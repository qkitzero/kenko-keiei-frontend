import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse } from "@/app/api/_lib/response";
import { withTimeout } from "@/app/api/_lib/timeout";
import {
  ORGANIZATION_JUDGMENTS_TIMEOUT_MS,
  listAllOrganizationJudgments,
} from "@/app/api/fitness/organizationJudgments";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ organizationId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { organizationId } = await params;

  const includeInactive =
    req.nextUrl.searchParams.get("includeInactive") === "true";

  const result = await authorizedRequest(req, (accessToken) =>
    withTimeout(ORGANIZATION_JUDGMENTS_TIMEOUT_MS, (signal) =>
      listAllOrganizationJudgments({
        headers: { Authorization: `Bearer ${accessToken}` },
        organizationId,
        includeInactive,
        signal,
      }),
    ),
  );

  return jsonResponse(result);
}
