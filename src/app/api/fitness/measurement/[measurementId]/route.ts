import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { parseMeasurementFields } from "@/app/api/fitness/_lib/measurementBody";
import { resolveMeasuredBy } from "@/app/api/fitness/_lib/staffId";
import { measurementClient } from "@/app/api/fitness/client";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ measurementId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { measurementId } = await params;

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      measurementClient.GET("/v1/measurement/{measurementId}", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { measurementId } },
      }),
    ),
  );

  return jsonResponse(result);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { measurementId } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseMeasurementFields(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await authorizedRequest(req, async (accessToken) => {
    const staff = await resolveMeasuredBy(accessToken, measurementId);
    if (!staff.ok) return { status: staff.status, error: staff.error };

    return toStatusResult(
      measurementClient.PUT("/v1/measurement/{measurementId}", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { measurementId } },
        body: { ...parsed.fields, measuredBy: staff.staffId },
      }),
    );
  });

  return jsonResponse(result);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { measurementId } = await params;

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      measurementClient.DELETE("/v1/measurement/{measurementId}", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { measurementId } },
      }),
    ),
  );

  return jsonResponse(result);
}
