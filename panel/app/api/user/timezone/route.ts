import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { pool } from "@/lib/db";

// Whitelist of supported IANA timezones (aligned with Telegram aliases + common zones)
const SUPPORTED_TIMEZONES = [
  "Europe/Warsaw",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Prague",
  "Europe/Vienna",
  "Europe/Bucharest",
  "Europe/Brussels",
  "Europe/Stockholm",
  "Europe/Helsinki",
  "Europe/Athens",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function validateTimezone(tz: string): boolean {
  if (SUPPORTED_TIMEZONES.includes(tz)) return true;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch (e) {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const timezone = String(body.timezone || "").trim();

    if (!timezone) {
      return NextResponse.json({ ok: false, error: "Missing 'timezone'" }, { status: 400 });
    }

    if (!validateTimezone(timezone)) {
      return NextResponse.json({ ok: false, error: `Invalid timezone: ${timezone}` }, { status: 400 });
    }

    await pool.query(
      `UPDATE users SET timezone = $1, updated_at = NOW() WHERE id = $2`,
      [timezone, userId]
    );

    return NextResponse.json({ ok: true, timezone });
  } catch (error) {
    console.error("[/api/user/timezone] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT timezone FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const timezone = result.rows[0].timezone || "Europe/Warsaw";

    return NextResponse.json({ ok: true, timezone });
  } catch (error) {
    console.error("[/api/user/timezone] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export { SUPPORTED_TIMEZONES };