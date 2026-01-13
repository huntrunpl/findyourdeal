import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { normLang } from "@/app/_lib/i18n";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ lang: "en" });

  const { rows } = await pool.query(
    `SELECT COALESCE(lang, 'en') AS lang FROM users WHERE id=$1 LIMIT 1`,
    [userId]
  );

  return NextResponse.json({ lang: String(rows?.[0]?.lang || "en") });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const next = normLang(body?.lang);

  await pool.query(`UPDATE users SET lang=$1, language=$1 WHERE id=$2`, [next, userId]);

  return NextResponse.json({ ok: true, lang: next });
}
