import { NextResponse } from "next/server";

export const RETURN_TO_COOKIE = "return_to";

const RETURN_TO_MAX_AGE = 60 * 60;

export function setReturnToCookie(res: NextResponse, returnTo: string) {
  if (!returnTo) {
    clearReturnToCookie(res);
    return;
  }
  res.cookies.set(RETURN_TO_COOKIE, returnTo, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: RETURN_TO_MAX_AGE,
  });
}

export function clearReturnToCookie(res: NextResponse) {
  res.cookies.set(RETURN_TO_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
