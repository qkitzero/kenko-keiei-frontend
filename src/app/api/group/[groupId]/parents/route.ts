import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { client } from "@/app/api/group/client";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ groupId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { groupId } = await params;

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      client.GET("/v1/groups/{groupId}/parents", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { groupId } },
      }),
    ),
  );

  return jsonResponse(result);
}
