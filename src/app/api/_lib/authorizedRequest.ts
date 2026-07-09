import { NextRequest } from "next/server";
import { client as authClient } from "@/app/api/auth/client";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  extractRefreshToken,
} from "@/app/api/_lib/cookies";

export type AuthorizedCall<T> = (accessToken: string) => Promise<{
  data?: T;
  error?: unknown;
  status: number;
}>;

export type AuthorizedResult<T> = {
  data?: T;
  error?: unknown;
  status: number;
  newAccessToken?: string;
  newRefreshToken?: string;
};

export async function authorizedRequest<T>(
  req: NextRequest,
  call: AuthorizedCall<T>,
): Promise<AuthorizedResult<T>> {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    const first = await call(accessToken);
    if (first.status !== 401) {
      return first;
    }
  }

  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return { status: 401, error: { message: "unauthenticated" } };
  }

  const { data: refreshData, response: refreshResponse } =
    await authClient.POST("/v1/refresh", {
      body: {},
      headers: { Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}` },
    });

  const newAccessToken = refreshData?.accessToken;
  if (!refreshResponse.ok || !newAccessToken) {
    return { status: 401, error: { message: "refresh failed" } };
  }

  const newRefreshToken = extractRefreshToken(refreshResponse);

  const retry = await call(newAccessToken);
  return { ...retry, newAccessToken, newRefreshToken };
}
