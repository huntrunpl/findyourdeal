import { cookies } from "next/headers";
import { pool } from "./db";

export const SESSION_COOKIE_NAME = "fyd_panel_session";

function envInt(name: string, def: number) {
  const v = Number(process.env[name] || "");
  return Number.isFinite(v) && v > 0 ? v : def;
}

const SESSION_DAYS = envInt("PANEL_SESSION_DAYS", 14);
const TOKEN_MINUTES = envInt("PANEL_TOKEN_MINUTES", 10);

export async function consumePanelLoginToken(token: string): Promise<number | null> {
  const t = (token || "").trim();
  if (!t) return null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const q = await client.query(
      `SELECT token, user_id, expires_at, used_at
       FROM panel_login_tokens
       WHERE token=$1
       FOR UPDATE`,
      [t]
    );

    const row = q.rows[0];
    if (!row) {
      await client.query("ROLLBACK");
      return null;
    }

    if (row.used_at) {
      await client.query("ROLLBACK");
      return null;
    }

    if (new Date(row.expires_at).getTime() <= Date.now()) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `UPDATE panel_login_tokens SET used_at = used_at /* FYD_PANEL_TOKEN_REUSE */ WHERE token=$1`,
      [t]
    );

    await client.query("COMMIT");
    return Number(row.user_id);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    throw e;
  } finally {
    client.release();
  }
}

export async function createPanelSession(
  userId: number,
  ip: string | null,
  userAgent: string | null
): Promise<{ id: string; expires_at: string }> {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const q = await pool.query(
    `INSERT INTO panel_sessions (user_id, expires_at, ip, user_agent)
     VALUES ($1, $2, $3, $4)
     RETURNING id::text, expires_at::text`,
    [userId, expires.toISOString(), ip, userAgent]
  );

  return q.rows[0];
}

export async function getSessionUserIdBySessionId(sessionId: string): Promise<number | null> {
  const sid = (sessionId || "").trim();
  if (!sid) return null;

  const q = await pool.query(
    `SELECT user_id
     FROM panel_sessions
     WHERE id = $1::uuid AND expires_at > NOW()
     LIMIT 1`,
    [sid]
  );
  return q.rows[0]?.user_id ?? null;
}

// używane w Server Components
export async function getSessionUserId(): Promise<number | null> {
  const c = await cookies();
  const sid = c.get(SESSION_COOKIE_NAME)?.value || "";
  if (!sid) return null;
  return getSessionUserIdBySessionId(sid);
}

export function getTokenMinutes() {
  return TOKEN_MINUTES;
}
