import type { AuthorizedResult } from "@/app/api/_lib/authorizedRequest";
import { applyRefreshedTokens } from "@/app/api/_lib/cookies";
import { NextResponse } from "next/server";

type OpenapiResult<T> = {
  data?: T;
  error?: unknown;
  response: Response;
};

export function toStatusResult<T>(
  promise: Promise<OpenapiResult<T>>,
): Promise<{ data?: T; error?: unknown; status: number }> {
  return promise.then(({ data, error, response }) => ({
    data,
    error,
    status: response.status,
  }));
}

export function jsonResponse<T>(result: AuthorizedResult<T>): NextResponse {
  const res = NextResponse.json(result.data ?? result.error ?? {}, {
    status: result.status,
  });
  applyRefreshedTokens(res, result);
  return res;
}
