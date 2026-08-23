import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import {
  customerClient,
  judgmentClient,
  organizationClient,
} from "@/app/api/fitness/client";
import { currentFiscalYear } from "@/lib/date";
import {
  SUMMARY_UPSTREAM_TIMEOUT_MS,
  buildTenantSummary,
} from "@/lib/tenantSummary";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ tenantId: string }> };

type UpstreamResult = { data?: unknown; error?: unknown; status: number };

async function withTimeout<T>(
  call: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    SUMMARY_UPSTREAM_TIMEOUT_MS,
  );
  try {
    return await call(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

function failureOf(results: UpstreamResult[]): UpstreamResult | null {
  const unauthenticated = results.find((result) => result.status === 401);
  if (unauthenticated) return unauthenticated;
  return (
    results.find((result) => result.status < 200 || result.status >= 300) ??
    null
  );
}

function readFiscalYear(value: string | null): number | null {
  if (value === null) return currentFiscalYear();
  return /^\d{4}$/.test(value) ? Number(value) : null;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { tenantId } = await params;

  const fiscalYear = readFiscalYear(req.nextUrl.searchParams.get("fiscalYear"));
  if (fiscalYear === null) {
    return NextResponse.json({ error: "Invalid fiscalYear" }, { status: 400 });
  }

  const result = await authorizedRequest(req, async (accessToken) => {
    const headers = { Authorization: `Bearer ${accessToken}` };

    const [customers, organizations] = await Promise.all([
      withTimeout((signal) =>
        toStatusResult(
          customerClient.GET("/v1/customers", {
            headers,
            params: { query: { tenantId, includeInactive: true } },
            signal,
          }),
        ),
      ),
      withTimeout((signal) =>
        toStatusResult(
          organizationClient.GET("/v1/organizations", {
            headers,
            params: { query: { tenantId } },
            signal,
          }),
        ),
      ),
    ]);

    const listFailure = failureOf([customers, organizations]);
    if (listFailure) return listFailure;

    const scopedOrganizations = (
      organizations.data?.organizations ?? []
    ).flatMap((organization) =>
      organization.organizationId
        ? [
            {
              organizationId: organization.organizationId,
              name: organization.name ?? "",
            },
          ]
        : [],
    );

    const judgmentResults = await Promise.all(
      scopedOrganizations.map(({ organizationId }) =>
        withTimeout((signal) =>
          toStatusResult(
            judgmentClient.GET("/v1/organization/{organizationId}/judgments", {
              headers,
              params: {
                path: { organizationId },
                query: { includeInactive: true },
              },
              signal,
            }),
          ),
        ),
      ),
    );

    const judgmentFailure = failureOf(judgmentResults);
    if (judgmentFailure) return judgmentFailure;

    return {
      status: 200,
      data: buildTenantSummary({
        fiscalYear,
        customers: (customers.data?.customers ?? []).filter(
          (customer) => customer.customerId,
        ),
        organizations: scopedOrganizations,
        judgments: judgmentResults.flatMap((judgments) =>
          (judgments.data?.judgments ?? []).filter(
            (judgment) => judgment.customerId,
          ),
        ),
      }),
    };
  });

  return jsonResponse(result);
}
