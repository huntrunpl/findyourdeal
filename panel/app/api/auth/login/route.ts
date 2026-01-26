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
  console.log("[auth/login] GET token:", token ? token.substring(0, 10) + "..." : "EMPTY");
  console.log("[auth/login] GET token:", token ? token.substring(0, 10) + "..." : "EMPTY");
  if (!token) {
    console.log("[auth/login] NO TOKEN PROVIDED");
    console.log("[auth/login] NO TOKEN PROVIDED");
    return NextResponse.redirect(new URL("/login?invalid=1", origin));
  }

  try {
    console.log("[auth/login] consumePanelLoginToken starting for token:", token.substring(0, 10) + "...");
    const userId = await consumePanelLoginToken(token);
    console.log("[auth/login] consumePanelLoginToken returned userId:", userId);
    if (!userId) {
      console.log("[auth/login] userId is null/falsy");
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
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("[auth/login] ERROR:", errMsg);
    console.error("[auth/login] STACK:", e instanceof Error ? e.stack : "no stack");
    return NextResponse.redirect(new URL(`/login?error=1&reason=${encodeURIComponent(errMsg)}`, origin));
  }
}
