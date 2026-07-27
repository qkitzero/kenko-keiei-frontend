import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { client } from "@/app/api/fitness/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const groupId = req.nextUrl.searchParams.get("groupId")?.trim() ?? "";
  if (!groupId) {
    return NextResponse.json(
      { error: "Missing or invalid groupId" },
      { status: 400 },
    );
  }

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      client.GET("/v1/customers", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { query: { groupId } },
      }),
    ),
  );

  return jsonResponse(result);
}
