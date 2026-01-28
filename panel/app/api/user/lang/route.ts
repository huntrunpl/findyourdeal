import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { pool } from "@/lib/db";

// SoT: tylko users.lang musi być ustawiony
// language_code i language są legacy (nie do renderowania)
const SUPPORTED_LANGS = ["en", "pl", "de", "fr", "es", "it", "pt", "ro", "nl", "cs", "sk"];

function normLang(raw: string): string {
  const val = String(raw || "").toLowerCase().trim();
  return SUPPORTED_LANGS.includes(val) ? val : "en";
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { rows } = await pool.query(
      `SELECT lang FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    const lang = normLang(rows?.[0]?.lang || "en");
    return NextResponse.json({ ok: true, lang });
  } catch (error) {
    console.error("[API /api/user/lang GET] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const lang = normLang(body.lang);

    console.log("[API /api/user/lang] Updating user", userId, "to lang", lang);

    // SoT: users.lang jest źródłem prawdy
    // language_code i language to legacy / kompatybilność (trigger DB je zsynchronizuje)
    await pool.query(
      `UPDATE users 
       SET lang = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [lang, userId]
    );

    console.log("[API /api/user/lang] Update successful");

    return NextResponse.json({ ok: true, lang });
  } catch (error) {
    console.error("[API /api/user/lang] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
