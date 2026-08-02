import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { measurementItemClient } from "@/app/api/fitness/client";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      measurementItemClient.GET("/v1/measurement-items", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ),
  );

  return jsonResponse(result);
}
