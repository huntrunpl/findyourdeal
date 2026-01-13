import { cookies } from "next/headers";
import pg from "pg";
import { normLang } from "./i18n";

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL || "";
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : null;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getUserIdFromAnySessionCookie(): Promise<number | null> {
  if (!pool) return null;

  const ck = await cookies();
  const candidates = ck
    .getAll()
    .map((c) => String(c.value || ""))
    .filter((v) => UUID_RE.test(v));

  if (!candidates.length) return null;

  const r = await pool.query(
    "SELECT user_id FROM panel_sessions WHERE id = ANY($1::uuid[]) ORDER BY created_at DESC LIMIT 1",
    [candidates]
  );

  return (r.rows[0]?.user_id as number | undefined) ?? null;
}

export async function getPanelLang(): Promise<string> {
  const userId = await getUserIdFromAnySessionCookie();
  if (!userId || !pool) return "en";

  const r = await pool.query("SELECT COALESCE(lang,'en') AS lang FROM users WHERE id=$1 LIMIT 1", [userId]);
  return normLang(String(r.rows[0]?.lang || "en"));
}

export default getPanelLang;
