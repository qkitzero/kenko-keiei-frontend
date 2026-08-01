import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { tenantProfileClient } from "@/app/api/fitness/client";
import {
  buildTenantProfilePayload,
  parseTenantProfileForm,
} from "@/lib/tenantProfile";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ tenantId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { tenantId } = await params;

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      tenantProfileClient.GET("/v1/tenant/{tenantId}/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { tenantId } },
      }),
    ),
  );

  return jsonResponse(result);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { tenantId } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const form = parseTenantProfileForm(body);
  if (!form.ok) {
    return NextResponse.json({ error: form.error }, { status: 400 });
  }

  const parsed = buildTenantProfilePayload(form.values);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      tenantProfileClient.PUT("/v1/tenant/{tenantId}/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { tenantId } },
        body: parsed.payload,
      }),
    ),
  );

  return jsonResponse(result);
}
