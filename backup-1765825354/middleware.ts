import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "fyd_panel_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // public
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const sid = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sid) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
