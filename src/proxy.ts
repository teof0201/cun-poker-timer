import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { ANON_COOKIE } from "@/lib/authCore";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.get(ANON_COOKIE)) {
    response.cookies.set(ANON_COOKIE, randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|ico)$).*)"],
};
