import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { client } from "@/app/api/fitness/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenantId")?.trim() ?? "";
  if (!tenantId) {
    return NextResponse.json(
      { error: "Missing or invalid tenantId" },
      { status: 400 },
    );
  }

  const includeInactive =
    req.nextUrl.searchParams.get("includeInactive") === "true";

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      client.GET("/v1/customers", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { query: { tenantId, includeInactive } },
      }),
    ),
  );

  return jsonResponse(result);
}
