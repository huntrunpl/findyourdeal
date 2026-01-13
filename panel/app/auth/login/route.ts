import { NextRequest, NextResponse } from "next/server";

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

export async function GET(req: NextRequest) {
  const token = (req.nextUrl.searchParams.get("token") || "").trim();
  const origin = getOrigin(req);

  const u = new URL("/api/auth/login", origin);
  if (token) u.searchParams.set("token", token);

  return NextResponse.redirect(u);
}
