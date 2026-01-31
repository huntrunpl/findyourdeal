import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's telegram_chat_id
    const userRes = await pool.query(
      "SELECT telegram_chat_id FROM users WHERE id = $1",
      [userId]
    );

    if (!userRes.rows.length || !userRes.rows[0].telegram_chat_id) {
      // No chat_id yet - return defaults
      return NextResponse.json({
        enabled: true,
        mode: "single"
      });
    }

    const chatId = String(userRes.rows[0].telegram_chat_id);

    // Get notification settings from chat_notifications
    const notifRes = await pool.query(
      "SELECT enabled, mode FROM chat_notifications WHERE chat_id = $1",
      [chatId]
    );

    if (!notifRes.rows.length) {
      // No record - return defaults
      return NextResponse.json({
        enabled: true,
        mode: "single"
      });
    }

    const row = notifRes.rows[0];
    return NextResponse.json({
      enabled: !!row.enabled,
      mode: row.mode || "single"
    });
  } catch (error) {
    console.error("[notifications GET]", error);
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

  let body: { enabled?: boolean; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { enabled, mode } = body;

  // Validation
  if (enabled !== undefined && typeof enabled !== "boolean") {
    return NextResponse.json(
      { error: "enabled must be boolean" },
      { status: 400 }
    );
  }
  if (mode !== undefined && !["single", "batch"].includes(mode)) {
    return NextResponse.json(
      { error: "mode must be 'single' or 'batch'" },
      { status: 400 }
    );
  }

  try {
    // Get user's telegram_chat_id
    const userRes = await pool.query(
      "SELECT telegram_chat_id FROM users WHERE id = $1",
      [userId]
    );

    if (!userRes.rows.length || !userRes.rows[0].telegram_chat_id) {
      return NextResponse.json(
        { error: "No Telegram chat linked" },
        { status: 400 }
      );
    }

    const chatId = String(userRes.rows[0].telegram_chat_id);

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [chatId];
    let paramIndex = 2;

    if (enabled !== undefined) {
      updates.push(`enabled = $${paramIndex}`);
      values.push(enabled);
      paramIndex++;
    }
    if (mode !== undefined) {
      updates.push(`mode = $${paramIndex}`);
      values.push(mode);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true });
    }

    // Upsert chat_notifications
    await pool.query(
      `INSERT INTO chat_notifications (chat_id, user_id, enabled, mode)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (chat_id, user_id)
       DO UPDATE SET ${updates.join(", ")}, updated_at = now()`,
      [chatId, userId, enabled ?? true, mode ?? "single"]
    );

    return NextResponse.json({
      success: true,
      enabled: enabled ?? true,
      mode: mode ?? "single"
    });
  } catch (error) {
    console.error("[notifications POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
