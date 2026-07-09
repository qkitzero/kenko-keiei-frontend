import { client } from "@/app/api/user/client";
import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { applyRefreshedTokens } from "@/app/api/_lib/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const result = await authorizedRequest(req, (accessToken) =>
    client
      .GET("/v1/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
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
