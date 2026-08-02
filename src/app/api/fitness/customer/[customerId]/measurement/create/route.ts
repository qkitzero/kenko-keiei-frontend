import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { parseMeasurementFields } from "@/app/api/fitness/_lib/measurementBody";
import { resolveStaffId } from "@/app/api/fitness/_lib/staffId";
import { measurementClient } from "@/app/api/fitness/client";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ customerId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { customerId } = await params;

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
    const staff = await resolveStaffId(accessToken);
    if (!staff.ok) return { status: staff.status, error: staff.error };

    return toStatusResult(
      measurementClient.POST("/v1/customer/{customerId}/measurement", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { customerId } },
        body: { ...parsed.fields, measuredBy: staff.staffId },
      }),
    );
  });

  return jsonResponse(result);
}
