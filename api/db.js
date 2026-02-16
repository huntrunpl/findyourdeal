import pkg from "pg";
const { Pool } = pkg;

// Preferuj DATABASE_URL jeśli jest (Docker/produkcyjnie), inaczej PGHOST/PGUSER itd.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    });

// =======================
// Rozpoznawanie źródła (OLX / Vinted)
// =======================

function detectSource(urlString) {
  try {
    const u = new URL(urlString);
    const host = (u.hostname || "").toLowerCase();
    if (host.includes("olx.")) return "olx";
    if (host.includes("vinted.")) return "vinted";
  } catch {
    // ignorujemy błędy parsowania
  }
  return "unknown";
}

function defaultNameForUrl(urlString) {
  const src = detectSource(urlString);
  if (src === "olx") return "Monitorowanie OLX";
  if (src === "vinted") return "Monitorowanie Vinted";
  return "Monitorowanie";
}

// =======================
// Inicjalizacja bazy
// =======================
export async function initDb() {
  // users (dla planów / limitów / statusu)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id TEXT UNIQUE,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      language_code TEXT,
      plan_name TEXT DEFAULT 'none',
      plan_expires_at TIMESTAMP,
      trial_used BOOLEAN DEFAULT FALSE,
      extra_link_packs INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // kompatybilność, jeśli tabela users istnieje, ale brakuje kolumn
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS language_code TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'none';`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS extra_link_packs INTEGER DEFAULT 0;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_uniq
    ON users (telegram_id);
  `);

  // links
  await pool.query(`
    CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      name TEXT,
      url TEXT NOT NULL,
      source TEXT,
      active BOOLEAN DEFAULT TRUE,
      chat_id TEXT,
      thread_id TEXT,
      last_key TEXT,
      last_seen_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // dodatkowa kolumna na filtry
  await pool.query(`
    ALTER TABLE links
    ADD COLUMN IF NOT EXISTS filters JSONB;
  `);

  // historia ogłoszeń
  await pool.query(`
    CREATE TABLE IF NOT EXISTS link_items (
      id SERIAL PRIMARY KEY,
      link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
      item_key TEXT NOT NULL,
      title TEXT,
      price NUMERIC,
      currency TEXT,
      brand TEXT,
      size TEXT,
      condition TEXT,
      url TEXT,
      first_seen_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(link_id, item_key)
    );
  `);

  // indeks pod pruning + szybkie pobieranie najnowszych
  await pool.query(`
    CREATE INDEX IF NOT EXISTS link_items_link_id_first_seen_idx
    ON link_items (link_id, first_seen_at DESC);
  `);

  // jeśli w jakiejś instancji macie BIGINT id dorzucony ręcznie – utrzymuj unikalność
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS link_items_id_uniq
    ON link_items (id);
  `);

  // tabela powiadomień per czat
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_notifications (
      id SERIAL PRIMARY KEY,
      chat_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      mode TEXT NOT NULL DEFAULT 'single',
      daily_count INTEGER NOT NULL DEFAULT 0,
      daily_count_date DATE,
      last_notified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // unikalność (chat_id, user_id) – potrzebne do ON CONFLICT
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS chat_notifications_chat_user_uniq
    ON chat_notifications (chat_id, user_id);
  `);

  // tryby powiadomień per link na danym czacie
  await pool.query(`
    CREATE TABLE IF NOT EXISTS link_notification_modes (
      user_id INTEGER NOT NULL,
      chat_id TEXT NOT NULL,
      link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
      mode TEXT NOT NULL,
      PRIMARY KEY (user_id, chat_id, link_id)
    );
  `);

  // updated_at do przechowywania czasu ostatniej zmiany trybu
  await pool.query(`
    ALTER TABLE link_notification_modes
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
  `);

  // tabela ciszy nocnej per czat
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_quiet_hours (
      chat_id TEXT PRIMARY KEY,
      quiet_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      quiet_from SMALLINT NOT NULL DEFAULT 22,
      quiet_to SMALLINT NOT NULL DEFAULT 7
    );
  `);

  // znacznik od którego liczymy historię wysyłek (globalnie dla czatu / per link)
  await pool.query(`
    ALTER TABLE chat_notifications
    ADD COLUMN IF NOT EXISTS notify_from TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await pool.query(`
    ALTER TABLE links
    ADD COLUMN IF NOT EXISTS notify_from TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  // per-link item limit per worker loop
  await pool.query(`
    ALTER TABLE links
    ADD COLUMN IF NOT EXISTS max_items_per_loop INTEGER NULL;
  `);

  // historia faktycznie wysłanych ofert (SoT dla limitów i komend historii)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sent_offers (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      chat_id TEXT NOT NULL,
      link_id INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      price NUMERIC NULL,
      currency TEXT NULL,
      title TEXT NULL,
      url TEXT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (chat_id, link_id, item_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS sent_offers_user_chat_sent_at_idx
    ON sent_offers (user_id, chat_id, sent_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS sent_offers_user_link_sent_at_idx
    ON sent_offers (user_id, link_id, sent_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS sent_offers_price_sort_idx
    ON sent_offers (user_id, chat_id, sent_at DESC, price ASC);
  `);

  // Admin audit log (KROK 6)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.admin_audit_log (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      action TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT NULL,

      caller_tg_id BIGINT NOT NULL,
      caller_user_id BIGINT NULL,
      caller_role TEXT NULL,

      target_tg_id BIGINT NULL,
      target_user_id BIGINT NULL,

      chat_id BIGINT NULL,
      message_id BIGINT NULL,

      payload JSONB NULL
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
    ON public.admin_audit_log(created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action
    ON public.admin_audit_log(action);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_tg
    ON public.admin_audit_log(target_tg_id);
  `);
}

// =======================
// Użytkownicy (API/tg-bot)
// =======================

export async function ensureUser(
  telegramId,
  username = null,
  firstName = null,
  lastName = null,
  languageCode = null
) {
  const tgNum = Number(telegramId);
  if (!Number.isFinite(tgNum)) throw new Error("ensureUser: invalid telegramId");

  const tgText = String(telegramId);

  const q = await pool.query(
    `
    INSERT INTO users (
      telegram_user_id,
      telegram_id,
      username,
      first_name,
      last_name,
      language_code
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (telegram_user_id) DO UPDATE SET
      telegram_id = EXCLUDED.telegram_id,
      username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      language_code = EXCLUDED.language_code,
      updated_at = NOW()
    RETURNING *;
    `,
    [tgNum, tgText, username, firstName, lastName, languageCode]
  );

  return q.rows[0] || null;
}

export async function getUserIdByTelegramId(tgId) {
  const tid = String(tgId);
  const q = await pool.query(
    `SELECT id FROM users WHERE CAST(telegram_id AS TEXT) = $1 LIMIT 1`,
    [tid]
  );
  return q.rows[0]?.id ?? null;
}

export async function getUserWithPlanByTelegramId(tgId) {
  const tgNum = Number(tgId);
  if (!Number.isFinite(tgNum)) return null;

  // Źródło prawdy: user_entitlements_v + users (lang)
  const q = await pool.query(
    `
    SELECT
      u.id,
      u.telegram_user_id,
      u.telegram_id,
      u.username,
      u.first_name,
      u.last_name,
      u.lang,
      u.language_code,
      ent.plan_code,
      ent.plan_name,
      ent.expires_at AS plan_expires_at,
      ent.links_limit_total,
      ent.daily_notifications_limit,
      ent.history_limit_total,
      ent.base_links_limit,
      ent.extra_links,
      u.telegram_chat_id
    FROM user_entitlements_v ent
    JOIN users u ON u.id = ent.user_id
    WHERE ent.telegram_user_id = $1
    LIMIT 1
    `,
    [tgNum]
  );

  return q.rows[0] || null;
}

// Alias for getUserWithPlanByTelegramId (used by panel-dev-auth and status command)
export async function getUserEntitlementsByTelegramId(tgId) {
  return getUserWithPlanByTelegramId(tgId);
}

export async function setUserTelegramChatId(userId, chatId) {
  const uid = Number(userId);
  const cid = Number(chatId);
  if (!Number.isFinite(uid)) throw new Error("setUserTelegramChatId: invalid userId");
  if (!Number.isFinite(cid) || cid <= 0) {
    throw new Error("setUserTelegramChatId: chatId must be private (>0)");
  }

  const q = await pool.query(
    `
    UPDATE users
    SET telegram_chat_id = $2, updated_at = NOW()
    WHERE id = $1 AND (telegram_chat_id IS NULL OR telegram_chat_id = $2)
    RETURNING telegram_chat_id
    `,
    [uid, cid]
  );

  return q.rows[0]?.telegram_chat_id ?? null;
}

export async function getChatNotificationMode(chatId, userId) {
  const q = await pool.query(
    `SELECT mode FROM chat_notifications WHERE chat_id = $1 AND user_id = $2 LIMIT 1`,
    [String(chatId), Number(userId)]
  );
  return (q.rows[0]?.mode || "single").toLowerCase();
}

export async function setLinkNotificationMode(userId, chatId, linkId, mode) {
  await pool.query(
    `
    INSERT INTO link_notification_modes (user_id, chat_id, link_id, mode, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (user_id, chat_id, link_id)
    DO UPDATE SET mode = EXCLUDED.mode, updated_at = NOW()
    `,
    [Number(userId), String(chatId), Number(linkId), String(mode)]
  );
}

export async function clearLinkNotificationMode(userId, chatId, linkId) {
  await pool.query(
    `DELETE FROM link_notification_modes WHERE user_id=$1 AND chat_id=$2 AND link_id=$3`,
    [Number(userId), String(chatId), Number(linkId)]
  );
}

export async function resetLinkOverridesForUserId(linkId, userId, chatId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Usuń per-link mode override
    await client.query(
      `DELETE FROM link_notification_modes WHERE user_id=$1 AND chat_id=$2 AND link_id=$3`,
      [Number(userId), String(chatId), Number(linkId)]
    );
    
    // 2. Reset notify_from (zaczynamy zbierać oferty od teraz)
    const res = await client.query(
      `UPDATE links SET notify_from = NOW() WHERE id = $1 AND user_id = $2 RETURNING id, name, url`,
      [Number(linkId), Number(userId)]
    );
    
    await client.query('COMMIT');
    return res.rows[0] || null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getUserById(userId) {
  const q = await pool.query(
    `
    SELECT
      id,
      telegram_id,
      username,
      first_name,
      last_name,
      language_code,
      plan_name,
      plan_expires_at,
      trial_used,
      extra_link_packs,
      telegram_chat_id
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [Number(userId)]
  );
  return q.rows[0] || null;
}

// =======================
// Linki (API/tg-bot)
// =======================

export async function countActiveLinksForUserId(userId) {
  const q = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM links WHERE user_id = $1`,
    [Number(userId)]
  );
  return q.rows[0]?.cnt ?? 0;
}

export async function countEnabledLinksForUserId(userId) {
  const q = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM links WHERE user_id = $1 AND active = TRUE`,
    [Number(userId)]
  );
  return q.rows[0]?.cnt ?? 0;
}

// ===== FIX: exports wymagane przez API/tg-bot (/links) =====
function __fydDetectSource(url) {
  const u = String(url || "").toLowerCase();
  if (u.includes("olx.")) return "olx";
  if (u.includes("vinted.")) return "vinted";
  return "unknown";
}
function __fydDefaultNameForUrl(url) {
  const src = __fydDetectSource(url);
  return src === "unknown" ? "Monitorowanie" : "Monitorowanie";
}

export async function getLinksByUser(telegramId) {
  const user = await getUserWithPlanByTelegramId(String(telegramId));
  if (!user) return [];
  const q = await pool.query(
    `
    SELECT id, name, url, source, active
    FROM links
    WHERE user_id = $1
    ORDER BY id ASC
    `,
    [Number(user.id)]
  );
  return q.rows || [];
}

export async function insertLink(telegramId, name, url, chatId = null, threadId = null) {
  const user = await getUserWithPlanByTelegramId(String(telegramId));
  if (!user) return null;

  const src = __fydDetectSource(url);
  const finalName = (name && String(name).trim().length)
    ? String(name).trim()
    : __fydDefaultNameForUrl(url);

  const q = await pool.query(
    `
    INSERT INTO links (user_id, name, url, source, active, chat_id, thread_id)
    VALUES ($1, $2, $3, $4, TRUE, $5, $6)
    RETURNING id, user_id, name, url, source, active
    `,
    [
      Number(user.id),
      finalName,
      String(url),
      src,
      chatId != null ? String(chatId) : null,
      threadId != null ? String(threadId) : null
    ]
  );
  return q.rows[0] || null;
}

export async function deleteLink(linkId, telegramId) {
  const user = await getUserWithPlanByTelegramId(String(telegramId));
  if (!user) return false;

  const q = await pool.query(
    `DELETE FROM links WHERE id = $1 AND user_id = $2 RETURNING id`,
    [Number(linkId), Number(user.id)]
  );
  return !!q.rowCount;
}

export async function getLinksByUserId(userId, activeOnly = false) {
  const q = await pool.query(
    `
    SELECT id, name, url, source, active
    FROM links
    WHERE user_id = $1
      AND ($2::boolean = FALSE OR active = TRUE)
      AND (hidden = FALSE OR hidden IS NULL)
    ORDER BY id ASC
    `,
    [Number(userId), !!activeOnly]
  );
  return q.rows || [];
}

export async function insertLinkForUserId(userId, name, url, chatId = null, threadId = null) {
  const src = __fydDetectSource(url);
  const finalName = (name && String(name).trim().length)
    ? String(name).trim()
    : __fydDefaultNameForUrl(url);

  const q = await pool.query(
    `
    INSERT INTO links (user_id, name, url, source, active, chat_id, thread_id)
    VALUES ($1, $2, $3, $4, TRUE, $5, $6)
    RETURNING id, user_id, name, url, source, active
    `,
    [
      Number(userId),
      finalName,
      String(url),
      src,
      chatId != null ? String(chatId) : null,
      threadId != null ? String(threadId) : null
    ]
  );
  return q.rows[0] || null;
}

export async function deactivateLinkForUserId(linkId, userId) {
  const q = await pool.query(
    `
    UPDATE links
    SET active = FALSE
    WHERE id = $1 AND user_id = $2
    RETURNING id, name, url
    `,
    [Number(linkId), Number(userId)]
  );
  return q.rows[0] || null;
}

export async function updateLinkNameForUserId(linkId, userId, newName) {
  const q = await pool.query(
    `
    UPDATE links
    SET label = $3
    WHERE id = $1 AND user_id = $2
    RETURNING id, name, url
    `,
    [Number(linkId), Number(userId), newName]
  );
  return q.rows[0] || null;
}


// ===== FIX: brakujące eksporty (API + worker) =====
function __fydParsePrice(raw) {
  if (raw == null) return { price: null, currency: null };
  const txt = String(raw).replace(/\s+/g, " ").trim();
  let currency = null;
  if (txt.includes("zł") || txt.includes("PLN")) currency = "PLN";
  if (txt.includes("€") || txt.includes("EUR")) currency = "EUR";
  if (txt.includes("$") || txt.includes("USD")) currency = "USD";

  const m = txt.replace(/[^0-9,\.]/g, "").replace(",", ".").match(/[0-9]+(\.[0-9]+)?/);
  const price = m ? Number(m[0]) : null;
  return { price: Number.isFinite(price) ? price : null, currency };
}

export async function getLinksForWorker() {
  const q = await pool.query(
    `
    SELECT id, user_id, name, url, source, active, chat_id, thread_id, last_key, filters, max_items_per_loop
    FROM links
    WHERE active = TRUE
    ORDER BY id ASC
    `
  );
  return q.rows || [];
}

export async function getSeenItemKeys(linkId, keys = []) {
  const arr = Array.isArray(keys) ? keys.filter(Boolean).map(String) : [];
  if (!arr.length) return new Set();
  const q = await pool.query(
    `SELECT item_key FROM link_items WHERE link_id = $1 AND item_key = ANY($2::text[])`,
    [Number(linkId), arr]
  );
  return new Set((q.rows || []).map(r => r.item_key));
}

export async function insertLinkItems(linkId, items = []) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return 0;

  let inserted = 0;
  for (const it of arr) {
    const item_key = String(it?.item_key || it?.itemKey || it?.key || it?.url || "").trim();
    if (!item_key) continue;

    const title = it?.title ? String(it.title).trim() : null;
    const url = it?.url ? String(it.url).trim() : null;

    const raw = it?.rawPrice ?? it?.price ?? null;
    const pp = __fydParsePrice(raw);

    const brand = it?.brand ? String(it.brand) : null;
    const size = it?.size ? String(it.size) : null;
    const condition = it?.condition ? String(it.condition) : null;

    try {
      await pool.query(
        `
        INSERT INTO link_items (link_id, item_key, title, price, currency, brand, size, condition, url)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (link_id, item_key) DO NOTHING
        `,
        [Number(linkId), item_key, title, pp.price, pp.currency, brand, size, condition, url]
      );
      inserted += 1
    } catch {
      // ignorujemy pojedyncze błędy
    }
  }
  return inserted;
}

export async function updateLastKey(linkId, lastKey) {
  await pool.query(
    `
    UPDATE links
    SET last_key = $2,
        last_seen_at = NOW()
    WHERE id = $1
    `,
    [Number(linkId), lastKey ? String(lastKey) : null]
  );
  return true;
}

export async function pruneLinkItems(linkId, keep = 500) {
  const k = Number(keep);
  if (!Number.isFinite(k) || k <= 0) return 0;

  const q = await pool.query(
    `
    DELETE FROM link_items
    WHERE link_id = $1
      AND id NOT IN (
        SELECT id FROM link_items
        WHERE link_id = $1
        ORDER BY first_seen_at DESC, id DESC
        LIMIT $2
      )
    `,
    [Number(linkId), k]
  );
  return q.rowCount || 0;
}

// =======================
// Cisza nocna (per chat_id)
// =======================
async function ensureQuietHoursTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiet_hours (
      chat_id TEXT PRIMARY KEY,
      quiet_enabled BOOLEAN DEFAULT FALSE,
      quiet_from SMALLINT,
      quiet_to SMALLINT,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

export async function getQuietHours(chatId) {
  // Read from chat_quiet_hours (panel table) - single source of truth
  const q = await pool.query(
    `SELECT chat_id, quiet_enabled, quiet_from, quiet_to FROM chat_quiet_hours WHERE chat_id = $1 LIMIT 1`,
    [String(chatId)]
  );
  return q.rows[0] || null;
}

export async function setQuietHours(chatId, fromHour, toHour) {
  // Write to chat_quiet_hours (panel table) - single source of truth
  const f = Number(fromHour);
  const t = Number(toHour);

  const q = await pool.query(
    `
    INSERT INTO chat_quiet_hours (chat_id, quiet_enabled, quiet_from, quiet_to)
    VALUES ($1, TRUE, $2, $3)
    ON CONFLICT (chat_id)
    DO UPDATE SET quiet_enabled = TRUE, quiet_from = EXCLUDED.quiet_from, quiet_to = EXCLUDED.quiet_to
    RETURNING chat_id, quiet_enabled, quiet_from, quiet_to
    `,
    [String(chatId), f, t]
  );
  return q.rows[0] || null;
}

export async function disableQuietHours(chatId) {
  // Write to chat_quiet_hours (panel table) - single source of truth
  const q = await pool.query(
    `
    INSERT INTO chat_quiet_hours (chat_id, quiet_enabled)
    VALUES ($1, FALSE)
    ON CONFLICT (chat_id)
    DO UPDATE SET quiet_enabled = FALSE
    RETURNING chat_id, quiet_enabled, quiet_from, quiet_to
    `,
    [String(chatId)]
  );
  return q.rows[0] || null;
}

// =======================
// Admin audit log (KROK 6)
// =======================
export async function logAdminAudit({
  action,
  status,
  reason = null,
  callerTgId,
  callerUserId = null,
  callerRole = null,
  targetTgId = null,
  targetUserId = null,
  chatId = null,
  messageId = null,
  payload = null
}) {
  try {
    await pool.query(
      `
      INSERT INTO public.admin_audit_log (
        action, status, reason,
        caller_tg_id, caller_user_id, caller_role,
        target_tg_id, target_user_id,
        chat_id, message_id,
        payload
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        action,
        status,
        reason,
        callerTgId ? Number(callerTgId) : null,
        callerUserId ? Number(callerUserId) : null,
        callerRole,
        targetTgId ? Number(targetTgId) : null,
        targetUserId ? Number(targetUserId) : null,
        chatId ? Number(chatId) : null,
        messageId ? Number(messageId) : null,
        payload ? JSON.stringify(payload) : null
      ]
    );
  } catch (err) {
    // Log error but don't crash the command
    console.error("[AUDIT_LOG_ERROR]", err?.stack || err);
  }
}
// =======================
// Admin audit log cleanup (KROK 6.2)
// =======================
export async function cleanupAuditLog(retentionDays = 180) {
  try {
    const result = await pool.query(
      `DELETE FROM public.admin_audit_log WHERE created_at < NOW() - INTERVAL '${retentionDays} days'`
    );
    const deletedRows = result.rowCount || 0;
    
    if (deletedRows > 0) {
      console.log(`[AUDIT_CLEANUP] Deleted ${deletedRows} audit log entries older than ${retentionDays} days`);
    } else {
      console.log(`[AUDIT_CLEANUP] No audit log entries to delete (retention: ${retentionDays} days)`);
    }
    
    return deletedRows;
  } catch (err) {
    console.error("[AUDIT_CLEANUP_ERROR]", err?.stack || err);
    return 0;
  }
}