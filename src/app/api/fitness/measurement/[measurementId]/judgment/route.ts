import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { judgmentClient } from "@/app/api/fitness/client";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ measurementId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { measurementId } = await params;

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      judgmentClient.GET("/v1/measurement/{measurementId}/judgment", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { measurementId } },
      }),
    ),
  );

  return jsonResponse(result);
}
