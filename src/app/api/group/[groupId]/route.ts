import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { client } from "@/app/api/group/client";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ groupId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { groupId } = await params;

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      client.GET("/v1/groups/{groupId}", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { groupId } },
      }),
    ),
  );

  return jsonResponse(result);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { groupId } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json(
      { error: "Missing or invalid required fields" },
      { status: 400 },
    );
  }

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      client.PATCH("/v1/groups/{groupId}", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { groupId } },
        body: { name: body.name },
      }),
    ),
  );

  return jsonResponse(result);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { groupId } = await params;

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      client.DELETE("/v1/groups/{groupId}", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { groupId } },
      }),
    ),
  );

  return jsonResponse(result);
}
