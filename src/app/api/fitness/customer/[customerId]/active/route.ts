import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { customerClient } from "@/app/api/fitness/client";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ customerId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { customerId } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const isActive = body?.isActive;
  if (typeof isActive !== "boolean") {
    return NextResponse.json(
      { error: "Missing or invalid isActive" },
      { status: 400 },
    );
  }

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      customerClient.PUT("/v1/customer/{customerId}/active", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { customerId } },
        body: { isActive },
      }),
    ),
  );

  return jsonResponse(result);
}
