import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserIdFromApiSession } from "../../_helpers/session";

// Force dynamic - don't cache user language
export const dynamic = "force-dynamic";

// SoT: tylko users.lang musi być ustawiony
// language_code i language są legacy (nie do renderowania)
const SUPPORTED_LANGS = ["en", "pl", "de", "fr", "es", "it", "pt", "ro", "nl", "cs", "sk"];

function normLang(raw: string): string {
  const val = String(raw || "").toLowerCase().trim();
  return SUPPORTED_LANGS.includes(val) ? val : "en";
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromApiSession();
    if (!userId) {
      console.log("[API /api/user/lang GET] No session - returning 401");
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { rows } = await pool.query(
      `SELECT COALESCE(language, lang, 'en') as resolved_lang FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    const lang = normLang(rows?.[0]?.resolved_lang || "en");
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
    const userId = await getUserIdFromApiSession();
    console.log("[API /api/user/lang POST] Session userId:", userId);
    
    if (!userId) {
      console.log("[API /api/user/lang POST] No session - returning 401");
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const lang = normLang(body.lang);

    console.log("[API /api/user/lang POST] User", userId, "→ lang:", lang);

    // SoT: users.language jest źródłem prawdy
    // lang to legacy alias
    // language_code NIE jest ustawiany (to hint z Telegrama, read-only)
    const result = await pool.query(
      `UPDATE users 
       SET language = $1,
           lang = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [lang, userId]
    );

    console.log("[API /api/user/lang POST] DB updated, rows:", result.rowCount);

    return NextResponse.json({ ok: true, lang });
  } catch (error) {
    console.error("[API /api/user/lang POST] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
