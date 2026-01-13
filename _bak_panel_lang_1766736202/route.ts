import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import pg from "pg";
import { normLang } from "../../../_lib/i18n";

export const runtime = "nodejs";

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

export async function GET() {
  if (!pool) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL missing" }, { status: 500, headers: { "cache-control": "no-store" } });
  }

  const userId = await getUserIdFromAnySessionCookie();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const r = await pool.query("SELECT COALESCE(lang,'en') AS lang FROM users WHERE id=$1 LIMIT 1", [userId]);
  return NextResponse.json({ ok: true, lang: normLang(String(r.rows[0]?.lang || "en")) }, { status: 200, headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!pool) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL missing" }, { status: 500, headers: { "cache-control": "no-store" } });
  }

  const userId = await getUserIdFromAnySessionCookie();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const body = await req.json().catch(() => ({}));
  const next = normLang(String(body?.lang || "en"));

  await pool.query("UPDATE users SET lang=$1 WHERE id=$2", [next, userId]);

  return NextResponse.json({ ok: true, lang: next }, { status: 200, headers: { "cache-control": "no-store" } });
}
