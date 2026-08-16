import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { judgmentClient } from "@/app/api/fitness/client";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ organizationId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { organizationId } = await params;

  const includeInactive =
    req.nextUrl.searchParams.get("includeInactive") === "true";

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      judgmentClient.GET("/v1/organization/{organizationId}/judgments", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { organizationId }, query: { includeInactive } },
      }),
    ),
  );

  return jsonResponse(result);
}
