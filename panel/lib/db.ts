import pg from "pg";

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var __FYD_POOL__: pg.Pool | undefined;
}

export const pool =
  global.__FYD_POOL__ ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  global.__FYD_POOL__ = pool;
}

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initPanelDb() {
  // Guard 1: Już zrobione
  if (initialized) return;

  // Guard 2: Jeśli trwa inicjalizacja, czekaj na to (race condition safety)
  if (initPromise) return initPromise;

  // Guard 3: Ustaw promise zanim zaczniemy
  initPromise = (async () => {
    try {
      // Tablica tokenów do logowania panelu (10 minut ważności)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS panel_login_tokens (
          token TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Tablica sesji panelu (domyślnie 14 dni)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS panel_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id INTEGER NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          ip TEXT,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Indeksy dla wydajności
      await pool.query(`
        CREATE INDEX IF NOT EXISTS panel_login_tokens_user_id
        ON panel_login_tokens (user_id);
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS panel_sessions_user_id
        ON panel_sessions (user_id);
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS panel_sessions_expires_at
        ON panel_sessions (expires_at);
      `);

      // Indeks dla cleanup wygasłych tokenów (10 min TTL)
      await pool.query(`
        CREATE INDEX IF NOT EXISTS panel_login_tokens_expires_at
        ON panel_login_tokens (expires_at);
      `);

      // Cleanup trigger: Usuwaj wygasłe tokeny (co 1 min, max 100 na run)
      // Zapobiega gromadzeniu się tokenów w bazie
      await pool.query(`
        CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
        RETURNS TABLE(deleted_count int) AS $$
        BEGIN
          DELETE FROM panel_login_tokens
          WHERE expires_at < NOW() - INTERVAL '5 minutes'
          LIMIT 100;
          
          GET DIAGNOSTICS deleted_count = ROW_COUNT;
          RETURN QUERY SELECT deleted_count;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Cleanup trigger: Usuwaj wygasłe sesje (co 1 min, max 100 na run)
      // Zapobiega gromadzeniu się sesji w bazie
      await pool.query(`
        CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
        RETURNS TABLE(deleted_count int) AS $$
        BEGIN
          DELETE FROM panel_sessions
          WHERE expires_at < NOW()
          LIMIT 100;
          
          GET DIAGNOSTICS deleted_count = ROW_COUNT;
          RETURN QUERY SELECT deleted_count;
        END;
        $$ LANGUAGE plpgsql;
      `);

      initialized = true;
      console.log("[initPanelDb] Panel database tables initialized successfully");
    } catch (e) {
      const err = e as Error;
      // Jeśli to permission error - log jasno ale nie crashuj (może być read-only replica)
      if (err.message?.includes("permission denied") || err.message?.includes("PERMISSION")) {
        console.warn("[initPanelDb] Permission denied - skipping (read-only environment?):", err.message);
      } else {
        console.error("[initPanelDb] Error initializing panel database:", err.message);
        throw e;
      }
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}
