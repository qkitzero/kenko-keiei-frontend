import { toStatusResult } from "@/app/api/_lib/response";
import { judgmentClient } from "@/app/api/fitness/client";
import type { OrganizationJudgment } from "@/lib/organizationReport";

export const ORGANIZATION_JUDGMENTS_PAGE_SIZE = 1000;

export const ORGANIZATION_JUDGMENTS_TIMEOUT_MS = 30_000;

const MAX_PAGES = 200;

type Options = {
  headers: Record<string, string>;
  organizationId: string;
  includeInactive: boolean;
  signal: AbortSignal;
};

type Result = {
  data?: { judgments: OrganizationJudgment[] };
  error?: unknown;
  status: number;
};

function pagingFailed(organizationId: string, reason: string): Result {
  console.error(
    `listAllOrganizationJudgments: ${reason} (organizationId=${organizationId})`,
  );
  return {
    status: 502,
    error: { message: "organization judgments paging did not finish" },
  };
}

export async function listAllOrganizationJudgments({
  headers,
  organizationId,
  includeInactive,
  signal,
}: Options): Promise<Result> {
  const judgments: OrganizationJudgment[] = [];
  const seenTokens = new Set<string>();
  let pageToken: string | undefined;

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const result = await toStatusResult(
        judgmentClient.GET("/v1/organization/{organizationId}/judgments", {
          headers,
          params: {
            path: { organizationId },
            query: {
              includeInactive,
              pageSize: ORGANIZATION_JUDGMENTS_PAGE_SIZE,
              pageToken,
            },
          },
          signal,
        }),
      );
      if (result.status < 200 || result.status >= 300) {
        return { status: result.status, error: result.error };
      }

      judgments.push(...(result.data?.judgments ?? []));

      const next = result.data?.nextPageToken;
      if (!next) return { status: 200, data: { judgments } };
      if (seenTokens.has(next)) {
        return pagingFailed(
          organizationId,
          `upstream repeated a page token on page ${page}`,
        );
      }
      seenTokens.add(next);
      pageToken = next;
    }
  } catch (e) {
    if (!signal.aborted) throw e;
    console.error(
      `listAllOrganizationJudgments: timed out on page ${seenTokens.size + 1} (organizationId=${organizationId})`,
    );
    return {
      status: 504,
      error: { message: "organization judgments timed out" },
    };
  }

  return pagingFailed(
    organizationId,
    `reached the limit of ${MAX_PAGES} pages`,
  );
}
