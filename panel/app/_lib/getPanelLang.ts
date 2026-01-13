import { cookies } from "next/headers";
import pg from "pg";
import { normLang, type Lang } from "./i18n";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || "";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : null;

async function getUserIdFromAnySessionCookie(): Promise<number | null> {
  if (!pool) return null;

  // Next.js 16: cookies() jest async w typach, więc robimy await
  const ck: any = await cookies();
  const all: Array<{ value: string }> = (ck?.getAll ? ck.getAll() : []) || [];

  const candidates = all
    .map((c) => String(c.value || ""))
    .filter((v) => UUID_RE.test(v));

  if (!candidates.length) return null;

  // panel_sessions.id jest UUID sesji, a cookie przechowuje UUID
  const q = `
    SELECT user_id
    FROM panel_sessions
    WHERE id = ANY($1::uuid[])
      AND expires_at > NOW()
    ORDER BY expires_at DESC
    LIMIT 1
  `;
  const { rows } = await pool.query(q, [candidates]);
  return rows?.[0]?.user_id ?? null;
}

export async function getPanelLang(): Promise<Lang> {
  try {
    const userId = await getUserIdFromAnySessionCookie();
    if (!userId || !pool) return normLang("en");

    // wspólne źródło prawdy z Telegramem: users.lang
    const { rows } = await pool.query(
      `SELECT COALESCE(lang, 'en') AS lang FROM users WHERE id=$1 LIMIT 1`,
      [userId]
    );
    return normLang(String(rows?.[0]?.lang || "en"));
  } catch {
    return normLang("en");
  }
}

export default getPanelLang;


