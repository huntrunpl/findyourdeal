import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's chat_id (telegram_chat_id OR telegram_user_id for private chats)
    const userRes = await pool.query(
      "SELECT COALESCE(telegram_chat_id::text, telegram_user_id::text) as chat_id FROM users WHERE id = $1",
      [userId]
    );

    if (!userRes.rows.length || !userRes.rows[0].chat_id) {
      // No chat_id yet - return defaults
      return NextResponse.json({
        enabled: false,
        start: 22,
        end: 7
      });
    }

    const chatId = String(userRes.rows[0].chat_id);

    // Get quiet hours from chat_quiet_hours
    const qhRes = await pool.query(
      "SELECT quiet_enabled, quiet_from, quiet_to FROM chat_quiet_hours WHERE chat_id = $1",
      [chatId]
    );

    if (!qhRes.rows.length) {
      // No record - return defaults
      return NextResponse.json({
        enabled: false,
        start: 22,
        end: 7
      });
    }

    const row = qhRes.rows[0];
    return NextResponse.json({
      enabled: !!row.quiet_enabled,
      start: row.quiet_from ?? 22,
      end: row.quiet_to ?? 7
    });
  } catch (error) {
    console.error("[quiet-hours GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { enabled?: boolean; start?: number; end?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { enabled, start, end } = body;

  // Validation
  if (typeof enabled !== "boolean") {
    return NextResponse.json(
      { error: "enabled must be boolean" },
      { status: 400 }
    );
  }
  if (
    typeof start !== "number" ||
    start < 0 ||
    start > 23 ||
    !Number.isInteger(start)
  ) {
    return NextResponse.json(
      { error: "start must be integer 0-23" },
      { status: 400 }
    );
  }
  if (
    typeof end !== "number" ||
    end < 0 ||
    end > 23 ||
    !Number.isInteger(end)
  ) {
    return NextResponse.json(
      { error: "end must be integer 0-23" },
      { status: 400 }
    );
  }

  try {
    // Get user's chat_id (telegram_chat_id OR telegram_user_id for private chats)
    const userRes = await pool.query(
      "SELECT COALESCE(telegram_chat_id::text, telegram_user_id::text) as chat_id FROM users WHERE id = $1",
      [userId]
    );

    if (!userRes.rows.length || !userRes.rows[0].chat_id) {
      return NextResponse.json(
        { error: "No Telegram chat linked" },
        { status: 400 }
      );
    }

    const chatId = String(userRes.rows[0].chat_id);

    // Upsert chat_quiet_hours with EXCLUDED to avoid type issues
    await pool.query(
      `INSERT INTO chat_quiet_hours (chat_id, quiet_enabled, quiet_from, quiet_to)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (chat_id)
       DO UPDATE SET
         quiet_enabled = EXCLUDED.quiet_enabled,
         quiet_from = EXCLUDED.quiet_from,
         quiet_to = EXCLUDED.quiet_to`,
      [chatId, enabled, start, end]
    );

    return NextResponse.json({
      success: true,
      enabled,
      start,
      end
    });
  } catch (error) {
    console.error("[quiet-hours POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
