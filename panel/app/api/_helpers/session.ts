/**
 * API Route Helpers - Session Management
 * 
 * This module provides consistent session handling across all API routes.
 * Uses the same method as getPanelLang() to find session cookies.
 */

import { cookies } from "next/headers";
import { pool } from "@/lib/db";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Get userId from any session cookie containing a valid UUID
 * 
 * This works with cookies set by Telegram bot login flow, which may
 * use different cookie names or multiple cookies.
 * 
 * @returns userId or null if no valid session found
 */
export async function getUserIdFromApiSession(): Promise<number | null> {
  if (!pool) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookieStore = (await cookies()) as any;
  const all = cookieStore.getAll();

  // Find all cookies that look like UUIDs (session IDs)
  const candidates = all
    .map((c: { value: string }) => String(c.value || ""))
    .filter((v: string) => UUID_RE.test(v));

  if (!candidates.length) {
    console.log("[getUserIdFromApiSession] No UUID cookies found");
    return null;
  }

  console.log(`[getUserIdFromApiSession] Found ${candidates.length} UUID cookie(s)`);

  // Query panel_sessions for any matching UUID
  const q = `
    SELECT user_id
    FROM panel_sessions
    WHERE id = ANY($1::uuid[])
      AND expires_at > NOW()
    ORDER BY expires_at DESC
    LIMIT 1
  `;
  
  try {
    const { rows } = await pool.query(q, [candidates]);
    const userId = rows?.[0]?.user_id ?? null;
    
    if (userId) {
      console.log(`[getUserIdFromApiSession] Found session for user ${userId}`);
    } else {
      console.log("[getUserIdFromApiSession] No active session found in DB");
    }
    
    return userId;
  } catch (error) {
    console.error("[getUserIdFromApiSession] Database error:", error);
    return null;
  }
}
