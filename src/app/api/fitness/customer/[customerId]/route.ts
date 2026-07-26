import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { parseCustomerFields } from "@/app/api/fitness/_lib/customerBody";
import { client } from "@/app/api/fitness/client";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ customerId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { customerId } = await params;

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      client.GET("/v1/customer/{customerId}", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { customerId } },
      }),
    ),
  );

  return jsonResponse(result);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { customerId } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseCustomerFields(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      client.PUT("/v1/customer/{customerId}", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { customerId } },
        body: parsed.fields,
      }),
    ),
  );

  return jsonResponse(result);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { customerId } = await params;

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      client.DELETE("/v1/customer/{customerId}", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { customerId } },
      }),
    ),
  );

  return jsonResponse(result);
}
