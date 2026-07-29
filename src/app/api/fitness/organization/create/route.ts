import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { organizationClient } from "@/app/api/fitness/client";
import { buildOrganizationName } from "@/lib/organization";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tenantId =
    body && typeof body.tenantId === "string" ? body.tenantId.trim() : "";
  if (!tenantId) {
    return NextResponse.json(
      { error: "Missing or invalid tenantId" },
      { status: 400 },
    );
  }

  const parsed = buildOrganizationName(
    typeof body.name === "string" ? body.name : "",
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      organizationClient.POST("/v1/organization", {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { tenantId, name: parsed.name },
      }),
    ),
  );

  return jsonResponse(result);
}
