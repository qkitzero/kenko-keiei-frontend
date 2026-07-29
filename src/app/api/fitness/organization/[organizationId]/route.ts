import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { organizationClient } from "@/app/api/fitness/client";
import { buildOrganizationName } from "@/lib/organization";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ organizationId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { organizationId } = await params;

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      organizationClient.GET("/v1/organization/{organizationId}", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { organizationId } },
      }),
    ),
  );

  return jsonResponse(result);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { organizationId } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = buildOrganizationName(
    body && typeof body.name === "string" ? body.name : "",
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      organizationClient.PUT("/v1/organization/{organizationId}", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { organizationId } },
        body: { name: parsed.name },
      }),
    ),
  );

  return jsonResponse(result);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { organizationId } = await params;

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      organizationClient.DELETE("/v1/organization/{organizationId}", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { organizationId } },
      }),
    ),
  );

  return jsonResponse(result);
}
