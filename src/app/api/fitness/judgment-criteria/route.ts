import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { judgmentClient } from "@/app/api/fitness/client";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      judgmentClient.GET("/v1/judgment-criteria", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ),
  );

  return jsonResponse(result);
}
