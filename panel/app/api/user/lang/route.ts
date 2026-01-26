import { NextRequest, NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { getSessionUserId } from "../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { lang } = body;

    if (!lang) {
      return NextResponse.json(
        { error: "Missing 'lang' parameter" },
        { status: 400 }
      );
    }

    // Normalize language: "pl-PL" -> "pl", "en-US" -> "en"
    const normalized = String(lang).toLowerCase().split("-")[0];

    if (!["pl", "en"].includes(normalized)) {
      return NextResponse.json(
        { error: "Supported languages: pl, en" },
        { status: 400 }
      );
    }

    // Update users.lang (source of truth)
    await pool.query(
      `UPDATE users SET lang = $1, updated_at = NOW() WHERE id = $2`,
      [normalized, userId]
    );

    return NextResponse.json(
      { success: true, lang: normalized },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/user/lang] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch current language
    const result = await pool.query(
      `SELECT lang FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentLang = result.rows[0].lang || "en";

    return NextResponse.json({ lang: currentLang }, { status: 200 });
  } catch (error) {
    console.error("[/api/user/lang] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
