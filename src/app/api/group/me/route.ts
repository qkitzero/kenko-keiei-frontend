import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { client } from "@/app/api/group/client";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      client.GET("/v1/me/groups", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ),
  );

  return jsonResponse(result);
}
