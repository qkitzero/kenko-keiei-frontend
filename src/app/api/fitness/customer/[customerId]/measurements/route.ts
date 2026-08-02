import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { measurementClient } from "@/app/api/fitness/client";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ customerId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { customerId } = await params;

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      measurementClient.GET("/v1/customer/{customerId}/measurements", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { customerId } },
      }),
    ),
  );

  return jsonResponse(result);
}
