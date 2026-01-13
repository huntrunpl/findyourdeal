import { NextRequest, NextResponse } from "next/server";
import { consumeLoginToken, createSession, getSessionDays, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";

  // brak tokenu -> login page
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const userId = await consumeLoginToken(token);

  // zły/wygasły/użyty token -> login page
  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  const ua = req.headers.get("user-agent") || null;

  const sessionId = await createSession(userId, ip, ua);

  const res = NextResponse.redirect(new URL("/links", req.url));
  res.headers.set("Cache-Control", "no-store");

  const days = getSessionDays();
  res.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: days * 24 * 60 * 60,
  });

  return res;
}
