import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { organizationClient } from "@/app/api/fitness/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenantId")?.trim() ?? "";
  if (!tenantId) {
    return NextResponse.json(
      { error: "Missing or invalid tenantId" },
      { status: 400 },
    );
  }

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      organizationClient.GET("/v1/organizations", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { query: { tenantId } },
      }),
    ),
  );

  return jsonResponse({
    ...result,
    data: result.data
      ? { count: (result.data.organizations ?? []).length }
      : undefined,
  });
}
