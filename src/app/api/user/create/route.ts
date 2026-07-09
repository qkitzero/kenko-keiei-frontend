import { client } from "@/app/api/user/client";
import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { applyRefreshedTokens } from "@/app/api/_lib/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body.displayName !== "string" || !body.birthDate) {
    return NextResponse.json(
      { error: "Missing or invalid required fields" },
      { status: 400 },
    );
  }

  const result = await authorizedRequest(req, (accessToken) =>
    client
      .POST("/v1/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          displayName: body.displayName,
          birthDate: {
            year: Number(body.birthDate.year),
            month: Number(body.birthDate.month),
            day: Number(body.birthDate.day),
          },
        },
      })
      .then(({ data, error, response }) => ({
        data,
        error,
        status: response.status,
      })),
  );

  const res = NextResponse.json(result.data ?? result.error ?? {}, {
    status: result.status,
  });
  applyRefreshedTokens(res, result);
  return res;
}
