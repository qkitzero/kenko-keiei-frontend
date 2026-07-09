import { client as authClient } from "@/app/api/auth/client";
import { client as userClient } from "@/app/api/user/client";
import {
  extractRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/app/api/_lib/cookies";
import { NextRequest, NextResponse } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const redirectUri = `${SITE_URL}/api/auth/callback`;

  try {
    const {
      data: authData,
      error: authError,
      response: authResponse,
    } = await authClient.POST("/v1/exchange-code", {
      body: { code, redirectUri },
    });

    if (authError) {
      return NextResponse.json(authError, { status: 500 });
    }

    const accessToken = authData?.accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing access token" },
        { status: 500 },
      );
    }

    const refreshToken = extractRefreshToken(authResponse);

    const { error: userError, response: userResponse } = await userClient.GET(
      "/v1/user",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (userResponse.status !== 404 && userError) {
      return NextResponse.json(userError, { status: 500 });
    }

    const destination = userResponse.status === 404 ? "/register" : "/";
    const res = NextResponse.redirect(new URL(destination, SITE_URL));

    setAccessTokenCookie(res, accessToken);
    if (refreshToken) {
      setRefreshTokenCookie(res, refreshToken);
    }

    return res;
  } catch (e) {
    console.error("auth callback failed:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
