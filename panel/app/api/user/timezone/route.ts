import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ timezone: null }, { status: 401 });

  const result = await pool.query(
    `SELECT timezone FROM users WHERE id = $1`,
    [userId]
  );
  
  const timezone = result.rows[0]?.timezone || "Europe/Warsaw";
  return NextResponse.json({ timezone });
}
