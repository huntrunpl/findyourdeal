"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  consumePanelLoginToken,
  createPanelSession,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

function getIsSecure() {
  const base = (process.env.PANEL_BASE_URL || "").trim();
  if (base) return base.startsWith("https://");
  // jeśli brak PANEL_BASE_URL, zakładamy produkcję HTTPS
  return true;
}

export async function loginWithToken(token: string) {
  const t = (token || "").trim();
  if (!t) redirect("/login?invalid=1");

  const userId = await consumePanelLoginToken(t);
  if (!userId) redirect("/login?invalid=1");

  // W server actions nie mamy request headers, więc IP/UA pomijamy (opcjonalne)
  const s = await createPanelSession(userId, null, null);

  const c = await cookies();
  c.set(SESSION_COOKIE_NAME, s.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: getIsSecure(),
    path: "/",
    expires: new Date(s.expires_at),
  });

  redirect("/links");
}
