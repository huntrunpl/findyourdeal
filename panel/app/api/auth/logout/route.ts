import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";

function getOrigin(req: NextRequest) {
  const envBase = (process.env.PANEL_BASE_URL || "").trim().replace(/\/+$/, "");
  if (envBase) return envBase;

  const xfProto = (req.headers.get("x-forwarded-proto") || "").split(",")[0].trim();
  const xfHost = (req.headers.get("x-forwarded-host") || "").split(",")[0].trim();
  const host = xfHost || (req.headers.get("host") || "").split(",")[0].trim() || "panel.findyourdeal.app";
  const proto = xfProto || "https";
  return `${proto}://${host}`;
}

// GET ma być nieszkodliwy (prefetch nie może wylogować)
export async function GET() {
  return NextResponse.json({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}

// Wylogowanie robimy tylko POST-em
export async function POST(req: NextRequest) {
  const origin = getOrigin(req);
  const res = NextResponse.redirect(new URL("/login", origin), 303);
  res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", expires: new Date(0) });
  return res;
}
