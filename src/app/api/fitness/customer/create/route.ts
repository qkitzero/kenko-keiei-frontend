import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { parseCustomerFields } from "@/app/api/fitness/_lib/customerBody";
import { client } from "@/app/api/fitness/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const groupId =
    body && typeof body.groupId === "string" ? body.groupId.trim() : "";
  if (!groupId) {
    return NextResponse.json(
      { error: "Missing or invalid groupId" },
      { status: 400 },
    );
  }

  const parsed = parseCustomerFields(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      client.POST("/v1/customer", {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { ...parsed.fields, groupId },
      }),
    ),
  );

  return jsonResponse(result);
}
