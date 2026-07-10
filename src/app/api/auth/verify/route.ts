import { ACCESS_TOKEN_COOKIE } from "@/app/api/_lib/cookies";
import { client } from "@/app/api/auth/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Missing access token" },
      { status: 401 },
    );
  }

  const { data, error, response } = await client.POST("/v1/verify", {
    body: {},
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error) {
    return NextResponse.json(error, { status: response.status });
  }

  return NextResponse.json(data);
}
