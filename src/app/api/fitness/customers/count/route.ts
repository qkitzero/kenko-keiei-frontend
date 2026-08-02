import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { customerClient } from "@/app/api/fitness/client";
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
      customerClient.GET("/v1/customers", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { query: { tenantId, includeInactive: false } },
      }),
    ),
  );

  return jsonResponse({
    ...result,
    data: result.data
      ? { count: (result.data.customers ?? []).length }
      : undefined,
  });
}
