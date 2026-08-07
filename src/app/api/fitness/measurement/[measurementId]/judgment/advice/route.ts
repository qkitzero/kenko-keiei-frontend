import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { jsonResponse, toStatusResult } from "@/app/api/_lib/response";
import { judgmentClient } from "@/app/api/fitness/client";
import { buildAdvicePayload, parseAdviceForm } from "@/lib/judgment";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ measurementId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { measurementId } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const form = parseAdviceForm(body);
  if (!form.ok) {
    return NextResponse.json({ error: form.error }, { status: 400 });
  }

  const parsed = buildAdvicePayload(form.advice);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await authorizedRequest(req, (accessToken) =>
    toStatusResult(
      judgmentClient.PUT("/v1/measurement/{measurementId}/judgment/advice", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { path: { measurementId } },
        body: parsed.payload,
      }),
    ),
  );

  return jsonResponse(result);
}
