import { cookies } from "next/headers";
import { pool } from "./db";

export const SESSION_COOKIE_NAME = "fyd_panel_session";

function envInt(name: string, def: number) {
  const v = process.env[name];
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : def;
}

export function getSessionDays() {
  return envInt("PANEL_SESSION_DAYS", 14);
}

export async function consumeLoginToken(token: string): Promise<number | null> {
  if (!token) return null;

  const q = await pool.query(
    `
    UPDATE panel_login_tokens
    SET used_at = NOW()
    WHERE token = $1
      AND used_at IS NULL
      AND expires_at > NOW()
    RETURNING user_id;
    `,
    [token]
  );

  const userId = q.rows[0]?.user_id;
  return userId ? Number(userId) : null;
}

export async function createSession(userId: number, ip?: string | null, userAgent?: string | null) {
  const days = getSessionDays();
  const q = await pool.query(
    `
    INSERT INTO panel_sessions (user_id, expires_at, ip, user_agent)
    VALUES ($1, NOW() + ($2 || ' days')::interval, $3, $4)
    RETURNING id;
    `,
    [userId, String(days), ip ?? null, userAgent ?? null]
  );
  return String(q.rows[0].id);
}

export async function getSessionUserIdBySessionId(sessionId: string): Promise<number | null> {
  if (!sessionId) return null;
  const q = await pool.query(
    `
    SELECT user_id
    FROM panel_sessions
    WHERE id = $1
      AND expires_at > NOW()
    LIMIT 1;
    `,
    [sessionId]
  );
  const userId = q.rows[0]?.user_id;
  return userId ? Number(userId) : null;
}

export async function deleteSession(sessionId: string) {
  if (!sessionId) return;
  await pool.query(`DELETE FROM panel_sessions WHERE id = $1`, [sessionId]);
}

// do użycia w Server Components (np. app/links/page.tsx)
export async function getSessionUserId(): Promise<number | null> {
  const sid = cookies().get(SESSION_COOKIE_NAME)?.value || "";
  if (!sid) return null;
  return getSessionUserIdBySessionId(sid);
}
