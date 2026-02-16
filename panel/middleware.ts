import { NextRequest, NextResponse } from "next/server";

const COOKIE = "fyd_panel_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // publiczne ścieżki
  if (
    pathname === "/login" ||
    pathname.startsWith("/billing/success") ||
    pathname.startsWith("/billing/cancel") ||
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/api/build-info") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // prosta bramka: cookie musi istnieć (weryfikacja w DB i tak jest po stronie server)
  const sid = req.cookies.get(COOKIE)?.value;
  if (!sid) return NextResponse.redirect(new URL("/login", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
