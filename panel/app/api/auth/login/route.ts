import { NextRequest, NextResponse } from "next/server";
import {
  consumePanelLoginToken,
  createPanelSession,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { initPanelDb } from "@/lib/db";

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
  // Initialize database tables on first request
  await initPanelDb().catch((e) => {
    console.error("Failed to initialize panel database:", e);
  });

  const origin = getOrigin(req);

  const token = (req.nextUrl.searchParams.get("token") || "").trim();
  if (!token) {
    return NextResponse.redirect(new URL("/login?invalid=1", origin));
  }

  try {
    const userId = await consumePanelLoginToken(token);
    if (!userId) {
      return NextResponse.redirect(new URL("/login?invalid=1", origin));
    }

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
    const ua = req.headers.get("user-agent") || null;

    const s = await createPanelSession(userId, ip, ua);

    const res = NextResponse.redirect(new URL("/links", origin));
    res.cookies.set(SESSION_COOKIE_NAME, s.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https://"),
      path: "/",
      expires: new Date(s.expires_at),
    });

    return res;
  } catch (e) {
    console.error("api/auth/login error", e);
    return NextResponse.redirect(new URL("/login?error=1", origin));
  }
}
