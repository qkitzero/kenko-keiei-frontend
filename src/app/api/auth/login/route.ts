import { setReturnToCookie } from "@/app/api/_lib/returnTo";
import { client } from "@/app/api/auth/client";
import { sanitizeReturnTo } from "@/lib/returnTo";
import { NextRequest, NextResponse } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return NextResponse.json({ message: "forbidden" }, { status: 403 });
  }

  const redirectUri = `${SITE_URL}/api/auth/callback`;

  const { data, error } = await client.POST("/v1/login", {
    body: { redirectUri },
  });

  if (error || !data?.loginUrl) {
    return NextResponse.json(error ?? { message: "login unavailable" }, {
      status: 500,
    });
  }

  const res = NextResponse.json(data);
  setReturnToCookie(
    res,
    sanitizeReturnTo(req.nextUrl.searchParams.get("returnTo")),
  );
  return res;
}
