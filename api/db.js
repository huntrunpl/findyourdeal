import pkg from "pg";
import { DEFAULT_LANG, normalizeLang } from "./i18n.js";
const { Pool } = pkg;

const SUPPORTED_LANGS = new Set(["pl","en","de","fr","es","it","pt","ro","nl","cs","sk","hu","hr","sr","bs","uk","ru"]);
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    });

function detectSource(urlString) {
  try {
    const u = new URL(urlString);
    const host = (u.hostname || "").toLowerCase();
    if (host.includes("olx.")) return "olx";
    if (host.includes("vinted.")) return "vinted";
  } catch {}
  return "unknown";
}

function defaultNameForUrl(urlString) {
  const src = detectSource(urlString);
  if (src === "olx") return "Monitorowanie OLX";
  if (src === "vinted") return "Monitorowanie Vinted";
  return "Monitorowanie";
}

async function ensureLinksColumns() {
  try { await pool.query(`ALTER TABLE public.links ADD COLUMN IF NOT EXISTS label TEXT;`); } catch {}
}

async function ensureLangColumns() {
  const ALLOWED = "('pl','en','de','fr','es','it','pt','ro','nl','cs','sk','hu','hr','sr','bs','uk','ru')";
// users.language + users.lang (alias) + lock
  try { await pool.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS language TEXT;`); } catch {}
  try { await pool.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS lang TEXT;`); } catch {}
  try { await pool.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS language_locked BOOLEAN NOT NULL DEFAULT FALSE;`); } catch {}

  try { await pool.query(`ALTER TABLE public.users ALTER COLUMN language SET DEFAULT '${DEFAULT_LANG}';`); } catch {}
  try { await pool.query(`ALTER TABLE public.users ALTER COLUMN lang SET DEFAULT '${DEFAULT_LANG}';`); } catch {}

  // Ujednolić language/lang i wypełnić braki
  try {
    await pool.query(`
      UPDATE public.users
      SET
        language = CASE
          WHEN language IS NOT NULL AND language<>'' AND language IN ${ALLOWED} THEN language
          WHEN lang IS NOT NULL AND lang<>'' AND lang IN ${ALLOWED} THEN lang
          ELSE '${DEFAULT_LANG}'
        END,
        lang = CASE
          WHEN language IS NOT NULL AND language<>'' AND language IN ${ALLOWED} THEN language
          WHEN lang IS NOT NULL AND lang<>'' AND lang IN ${ALLOWED} THEN lang
          ELSE '${DEFAULT_LANG}'
        END
      WHERE
        language IS NULL OR language='' OR language NOT IN ${ALLOWED}
        OR lang IS NULL OR lang='' OR lang NOT IN ${ALLOWED}
        OR language IS DISTINCT FROM lang;
    `);
  } catch {}

  try { await pool.query(`ALTER TABLE public.users ALTER COLUMN language SET NOT NULL;`); } catch {}
  try { await pool.query(`ALTER TABLE public.users ALTER COLUMN lang SET NOT NULL;`); } catch {}

  // chat_notifications.language
  try { await pool.query(`ALTER TABLE public.chat_notifications ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT '${DEFAULT_LANG}';`); } catch {}
  try {
    await pool.query(`
      UPDATE public.chat_notifications
      SET language='${DEFAULT_LANG}'
      WHERE language IS NULL OR language='' OR language NOT IN ${ALLOWED};
    `);
  } catch {}
}

// ---- TRIAL auto-grant (bezpieczny, self-heal; działa tylko jeśli schema pozwala) ----
const FYD_TRIAL_DAYS = (() => {
  const n = Number(process.env.FYD_TRIAL_DAYS ?? 3);
  return Number.isFinite(n) && n > 0 && n <= 30 ? n : 3;
})();

async function getColumns(tableName) {
  try {
    const r = await pool.query(
      `SELECT column_name, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1`,
      [String(tableName)]
    );
    return r.rows || [];
  } catch {
    return [];
  }
}
function hasCol(cols, name) {
  return cols.some((c) => String(c.column_name).toLowerCase() === String(name).toLowerCase());
}

async function ensureTrialForUserId(userId, tgUserId) {
  try {
    const uid = Number(userId);
    if (!Number.isFinite(uid) || uid <= 0) return;

    const subCols = await getColumns("subscriptions");
    if (!subCols.length) return; // brak tabeli albo brak uprawnień

    // jeśli trial_used = true -> nie dawaj drugi raz
    const usrCols = await getColumns("users");
    if (hasCol(usrCols, "trial_used")) {
      const tr = await pool.query(`SELECT trial_used FROM public.users WHERE id=$1 LIMIT 1`, [uid]).catch(() => ({ rows: [] }));
      if (tr?.rows?.[0]?.trial_used === true) return;
    }

    // jeśli już ma subskrypcję -> nie dawaj trial
    if (hasCol(subCols, "status")) {
      const ex = await pool.query(`SELECT 1 FROM public.subscriptions WHERE user_id=$1 AND status='active' LIMIT 1`, [uid]).catch(() => ({ rowCount: 0 }));
      if ((ex?.rowCount || 0) > 0) return;
    } else {
      const ex = await pool.query(`SELECT 1 FROM public.subscriptions WHERE user_id=$1 LIMIT 1`, [uid]).catch(() => ({ rowCount: 0 }));
      if ((ex?.rowCount || 0) > 0) return;
    }

    // plan trial
    const pr = await pool.query(`SELECT id FROM public.plans WHERE LOWER(code)='trial' LIMIT 1`).catch(() => ({ rows: [] }));
    const planId = Number(pr?.rows?.[0]?.id || 0);
    if (!Number.isFinite(planId) || planId <= 0) return;

    const cols = [];
    const vals = [];
    const add = (c, v) => {
      if (hasCol(subCols, c)) {
        cols.push(c);
        vals.push(v);
      }
    };

    const now = new Date();
    const end = new Date(Date.now() + FYD_TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const tgid = Number(tgUserId);
    const ref = Number.isFinite(tgid) && tgid > 0 ? String(tgid) : String(uid);

    add("user_id", uid);
    add("plan_id", planId);
    add("provider", "internal");
    add("provider_subscription_id", `trial:${ref}`);
    add("status", "active");
    add("addon_qty", 0);
    add("current_period_end", end);
    add("created_at", now);
    add("updated_at", now);

    if (cols.length < 4) return;

    const ph = cols.map((_, i) => `$${i + 1}`).join(",");
    const conflict =
      hasCol(subCols, "provider") && hasCol(subCols, "provider_subscription_id")
        ? " ON CONFLICT (provider, provider_subscription_id) DO NOTHING"
        : " ON CONFLICT DO NOTHING";

    const sql = `INSERT INTO public.subscriptions (${cols.join(",")}) VALUES (${ph})${conflict}`;
    await pool.query(sql, vals).catch(() => {});

    if (hasCol(usrCols, "trial_used")) {
      await pool.query(`UPDATE public.users SET trial_used=TRUE, updated_at=NOW() WHERE id=$1`, [uid]).catch(() => {});
    }
  } catch {}
}

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.users (
      id SERIAL PRIMARY KEY,
      telegram_user_id BIGINT,
      telegram_id TEXT,
      telegram_chat_id BIGINT,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      language_code TEXT,
      language TEXT NOT NULL DEFAULT '${DEFAULT_LANG}',
      lang TEXT NOT NULL DEFAULT '${DEFAULT_LANG}',
      language_locked BOOLEAN NOT NULL DEFAULT FALSE,
      plan_name TEXT DEFAULT 'none',
      plan_expires_at TIMESTAMP,
      trial_used BOOLEAN DEFAULT FALSE,
      extra_link_packs INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await ensureLangColumns();

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_user_id_uniq
    ON public.users (telegram_user_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.links (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      name TEXT,
      label TEXT,
      url TEXT NOT NULL,
      source TEXT,
      active BOOLEAN DEFAULT TRUE,
      chat_id TEXT,
      thread_id TEXT,
      last_key TEXT,
      last_seen_at TIMESTAMP,
      filters JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await ensureLinksColumns();

  await pool.query(`
    CREATE INDEX IF NOT EXISTS links_user_active_idx
    ON public.links (user_id, active, id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.link_items (
      id SERIAL PRIMARY KEY,
      link_id INTEGER NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
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

  await pool.query(`
    CREATE INDEX IF NOT EXISTS link_items_link_id_first_seen_idx
    ON public.link_items (link_id, first_seen_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.chat_notifications (
      id SERIAL PRIMARY KEY,
      chat_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      mode TEXT NOT NULL DEFAULT 'single',
      language TEXT NOT NULL DEFAULT '${DEFAULT_LANG}',
      daily_count INTEGER NOT NULL DEFAULT 0,
      daily_count_date DATE,
      last_notified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS chat_notifications_chat_user_uniq
    ON public.chat_notifications (chat_id, user_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.link_notification_modes (
      user_id INTEGER NOT NULL,
      chat_id TEXT NOT NULL,
      link_id INTEGER NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
      mode TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (user_id, chat_id, link_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.chat_quiet_hours (
      chat_id TEXT PRIMARY KEY,
      quiet_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      quiet_from SMALLINT NOT NULL DEFAULT 22,
      quiet_to SMALLINT NOT NULL DEFAULT 7
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.activation_tokens (
      token TEXT PRIMARY KEY,
      plan_id INTEGER NOT NULL,
      provider TEXT NOT NULL,
      provider_ref TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      used_by_telegram_user_id BIGINT
    );
  `);

  try { await pool.query(`ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS addon_qty INTEGER DEFAULT 0;`); } catch {}
  try { await pool.query(`ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS provider_customer_id TEXT;`); } catch {}
  try { await pool.query(`ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;`); } catch {}
  try {
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_provider_sub_uniq
      ON public.subscriptions (provider, provider_subscription_id);
    `);
  } catch {}

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.panel_login_tokens (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP
      );
    `);
  } catch {}
}

export async function ensureUser(telegramUserId, username=null, firstName=null, lastName=null, languageCode=null) {
  const tgNum = Number(telegramUserId);
  if (!Number.isFinite(tgNum)) throw new Error("ensureUser: invalid telegramUserId");
  const tgText = String(tgNum);

  const base = normalizeLang(languageCode);
  const lang = SUPPORTED_LANGS.has(base) ? base : DEFAULT_LANG;

  await ensureLangColumns();
  await ensureLinksColumns();

  const q = await pool.query(
    `
    INSERT INTO public.users (telegram_user_id, telegram_id, username, first_name, last_name, language_code, language, lang, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$7,NOW(),NOW())
    ON CONFLICT (telegram_user_id) DO UPDATE SET
      telegram_id=EXCLUDED.telegram_id,
      username=EXCLUDED.username,
      first_name=EXCLUDED.first_name,
      last_name=EXCLUDED.last_name,
      language_code=EXCLUDED.language_code,
      language=CASE
        WHEN public.users.language_locked = TRUE THEN public.users.language
        ELSE EXCLUDED.language
      END,
      lang=CASE
        WHEN public.users.language_locked = TRUE THEN public.users.lang
        ELSE EXCLUDED.lang
      END,
      updated_at=NOW()
    RETURNING *;
    `,
    [tgNum, tgText, username, firstName, lastName, languageCode, lang]
  );

  const user = q.rows[0] || null;

  // auto-trial (jeśli możliwe)
  if (user && user.id) {
    try { await ensureTrialForUserId(Number(user.id), tgNum); } catch {}
  }

  return user;
}

export async function setUserLanguage(idOrTgOrUser, a, b=null) {
  let idVal = idOrTgOrUser;
  if (idVal && typeof idVal === "object") {
    idVal = idVal.telegram_user_id ?? idVal.telegramUserId ?? idVal.id;
  }

  const n = Number(idVal);
  if (!Number.isFinite(n)) throw new Error("setUserLanguage: invalid id");

  let chatId = null;
  let langCode = null;

  if (b != null) {
    chatId = String(a);
    langCode = b;
  } else {
    langCode = a;
  }

  const base = normalizeLang(langCode);
  const lang = SUPPORTED_LANGS.has(base) ? base : DEFAULT_LANG;

  await ensureLangColumns();

  const run = async () => {
    const u = await pool.query(
      `SELECT id FROM public.users WHERE telegram_user_id=$1 OR id=$1 LIMIT 1`,
      [n]
    );
    if (!u.rowCount) return null;
    const userId = Number(u.rows[0].id);

    await pool.query(
      `UPDATE public.users SET language=$2, lang=$2, updated_at=NOW() WHERE id=$1`,
      [userId, lang]
    );

    if (chatId != null) {
      await pool.query(
        `UPDATE public.chat_notifications SET language=$3, updated_at=NOW() WHERE chat_id=$1 AND user_id=$2`,
        [String(chatId), userId, lang]
      ).catch(() => {});
    }

    const out = await pool.query(`SELECT * FROM public.users WHERE id=$1 LIMIT 1`, [userId]);
    return out.rows[0] || null;
  };

  try {
    return await run();
  } catch (e) {
    const code = e?.code || "";
    if (code === "42703" || String(e?.message || "").includes('column "language" does not exist') || String(e?.message || "").includes('column "lang" does not exist')) {
      await ensureLangColumns();
      return await run();
    }
    throw e;
  }
}

export async function getUserWithPlanByTelegramId(tgId) {
  const tgNum = Number(tgId);
  if (!Number.isFinite(tgNum)) return null;
  const q = await pool.query(`SELECT * FROM public.users WHERE telegram_user_id=$1 LIMIT 1`, [tgNum]);
  return q.rows[0] || null;
}

export async function getUserById(userId) {
  const q = await pool.query(`SELECT * FROM public.users WHERE id=$1 LIMIT 1`, [Number(userId)]);
  return q.rows[0] || null;
}

export async function getUserEntitlementsByTelegramId(tgId) {
  const tgNum = Number(tgId);
  if (!Number.isFinite(tgNum)) return null;
  try {
    const q = await pool.query(
      `
      SELECT user_id, telegram_user_id, plan_code, expires_at, base_links_limit, extra_links, links_limit_total,
             fast_slots, refresh_fast_s, refresh_normal_s, group_chat_allowed
      FROM public.user_entitlements_v
      WHERE telegram_user_id=$1
      LIMIT 1
      `,
      [tgNum]
    );
    return q.rows[0] || null;
  } catch {
    return null;
  }
}

export async function ensureChatNotificationsRow(chatId, userId) {
  const uid = Number(userId);
  if (!Number.isFinite(uid) || uid <= 0) throw new Error("ensureChatNotificationsRow: invalid userId");

  let lang = DEFAULT_LANG;
  try {
    const r = await pool.query(
      `SELECT COALESCE(NULLIF(language,''), NULLIF(lang,''), $1) AS lang
       FROM public.users
       WHERE id=$2
       LIMIT 1`,
      [DEFAULT_LANG, uid]
    );
    if (r?.rows?.[0]?.lang) lang = String(r.rows[0].lang);
  } catch {}

  const q = await pool.query(
    `
    INSERT INTO public.chat_notifications (chat_id, user_id, enabled, mode, language, daily_count, daily_count_date, created_at, updated_at)
    VALUES ($1,$2,TRUE,'single',$3,0,CURRENT_DATE,NOW(),NOW())
    ON CONFLICT (chat_id, user_id) DO UPDATE SET updated_at=NOW()
    RETURNING *
    `,
    [String(chatId), uid, lang]
  );
  return q.rows[0] || null;
}


export async function clearLinkNotificationMode(userId, chatId, linkId) {
  return await pool.query(
    `DELETE FROM public.link_notification_modes WHERE user_id=$1 AND chat_id=$2 AND link_id=$3`,
    [Number(userId), String(chatId), Number(linkId)]
  );
}

export async function countEnabledLinksForUserId(userId) {
  const q = await pool.query(`SELECT COUNT(*)::int AS cnt FROM public.links WHERE user_id=$1 AND active=TRUE`, [Number(userId)]);
  return q.rows[0]?.cnt ?? 0;
}
export async function countActiveLinksForUserId(userId) {
  const q = await pool.query(`SELECT COUNT(*)::int AS cnt FROM public.links WHERE user_id=$1`, [Number(userId)]);
  return q.rows[0]?.cnt ?? 0;
}
export async function getLinksByUserId(userId, enabledOnly=false) {
  const q = enabledOnly
    ? await pool.query(`SELECT id,COALESCE(NULLIF(label,''),name) AS name,url,source,active FROM public.links WHERE user_id=$1 AND active=TRUE ORDER BY id ASC`, [Number(userId)])
    : await pool.query(`SELECT id,COALESCE(NULLIF(label,''),name) AS name,url,source,active FROM public.links WHERE user_id=$1 ORDER BY id ASC`, [Number(userId)]);
  return q.rows || [];
}

export async function setLinkLabelForUserId(userId, linkId, label) {
  await ensureLinksColumns();
  const clean = (label == null) ? "" : String(label).trim();
  const q = await pool.query(
    `UPDATE public.links SET label=$3 WHERE id=$1 AND user_id=$2 RETURNING id,COALESCE(NULLIF(label,''),name) AS name,url,source,active`,
    [Number(linkId), Number(userId), clean]
  );
  return q.rows[0] || null;
}

export async function insertLinkForUserId(userId, name, url, chatId=null, threadId=null) {
  const src = detectSource(url);
  const finalName = name && String(name).trim().length ? String(name).trim() : defaultNameForUrl(url);
  const q = await pool.query(
    `
    INSERT INTO public.links (user_id,name,label,url,source,active,chat_id,thread_id,created_at)
    VALUES ($1,$2,NULL,$3,$4,TRUE,$5,$6,NOW())
    RETURNING id,user_id,COALESCE(NULLIF(label,''),name) AS name,url,source,active,chat_id,thread_id
    `,
    [Number(userId), finalName, String(url), src, chatId!=null?String(chatId):null, threadId!=null?String(threadId):null]
  );
  return q.rows[0] || null;
}

export async function deactivateLinkForUserId(linkId, userId) {
  const q = await pool.query(
    `UPDATE public.links SET active=FALSE WHERE id=$1 AND user_id=$2 RETURNING id,COALESCE(NULLIF(label,''),name) AS name,url,source,active`,
    [Number(linkId), Number(userId)]
  );
  return q.rows[0] || null;
}

export async function deleteLinkForUserId(linkId, userId) {
  // Usuwa link całkowicie: znika z /lista i /status + zwalnia limit
  const q = await pool.query(
    `DELETE FROM public.links
     WHERE id=$1 AND user_id=$2
     RETURNING id,COALESCE(NULLIF(label,''),name) AS name,url,source,active`,
    [Number(linkId), Number(userId)]
  );
  return q.rows[0] || null;
}

export async function getLinksForWorker() {
  const q = await pool.query(
    `
    SELECT l.id,l.user_id,u.telegram_user_id,COALESCE(NULLIF(l.label,''),l.name) AS name,l.url,l.source,l.active,l.chat_id,l.thread_id,l.last_key,l.filters
    FROM public.links l
    JOIN public.users u ON u.id=l.user_id
    WHERE l.active=TRUE
    ORDER BY l.id ASC
    `
  );
  return q.rows || [];
}




export async function getSeenItemKeys(linkId, keysToCheck) {
  const arr = Array.isArray(keysToCheck)
    ? keysToCheck.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  if (!arr.length) return new Set();

  const sql = `
    WITH k AS (
      SELECT DISTINCT public.fyd_norm_item_key(x) AS k
      FROM unnest($2::text[]) t(x)
      WHERE x IS NOT NULL AND btrim(x) <> ''
    )
    SELECT li.item_key
    FROM public.link_items li
    JOIN k ON k.k = li.item_key
    WHERE li.link_id = $1
  `;
  const r = await pool.query(sql, [Number(linkId), arr]);
  return new Set((r.rows || []).map((row) => row.item_key));
}




function __parsePrice(raw) {
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




export async function insertLinkItems(linkId, items) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return 0;

  // price_from / price_to z URL linku (Vinted/OLX)
  const lr = await pool.query("SELECT url FROM public.links WHERE id=$1 LIMIT 1", [Number(linkId)]);
  const linkUrl = String(lr?.rows?.[0]?.url || "");

  let priceFrom = null
  let priceTo = null
  try {
    const u = new URL(linkUrl);
    const sp = u.searchParams;

    const pf = sp.get("price_from") || sp.get("search[filter_float_price:from]");
    const pt = sp.get("price_to")   || sp.get("search[filter_float_price:to]");

    if (pf !== null && pf !== "") {
      const n = Number(pf);
      if (Number.isFinite(n)) priceFrom = n;
    }
    if (pt !== null && pt !== "") {
      const n = Number(pt);
      if (Number.isFinite(n)) priceTo = n;
    }
  } catch {
    priceFrom = null; priceTo = null;
  }

  const payload = [];
  for (const it of arr) {
    // Vinted często daje cenę jako string typu "123 zł" / "123,00 PLN"
    let price = null;
    let currency = (it && it.currency != null) ? String(it.currency) : "";
    currency = String(currency || "").trim();

    if (it && it.price !== undefined && it.price !== null && String(it.price).trim() !== "") {
      if (typeof it.price === "number") {
        price = it.price;
      } else {
        const parsed = __parsePrice(it.price);
        if (parsed && parsed.price != null) price = parsed.price;
        if (!currency && parsed && parsed.currency) currency = parsed.currency;
      }
    }

    if (price !== null && !Number.isFinite(price)) price = null;

    // jeżeli link ma bounds (price_from/price_to), a nie umiemy ceny -> odrzuć
    if ((priceFrom !== null || priceTo !== null) && price === null) continue;

    // filtr cen zgodnie z parametrami linku
    if (priceFrom !== null && price !== null && price < priceFrom) continue;
    if (priceTo !== null && price !== null && price > priceTo) continue;

    payload.push({
      item_key: it?.item_key ?? it?.key ?? it?.url ?? "",
      title: it?.title ?? "",
      price,
      currency,
      brand: it?.brand ?? "",
      size: it?.size ?? "",
      condition: it?.condition ?? "",
      url: it?.url ?? ""
    });
  }

  if (!payload.length) return 0;

  const sql = `
    INSERT INTO public.link_items (link_id, item_key, title, price, currency, brand, size, condition, url, first_seen_at)
    SELECT
      $1,
      public.fyd_norm_item_key(COALESCE(x.url, x.item_key)),
      x.title,
      x.price,
      x.currency,
      x.brand,
      x.size,
      x.condition,
      x.url,
      NOW()
    FROM jsonb_to_recordset($2::jsonb) AS x(
      item_key text,
      title text,
      price numeric,
      currency text,
      brand text,
      size text,
      condition text,
      url text
    )
    WHERE public.fyd_norm_item_key(COALESCE(x.url, x.item_key)) IS NOT NULL
      AND public.fyd_norm_item_key(COALESCE(x.url, x.item_key)) <> ''
    ON CONFLICT DO NOTHING
  `;
  const r = await pool.query(sql, [Number(linkId), JSON.stringify(payload)]);
  return (r && typeof r.rowCount === "number") ? r.rowCount : 0;
}






export async function updateLastKey(linkId, newestKey) {
  const k = String(newestKey || "").trim();
  if (!k) return;
  await pool.query(
    "UPDATE public.links SET last_key = public.fyd_norm_item_key($2) WHERE id=$1",
    [Number(linkId), k]
  );
}


export async function pruneLinkItems(linkId, keep=500) {
  const k = Number(keep);
  if (!Number.isFinite(k) || k <= 0) return 0;
  const q = await pool.query(
    `
    DELETE FROM public.link_items
    WHERE link_id=$1
      AND id NOT IN (
        SELECT id FROM public.link_items
        WHERE link_id=$1
        ORDER BY first_seen_at DESC, id DESC
        LIMIT $2
      )
    `,
    [Number(linkId), k]
  );
  return q.rowCount || 0;
}

export async function getQuietHours(chatId) {
  const q = await pool.query(`SELECT * FROM public.chat_quiet_hours WHERE chat_id=$1 LIMIT 1`, [String(chatId)]);
  return q.rows[0] || null;
}
export async function setQuietHours(chatId, fromHour, toHour) {
  await pool.query(
    `
    INSERT INTO public.chat_quiet_hours (chat_id, quiet_enabled, quiet_from, quiet_to)
    VALUES ($1, TRUE, $2, $3)
    ON CONFLICT (chat_id) DO UPDATE SET
      quiet_enabled=TRUE,
      quiet_from=EXCLUDED.quiet_from,
      quiet_to=EXCLUDED.quiet_to
    `,
    [String(chatId), Number(fromHour), Number(toHour)]
  );
  return true;
}
export async function disableQuietHours(chatId) {
  await pool.query(
    `
    INSERT INTO public.chat_quiet_hours (chat_id, quiet_enabled, quiet_from, quiet_to)
    VALUES ($1, FALSE, 22, 7)
    ON CONFLICT (chat_id) DO UPDATE SET quiet_enabled=FALSE
    `,
    [String(chatId)]
  );
  return true;
}

/* kompatybilność (stare nazwy z tg-bot.js) */
export async function getUserIdByTelegramId(tgId) {
  const tgNum = Number(tgId);
  if (!Number.isFinite(tgNum)) return null;
  const q = await pool.query(`SELECT id FROM public.users WHERE telegram_user_id=$1 LIMIT 1`, [tgNum]);
  return q.rows?.[0]?.id ? Number(q.rows[0].id) : null;
}
export async function listActiveLinks() {
  const q = await pool.query(`SELECT id,COALESCE(NULLIF(label,''),name) AS name,url,source,active FROM public.links WHERE active=TRUE ORDER BY id ASC`);
  return q.rows || [];
}
export async function deactivateLink(id) {
  const q = await pool.query(`UPDATE public.links SET active=FALSE WHERE id=$1 RETURNING id,COALESCE(NULLIF(label,''),name) AS name,url,source,active`, [Number(id)]);
  return q.rows[0] || null;
}
export async function addLink(url, name=null) {
  const q = await pool.query(
    `INSERT INTO public.links (user_id,name,label,url,source,active,created_at) VALUES (NULL,$1,NULL,$2,$3,TRUE,NOW()) RETURNING id,COALESCE(NULLIF(label,''),name) AS name,url,source,active`,
    [name && String(name).trim().length ? String(name).trim() : defaultNameForUrl(url), String(url), detectSource(url)]
  );
  return q.rows[0] || null;
}
export async function activateLink(id) {
  const q = await pool.query(`UPDATE public.links SET active=TRUE WHERE id=$1 RETURNING id,COALESCE(NULLIF(label,''),name) AS name,url,source,active`, [Number(id)]);
  return q.rows[0] || null;
}
