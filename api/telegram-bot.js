import "./env.js";

import fetch from "node-fetch";
import { randomBytes } from "node:crypto";
import pg from "pg";
import { sleep, escapeHtml, normLang } from "./src/bot/utils.js";
import { createTg } from "./src/bot/tg.js";
import { stripeGet, stripePostForm } from "./src/bot/stripe.js";
import { getPlanIdByCode, planLabel, nowPlusMinutes, createActivationToken, createPlanCheckoutSession, createAddon10CheckoutSession } from "./src/bot/plans.js";
import { dedupePanelLoginUrlText, appendUrlFromKeyboard } from "./src/bot/text-normalize.js";
import { FYD_DEFAULT_LANG, FYD_SUPPORTED_LANGS, isSupportedLang } from "./src/bot/i18n.js";
import { hasColumn } from "./src/bot/schema-cache.js";
import { getUserLangByUserId, maybeMigrateChatLangToUser, OLD_getLangFromUsers, setLang } from "./src/bot/lang-store.js";
import { stripPrefixIcons, isDisableText, isSingleText, isBatchText, fixInlineButtonsI18n } from "./src/bot/inline-buttons-i18n.js";
import { handleLang, handleHelp, handleDefault } from "./src/bot/help-lang.js";
import { createHandleCallback } from "./src/bot/updates/callbacks.js";
import { createHandleUpdate } from "./src/bot/updates/handle-update.js";
import { createPollingRunner } from "./src/bot/updates/polling.js";
import { createHistoryHandlers } from "./src/bot/commands/history.js";
import { createFiltersHandlers } from "./src/bot/commands/filters.js";
import { createAdminHandlers } from "./src/bot/commands/admin.js";
import { createNazwaHandler } from "./src/bot/commands/nazwa.js";
import { createPlanHandlers } from "./src/bot/commands/plans.js";
import { handleList as handleListCmd, handleAdd as handleAddCmd, handleRemove as handleRemoveCmd } from "./src/bot/commands/links.js";
import { createHandlePanel } from "./src/bot/commands/panel.js";
import { createHandleStatus } from "./src/bot/commands/status.js";
import { createChatNotificationsHandlers } from "./src/bot/commands/chat-notifications.js";
const { Pool } = pg;

import { t, normalizeLang, langLabel, buildLanguageKeyboard } from "./i18n.js";
import {
  initDb,
  ensureUser,
  getUserWithPlanByTelegramId,
  getUserEntitlementsByTelegramId,
  countActiveLinksForUserId,
  insertLinkForUserId,
  clearLinkNotificationMode,
  setQuietHours,
  disableQuietHours,
  getQuietHours,
  ensureChatNotificationsRow as ensureChatNotificationsRowDb,
} from "./db.js";

/**
 * FYD Telegram Bot — clean single-source version
 * - no duplicated fetch wrappers
 * - no duplicated pools
 * - schema-aware writes (lang/language, filters etc.)
 * - keeps: /help /lang /status /plans /starter /growth /platinum /addon10
 *         /list /add /remove /panel /on /off /single /batch
 *         per-link: /single_18 /batch_18 /off_18 /on_18 (+ spaced variants)
 *         quiet hours: /quiet 22-7 /quiet_off
 *         history: /latest [ID] and /cheapest [ID]
 *         platinum filters: /cena /rozmiar /marka /filtry /resetfiltry
 *         admin: /usun_uzytkownika /daj_admina /technik
 *         naming: /nazwa <ID> <name|-> (also updates label)
 */

const TG = process.env.TELEGRAM_BOT_TOKEN || "";
const DATABASE_URL = process.env.DATABASE_URL || "";


const __botPool = new Pool({ connectionString: DATABASE_URL });

async function __fydResetAllLinksBaseline(userId) {
  const uid = Number(userId);
  const r = await __botPool.query(
    "UPDATE links SET last_key=NULL, last_seen_at=NOW() WHERE user_id=$1",
    [uid]
  );
  console.error("[tg-bot] baseline reset ALL", { userId: uid, rowCount: r.rowCount });
}


async function __fydResetOneLinkBaseline(userId, linkId) {
  const uid = Number(userId);
  const lid = Number(linkId);
  const r = await __botPool.query(
    "UPDATE links SET last_key=NULL, last_seen_at=NOW() WHERE user_id=$1 AND id=$2",
    [uid, lid]
  );
  console.error("[tg-bot] baseline reset ONE", { userId: uid, linkId: lid, rowCount: r.rowCount });
}


const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

const BOT_USERNAME =
  process.env.TELEGRAM_BOT_USERNAME ||
  process.env.BOT_USERNAME ||
  process.env.FYD_BOT_USERNAME ||
  "";

const PRICE_STARTER = process.env.FYD_PRICE_STARTER || "";
const PRICE_GROWTH = process.env.FYD_PRICE_GROWTH || "";
const PRICE_PLATINUM = process.env.FYD_PRICE_PLATINUM || "";
const PRICE_ADDON10 = process.env.FYD_PRICE_ADDON10 || "";

if (!TG) {
  console.error("Missing TELEGRAM_BOT_TOKEN");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool =
  globalThis.__FYD_TG_POOL_SINGLE ||
  new Pool({ connectionString: DATABASE_URL });
globalThis.__FYD_TG_POOL_SINGLE = pool;

async function dbQuery(sql, params = []) {
  return pool.query(sql, params);
}





// ---------- telegram call ----------




// ---------- /plans ----------
const { handlePlans, handleBuyPlan, handleAddon10 } = createPlanHandlers({
  tgSend: (...a) => tgSend(...a),
  escapeHtml,
  createPlanCheckoutSession,
  createAddon10CheckoutSession,
  STRIPE_SECRET_KEY,
  PRICE_ADDON10,
  BOT_USERNAME,
  planLabel,
  normLang,
  t,
  langLabel,
  fydResolveLang: (...a) => fydResolveLang(...a),
  getUserEntitlementsByTelegramId,
});


// ---------- /list ----------
async function handleList(msg, user) {
  return handleListCmd({ dbQuery, pool, tgSend, escapeHtml, fydResolveLang }, msg, user);
}

// ---------- /add ----------
async function handleAdd(msg, user, argText) {
  return handleAddCmd({ tgSend, escapeHtml, fydResolveLang, getUserEntitlementsByTelegramId, countActiveLinksForUserId, insertLinkForUserId }, msg, user, argText);
}

// ---------- /remove (hard delete) ----------
async function handleRemove(msg, user, argText) {
  return handleRemoveCmd({ pool, tgSend, escapeHtml, fydResolveLang }, msg, user, argText);
}

// ---------- per-link modes ----------
async function setPerLinkMode(chatId, userId, linkId, mode) {
  const m = String(mode || "").toLowerCase();
  const finalMode = m === "batch" ? "batch" : m === "off" ? "off" : "single";

  const chk = await dbQuery(`SELECT id FROM links WHERE id=$1 AND user_id=$2 LIMIT 1`, [Number(linkId), Number(userId)]);
  if (!chk.rowCount) return { ok: false, reason: "NOT_OWNED" };

  await dbQuery(
    `INSERT INTO link_notification_modes (user_id,chat_id,link_id,mode,updated_at)
     VALUES ($1,$2,$3,$4,NOW())
     ON CONFLICT (user_id,chat_id,link_id)
     DO UPDATE SET mode=EXCLUDED.mode, updated_at=NOW()`,
    [Number(userId), String(chatId), Number(linkId), finalMode]
  );

  return { ok: true, mode: finalMode };
}

// ---------- quiet hours ----------
const __chatNotif = createChatNotificationsHandlers({
  tgSend: (...a) => tgSend(...a),
  fydResolveLang: (...a) => fydResolveLang(...a),
  dbQuery,
  hasColumn,
  ensureChatNotificationsRowDb: (...a) => ensureChatNotificationsRowDb(...a),
  getQuietHours,
  setQuietHours,
  disableQuietHours,
  escapeHtml,
});

const handleQuiet = __chatNotif.handleQuiet;
const handleQuietOff = __chatNotif.handleQuietOff;
const globalOn = __chatNotif.globalOn;
const globalOff = __chatNotif.globalOff;
const armLinks = __chatNotif.armLinks;
const globalOnAndArm = __chatNotif.globalOnAndArm;
const handleModeSingle = __chatNotif.handleModeSingle;
const handleModeBatch = __chatNotif.handleModeBatch;

// ---------- /panel ----------
const handlePanel = createHandlePanel({
  randomBytes,
  dbQuery,
  tgSend: (...a) => tgSend(...a),
  escapeHtml,
  fydResolveLang: (...a) => fydResolveLang(...a),
  getPanelBaseUrl: () => process.env.PANEL_BASE_URL || "https://panel.findyourdeal.app",
});

// ---------- /status (full) ----------
const handleStatus = createHandleStatus({
  tgSend: (...a) => tgSend(...a),
  escapeHtml,
  fydResolveLang: (...a) => fydResolveLang(...a),
  normLang,
  planLabel,
  getUserEntitlementsByTelegramId,
  getQuietHours,
  dbQuery,
});

// ---------- /nazwa ----------
const handleNazwa = createNazwaHandler({
  tgSend: (...a) => tgSend(...a),
  escapeHtml,
  fydResolveLang: (...a) => fydResolveLang(...a),
  dbQuery,
});


// ---------- admin handlers ----------
const { handleTechnik, handleUsunUzytkownika, handleDajAdmina } = createAdminHandlers({
  tgSend: (...a) => tgSend(...a),
  escapeHtml,
  dbQuery,
});


const {
  handleCena,
  handleRozmiar,
  handleMarka,
  handleFiltry,
  handleResetFiltry,
} = createFiltersHandlers({
  tgSend: (...a) => tgSend(...a),
  fydResolveLang: (...a) => fydResolveLang(...a),
  escapeHtml,
  dbQuery,
  hasColumn,
  stripPrefixIcons,
  normLang,
  t,
});

// ---------- callbacks ----------
let __handleCallback = null;
async function handleCallback(update) {
  if (!__handleCallback) {
    __handleCallback = createHandleCallback({
      tgAnswerCb,
      tgSend,
      getUserWithPlanByTelegramId,
      ensureChatNotificationsRowDb,
      fydResolveLang,
      setPerLinkMode,
    });
  }
  return __handleCallback(update);
}

// ---------- long polling ----------
const main = createPollingRunner({
  TG,
  fetch,
  sleep,
  handleUpdate,
  log: console,
});

// ---------- command normalization ----------
// (moved to api/src/bot/updates/handle-update.js)

// ---------- update handler ----------
let __handleUpdate = null;
const __dbReadyRef = { value: false };
async function handleUpdate(update) {
  if (!__handleUpdate) {
    __handleUpdate = createHandleUpdate({
      handleCallback,
      tgSend,
      ensureUser,
      getUserWithPlanByTelegramId,
      ensureChatNotificationsRowDb: ensureChatNotificationsRowDb,
      dbReadyRef: __dbReadyRef,
      initDbRetryLoop,
      fydResolveLang,
      dbQuery,
      clearLinkNotificationMode,
      setPerLinkMode,

      handleHelp,
      handleLang,
      handleStatus,
      handlePlans,
      handleBuyPlan,
      handleAddon10,

      handleCena,
      handleRozmiar,
      handleMarka,
      handleFiltry,
      handleResetFiltry,

      handleNewestStrict,
      handleCheapest,

      handlePanel,
      handleList,
      handleRemove,
      handleAdd,

      globalOnAndArm: globalOnAndArm,
      globalOff,
      handleModeSingle,
      handleModeBatch,
      handleDefault,

      handleQuietOff,
      handleQuiet,

      handleUsunUzytkownika,
      handleDajAdmina,
      handleNazwa,
      handleTechnik,

      t,
    });
  }
  const res = await __handleUpdate(update);
  __dbReady = __dbReadyRef.value;
  return res;
}

// ---------- DB init retry ----------
let __dbReady = false;
async function initDbRetryLoop() {
  for (;;) {
    try {
      await initDb();
      __dbReady = true;
      return;
    } catch (e) {
      const code = e && e.code ? String(e.code) : "";
      if (code === "57P03") {
        console.error("[tg-bot] DB is starting up (57P03) - retry in 2s");
        await sleep(2000);
        continue;
      }
      throw e;
    }
  }
}


// ---------- main ----------
// ---- run only when executed directly (no side-effects on import) ----
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("telegram-bot fatal error", e);
    process.exit(1);
  });
}

