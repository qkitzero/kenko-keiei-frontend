import { client } from "@/app/api/auth/client";
import {
  REFRESH_TOKEN_COOKIE,
  extractRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/app/api/_lib/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json(
      { error: "Missing refresh token" },
      { status: 401 },
    );
  }

  const { data, error, response } = await client.POST("/v1/refresh", {
    body: {},
    headers: { Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}` },
  });

  if (error || !data?.accessToken) {
    return NextResponse.json(error ?? { error: "Refresh failed" }, {
      status: 401,
    });
  }

  const res = NextResponse.json({ ok: true });

  setAccessTokenCookie(res, data.accessToken);
  const rotatedRefreshToken = extractRefreshToken(response);
  if (rotatedRefreshToken) {
    setRefreshTokenCookie(res, rotatedRefreshToken);
  }

  return res;
}
