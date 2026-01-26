"use server";

import { pool } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { normLang } from "@/app/_lib/i18n";

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
  });

  redirect("/links");
}


export async function getUserLangAction(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) return "en";

  const { rows } = await pool.query(
    `SELECT COALESCE(lang, 'en') AS lang FROM users WHERE id=$1 LIMIT 1`,
    [userId]
  );

  return String(rows?.[0]?.lang || "en");
}

export async function setUserLangAction(lang: string): Promise<{ ok: boolean; lang: string }> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      console.error("[setUserLangAction] No userId from session");
      return { ok: false, lang: "en" };
    }

    const next = normLang(lang);
    console.log("[setUserLangAction] Updating user", userId, "to lang", next);
    
    const result = await pool.query(`UPDATE users SET lang=$1, language_code=$1, language=$1 WHERE id=$2`, [next, userId]);
    console.log("[setUserLangAction] Update result:", result.rowCount, "rows affected");

    return { ok: true, lang: next };
  } catch (error) {
    console.error("[setUserLangAction] Error:", error);
    return { ok: false, lang: "en" };
  }
}
