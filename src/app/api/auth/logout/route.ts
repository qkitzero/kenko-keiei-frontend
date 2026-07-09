import { client } from "@/app/api/auth/client";
import { REFRESH_TOKEN_COOKIE, clearAuthCookies } from "@/app/api/_lib/cookies";
import { NextRequest, NextResponse } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const returnTo = `${SITE_URL}/`;

  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    try {
      await client.POST("/v1/revoke", {
        body: {},
        headers: { Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}` },
      });
    } catch (e) {
      console.error("failed to revoke token during logout:", e);
    }
  }

  let logoutUrl = returnTo;
  try {
    const { data } = await client.POST("/v1/logout", {
      body: { returnTo },
    });
    if (data?.logoutUrl) {
      logoutUrl = data.logoutUrl;
    }
  } catch (e) {
    console.error("failed to call logout endpoint:", e);
  }

  const res = NextResponse.json({ logoutUrl });
  clearAuthCookies(res);
  return res;
}
