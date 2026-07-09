import { NextResponse } from "next/server";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

export function setAccessTokenCookie(res: NextResponse, accessToken: string) {
  res.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
}

export function setRefreshTokenCookie(res: NextResponse, refreshToken: string) {
  res.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.delete(ACCESS_TOKEN_COOKIE);
  res.cookies.delete(REFRESH_TOKEN_COOKIE);
}

export function applyRefreshedTokens(
  res: NextResponse,
  tokens: { newAccessToken?: string; newRefreshToken?: string },
) {
  if (tokens.newAccessToken) {
    setAccessTokenCookie(res, tokens.newAccessToken);
  }
  if (tokens.newRefreshToken) {
    setRefreshTokenCookie(res, tokens.newRefreshToken);
  }
}

export function extractRefreshToken(response: Response): string | undefined {
  const setCookies = response.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    const match = cookie.match(/^refresh_token=([^;]+)/);
    if (match) {
      return match[1];
    }
  }
  return undefined;
}
