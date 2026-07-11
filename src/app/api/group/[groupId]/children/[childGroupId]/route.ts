import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { client } from "@/app/api/group/client";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ groupId: string; childGroupId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const { groupId, childGroupId } = await params;

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      client.DELETE("/v1/groups/{parentGroupId}/children/{childGroupId}", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { parentGroupId: groupId, childGroupId } },
      }),
    ),
  );

  return jsonResponse(result);
}
