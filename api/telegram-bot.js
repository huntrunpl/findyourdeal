import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import pg from "pg";
import Stripe from "stripe";
import { randomBytes } from "crypto";
import { fileURLToPath } from "url";
import os from "os";
import { t, getUserLang } from "./i18n_unified.js";
import { normalizeCommand, getPrimaryAlias } from "./command_aliases.js";

const __filename = fileURLToPath(import.meta.url);
const BUILD_ID = "20260215_230000"; // KROK 11.2+11.3: Admin command aliases (11 langs) + localized help_admin + canonical routing
const BOT_CODE_HASH = "4246c9f8583238ad3ddca9865b016d83"; // Code fingerprint for runtime verification
const START_TIME = Date.now(); // Bot start timestamp for uptime calculation

import {
  initDb,
  ensureUser,
  getUserWithPlanByTelegramId,
  getUserById,
  getLinksByUserId,
  countActiveLinksForUserId,
  countEnabledLinksForUserId,
  insertLinkForUserId,
  deactivateLinkForUserId,
  setQuietHours,
  disableQuietHours,
  getQuietHours,
  logAdminAudit,
  cleanupAuditLog,
} from "./db.js";
import { clearLinkNotificationMode } from "./db.js";

import {
  getEffectiveLinkLimit,
  formatPlanStatus,
  isPlanActive,
  buildLimitReachedMessage,
  getPerLinkItemLimit,
  getExtraLinkPacks,
} from "./plans.js";

const { Pool } = pg;

const TG = process.env.TELEGRAM_BOT_TOKEN || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PRICE_STARTER = process.env.STRIPE_PRICE_STARTER || "";
const STRIPE_PRICE_GROWTH = process.env.STRIPE_PRICE_GROWTH || "";
const STRIPE_PRICE_PLATINUM = process.env.STRIPE_PRICE_PLATINUM || "";
const STRIPE_PRICE_ADDON = process.env.STRIPE_PRICE_ADDON10 || process.env.STRIPE_PRICE_ADDON || "";

if (!TG) {
  console.error("Brak TELEGRAM_BOT_TOKEN w env, wychodzę.");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("Brak DATABASE_URL w env – bot może mieć problem z DB.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Initialize Stripe
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY, {
  apiVersion: "2026-01-28.clover",
}) : null;

// Track last router match for /debug
let lastRouterMatch = { cmd: null, matched: null, timestamp: null };

// limit dzienny powiadomień na jeden chat – informacyjnie do /status
const MAX_DAILY_NOTIFICATIONS = 200;

// admini uprawnieni do komend typu /admin_reset
const ADMIN_TELEGRAM_IDS = new Set(
  String(process.env.ADMIN_TELEGRAM_IDS || "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
);

// ---------- helpery ogólne ----------

async function dbQuery(sql, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

// Minimalne escape HTML dla Telegrama (parse_mode=HTML)
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Sanitizes HTML for Telegram API - preserves allowed tags, escapes everything else
 * Allowed tags: <b>, <i>, <code>, <pre>, <a href="">, <u>, <s>, <strong>, <em>
 * This prevents "Unsupported start tag" errors from Telegram API
 */
function sanitizeHtmlForTelegram(text) {
  if (!text) return "";
  
  // Convert to string
  let safe = String(text);
  
  // First pass: protect allowed tags by replacing with placeholders
  const allowedTags = [
    { pattern: /<b>/gi, placeholder: "___B_OPEN___" },
    { pattern: /<\/b>/gi, placeholder: "___B_CLOSE___" },
    { pattern: /<i>/gi, placeholder: "___I_OPEN___" },
    { pattern: /<\/i>/gi, placeholder: "___I_CLOSE___" },
    { pattern: /<code>/gi, placeholder: "___CODE_OPEN___" },
    { pattern: /<\/code>/gi, placeholder: "___CODE_CLOSE___" },
    { pattern: /<pre>/gi, placeholder: "___PRE_OPEN___" },
    { pattern: /<\/pre>/gi, placeholder: "___PRE_CLOSE___" },
    { pattern: /<u>/gi, placeholder: "___U_OPEN___" },
    { pattern: /<\/u>/gi, placeholder: "___U_CLOSE___" },
    { pattern: /<s>/gi, placeholder: "___S_OPEN___" },
    { pattern: /<\/s>/gi, placeholder: "___S_CLOSE___" },
    { pattern: /<strong>/gi, placeholder: "___STRONG_OPEN___" },
    { pattern: /<\/strong>/gi, placeholder: "___STRONG_CLOSE___" },
    { pattern: /<em>/gi, placeholder: "___EM_OPEN___" },
    { pattern: /<\/em>/gi, placeholder: "___EM_CLOSE___" },
  ];
  
  // Replace allowed tags with placeholders
  allowedTags.forEach(({ pattern, placeholder }) => {
    safe = safe.replace(pattern, placeholder);
  });
  
  // Escape all remaining < and > (these are the dangerous ones)
  safe = safe.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  // Also escape & that aren't part of entities
  safe = safe.replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, "&amp;");
  
  // Restore allowed tags
  safe = safe
    .replace(/___B_OPEN___/g, "<b>")
    .replace(/___B_CLOSE___/g, "</b>")
    .replace(/___I_OPEN___/g, "<i>")
    .replace(/___I_CLOSE___/g, "</i>")
    .replace(/___CODE_OPEN___/g, "<code>")
    .replace(/___CODE_CLOSE___/g, "</code>")
    .replace(/___PRE_OPEN___/g, "<pre>")
    .replace(/___PRE_CLOSE___/g, "</pre>")
    .replace(/___U_OPEN___/g, "<u>")
    .replace(/___U_CLOSE___/g, "</u>")
    .replace(/___S_OPEN___/g, "<s>")
    .replace(/___S_CLOSE___/g, "</s>")
    .replace(/___STRONG_OPEN___/g, "<strong>")
    .replace(/___STRONG_CLOSE___/g, "</strong>")
    .replace(/___EM_OPEN___/g, "<em>")
    .replace(/___EM_CLOSE___/g, "</em>");
  
  return safe;
}

function isAdmin(tgId) {
  return ADMIN_TELEGRAM_IDS.has(String(tgId || ""));
}

async function tgApi(method, payload) {
  const url = `https://api.telegram.org/bot${TG}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json().catch(() => ({}));
}

async function tgSend(chatId, text, extra = {}) {
  const MAX_LEN = 3500; // bezpieczny margines dla Telegrama (limit ~4096)
  const raw = String(text ?? "");
  
  // Sanitize HTML to prevent "Unsupported start tag" errors
  const full = sanitizeHtmlForTelegram(raw);

  const parts = [];
  if (full.length <= MAX_LEN) {
    parts.push(full);
  } else {
    let rest = full;
    while (rest.length > 0) {
      let cut = rest.lastIndexOf("\n", MAX_LEN);
      if (cut < 1000) cut = MAX_LEN; // jak nie ma sensownego \n, tnij twardo
      parts.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
  }

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const extraForThis = i === 0 ? extra : {}; // nie duplikuj klawiatur/markupów
    try {
      const res = await tgApi("sendMessage", {
        chat_id: chatId,
        text: part,
        ...(extra.parse_mode !== undefined ? { parse_mode: extra.parse_mode } : { parse_mode: "HTML" }),
        disable_web_page_preview: extra.disable_web_page_preview !== undefined 
          ? extra.disable_web_page_preview 
          : true,
        ...extraForThis,
      });

      if (!res || res.ok !== true) {
        console.error("Telegram send failed:", res?.description || res);
        console.error("chatId=", chatId, "textLen=", String(part).length);
      } else {
        console.log("Telegram sent:", res.result?.message_id, "chatId=", chatId, "len=", String(part).length);
      }
    } catch (err) {
      console.error("[TG_SEND_ERROR]", {
        chatId,
        textPreview: String(part).slice(0, 200),
        error: err.message || String(err)
      });
      if (err.response?.body) {
        console.error("[TG_SEND_ERROR_BODY]", err.response.body);
      }
    }
  }
}

async function tgAnswerCb(callbackQueryId, text, showAlert = false) {
  try {
    await tgApi("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      text,
      show_alert: !!showAlert,
    });
  } catch (e) {
    // ignore
  }
}

// ---------- mapowanie Telegram ID -> user_id (aliasy) ----------

async function resolveUserIdFromTg(tgId) {
  const tid = String(tgId);

  // standard: pobieramy user po telegram_id
  const user = await getUserWithPlanByTelegramId(tid);
  return user?.id || null;
}

// jeśli nie ma chat_notifications – tworzymy domyślnie WŁĄCZONE + single
async function ensureChatNotificationsRow(chatId, userId) {
  await dbQuery(
    `
    INSERT INTO chat_notifications (chat_id, user_id, enabled, mode, daily_count, daily_count_date, created_at, updated_at)
    VALUES ($1, $2, TRUE, 'single', 0, CURRENT_DATE, NOW(), NOW())
    ON CONFLICT (chat_id, user_id) DO NOTHING
    `,
    [String(chatId), Number(userId)]
  );
}

// ---------- long polling z getUpdates ----------

let offset = 0;

async function fetchUpdates() {
  const url = new URL(`https://api.telegram.org/bot${TG}/getUpdates`);
  url.searchParams.set("timeout", "30");
  if (offset) url.searchParams.set("offset", String(offset));

  const res = await fetch(url.href);
  if (!res.ok) throw new Error(`getUpdates HTTP ${res.status}`);

  const data = await res.json();
  if (!data.ok) throw new Error(`getUpdates Telegram error: ${data.description}`);

  return data.result;
}

// ---------- pomocnik do budowy STATUS ----------

function formatDateYMD(dateVal) {
  if (!dateVal) return "n/a";
  try {
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
    return d.toISOString().slice(0, 10);
  } catch {
    return "n/a";
  }
}


async function buildStatusMessage(chatId, user) {
  const userId = user.id;
  const lang = getUserLang(user);

  const linkLimit = Number(user.links_limit_total ?? getEffectiveLinkLimit(user) ?? 0) || 0;
  const dailyLimit = Number(user.daily_notifications_limit ?? MAX_DAILY_NOTIFICATIONS) || MAX_DAILY_NOTIFICATIONS;
  const planCode = user.plan_code || user.plan_name || "-";
  const planName = user.plan_name || user.plan_code || "-";
  const planExp = formatDateYMD(user.plan_expires_at || user.expires_at);
  
  // Calculate addon packs (if platinum)
  const extraPacks = planCode.toLowerCase() === "platinum" ? getExtraLinkPacks(user) : 0;

  // stderr is always unbuffered in Node.js, unlike stdout in non-TTY environments
  process.stderr.write(
    `[status_debug] user_id=${userId} lang=${lang} plan_code=${planCode} link_limit=${linkLimit} daily_limit=${dailyLimit} lang_col=${user.lang} lang_code=${user.language_code}\n`
  );

  let text = t(lang, "status.title") + "\n\n";
  const planText = extraPacks > 0 
    ? t(lang, "status.plan_with_addons", { name: planName, exp: planExp, addons: extraPacks })
    : t(lang, "status.plan", { name: planName, exp: planExp });
  text += planText + "\n\n";

  // Link counters
  try {
    const totalLinks = await countActiveLinksForUserId(userId);
    const enabledLinks = await countEnabledLinksForUserId(userId);
    text += t(lang, "status.links_enabled", { enabled: enabledLinks, limit: linkLimit }) + "\n";
    text += t(lang, "status.links_total", { total: totalLinks, limit: linkLimit }) + "\n";
    if (dailyLimit) {
      text += t(lang, "status.daily_limit", { limit: dailyLimit }) + "\n";
    }
    text += `\n`;
  } catch (e) {
    console.error("buildStatusMessage: link counters error", e);
  }

  // Chat notification settings
  const todayStr = new Date().toISOString().slice(0, 10);
  let chatDefaultMode = "single";
  let chatEnabled = true;
  let notifDebugData = { source: "none", enabled: null, mode: null, rowCount: 0 };
  
  try {
    const res = await dbQuery(
      `
      SELECT enabled, mode, daily_count, daily_count_date
      FROM chat_notifications
      WHERE chat_id = $1 AND user_id = $2
      `,
      [String(chatId), userId]
    );

    notifDebugData = {
      source: "chat_notifications",
      chatId: String(chatId),
      userId,
      rowCount: res.rowCount || 0,
      enabled: res.rows[0]?.enabled ?? null,
      mode: res.rows[0]?.mode ?? null
    };

    if (res.rowCount) {
      const row = res.rows[0];
      const enabled = row.enabled !== false;
      const mode = (row.mode || "single").toLowerCase();
      chatDefaultMode = mode;
      chatEnabled = enabled;

      let daily = row.daily_count || 0;
      let dateStr = null;
      if (row.daily_count_date) {
        dateStr = row.daily_count_date.toISOString
          ? row.daily_count_date.toISOString().slice(0, 10)
          : String(row.daily_count_date).slice(0, 10);
      }
      if (dateStr !== todayStr) daily = 0;

      const modeKey = mode === "batch" ? "mode.batch" : mode === "off" ? "mode.off" : "mode.single";
      const modeLabel = t(lang, modeKey);
      const chatLineKey = enabled ? "status.chat_line_enabled" : "status.chat_line_disabled";
      text += t(lang, chatLineKey, { mode: modeLabel, daily, limit: dailyLimit }) + "\n\n";
    } else {
      notifDebugData.reason = "no_row_found";
      text += t(lang, "status.chat_line_enabled", { mode: "single", daily: 0, limit: dailyLimit }) + "\n\n";
    }
  } catch (e) {
    console.error("buildStatusMessage: chat_notifications error", e);
    notifDebugData = { source: "error", error: e.message };
    text += t(lang, "status.unknown") + "\n\n";
  }

  // Quiet hours
  let quietDebugData = { source: "none", enabled: null, from: null, to: null };
  
  try {
    const qh = await getQuietHours(String(chatId));
    
    quietDebugData = {
      source: "chat_quiet_hours",
      chatId: String(chatId),
      rowFound: !!qh,
      enabled: qh?.quiet_enabled ?? null,
      from: qh?.quiet_from ?? null,
      to: qh?.quiet_to ?? null
    };
    
    if (qh && qh.quiet_enabled) {
      text += t(lang, "status.quiet_on", { from: qh.quiet_from ?? 22, to: qh.quiet_to ?? 7 }) + "\n\n";
    } else {
      if (!qh) quietDebugData.reason = "no_row_found";
      text += t(lang, "status.quiet_off") + "\n\n";
    }
  } catch (e) {
    console.error("buildStatusMessage: quiet_hours error", e);
    quietDebugData = { source: "error", error: e.message };
    text += t(lang, "status.unknown") + "\n\n";
  }

  // Debug log
  console.log(`[status_debug] user_id=${userId} chatId=${chatId} telegram_user_id=${user.telegram_user_id}`);
  console.log(`[status_debug] notifications:`, JSON.stringify(notifDebugData));
  console.log(`[status_debug] quiet_hours:`, JSON.stringify(quietDebugData));

  // Links list (up to 25)
  try {
    const resLinks = await dbQuery(
      `
      SELECT
        l.id,
        l.name,
        l.url,
        l.source,
        l.active,
        lnm.mode AS link_mode
      FROM links l
      LEFT JOIN link_notification_modes lnm
        ON lnm.user_id = l.user_id
       AND lnm.chat_id = $2
       AND lnm.link_id = l.id
      WHERE l.user_id = $1
        AND l.active = TRUE
      ORDER BY l.id ASC
      LIMIT 25
      `,
      [userId, String(chatId)]
    );

    if (!resLinks.rowCount) {
      text += t(lang, "status.no_links");
    } else {
      text += t(lang, "status.links_header") + "\n";
      for (const row of resLinks.rows) {
        const src = (row.source || "").toUpperCase() || "LINK";
        const name = row.name || row.url;
        const lm = row.link_mode == null ? null : String(row.link_mode).toLowerCase();
        const modeRaw =
          lm === null
            ? chatDefaultMode
            : lm === "batch"
            ? "batch"
            : lm === "off"
            ? "off"
            : "single";

        const modeKey = modeRaw === "batch" ? "mode.batch" : modeRaw === "off" ? "mode.off" : "mode.single";
        const modeLabel = t(lang, modeKey);
        const state = row.active ? "✅" : "⛔";
        
        // Bell icon logic
        let bell;
        if (modeRaw === "off") {
          bell = "🔕";
        } else if (chatEnabled) {
          bell = "🔔";
        } else {
          bell = "🔕";
        }
        
        text += `• ${state}${bell} ${row.id} – ${escapeHtml(name)} (${src}) – ${modeLabel}\n`;
      }

      text += "\n" + t(lang, "status.per_link_hint");
    }
  } catch (e) {
    console.error("buildStatusMessage: links error", e);
    text += t(lang, "status.unknown");
  }

  return text.trim();
}

// ---------- /help /start ----------

async function handleHelp(msg, user) {
  const chatId = msg.chat.id;
  try {
    const lang = getUserLang(user);
    
    const text =
      t(lang, "cmd.help_greeting") + "\n\n" +
      t(lang, "cmd.help_basic") + "\n" +
      t(lang, "cmd.help_basic_lista") + "\n" +
      t(lang, "cmd.help_basic_usun") + "\n" +
      t(lang, "cmd.help_basic_dodaj") + "\n" +
      t(lang, "cmd.help_basic_status") + "\n" +
      t(lang, "cmd.help_basic_panel") + "\n" +
      t(lang, "cmd.help_basic_nazwa") + "\n\n" +
      t(lang, "cmd.help_notif") + "\n" +
      t(lang, "cmd.help_notif_on") + "\n" +
      t(lang, "cmd.help_notif_off") + "\n" +
      t(lang, "cmd.help_notif_single") + "\n" +
      t(lang, "cmd.help_notif_batch") + "\n\n" +
      t(lang, "cmd.help_perlink") + "\n" +
      t(lang, "cmd.help_perlink_commands") + "\n" +
      t(lang, "cmd.help_perlink_max") + "\n\n" +
      t(lang, "cmd.help_quiet") + "\n" +
      t(lang, "cmd.help_quiet_show") + "\n" +
      t(lang, "cmd.help_quiet_set") + "\n" +
      t(lang, "cmd.help_quiet_off") + "\n\n" +
      t(lang, "cmd.help_history") + "\n" +
      t(lang, "cmd.help_history_najnowsze") + "\n" +
      t(lang, "cmd.help_history_najnowsze_id") + "\n" +
      t(lang, "cmd.help_history_najtansze") + "\n" +
      t(lang, "cmd.help_history_najtansze_id") + "\n\n" +
      t(lang, "cmd.help_plans") + "\n" +
      t(lang, "cmd.help_plans_show") + "\n\n" +
      t(lang, "cmd.help_lang") + "\n" +
      t(lang, "cmd.help_lang_set") + "\n\n" +
      t(lang, "cmd.help_examples") + "\n" +
      t(lang, "cmd.help_examples_text") + "\n\n" +
      `<i>v${BUILD_ID} • ${BOT_CODE_HASH.slice(0,8)} • ${os.hostname()}</i>`;

    await tgSend(chatId, text);
  } catch (e) {
    console.error("[HELP_CRASH]", e?.stack || e);
    await tgSend(chatId, "❌ /help crashed on server. Check logs: [HELP_CRASH].");
  }
}

// ---------- /commands ----------

async function handleCommands(msg, user) {
  const chatId = msg.chat.id;
  try {
    const lang = getUserLang(user);
    
    const text =
      t(lang, "cmd.commands_header") + "\n\n" +
      t(lang, "cmd.commands_text") + "\n\n" +
      t(lang, "cmd.commands_footer") + "\n\n" +
      `<i>v${BUILD_ID} • ${BOT_CODE_HASH.slice(0,8)}</i>`;

    await tgSend(chatId, text);
  } catch (e) {
    console.error("[COMMANDS_CRASH]", e?.stack || e);
    await tgSend(chatId, "❌ /commands crashed on server. Check logs: [COMMANDS_CRASH].");
  }
}

// ---------- /debug ----------

async function handleDebug(msg) {
  const chatId = String(msg.chat.id);
  const tgId = msg.from?.id;
  
  // Admin gate
  if (!isAdmin(tgId)) {
    await tgSend(chatId, "❌ Brak uprawnień.");
    return;
  }
  
  const supportedLangsList = Object.keys(SUPPORTED_LANGS).join(", ");
  const lastMatch = lastRouterMatch.cmd 
    ? `${lastRouterMatch.cmd} → ${lastRouterMatch.matched} (${new Date(lastRouterMatch.timestamp).toISOString()})`
    : "(none yet)";
  
  // DB connection test
  let dbStatus = "OK";
  let dbLatency = 0;
  try {
    const start = Date.now();
    await pool.query("SELECT 1 AS test");
    dbLatency = Date.now() - start;
  } catch (err) {
    dbStatus = `ERROR: ${err.message}`;
  }
  
  // Uptime
  const uptimeMs = Date.now() - START_TIME;
  const uptimeSec = Math.floor(uptimeMs / 1000);
  const uptimeMin = Math.floor(uptimeSec / 60);
  const uptimeHr = Math.floor(uptimeMin / 60);
  const uptimeStr = `${uptimeHr}h ${uptimeMin % 60}m ${uptimeSec % 60}s`;
  
  const lines = [
    "🐛 Debug Info",
    "",
    `bot_version: ${BUILD_ID}`,
    `code_hash: ${BOT_CODE_HASH.slice(0, 12)}`,
    `hostname: ${os.hostname()}`,
    `file_path: ${__filename}`,
    `uptime: ${uptimeStr} (${uptimeMs}ms)`,
    "",
    `db_status: ${dbStatus}`,
    `db_latency: ${dbLatency}ms`,
    "",
    `supported_langs: ${supportedLangsList}`,
    "",
    `last_router_match: ${lastMatch}`,
  ];
  
  await tgSend(chatId, lines.join("\n"));
}

// ---------- /debug_worker_links ----------

async function handleDebugWorkerLinks(msg) {
  const chatId = String(msg.chat.id);
  const tgId = msg.from?.id;
  
  // Admin gate
  if (!isAdmin(tgId)) {
    await tgSend(chatId, "❌ Brak uprawnień.");
    return;
  }
  
  try {
    const res = await pool.query(
      `
      SELECT
        l.id,
        l.name,
        l.url,
        l.chat_id,
        u.plan_code,
        u.plan_expires_at,
        l.max_items_per_loop
      FROM links l
      JOIN users u ON u.id = l.user_id
      WHERE l.active = TRUE
      ORDER BY l.id ASC
      LIMIT 50
      `
    );
    
    if (!res.rowCount) {
      await tgSend(chatId, "📦 No active links in worker.");
      return;
    }
    
    const lines = ["📦 Active Worker Links:", ""];
    
    for (const row of res.rows) {
      const maxLimit = row.max_items_per_loop != null ? `max:${row.max_items_per_loop}` : "default";
      const exp = row.plan_expires_at ? row.plan_expires_at.toISOString().slice(0, 10) : "none";
      const name = row.name || row.url.slice(0, 30);
      
      lines.push(
        `• ID ${row.id} – ${escapeHtml(name)}\n  chat:${row.chat_id} plan:${row.plan_code || "free"} exp:${exp} ${maxLimit}`
      );
    }
    
    if (res.rowCount === 50) {
      lines.push("", `... and more (showing first 50)`);
    } else {
      lines.push("", `Total: ${res.rowCount}`);
    }
    
    await tgSend(chatId, lines.join("\n"));
  } catch (err) {
    console.error("[debug_worker_links]", err);
    await tgSend(chatId, `❌ Error: ${err.message}`);
  }
}

// ---------- /panel ----------

async function createPanelLoginToken(userId) {
  const token = randomBytes(24).toString("base64url");
  const minutes = Number(process.env.PANEL_TOKEN_MINUTES || "10") || 10;
  
  await pool.query(
    `INSERT INTO panel_login_tokens (token, user_id, expires_at)
     VALUES ($1, $2, now() + interval '${minutes} minutes')`,
    [token, userId]
  );
  return token;
}

async function handlePanel(msg, user) {
  const chatId = String(msg.chat.id);
  const requestId = randomBytes(8).toString("hex");

  try {
    console.log(`[panel][${requestId}] START userId=${user.id} telegramUserId=${user.telegram_user_id}`);

    const token = await createPanelLoginToken(user.id);
    const minutes = Number(process.env.PANEL_TOKEN_MINUTES || "10") || 10;
    const url = `https://panel.findyourdeal.app/api/auth/login?token=${encodeURIComponent(token)}`;

    const lang = getUserLang(user);
    await tgSend(chatId, t(lang, "payment.panel_link", { minutes, url }));
    console.log(`[panel][${requestId}] SUCCESS Created token, sent link`);
  } catch (e) {
    console.error(`[panel][${requestId}] ERROR:`, e);
    const lang = getUserLang(user);
    await tgSend(chatId, t(lang, "cmd.error_panel", { requestId }));
  }
}

// ---------- Helper: getAvailablePurchases (shared logic with panel) ----------

function getAvailablePurchases(currentPlan) {
  const normalized = String(currentPlan || "trial").toLowerCase();
  
  // Map old names
  const plan = normalized === "basic" ? "starter" : 
               normalized === "pro" ? "growth" : 
               normalized === "free" ? "trial" : 
               normalized;
  
  if (plan === "platinum") {
    return { type: "addon", items: ["links_10"] };
  }
  
  if (plan === "trial" || plan === "free") {
    return { type: "plans", items: ["starter", "growth", "platinum"] };
  }
  
  if (plan === "starter") {
    return { type: "plans", items: ["growth", "platinum"] };
  }
  
  if (plan === "growth") {
    return { type: "plans", items: ["platinum"] };
  }
  
  // Fallback for unknown plan
  return { type: "plans", items: [] };
}

// ---------- /plany ----------

async function handlePlany(msg, user) {
  const chatId = msg.chat.id;
  const requestId = randomBytes(8).toString("hex");

  try {
    // Get current plan from DB (source of truth: user_entitlements_v)
    const currentPlan = user.plan_code || "trial";
    
    console.log(`[plany][${requestId}] START userId=${user.id} telegramUserId=${user.telegram_user_id} currentPlan=${currentPlan}`);

    if (!stripe) {
      console.error(`[plany][${requestId}] ERROR: Stripe not configured (STRIPE_SECRET_KEY missing)`);
      const lang = getUserLang(user);
      await tgSend(chatId, t(lang, "cmd.error_payment_config", { requestId }));
      return;
    }

    // Use shared decision logic (same as panel Billing CTA)
    const purchases = getAvailablePurchases(currentPlan);
    
    console.log(`[plany][${requestId}]`, { 
      telegramUserId: user.telegram_user_id, 
      currentPlan, 
      purchaseType: purchases.type,
      availableItems: purchases.items
    });

    // PLATINUM: Auto-generate Stripe checkout link for addon
    if (purchases.type === "addon") {
      if (!STRIPE_PRICE_ADDON) {
        console.error(`[plany][${requestId}] ERROR: STRIPE_PRICE_ADDON not configured`);
        const lang = getUserLang(user);
        await tgSend(chatId, t(lang, "cmd.error_addon_config", { requestId }));
        return;
      }

      // Get addon quantity and expiry from user data
      const extraLinks = user.extra_links || 0;
      const expiryDate = user.plan_expires_at 
        ? new Date(user.plan_expires_at).toISOString().split('T')[0] 
        : "N/A";
      
      // Calculate total link limit (base + addons)
      const basePlatinumLinks = user.base_links_limit || 80;
      const totalLinks = user.links_limit_total || (basePlatinumLinks + extraLinks);
      const addonPackages = Math.floor(extraLinks / 10);

      console.log(`[plany][${requestId}] Platinum user - creating addon checkout`, {
        extraLinks,
        totalLinks,
        addonPackages,
        expiryDate
      });

      // Create Stripe checkout session immediately (no button click required)
      console.log(`[plany_addon_checkout][${requestId}] Creating Stripe session: mode=subscription priceId=${STRIPE_PRICE_ADDON}`);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: STRIPE_PRICE_ADDON, quantity: 1 }],
        success_url: `https://panel.findyourdeal.app/billing?success=true`,
        cancel_url: `https://panel.findyourdeal.app/billing?canceled=true`,
        client_reference_id: String(user.id),
        metadata: {
          user_id: String(user.id),
          telegram_user_id: String(user.telegram_user_id),
          addon_code: "links_10",
          source: "telegram_bot_auto"
        }
      });

      console.log(`[plany_addon_checkout][${requestId}] SUCCESS Created Stripe session=${session.id}`);

      const lang = getUserLang(user);
      const addonText = addonPackages > 0 ? t(lang, "payment.platinum_addon_packages", { count: addonPackages }) : '';
      await tgSend(
        chatId,
        t(lang, "payment.platinum_addon", { expiryDate, totalLinks, addonText, url: session.url })
      );
      console.log(`[plany][${requestId}] Sent addon checkout link for platinum user`);
      return;
    }

    // TRIAL/STARTER/GROWTH: Show plan upgrades
    if (purchases.items.length === 0) {
      const lang = getUserLang(user);
      await tgSend(chatId, t(lang, "cmd.error_no_purchase"));
      return;
    }

    const planDetails = {
      starter: { name: "Starter", emoji: "🚀", price: STRIPE_PRICE_STARTER },
      growth: { name: "Growth", emoji: "📈", price: STRIPE_PRICE_GROWTH },
      platinum: { name: "Platinum", emoji: "💎", price: STRIPE_PRICE_PLATINUM }
    };

    // Build inline keyboard for available plans
    const keyboard = {
      inline_keyboard: purchases.items.map(code => [{
        text: `${planDetails[code].emoji} ${planDetails[code].name}`,
        callback_data: `plan:${code}`
      }])
    };

    const planLabel = {
      trial: "Trial",
      free: "Free",
      starter: "Starter",
      growth: "Growth",
      platinum: "Platinum"
    };

    const lang = getUserLang(user);
    await tgSend(chatId, t(lang, "payment.plans_list_keyboard", { planLabel: planLabel[currentPlan] || currentPlan }), keyboard);
    console.log(`[plany][${requestId}] Sent ${purchases.items.length} plan options`);
  } catch (error) {
    console.error(`[plany][${requestId}] ERROR:`, error);
    console.error(`[plany][${requestId}] Error message: ${error.message}`);
    const lang = getUserLang(user);
    await tgSend(chatId, t(lang, "cmd.error_payment_create", { requestId }));
  }
}

// ---------- /lista ----------

async function handleLista(msg, user) {
  const chatId = msg.chat.id;
  const lang = getUserLang(user);

  try {
    const links = await getLinksByUserId(user.id, true);

    if (!links.length) {
      // Use plain text - no HTML entities needed
      await tgSend(chatId, t(lang, "cmd.lista_empty"), { 
        disable_web_page_preview: true 
      });
      return;
    }

    // Build list in plain text (no HTML) to avoid parse errors with URLs containing &
    let text = t(lang, "cmd.lista_title") + "\n\n";
    for (const row of links) {
      const name = row.name || "(no name)";
      text += `ID ${row.id} — ${name}\n`;
      text += `${row.url}\n\n`;
    }
    text += t(lang, "cmd.lista_disable") + "\n";
    // Dynamic command example using primary alias for "usun" in user's language
    const removeCmd = getPrimaryAlias("usun", lang);
    text += `/${removeCmd} <ID>`;

    // Send as plain text (parse_mode: null) to prevent HTML entity errors
    await tgSend(chatId, text, { 
      disable_web_page_preview: true 
    });
  } catch (err) {
    console.error("handleLista error:", err);
    await tgSend(chatId, t(lang, "cmd.error_lista"));
  }
}

// ---------- /usun ----------

async function handleUsun(msg, user, argText) {
  const chatId = msg.chat.id;
  const lang = getUserLang(user);
  const id = parseInt(argText, 10);

  if (!id) {
    await tgSend(chatId, t(lang, "cmd.usage_usun"));
    return;
  }

  try {
    const row = await deactivateLinkForUserId(id, user.id);

    if (!row) {
      await tgSend(chatId, t(lang, "cmd.link_not_found", { id }));
      return;
    }

    const name = row.name || t(lang, "lista.no_name");
    let text = t(lang, "usun.success");
    text += `ID <b>${row.id}</b> — ${escapeHtml(name)}\n`;
    text += `<code>${escapeHtml(row.url)}</code>\n\n`;
    text += t(lang, "usun.footer");

    await tgSend(chatId, text);
  } catch (err) {
    console.error("handleUsun error:", err);
    await tgSend(chatId, t(lang, "cmd.error_usun"));
  }
}

// ---------- /dodaj ----------

async function handleDodaj(msg, user, argText) {
  const chatId = msg.chat.id;

  const lang = getUserLang(user);

  if (!argText) {
    await tgSend(chatId, t(lang, "cmd.usage_dodaj"));
    return;
  }

  const parts = argText.split(/\s+/);
  const url = parts[0];
  const name = parts.slice(1).join(" ") || null;

  if (!url || !/^https?:\/\//i.test(url)) {
    await tgSend(chatId, t(lang, "dodaj.invalid_url"));
    return;
  }

  // plan aktywny?
  const activePlan = isPlanActive(user, new Date());
  if (!activePlan) {
    // Trial wygasł
    if (String(user.plan_name || "").toLowerCase() === "trial" && user.trial_used) {
      await tgSend(chatId, t(lang, "dodaj.trial_expired"));
      return;
    }

    // plan płatny wygasł
    const pn = String(user.plan_name || "").toLowerCase();
    if (pn === "starter" || pn === "growth" || pn === "platinum") {
      await tgSend(chatId, t(lang, "dodaj.plan_expired"));
      return;
    }

    const msg = user.trial_used 
      ? t(lang, "dodaj.no_active_plan_trial_used")
      : t(lang, "dodaj.no_active_plan_trial_available");
    await tgSend(chatId, msg);
    return;
  }

  // limit linków
  const activeLinks = await countActiveLinksForUserId(user.id);
  const limit = getEffectiveLinkLimit(user);

  if (activeLinks >= limit) {
    const msgText = buildLimitReachedMessage(user, activeLinks, limit);
    await tgSend(chatId, escapeHtml(msgText));
    return;
  }

  try {
    const row = await insertLinkForUserId(user.id, name, url);

    const displayName = row.name || t(lang, "dodaj.no_name");
    await tgSend(
      chatId,
      t(lang, "dodaj.success", {
        id: row.id,
        name: escapeHtml(displayName),
        url: escapeHtml(row.url),
        active: activeLinks + 1,
        limit
      })
    );
  } catch (err) {
    console.error("handleDodaj error:", err);
    await tgSend(chatId, t(lang, "cmd.error_dodaj"));
  }
}

// ---------- /status ----------

async function handleStatus(msg, user) {
  const chatId = String(msg.chat.id);

  try {
    await ensureChatNotificationsRow(chatId, user.id);
    const statusText = await buildStatusMessage(chatId, user);
    await tgSend(chatId, statusText);
  } catch (err) {
    console.error("handleStatus error:", err);
    const lang = getUserLang(user);
    await tgSend(chatId, t(lang, "cmd.error_status"));
  }
}

// ---------- /on /off ----------

async function handleNotificationsOn(msg, user) {
  const chatId = String(msg.chat.id);

  await ensureChatNotificationsRow(chatId, user.id);

  // reset notify_from (zaczynam zbierać oferty od teraz)
  await dbQuery(
    `
    INSERT INTO chat_notifications (chat_id, user_id, enabled, mode, updated_at, notify_from)
    VALUES ($1, $2, TRUE, 'single', NOW(), NOW())
    ON CONFLICT (chat_id, user_id) DO UPDATE SET
      enabled = TRUE,
      updated_at = NOW(),
      notify_from = NOW()
    `,
    [chatId, user.id]
  );

  // reset notify_from dla wszystkich aktywnych linków tego użytkownika
  await dbQuery(
    `
    UPDATE links
    SET notify_from = NOW()
    WHERE user_id = $1 AND active = TRUE
    `,
    [user.id]
  );

  const lang = getUserLang(user);
  await tgSend(chatId, t(lang, "notif.enabled"));
}

async function handleNotificationsOff(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = getUserLang(user);

  await ensureChatNotificationsRow(chatId, user.id);

  await dbQuery(
    `
    INSERT INTO chat_notifications (chat_id, user_id, enabled, mode, updated_at)
    VALUES ($1, $2, FALSE, 'single', NOW())
    ON CONFLICT (chat_id, user_id) DO UPDATE SET
      enabled = FALSE,
      updated_at = NOW()
    `,
    [chatId, user.id]
  );

  await tgSend(chatId, t(lang, "notif.disabled"));
}

// ---------- /admin_reset /areset ----------

async function handleAdminReset(msg, _user, argText) {
  const callerTgId = msg?.from?.id;
  const lang = getUserLang(_user);
  if (!isAdmin(callerTgId)) {
    await tgSend(msg.chat.id, t(lang, "cmd.unauthorized"));
    return;
  }

  const targetTgId = String(argText || "").trim();
  if (!targetTgId) {
    await tgSend(msg.chat.id, t(lang, "cmd.provide_id"));
    return;
  }

  const targetUser = await getUserWithPlanByTelegramId(targetTgId);
  if (!targetUser) {
    await tgSend(msg.chat.id, t(lang, "cmd.user_not_found", { id: escapeHtml(targetTgId) }));
    return;
  }

  // reset liczników we wszystkich chat_notifications usera
  const chatRes = await dbQuery(
    `
    UPDATE chat_notifications
    SET daily_count = 0,
        daily_count_date = CURRENT_DATE,
        notify_from = NOW(),
        updated_at = NOW()
    WHERE user_id = $1
    `,
    [Number(targetUser.id)]
  );

  // reset notify_from na aktywnych linkach
  const linkRes = await dbQuery(
    `
    UPDATE links
    SET notify_from = NOW(),
        updated_at = NOW()
    WHERE user_id = $1 AND active = TRUE
    `,
    [Number(targetUser.id)]
  );

  const nowIso = new Date().toISOString();
  await tgSend(
    msg.chat.id,
    t(lang, "admin.reset_success", { tgId: escapeHtml(targetTgId), chats: chatRes.rowCount, links: linkRes.rowCount, since: nowIso })
  );
}

// ---------- /reset_daily ----------

async function handleResetDaily(msg, user, argText) {
  const callerTgId = msg?.from?.id;
  const chatId = msg?.chat?.id ? String(msg.chat.id) : null;
  const messageId = msg?.message_id;
  
  // Determine caller role
  const superAdmins = String(process.env.FYD_SUPERADMIN_TG_IDS || "")
    .split(/[, ]+/)
    .map((x) => Number(String(x || "").trim()))
    .filter((x) => Number.isFinite(x) && x > 0);
  const callerRole = superAdmins.includes(Number(callerTgId)) ? "SUPERADMIN" : (isAdmin(callerTgId) ? "ADMIN" : "USER");
  
  // Admin gate
  if (!isAdmin(callerTgId)) {
    await tgSend(chatId, "⛔ Brak uprawnień (ADMIN).");
    await logAdminAudit({
      action: "reset_daily",
      status: "FAIL",
      reason: "NOT_AUTHORIZED",
      callerTgId,
      callerUserId: user?.id || null,
      callerRole: "USER",
      chatId,
      messageId
    });
    return;
  }

  // Parse telegram_user_id
  const targetTgId = Number(argText || 0);
  if (!Number.isFinite(targetTgId) || targetTgId <= 0) {
    await tgSend(chatId, "Użycie: /reset_daily <telegram_user_id>");
    await logAdminAudit({
      action: "reset_daily",
      status: "FAIL",
      reason: "INVALID_USAGE",
      callerTgId,
      callerUserId: user?.id || null,
      callerRole,
      chatId,
      messageId
    });
    return;
  }

  // Map telegram_user_id to user_id and get timezone
  let userRow;
  try {
    const res = await dbQuery(
      `SELECT id, COALESCE(NULLIF(timezone,''),'Europe/Warsaw') AS tz FROM users WHERE telegram_user_id=$1 LIMIT 1`,
      [targetTgId]
    );
    if (!res.rows.length) {
      await tgSend(chatId, `ℹ️ Nie znaleziono użytkownika o telegram_user_id=${targetTgId}`);
      await logAdminAudit({
        action: "reset_daily",
        status: "FAIL",
        reason: "TARGET_NOT_FOUND",
        callerTgId,
        callerUserId: user?.id || null,
        callerRole,
        targetTgId,
        chatId,
        messageId
      });
      return;
    }
    userRow = res.rows[0];
  } catch (err) {
    await tgSend(chatId, `❌ Błąd pobierania użytkownika: ${escapeHtml(String(err?.message || err))}`);
    await logAdminAudit({
      action: "reset_daily",
      status: "FAIL",
      reason: `DB_ERROR: ${err?.message || err}`,
      callerTgId,
      callerUserId: user?.id || null,
      callerRole,
      targetTgId,
      chatId,
      messageId
    });
    return;
  }

  const userId = Number(userRow.id);
  const tz = userRow.tz || 'Europe/Warsaw';

  // Reset daily counter in chat_notifications
  let rowCount = 0;
  try {
    const updateRes = await dbQuery(
      `UPDATE public.chat_notifications 
       SET daily_count=0, 
           daily_count_date=(NOW() AT TIME ZONE $2)::date, 
           updated_at=NOW() 
       WHERE user_id=$1`,
      [userId, tz]
    );
    rowCount = updateRes.rowCount || 0;
  } catch (err) {
    await tgSend(chatId, `❌ Błąd resetowania: ${escapeHtml(String(err?.message || err))}`);
    await logAdminAudit({
      action: "reset_daily",
      status: "FAIL",
      reason: `DB_ERROR: ${err?.message || err}`,
      callerTgId,
      callerUserId: user?.id || null,
      callerRole,
      targetTgId,
      targetUserId: userId,
      chatId,
      messageId
    });
    return;
  }

  // Success message
  await tgSend(
    chatId,
    `✅ Zresetowano dzienny licznik dla tg_user_id=<code>${targetTgId}</code> (user_id=<code>${userId}</code>).\n` +
    `Rekordy: <b>${rowCount}</b>\n` +
    `TZ: <code>${escapeHtml(tz)}</code>`
  );

  // Audit log SUCCESS
  await logAdminAudit({
    action: "reset_daily",
    status: "SUCCESS",
    reason: null,
    callerTgId,
    callerUserId: user?.id || null,
    callerRole,
    targetTgId,
    targetUserId: userId,
    chatId,
    messageId,
    payload: { tz, rowCount }
  });
}

// ---------- /technik ----------

async function handleTechnik(msg, _user, argText) {
  const callerTgId = msg?.from?.id;
  const chatId = String(msg.chat.id);
  
  // Admin gate
  if (!isAdmin(callerTgId)) {
    await tgSend(chatId, "⛔ Brak uprawnień (ADMIN).");
    return;
  }

  const targetTgId = Number(argText || callerTgId || 0);
  if (!Number.isFinite(targetTgId) || targetTgId <= 0) {
    await tgSend(chatId, "Użycie: /technik <telegram_user_id>");
    return;
  }

  let userId = 0;
  try {
    const res = await dbQuery(
      `SELECT id FROM users WHERE telegram_user_id=$1 LIMIT 1`,
      [targetTgId]
    );
    userId = res.rows[0]?.id ? Number(res.rows[0].id) : 0;
  } catch (err) {
    // Silent fail
  }

  await tgSend(
    chatId,
    `🛠 <b>TECHNIK</b>\n` +
    `tg_user_id: <code>${escapeHtml(String(targetTgId))}</code>\n` +
    `user_id: <code>${escapeHtml(String(userId || 0))}</code>`
  );
}

// ---------- /daj_admina ----------

async function handleDajAdmina(msg, user, argText) {
  const callerTgId = msg?.from?.id;
  const chatId = msg?.chat?.id ? String(msg.chat.id) : null;
  const messageId = msg?.message_id;
  
  // SUPERADMIN gate
  const superAdmins = String(process.env.FYD_SUPERADMIN_TG_IDS || "")
    .split(/[, ]+/)
    .map((x) => Number(String(x || "").trim()))
    .filter((x) => Number.isFinite(x) && x > 0);

  if (!superAdmins.includes(Number(callerTgId))) {
    await tgSend(chatId, "⛔ Brak uprawnień (tylko SUPERADMIN).");
    await logAdminAudit({
      action: "grant_admin",
      status: "FAIL",
      reason: "NOT_AUTHORIZED",
      callerTgId,
      callerUserId: user?.id || null,
      callerRole: "USER",
      chatId,
      messageId
    });
    return;
  }

  const targetTgId = Number(argText || 0);
  if (!Number.isFinite(targetTgId) || targetTgId <= 0) {
    await tgSend(chatId, "Użycie: /daj_admina <telegram_user_id>");
    await logAdminAudit({
      action: "grant_admin",
      status: "FAIL",
      reason: "INVALID_USAGE",
      callerTgId,
      callerUserId: user?.id || null,
      callerRole: "SUPERADMIN",
      chatId,
      messageId
    });
    return;
  }

  try {
    await dbQuery("UPDATE users SET is_admin=TRUE WHERE telegram_user_id=$1", [targetTgId]).catch(() => {});
    const check = await dbQuery("SELECT id FROM users WHERE telegram_user_id=$1 LIMIT 1", [targetTgId]);
    if (!check.rows.length) {
      await tgSend(chatId, `ℹ️ Nie znaleziono użytkownika o telegram_user_id=${targetTgId} (najpierw musi zrobić /start).`);
      await logAdminAudit({
        action: "grant_admin",
        status: "FAIL",
        reason: "TARGET_NOT_FOUND",
        callerTgId,
        callerUserId: user?.id || null,
        callerRole: "SUPERADMIN",
        targetTgId,
        chatId,
        messageId
      });
      return;
    }
    const targetUserId = Number(check.rows[0].id);
    await tgSend(chatId, `✅ Nadano ADMIN dla telegram_user_id=${targetTgId}`);
    await logAdminAudit({
      action: "grant_admin",
      status: "SUCCESS",
      reason: null,
      callerTgId,
      callerUserId: user?.id || null,
      callerRole: "SUPERADMIN",
      targetTgId,
      targetUserId,
      chatId,
      messageId
    });
  } catch (err) {
    await tgSend(chatId, `❌ Błąd nadawania admina: ${escapeHtml(String(err?.message || err))}`);
    await logAdminAudit({
      action: "grant_admin",
      status: "FAIL",
      reason: `DB_ERROR: ${err?.message || err}`,
      callerTgId,
      callerUserId: user?.id || null,
      callerRole: "SUPERADMIN",
      targetTgId,
      chatId,
      messageId
    });
  }
}

// ---------- /usun_uzytkownika ----------

async function handleUsunUzytkownika(msg, user, argText) {
  const callerTgId = msg?.from?.id;
  const chatId = msg?.chat?.id ? String(msg.chat.id) : null;
  const messageId = msg?.message_id;
  
  // SUPERADMIN gate
  const superAdmins = String(process.env.FYD_SUPERADMIN_TG_IDS || "")
    .split(/[, ]+/)
    .map((x) => Number(String(x || "").trim()))
    .filter((x) => Number.isFinite(x) && x > 0);

  if (!superAdmins.includes(Number(callerTgId))) {
    await tgSend(chatId, "⛔ Brak uprawnień (tylko SUPERADMIN).");
    await logAdminAudit({
      action: "delete_user",
      status: "FAIL",
      reason: "NOT_AUTHORIZED",
      callerTgId,
      callerUserId: user?.id || null,
      callerRole: "USER",
      chatId,
      messageId
    });
    return;
  }

  const targetTgId = Number(argText || 0);
  if (!Number.isFinite(targetTgId) || targetTgId <= 0) {
    await tgSend(chatId, "Użycie: /usun_uzytkownika <telegram_user_id>");
    await logAdminAudit({
      action: "delete_user",
      status: "FAIL",
      reason: "INVALID_USAGE",
      callerTgId,
      callerUserId: user?.id || null,
      callerRole: "SUPERADMIN",
      chatId,
      messageId
    });
    return;
  }

  const safe = async (sql, params) => {
    try { await dbQuery(sql, params); } catch {}
  };

  try {
    const u = await dbQuery("SELECT id FROM users WHERE telegram_user_id=$1 LIMIT 1", [targetTgId]);
    if (!u.rows.length) {
      await tgSend(chatId, `ℹ️ Nie znaleziono użytkownika o telegram_user_id=${targetTgId}`);
      await logAdminAudit({
        action: "delete_user",
        status: "FAIL",
        reason: "TARGET_NOT_FOUND",
        callerTgId,
        callerUserId: user?.id || null,
        callerRole: "SUPERADMIN",
        targetTgId,
        chatId,
        messageId
      });
      return;
    }
    const userId = Number(u.rows[0].id);

    await dbQuery("BEGIN");

    await safe("DELETE FROM panel_sessions WHERE user_id=$1", [userId]);
    await safe("DELETE FROM panel_login_tokens WHERE user_id=$1", [userId]);
    await safe("DELETE FROM subscriptions WHERE user_id=$1", [userId]);

    await safe("DELETE FROM link_notification_modes WHERE user_id=$1", [userId]);
    await safe("DELETE FROM chat_notifications WHERE user_id=$1", [userId]);

    await safe("DELETE FROM link_items WHERE link_id IN (SELECT id FROM links WHERE user_id=$1)", [userId]);
    await safe("DELETE FROM link_notification_modes WHERE link_id IN (SELECT id FROM links WHERE user_id=$1)", [userId]);
    await safe("DELETE FROM sent_offers WHERE user_id=$1", [userId]);
    await safe("DELETE FROM links WHERE user_id=$1", [userId]);

    await dbQuery("DELETE FROM users WHERE id=$1", [userId]);

    await dbQuery("COMMIT");
    await tgSend(chatId, `✅ Usunięto użytkownika telegram_user_id=${targetTgId} (user_id=${userId}) i wyczyszczono jego dane.`);
    await logAdminAudit({
      action: "delete_user",
      status: "SUCCESS",
      reason: null,
      callerTgId,
      callerUserId: user?.id || null,
      callerRole: "SUPERADMIN",
      targetTgId,
      targetUserId: userId,
      chatId,
      messageId,
      payload: { deleted_tables: ["panel_sessions", "panel_login_tokens", "subscriptions", "link_notification_modes", "chat_notifications", "link_items", "sent_offers", "links", "users"] }
    });
  } catch (err) {
    try { await dbQuery("ROLLBACK"); } catch {}
    await tgSend(chatId, `❌ Błąd usuwania użytkownika: ${escapeHtml(String(err?.message || err))}`);
    await logAdminAudit({
      action: "delete_user",
      status: "FAIL",
      reason: `DB_ERROR: ${err?.message || err}`,
      callerTgId,
      callerUserId: user?.id || null,
      callerRole: "SUPERADMIN",
      targetTgId,
      chatId,
      messageId
    });
  }
}

// ---------- /help_admin ----------

async function handleHelpAdmin(msg, user) {
  const callerTgId = msg?.from?.id;
  const chatId = String(msg.chat.id);
  
  // Admin gate
  if (!isAdmin(callerTgId)) {
    await tgSend(chatId, "⛔ Brak uprawnień (ADMIN).");
    return;
  }

  const lang = getUserLang(user);
  await tgSend(chatId, t(lang, "cmd.help_admin_text"));
}

// ---------- /audit ----------

async function handleAudit(msg, user, argText) {
  const callerTgId = msg?.from?.id;
  const chatId = String(msg.chat.id);
  
  // Admin gate
  if (!isAdmin(callerTgId)) {
    await tgSend(chatId, "⛔ Brak uprawnień (ADMIN).");
    return;
  }

  const lang = getUserLang(user);

  // Parse arguments: /audit <telegram_user_id> [limit]
  const args = (argText || "").trim().split(/\s+/);
  const targetTgId = Number(args[0] || 0);
  const limit = Number(args[1] || 20);

  if (!Number.isFinite(targetTgId) || targetTgId <= 0) {
    await tgSend(chatId, t(lang, "cmd.audit_usage"));
    return;
  }

  if (!Number.isFinite(limit) || limit <= 0 || limit > 100) {
    await tgSend(chatId, t(lang, "cmd.audit_usage"));
    return;
  }

  try {
    const res = await dbQuery(
      `SELECT 
        id, created_at, action, status, reason,
        caller_tg_id, caller_role,
        target_tg_id, target_user_id,
        payload
       FROM public.admin_audit_log
       WHERE target_tg_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [targetTgId, limit]
    );

    if (!res.rows.length) {
      await tgSend(chatId, t(lang, "cmd.audit_empty", { target_tg_id: targetTgId }));
      return;
    }

    let text = t(lang, "cmd.audit_header", { target_tg_id: targetTgId, count: res.rows.length, limit });
    text += "\n\n";

    for (const row of res.rows) {
      const ts = new Date(row.created_at).toISOString().replace("T", " ").substring(0, 19);
      const payloadStr = row.payload ? ` | ${JSON.stringify(row.payload)}` : "";
      
      text += t(lang, "cmd.audit_line", {
        timestamp: ts,
        action: row.action,
        status: row.status,
        caller_tg_id: row.caller_tg_id,
        caller_role: row.caller_role || "—",
        reason: row.reason || "—",
        payload: payloadStr
      });
      text += "\n";
    }

    // Split if too long
    if (text.length > 4000) {
      const chunks = [];
      let current = "";
      for (const line of text.split("\n")) {
        if ((current + line + "\n").length > 4000) {
          chunks.push(current);
          current = line + "\n";
        } else {
          current += line + "\n";
        }
      }
      if (current) chunks.push(current);

      for (const chunk of chunks) {
        await tgSend(chatId, chunk);
      }
    } else {
      await tgSend(chatId, text);
    }
  } catch (err) {
    console.error("[AUDIT_ERROR]", err?.stack || err);
    await tgSend(chatId, `❌ Error fetching audit log: ${escapeHtml(String(err?.message || err))}`);
  }
}

// ---------- /pojedyncze /zbiorcze (domyślny tryb czatu) ----------

async function handleModeSingle(msg, user) {
  const chatId = String(msg.chat.id);

  await ensureChatNotificationsRow(chatId, user.id);

  await dbQuery(
    `
    UPDATE chat_notifications
    SET mode = 'single', updated_at = NOW()
    WHERE chat_id = $1 AND user_id = $2
    `,
    [chatId, user.id]
  );

  const lang = getUserLang(user);
  await tgSend(chatId, t(lang, "notif.mode_single"));
}

async function handleModeBatch(msg, user) {
  const chatId = String(msg.chat.id);

  await ensureChatNotificationsRow(chatId, user.id);

  await dbQuery(
    `
    UPDATE chat_notifications
    SET mode = 'batch', updated_at = NOW()
    WHERE chat_id = $1 AND user_id = $2
    `,
    [chatId, user.id]
  );

  const lang = getUserLang(user);
  await tgSend(chatId, t(lang, "notif.mode_batch"));
}

// ---------- tryb per-link na tym czacie ----------

async function setPerLinkMode(chatId, userId, linkId, mode) {
  const m = String(mode || "").toLowerCase();
  const finalMode = m === "batch" ? "batch" : m === "off" ? "off" : "single";

  // zabezpieczenie: link musi należeć do usera
  const chk = await dbQuery(
    `SELECT id FROM links WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [Number(linkId), Number(userId)]
  );
  if (!chk.rowCount) return { ok: false, reason: "Link not found on your account." };

  await dbQuery(
    `
    INSERT INTO link_notification_modes (user_id, chat_id, link_id, mode, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (user_id, chat_id, link_id) DO UPDATE SET
      mode = EXCLUDED.mode,
      updated_at = NOW()
    `,
    [Number(userId), String(chatId), Number(linkId), finalMode]
  );

  return { ok: true, mode: finalMode };
}

// ---------- /lang - zmiana języka ----------

// Ordered list of supported languages (for consistent display in /lang)
const LANG_CODES = ["en", "pl", "de", "fr", "it", "es", "pt", "ru", "cs", "hu", "uk"];

const SUPPORTED_LANGS = {
  "en": "English 🇬🇧",
  "pl": "Polski 🇵🇱",
  "de": "Deutsch 🇩🇪",
  "fr": "Français 🇫🇷",
  "it": "Italiano 🇮🇹",
  "es": "Español 🇪🇸",
  "pt": "Português 🇵🇹",
  "cs": "Čeština 🇨🇿",
  "sk": "Slovenčina 🇸🇰",
  "ro": "Română 🇷🇴",
  "nl": "Nederlands 🇳🇱"
};

// Confirmation templates per target language

async function handleLanguage(msg, user) {
  const chatId = String(msg.chat.id);
  const arg = (msg.text || "").trim().split(/\s+/).slice(1).join(" ").trim().toLowerCase();

  // CRITICAL: Use only user object - getUserLang() already has correct priority
  const lang = getUserLang(user);

  if (!arg) {
    const langName = SUPPORTED_LANGS[lang] || "English";
    
    // Build inline keyboard with 2 columns
    const langCodes = Object.keys(SUPPORTED_LANGS);
    const keyboard = [];
    for (let i = 0; i < langCodes.length; i += 2) {
      const row = [];
      row.push({
        text: SUPPORTED_LANGS[langCodes[i]],
        callback_data: `setlang:${langCodes[i]}`
      });
      if (i + 1 < langCodes.length) {
        row.push({
          text: SUPPORTED_LANGS[langCodes[i + 1]],
          callback_data: `setlang:${langCodes[i + 1]}`
        });
      }
      keyboard.push(row);
    }
    
    await tgSend(
      chatId,
      t(lang, "lang.current", { name: langName }) + "\n\n" + t(lang, "lang.available"),
      { reply_markup: { inline_keyboard: keyboard } }
    );
    return;
  }

  // Normalize: "pl-PL" -> "pl", "en-US" -> "en"
  const normalized = arg.split("-")[0].toLowerCase();
  
  if (!SUPPORTED_LANGS[normalized]) {
    // Use comma-separated codes for error message (short format)
    const langList = Object.keys(SUPPORTED_LANGS).join(", ");
    await tgSend(chatId, t(lang, "lang.unknown", { list: langList }));
    return;
  }

  // Update users.lang AND language (user's explicit choice)
  // IMPORTANT: Do NOT update language_code - it's read-only from Telegram
  process.stderr.write(`[lang_debug] Updating user ${user.id} lang from ${user.lang} to ${normalized}\n`);
  await dbQuery(
    `UPDATE users
     SET lang = $1,
         language = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [normalized, user.id]
  );
  process.stderr.write(`[lang_debug] Update completed for user ${user.id}\n`);

  const langName = SUPPORTED_LANGS[normalized];
  await tgSend(chatId, t(normalized, "lang.confirm", { name: langName }));
}

// ---------- cisza nocna ----------

async function handleQuiet(msg, user) {
  const chatId = String(msg.chat.id);
  const arg = (msg.text || "").trim().split(/\s+/).slice(1).join(" ").trim();

  const lang = getUserLang(user);

  if (!arg) {
    const qh = await getQuietHours(chatId);
    if (qh?.quiet_enabled) {
      await tgSend(chatId, t(lang, "quiet.status_on", { from: qh.quiet_from, to: qh.quiet_to }));
    } else {
      await tgSend(chatId, t(lang, "quiet.status_off"));
    }
    return;
  }

  const m = arg.match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
  if (!m) {
    await tgSend(chatId, t(lang, "quiet.usage"));
    return;
  }

  const fromHour = Number(m[1]);
  const toHour = Number(m[2]);

  if (
    !Number.isFinite(fromHour) || !Number.isFinite(toHour) ||
    fromHour < 0 || fromHour > 23 || toHour < 0 || toHour > 23
  ) {
    await tgSend(chatId, t(lang, "quiet.invalid_hours"));
    return;
  }

  await setQuietHours(chatId, fromHour, toHour);
  await tgSend(chatId, t(lang, "quiet.set", { from: fromHour, to: toHour }));
}

async function handleQuietOff(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = getUserLang(user);
  await disableQuietHours(chatId);
  await tgSend(chatId, t(lang, "quiet.disabled"));
}

// ---------- /najnowsze /najtansze (sent offers history) ----------

async function fetchChatNotifyFrom(chatId, userId) {
  try {
    const res = await dbQuery(
      `SELECT notify_from FROM chat_notifications WHERE chat_id = $1 AND user_id = $2 LIMIT 1`,
      [String(chatId), Number(userId)]
    );
    if (res.rowCount && res.rows[0].notify_from) {
      return new Date(res.rows[0].notify_from);
    }
  } catch (e) {
    console.error("[fetchChatNotifyFrom] error:", e);
  }
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

function formatDateTime(date) {
  const d = new Date(date);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

async function handleNajnowsze(msg, user, argText) {
  const chatId = String(msg.chat.id);
  const lang = getUserLang(user);
  const linkId = argText ? Number(argText.trim()) : NaN;
  const sinceChat = await fetchChatNotifyFrom(chatId, user.id);

  // MODE 1: With ID (per-link)
  if (Number.isFinite(linkId) && linkId > 0) {
    const linkQ = await dbQuery(
      `SELECT id, name, url, notify_from FROM links WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [linkId, user.id]
    );

    if (!linkQ.rowCount) {
      await tgSend(chatId, t(lang, "najnowsze.link_not_found_detail", { id: linkId }));
      return;
    }

    const linkRow = linkQ.rows[0];
    const since = new Date(
      Math.max(new Date(linkRow.notify_from || 0).getTime(), sinceChat.getTime())
    );

    const itemsQ = await dbQuery(
      `SELECT title, price, currency, url, sent_at
       FROM sent_offers
       WHERE user_id = $1 AND chat_id = $2 AND link_id = $3 AND sent_at >= $4
       ORDER BY sent_at DESC
       LIMIT 10`,
      [user.id, chatId, linkId, since]
    );

    if (!itemsQ.rowCount) {
      await tgSend(
        chatId,
        t(lang, "najnowsze_enhanced.no_history_per_link", {
          id: linkId,
          since: formatDateTime(since),
        })
      );
      return;
    }

    let out = t(lang, "najnowsze_enhanced.header_per_link", {
      id: linkId,
      name: linkRow.name || "(no name)",
      since: formatDateTime(since),
    }) + "\n\n";

    itemsQ.rows.forEach((it, idx) => {
      const title = escapeHtml(it.title || t(lang, "najnowsze_enhanced.no_title"));
      const priceStr = it.price != null ? `${it.price} ${it.currency || ""}`.trim() : "";
      out += `${idx + 1}. <b>${title}</b>\n`;
      if (priceStr) out += `💰 ${escapeHtml(priceStr)}\n`;
      if (it.url) out += `${escapeHtml(it.url)}\n`;
      out += `📅 ${formatDateTime(it.sent_at)}\n\n`;
    });

    // Footer: show other links from user
    const otherLinksQ = await dbQuery(
      `SELECT DISTINCT link_id FROM sent_offers WHERE user_id = $1 AND chat_id = $2 AND link_id != $3 LIMIT 5`,
      [user.id, chatId, linkId]
    );
    if (otherLinksQ.rowCount > 0) {
      const otherIds = otherLinksQ.rows.map(r => r.link_id);
      out += `\n${t(lang, "najnowsze_enhanced.footer")} ${otherIds.map(id => `/najnowsze ${id}`).join(" ")}`;
    }

    await tgSend(chatId, out.trim(), { disable_web_page_preview: true });
    return;
  }

  // MODE 2: No ID (global - all links)
  const globalQ = await dbQuery(
    `SELECT so.link_id, so.title, so.price, so.currency, so.url, so.sent_at, l.name AS link_name
     FROM sent_offers so
     JOIN links l ON l.id = so.link_id
     WHERE so.user_id = $1 AND so.chat_id = $2 AND so.sent_at >= $3
     ORDER BY so.sent_at DESC
     LIMIT 10`,
    [user.id, chatId, sinceChat]
  );

  if (!globalQ.rowCount) {
    await tgSend(
      chatId,
      t(lang, "najnowsze_enhanced.no_history_global", {
        since: formatDateTime(sinceChat),
      })
    );
    return;
  }

  let out = t(lang, "najnowsze_enhanced.header_global", {
    since: formatDateTime(sinceChat),
  }) + "\n\n";

  globalQ.rows.forEach((row, idx) => {
    const priceStr = row.price != null ? `${row.price} ${row.currency || ""}`.trim() : "";
    out += `${idx + 1}. [${row.link_id}] ${escapeHtml(row.link_name || "(no name)")}\n`;
    out += `<b>${escapeHtml(row.title || t(lang, "najnowsze_enhanced.no_title"))}</b>\n`;
    if (priceStr) out += `💰 ${escapeHtml(priceStr)}\n`;
    if (row.url) out += `${escapeHtml(row.url)}\n`;
    out += `📅 ${formatDateTime(row.sent_at)}\n\n`;
  });

  await tgSend(chatId, out.trim(), { disable_web_page_preview: true });
}

async function handleNajtansze(msg, user, argText) {
  const chatId = String(msg.chat.id);
  const lang = getUserLang(user);
  const linkId = argText ? Number(argText.trim()) : NaN;
  const sinceChat = await fetchChatNotifyFrom(chatId, user.id);

  // MODE 1: With ID (per-link)
  if (Number.isFinite(linkId) && linkId > 0) {
    const linkQ = await dbQuery(
      `SELECT id, name, url, notify_from FROM links WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [linkId, user.id]
    );

    if (!linkQ.rowCount) {
      await tgSend(chatId, t(lang, "najnowsze.link_not_found_detail", { id: linkId }));
      return;
    }

    const linkRow = linkQ.rows[0];
    const since = new Date(
      Math.max(new Date(linkRow.notify_from || 0).getTime(), sinceChat.getTime())
    );

    const itemsQ = await dbQuery(
      `SELECT title, price, currency, url, sent_at
       FROM sent_offers
       WHERE user_id = $1 AND chat_id = $2 AND link_id = $3 AND sent_at >= $4 AND price IS NOT NULL
       ORDER BY price ASC NULLS LAST, sent_at DESC
       LIMIT 10`,
      [user.id, chatId, linkId, since]
    );

    if (!itemsQ.rowCount) {
      await tgSend(
        chatId,
        t(lang, "najtansze.no_history_per_link", {
          id: linkId,
          since: formatDateTime(since),
        })
      );
      return;
    }

    let out = t(lang, "najtansze.header_per_link", {
      id: linkId,
      name: linkRow.name || "(no name)",
      since: formatDateTime(since),
    }) + "\n\n";

    itemsQ.rows.forEach((it, idx) => {
      const title = escapeHtml(it.title || t(lang, "najnowsze_enhanced.no_title"));
      const priceStr = it.price != null ? `${it.price} ${it.currency || ""}`.trim() : "";
      out += `${idx + 1}. <b>${title}</b>\n`;
      if (priceStr) out += `💰 ${escapeHtml(priceStr)}\n`;
      if (it.url) out += `${escapeHtml(it.url)}\n`;
      out += `📅 ${formatDateTime(it.sent_at)}\n\n`;
    });

    await tgSend(chatId, out.trim(), { disable_web_page_preview: true });
    return;
  }

  // MODE 2: No ID (global - all links)
  const globalQ = await dbQuery(
    `SELECT so.link_id, so.title, so.price, so.currency, so.url, so.sent_at, l.name AS link_name
     FROM sent_offers so
     JOIN links l ON l.id = so.link_id
     WHERE so.user_id = $1 AND so.chat_id = $2 AND so.sent_at >= $3 AND so.price IS NOT NULL
     ORDER BY so.price ASC NULLS LAST, so.sent_at DESC
     LIMIT 10`,
    [user.id, chatId, sinceChat]
  );

  if (!globalQ.rowCount) {
    await tgSend(
      chatId,
      t(lang, "najtansze.no_history_global", {
        since: formatDateTime(sinceChat),
      })
    );
    return;
  }

  let out = t(lang, "najtansze.header_global", {
    since: formatDateTime(sinceChat),
  }) + "\n\n";

  globalQ.rows.forEach((row, idx) => {
    const priceStr = row.price != null ? `${row.price} ${row.currency || ""}`.trim() : "";
    out += `${idx + 1}. [${row.link_id}] ${escapeHtml(row.link_name || "(no name)")}\n`;
    out += `<b>${escapeHtml(row.title || t(lang, "najnowsze_enhanced.no_title"))}</b>\n`;
    if (priceStr) out += `💰 ${escapeHtml(priceStr)}\n`;
    if (row.url) out += `${escapeHtml(row.url)}\n`;
    out += `📅 ${formatDateTime(row.sent_at)}\n\n`;
  });

  await tgSend(chatId, out.trim(), { disable_web_page_preview: true });
}

// ---------- /max <ID> <value> - set per-link item limit ----------

async function handleMax(msg, user, argText) {
  const chatId = String(msg.chat.id);
  const lang = getUserLang(user);
  const args = argText.trim().split(/\s+/);
  const linkIdStr = args[0];
  const valueStr = args[1];

  if (!linkIdStr) {
    await tgSend(chatId, t(lang, "cmd.max_usage"));
    return;
  }

  const linkId = Number(linkIdStr);
  if (!Number.isFinite(linkId) || linkId <= 0) {
    await tgSend(chatId, t(lang, "cmd.max_invalid_id"));
    return;
  }

  // Verify ownership
  const linkQ = await dbQuery(
    `SELECT id, name FROM links WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [linkId, user.id]
  );

  if (!linkQ.rowCount) {
    await tgSend(chatId, t(lang, "cmd.link_not_found", { id: linkId }));
    return;
  }

  const linkName = linkQ.rows[0].name || `#${linkId}`;

  // Parse value: "off" or number
  if (!valueStr || valueStr.toLowerCase() === "off") {
    await dbQuery(
      `UPDATE links SET max_items_per_loop = NULL WHERE id = $1`,
      [linkId]
    );
    await tgSend(chatId, t(lang, "cmd.max_disabled", { id: linkId, name: linkName }));
    return;
  }

  const limit = Number(valueStr);
  if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
    await tgSend(chatId, t(lang, "cmd.max_invalid_value"));
    return;
  }

  await dbQuery(
    `UPDATE links SET max_items_per_loop = $1 WHERE id = $2`,
    [limit, linkId]
  );

  await tgSend(chatId, t(lang, "cmd.max_set", { id: linkId, name: linkName, value: limit }));
}

// ---------- callback_query z przycisków (lnmode:ID:mode) ----------

async function handleCallback(update) {
  const cq = update.callback_query;
  if (!cq) return;

  const data = cq.data || "";
  const chatId = cq.message?.chat?.id;
  const fromId = cq.from?.id ? String(cq.from.id) : null;

  if (!chatId || !fromId) {
    await tgAnswerCb(cq.id, t("en", "callback.no_chat_data"));
    return;
  }

  // Handle plan selection from /plany
  if (data.startsWith("plan:")) {
    const requestId = randomBytes(8).toString("hex");
    const actionData = data.replace("plan:", "");
    
    console.log(`[plany_checkout][${requestId}] START action=${actionData} chatId=${chatId}`);

    try {
      if (!stripe) {
        await tgAnswerCb(cq.id, t("en", "payment.error_config"));
        await tgSend(String(chatId), t("en", "cmd.error_stripe_not_configured", { requestId }));
        return;
      }

      // Get user from callback
      const tgUserId = cq.from.id;
      const userQ = await pool.query(
        `SELECT id, telegram_user_id FROM users WHERE telegram_user_id=$1 LIMIT 1`,
        [tgUserId]
      );

      if (!userQ.rows[0]) {
        await tgAnswerCb(cq.id, t("en", "cmd.user_not_found", { id: tgUserId }));
        return;
      }

      const userId = userQ.rows[0].id;

      // Handle addon purchase
      if (actionData === "addon_links_10") {
        if (!STRIPE_PRICE_ADDON) {
          console.error(`[plany_checkout][${requestId}] Missing STRIPE_PRICE_ADDON env`);
          await tgAnswerCb(cq.id, t("en", "payment.error_config"));
          await tgSend(String(chatId), t("en", "cmd.error_addon_not_configured", { requestId }));
          return;
        }

        console.log(`[plany_checkout][${requestId}] Addon links_10 → priceId=${STRIPE_PRICE_ADDON}`);
        console.log(`[plany_checkout][${requestId}] Creating Stripe session: mode=subscription priceId=${STRIPE_PRICE_ADDON} quantity=1`);

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          line_items: [{ price: STRIPE_PRICE_ADDON, quantity: 1 }],
          success_url: `https://panel.findyourdeal.app/billing?success=true`,
          cancel_url: `https://panel.findyourdeal.app/billing?canceled=true`,
          client_reference_id: String(userId),
          metadata: {
            user_id: String(userId),
            telegram_user_id: String(tgUserId),
            addon_code: "links_10",
            source: "telegram_bot"
          }
        });

        console.log(`[plany_checkout][${requestId}] SUCCESS Created Stripe session=${session.id} url=${session.url}`);

        await tgAnswerCb(cq.id, t("en", "payment.addon_button"));
        await tgSend(
          String(chatId),
          t("en", "payment.addon_checkout", { url: session.url, requestId })
        );
        return;
      }

      // Handle plan purchase
      const planCode = actionData;
      const priceMap = {
        starter: STRIPE_PRICE_STARTER,
        growth: STRIPE_PRICE_GROWTH,
        platinum: STRIPE_PRICE_PLATINUM
      };

      const priceId = priceMap[planCode];
      if (!priceId) {
        console.error(`[plany_checkout][${requestId}] Missing price for plan=${planCode}`);
        await tgAnswerCb(cq.id, t("en", "payment.error_config"));
        await tgSend(String(chatId), t("en", "cmd.error_addon_config", { requestId }));
        return;
      }

      console.log(`[plany_checkout][${requestId}] Plan ${planCode} → priceId=${priceId}`);

      // Create Stripe checkout session
      console.log(`[plany_checkout][${requestId}] Creating Stripe session: mode=subscription priceId=${priceId} quantity=1`);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `https://panel.findyourdeal.app/billing?success=true`,
        cancel_url: `https://panel.findyourdeal.app/billing?canceled=true`,
        client_reference_id: String(userId),
        metadata: {
          user_id: String(userId),
          telegram_user_id: String(tgUserId),
          plan_code: planCode,
          source: "telegram_bot"
        }
      });

      console.log(`[plany_checkout][${requestId}] SUCCESS Created Stripe session=${session.id} url=${session.url}`);

      await tgAnswerCb(cq.id, `✓ ${planCode}`);
      await tgSend(
        String(chatId),
        t("en", "payment.checkout_url", { planCode, url: session.url, requestId })
      );
    } catch (error) {
      const message = error?.message || "Unknown error";
      const rawMessage = error?.raw?.message || "";
      console.error(`[plany_checkout][${requestId}] ERROR:`, error);
      console.error(`[plany_checkout][${requestId}] Error message: ${message}`);
      console.error(`[plany_checkout][${requestId}] Stripe raw message: ${rawMessage}`);

      await tgAnswerCb(cq.id, t("en", "payment.error_config"));
      await tgSend(String(chatId), t("en", "cmd.error_payment_create", { requestId }));
    }
    return;
  }

  const userId = await resolveUserIdFromTg(fromId);
  if (!userId) {
    const lang = getUserLang({ telegram_user_id: fromId });
    await tgAnswerCb(cq.id, t(lang, "cmd.user_not_in_db"));
    return;
  }

  await ensureChatNotificationsRow(String(chatId), userId);

  // lnmode:<linkId>:<off|single|batch>
  const m = data.match(/^lnmode:(\d+):(off|single|batch)$/i);
  if (m) {
    const linkId = Number(m[1]);
    const mode = String(m[2]).toLowerCase();

    const res = await setPerLinkMode(String(chatId), userId, linkId, mode);
    if (!res.ok) {
      await tgAnswerCb(cq.id, t("en", "callback.mode_set_failed"), true);
      return;
    }

    const pretty =
      res.mode === "batch" ? "batch" : res.mode === "off" ? "OFF" : "single";

    await tgAnswerCb(cq.id, t("en", "callback.mode_set", { mode: pretty }));
    return;
  }

  // setlang:<langCode>
  const langMatch = data.match(/^setlang:([a-z]{2})$/i);
  if (langMatch) {
    const langCode = langMatch[1].toLowerCase();
    
    if (!SUPPORTED_LANGS[langCode]) {
      await tgAnswerCb(cq.id, t("en", "lang.unknown_language"), true);
      return;
    }
    
    // Update user's language
    await dbQuery(
      `UPDATE users
       SET lang = $1,
           language = $1,
           language_code = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [langCode, userId]
    );
    
    process.stderr.write(`[lang_debug] Updating user ${userId} lang from ${cq.from.language_code || 'unknown'} to ${langCode} (via callback)\n`);
    
    const langName = SUPPORTED_LANGS[langCode];
    
    // Answer callback and edit message
    await tgAnswerCb(cq.id, `✓ ${langName}`);
    
    // Send new message with confirmation in target language
    await tgSend(String(chatId), t(langCode, "lang.confirm", { name: langName }));
    return;
  }

  await tgAnswerCb(cq.id, t("en", "general.unknown_command"));
}

// ---------- obsługa pojedynczego update ----------

async function handleUpdate(update) {
  if (update.callback_query) {
    await handleCallback(update);
    return;
  }

  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const from = msg.from || {};
  const tgId = from.id ? String(from.id) : null;

  // [P0] Log każdego update'a dla diagnostyki
  console.log("[TG_UPDATE]", {
    text: msg?.text,
    chatId: msg?.chat?.id,
    tgId: msg?.from?.id,
    date: msg?.date
  });
let text = (msg.text ?? "").trim();

// NORMALIZACJA: pozwól na spację zamiast "_"
const m = text.match(/^\/(on|off|pojedyncze|pojedynczo|zbiorcze)\s+(\d+)\b/i);
if (m) {
  const cmd = m[1].toLowerCase() === "pojedynczo" ? "pojedyncze" : m[1].toLowerCase();
  text = `/${cmd}_${m[2]}`;
}

  console.log("TG message:", chatId, text);

  if (!tgId) {
    await tgSend(chatId, t("en", "admin.no_telegram_id"));
    return;
  }

  // rejestracja / aktualizacja profilu
  await initDb();
// W grupach może nie być from (anonimowy admin / sender_chat)
if (!from || !from.id) {
  console.warn("TG update bez from.id (anon admin / sender_chat) – pomijam komendę");
  return;
}


await ensureUser(
  from.id,
  from.username || null,
  from.first_name || null,
  from.last_name || null,
  from.language_code || null
);

  // alias / user
  const resolvedId = await resolveUserIdFromTg(tgId);

  let user = null;
  if (resolvedId === 1) {
    user = await getUserById(1);
  } else {
    user = await getUserWithPlanByTelegramId(tgId);
  }

  if (!user) {
    const lang = getUserLang({ telegram_user_id: tgId });
    await tgSend(
      chatId,
      t(lang, "cmd.user_not_registered")
    );
    return;
  }

  // [P0] Language diagnostic log
  console.log("[LANG_CHECK]", {
    tgId: user.telegram_id,
    user_language: user.language,
    user_language_code: user.language_code,
    computed: getUserLang(user),
  });

  // [P0] i18n smoke test
  console.log("[I18N_SMOKE]", {
    computed: getUserLang(user),
    sample: t(getUserLang(user), "notif.enabled")
  });

  await ensureChatNotificationsRow(String(chatId), user.id);

  // parsowanie komend - ROBUST PARSING
  // Extract first token, handle @botname, clean command
  const raw = text.trim();
  const firstToken = raw.split(/\s+/)[0];           // "/plany@Bot" or "/plany"
  const command = firstToken.split("@")[0].toLowerCase();  // "/plany"
  const argText = raw.substring(firstToken.length).trim();

  // Normalize command to canonical form (handles aliases)
  const canonical = normalizeCommand(text);

  // Command logging for debugging
  console.log("[cmd]", { raw, firstToken, command, canonical, chatId, telegramUserId: tgId });

  // komendy admins
  if (command === "/admin_reset" || command === "/areset") {
    await handleAdminReset(msg, user, argText);
    return;
  }

  // Per-link commands with space syntax: /off 18, /on 18, /pojedyncze 18, /zbiorcze 18
  // Check if canonical is a per-link candidate AND has a numeric argument
  if (["off", "on", "pojedyncze", "zbiorcze"].includes(canonical)) {
    const linkIdStr = argText.trim().split(/\s+/)[0];
    const linkId = linkIdStr ? Number(linkIdStr) : null;

    if (linkId && !isNaN(linkId) && linkId > 0) {
      // Per-link mode detected
      const lang = getUserLang(user);

      // /on ID = usuń override (wraca do domyślnego trybu czatu)
      if (canonical === "on") {
        // zabezpieczenie: link musi należeć do usera
        const chk = await dbQuery(
          `SELECT id FROM links WHERE id = $1 AND user_id = $2 LIMIT 1`,
          [Number(linkId), Number(user.id)]
        );
        if (!chk.rowCount) {
          await tgSend(chatId, t(lang, "cmd.link_not_found", { id: linkId }));
          return;
        }

        await clearLinkNotificationMode(user.id, String(chatId), linkId);

        // reset notify_from dla tego konkretnego linku (zaczynam zbierać oferty od teraz)
        await dbQuery(
          `UPDATE links SET notify_from = NOW() WHERE id = $1 AND user_id = $2`,
          [Number(linkId), Number(user.id)]
        );

        // odczytaj domyślny tryb czatu (żeby ładnie potwierdzić)
        const cn = await dbQuery(
          `SELECT mode FROM chat_notifications WHERE chat_id = $1 AND user_id = $2 LIMIT 1`,
          [String(chatId), Number(user.id)]
        );
        const chatMode =
          (cn.rows[0]?.mode || "single").toLowerCase() === "batch" ? "zbiorczo" : "pojedynczo";

        await tgSend(
          chatId,
          t(lang, "callback.link_mode_set", { linkId, mode: `ON (${chatMode})` })
        );
        return;
      }

      const mode = canonical === "zbiorcze" ? "batch" : canonical === "off" ? "off" : "single";
      const res = await setPerLinkMode(String(chatId), user.id, linkId, mode);

      if (!res.ok) {
        await tgSend(chatId, t(lang, "callback.mode_set_failed"));
        return;
      }

      const pretty =
        res.mode === "batch" ? "batch" : res.mode === "off" ? "OFF" : "single";

      await tgSend(chatId, t(lang, "callback.link_mode_set", { linkId, mode: pretty }));
      return;
    }
    // If no valid linkId, fall through to chat-level handlers below
  }

  // Router with canonical commands (supports aliases)
  if (canonical === "start" || canonical === "help") {
    lastRouterMatch = { cmd: command, matched: "help", timestamp: Date.now() };
    await handleHelp(msg, user);
  } else if (canonical === "commands") {
    lastRouterMatch = { cmd: command, matched: "commands", timestamp: Date.now() };
    await handleCommands(msg, user);
  } else if (canonical === "debug") {
    lastRouterMatch = { cmd: command, matched: "debug", timestamp: Date.now() };
    await handleDebug(msg);
  } else if (canonical === "debug_worker_links") {
    lastRouterMatch = { cmd: command, matched: "debug_worker_links", timestamp: Date.now() };
    await handleDebugWorkerLinks(msg);
  } else if (canonical === "reset_daily") {
    lastRouterMatch = { cmd: command, matched: "reset_daily", timestamp: Date.now() };
    await handleResetDaily(msg, user, argText);
  } else if (canonical === "help_admin") {
    lastRouterMatch = { cmd: command, matched: "help_admin", timestamp: Date.now() };
    await handleHelpAdmin(msg, user);
  } else if (canonical === "audit") {
    lastRouterMatch = { cmd: command, matched: "audit", timestamp: Date.now() };
    await handleAudit(msg, user, argText);
  } else if (canonical === "technik") {
    lastRouterMatch = { cmd: command, matched: "technik", timestamp: Date.now() };
    await handleTechnik(msg, user, argText);
  } else if (canonical === "daj_admina") {
    lastRouterMatch = { cmd: command, matched: "daj_admina", timestamp: Date.now() };
    await handleDajAdmina(msg, user, argText);
  } else if (canonical === "usun_uzytkownika") {
    lastRouterMatch = { cmd: command, matched: "usun_uzytkownika", timestamp: Date.now() };
    await handleUsunUzytkownika(msg, user, argText);
  } else if (canonical === "plany") {
    lastRouterMatch = { cmd: command, matched: "plany", timestamp: Date.now() };
    console.log("[cmd]", { matched: "plany", telegramUserId: tgId });
    await handlePlany(msg, user);
  } else if (canonical === "panel") {
    lastRouterMatch = { cmd: command, matched: "panel", timestamp: Date.now() };
    console.log("[cmd]", { matched: "panel", telegramUserId: tgId });
    await handlePanel(msg, user);
  } else if (canonical === "lista") {
    await handleLista(msg, user);
  } else if (canonical === "usun") {
    await handleUsun(msg, user, argText);
  } else if (canonical === "dodaj") {
    await handleDodaj(msg, user, argText);
  } else if (canonical === "status") {
    await handleStatus(msg, user);
  } else if (canonical === "on") {
    await handleNotificationsOn(msg, user);
  } else if (canonical === "off") {
    await handleNotificationsOff(msg, user);
  } else if (canonical === "pojedyncze") {
    await handleModeSingle(msg, user);
  } else if (canonical === "zbiorcze") {
    await handleModeBatch(msg, user);
  } else if (canonical === "cisza_off") {
    await handleQuietOff(msg, user);
  } else if (canonical === "cisza") {
    await handleQuiet(msg, user);
  } else if (canonical === "lang") {
    lastRouterMatch = { cmd: command, matched: "lang", timestamp: Date.now() };
    await handleLanguage(msg, user, argText);
  } else if (canonical === "najnowsze") {
    lastRouterMatch = { cmd: command, matched: "najnowsze", timestamp: Date.now() };
    await handleNajnowsze(msg, user, argText);
  } else if (canonical === "najtansze") {
    lastRouterMatch = { cmd: command, matched: "najtansze", timestamp: Date.now() };
    await handleNajtansze(msg, user, argText);
  } else if (canonical === "max") {
    lastRouterMatch = { cmd: command, matched: "max", timestamp: Date.now() };
    await handleMax(msg, user, argText);
  } else {
    lastRouterMatch = { cmd: command, matched: "unknown", timestamp: Date.now() };
    const lang = getUserLang(user);
    await tgSend(chatId, t(lang, "general.unknown_command"));
  }
}

// ---------- main loop ----------

async function main() {
  // Log startup to verify stdout is connected to docker logs
  process.stdout.write("[tg-bot] Starting telegram-bot service\n");
  console.log("telegram-bot.js start");
  console.log(`[BOT_VERSION] ${BUILD_ID}`);
  console.log(`[BOT_FILE] ${__filename}`);
  console.log(`[BOT_LANGS] ${Object.keys(SUPPORTED_LANGS).join(", ")}`);

  await initDb();

  // Cleanup old audit logs (retention: 180 days) - KROK 6.2
  await cleanupAuditLog(180);

  while (true) {
    try {
      const updates = await fetchUpdates();

      for (const u of updates) {
        offset = u.update_id + 1;
        try {
          await handleUpdate(u);
        } catch (e) {
          console.error("handleUpdate error:", e);
        }
      }
    } catch (e) {
      console.error("polling error:", e);
      // krótka pauza przy błędach sieci
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

main().catch((err) => {
  console.error("telegram-bot fatal error", err);
  process.exit(1);
});
