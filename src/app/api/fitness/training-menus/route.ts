import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { trainingMenuClient } from "@/app/api/fitness/client";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      trainingMenuClient.GET("/v1/training-menus", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ),
  );

  return jsonResponse(result);
}
