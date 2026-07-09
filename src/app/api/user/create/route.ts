import { client } from "@/app/api/user/client";
import { authorizedRequest } from "@/app/api/_lib/authorizedRequest";
import { applyRefreshedTokens } from "@/app/api/_lib/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await authorizedRequest(req, (accessToken) =>
    client
      .POST("/v1/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          displayName: body.displayName,
          birthDate: {
            year: body.birthDate.year,
            month: body.birthDate.month,
            day: body.birthDate.day,
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
