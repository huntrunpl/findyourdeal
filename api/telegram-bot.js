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
async function handlePlans(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  const L = normLang(lang);

  const PLANS_TXT = {
    pl: "💳 Wybierz plan:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nPo opłaceniu wrócisz do bota i aktywacja zrobi się automatycznie.",
    en: "💳 Choose a plan:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nAfter checkout you'll return to the bot and activation will be automatic.",
    de: "💳 Wähle einen Plan:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nNach dem Checkout kehrst du zum Bot zurück und die Aktivierung passiert automatisch.",
    fr: "💳 Choisissez un abonnement :\n\n• Starter : /starter\n• Growth : /growth\n• Platinum : /platinum\n\nAprès le paiement, vous reviendrez au bot et l’activation sera automatique.",
    es: "💳 Elige un plan:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nTras el pago volverás al bot y la activación será automática.",
    it: "💳 Scegli un piano:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nDopo il pagamento tornerai al bot e l’attivazione sarà automatica.",
    pt: "💳 Escolha um plano:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nApós o pagamento você volta ao bot e a ativação será automática.",
    ro: "💳 Alege un plan:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nDupă plată revii în bot și activarea va fi automată.",
    nl: "💳 Kies een plan:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nNa betaling ga je terug naar de bot en wordt activatie automatisch gedaan.",
    cs: "💳 Vyberte plán:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nPo platbě se vrátíte do bota a aktivace proběhne automaticky.",
    sk: "💳 Vyberte plán:\n\n• Starter: /starter\n• Growth: /growth\n• Platinum: /platinum\n\nPo platbe sa vrátite do bota a aktivácia prebehne automaticky.",
  };

  const ent = await getUserEntitlementsByTelegramId(user.telegram_user_id).catch(() => null);
  const code = String(ent?.plan_code || "").toLowerCase();

  if (code === "platinum") {
    // show addon10 checkout
    const intro = {
      pl: "➕ Addon +10: +10 linków oraz +100 limitu historii.\nOtwórz płatność poniżej:",
      en: "➕ Addon +10: +10 links and +100 history limit.\nOpen checkout link below:",
      de: "➕ Add-on +10: +10 Links und +100 Verlaufslimit.\nÖffne den Checkout-Link unten:",
      fr: "➕ Add-on +10 : +10 liens et +100 limite d’historique.\nOuvrez le lien de paiement ci-dessous :",
      es: "➕ Addon +10: +10 enlaces y +100 de límite de historial.\nAbre el enlace de pago abajo:",
      it: "➕ Addon +10: +10 link e +100 di limite storico.\nApri il link di pagamento qui sotto:",
      pt: "➕ Addon +10: +10 links e +100 de limite de histórico.\nAbra o link de pagamento abaixo:",
      ro: "➕ Addon +10: +10 linkuri și +100 la limita istoricului.\nDeschide linkul de plată de mai jos:",
      nl: "➕ Addon +10: +10 links en +100 geschiedenislimiet.\nOpen de betaallink hieronder:",
      cs: "➕ Addon +10: +10 odkazů a +100 limit historie.\nOtevřete platební odkaz níže:",
      sk: "➕ Addon +10: +10 odkazov a +100 limit histórie.\nOtvorte platobný odkaz nižšie:",
    };

    try {
      const resp = await createAddon10CheckoutSession({ user, chatId });
      await tgSend(chatId, `✅ ${planLabel("platinum")}\n\n${intro[L] || intro.en}\n\n${escapeHtml(resp.url)}`);
      return;
    } catch (e) {
      await tgSend(chatId, L === "pl" ? "❌ Nie udało się wygenerować linku płatności." : "❌ Couldn't generate payment link.");
      return;
    }
  }

  await tgSend(chatId, PLANS_TXT[L] || PLANS_TXT.en);
}

async function handleBuyPlan(msg, user, code) {
  const chatId = String(msg.chat.id);
  const priceId =
    code === "starter" ? PRICE_STARTER :
    code === "growth" ? PRICE_GROWTH :
    code === "platinum" ? PRICE_PLATINUM :
    "";

  if (!STRIPE_SECRET_KEY || !priceId || !BOT_USERNAME) {
    await tgSend(chatId, "❌ Sales config missing.");
    return;
  }

  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  try {
    const { url } = await createPlanCheckoutSession({ user, planCode: code, priceId, chatId });
    await tgSend(chatId, `${t(lang, "language_current", { language: escapeHtml(langLabel(lang)) })}\n\n${escapeHtml(url)}`);
  } catch (e) {
    await tgSend(chatId, `❌ ${escapeHtml(e?.message || e)}`);
  }
}

async function handleAddon10(msg, user) {
  const chatId = String(msg.chat.id);
  if (!STRIPE_SECRET_KEY || !PRICE_ADDON10 || !BOT_USERNAME) {
    await tgSend(chatId, "❌ Addon config missing.");
    return;
  }
  try {
    const { url } = await createAddon10CheckoutSession({ user, chatId });
    await tgSend(chatId, escapeHtml(url));
  } catch (e) {
    const m = String(e?.message || e);
    if (m === "ADDON_ONLY_PLATINUM") {
      await tgSend(chatId, "⛔ Addon +10 is Platinum only.");
      return;
    }
    await tgSend(chatId, `❌ ${escapeHtml(m)}`);
  }
}

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
async function handleNazwa(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");

  const raw = String(msg.text || "").trim();
  const parts = raw.split(/\s+/);
  const linkId = Number(parts[1] || 0);
  const rawName = parts.slice(2).join(" ").trim();

  if (!Number.isFinite(linkId) || linkId <= 0 || !rawName) {
    await tgSend(chatId, lang === "pl"
      ? "Użycie: /nazwa <ID> <Twoja nazwa>\nPrzykład: /nazwa 116 Oferty iPhone 16\nWyczyszczenie: /nazwa 116 -"
      : "Usage: /nazwa <ID> <Your name>\nExample: /nazwa 116 iPhone 16 offers\nClear: /nazwa 116 -"
    );
    return;
  }

  const name = (rawName === "-" ? "" : rawName).slice(0, 60);

  try {
    const r = await dbQuery(
      "UPDATE links SET name=$1, label=$1 WHERE id=$2 AND user_id=$3 RETURNING id",
      [name || null, linkId, Number(user.id)]
    );
    if (!r.rowCount) {
      await tgSend(chatId, lang === "pl"
        ? `ℹ️ Nie znaleziono linku o ID ${linkId} na Twoim koncie.`
        : `ℹ️ Link ID ${linkId} not found in your account.`
      );
      return;
    }

    await tgSend(chatId, lang === "pl"
      ? (name ? `✅ Ustawiono nazwę dla ID ${linkId}: ${escapeHtml(name)}` : `✅ Wyczyszczono nazwę dla ID ${linkId}.`)
      : (name ? `✅ Name set for ID ${linkId}: ${escapeHtml(name)}` : `✅ Name cleared for ID ${linkId}.`)
    );
  } catch (e) {
    await tgSend(chatId, `❌ Error: ${escapeHtml(String(e?.message || e))}`);
  }
}

// ---------- admin helpers ----------
function getAdminIds() {
  const raw =
    process.env.FYD_ADMIN_TG_IDS ||
    process.env.FYD_SUPERADMIN_TG_IDS ||
    "";
  return String(raw)
    .split(/[, ]+/)
    .map((x) => Number(String(x || "").trim()))
    .filter((x) => Number.isFinite(x) && x > 0);
}

function isAdminTgId(tgId) {
  const ids = getAdminIds();
  return ids.length ? ids.includes(Number(tgId)) : false;
}

// /technik (ADMIN)
async function handleTechnik(msg, user, argText) {
  const chatId = String(msg.chat.id);
  const fromId = msg?.from?.id;
  if (!isAdminTgId(fromId)) {
    await tgSend(chatId, "⛔ Brak uprawnień (ADMIN).");
    return;
  }

  const target = Number(argText || fromId || 0);
  if (!Number.isFinite(target) || target <= 0) {
    await tgSend(chatId, "Użycie: /technik <telegram_user_id>");
    return;
  }

  const r = await dbQuery(`SELECT id FROM users WHERE telegram_user_id=$1 LIMIT 1`, [target]).catch(() => ({ rows: [] }));
  const uid = r?.rows?.[0]?.id ? Number(r.rows[0].id) : 0;

  await tgSend(
    chatId,
    `🛠 <b>TECHNIK</b>\n` +
      `tg_user_id: <code>${escapeHtml(String(target))}</code>\n` +
      `user_id: <code>${escapeHtml(String(uid || 0))}</code>`,
    { disable_web_page_preview: true, link_preview_options: { is_disabled: true } }
  );
}

// /usun_uzytkownika (SUPERADMIN)
async function handleUsunUzytkownika(msg, user) {
  const chatId = String(msg.chat.id);
  const fromId = msg?.from?.id || 0;
  const superAdmins = String(process.env.FYD_SUPERADMIN_TG_IDS || "")
    .split(/[, ]+/)
    .map((x) => Number(String(x || "").trim()))
    .filter((x) => Number.isFinite(x) && x > 0);

  if (!superAdmins.includes(Number(fromId))) {
    await tgSend(chatId, "⛔ Brak uprawnień (tylko SUPERADMIN).");
    return;
  }

  const parts = String(msg.text || "").trim().split(/\s+/);
  const tgId = Number(parts[1] || 0);

  if (!Number.isFinite(tgId) || tgId <= 0) {
    await tgSend(chatId, "Użycie: /usun_uzytkownika <telegram_user_id>");
    return;
  }

  const safe = async (sql, params) => {
    try { await dbQuery(sql, params); } catch {}
  };

  try {
    const u = await dbQuery("SELECT id FROM users WHERE telegram_user_id=$1 LIMIT 1", [tgId]);
    if (!u.rows.length) {
      await tgSend(chatId, `ℹ️ Nie znaleziono użytkownika o telegram_user_id=${tgId}`);
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
    await safe("DELETE FROM links WHERE user_id=$1", [userId]);

    await dbQuery("DELETE FROM users WHERE id=$1", [userId]);

    await dbQuery("COMMIT");
    await tgSend(chatId, `✅ Usunięto użytkownika telegram_user_id=${tgId} (user_id=${userId}) i wyczyszczono jego dane.`);
  } catch (e) {
    try { await dbQuery("ROLLBACK"); } catch {}
    await tgSend(chatId, `❌ Błąd usuwania użytkownika: ${escapeHtml(String(e?.message || e))}`);
  }
}

// /daj_admina (SUPERADMIN)
async function handleDajAdmina(msg, user) {
  const chatId = String(msg.chat.id);
  const fromId = msg?.from?.id || 0;
  const superAdmins = String(process.env.FYD_SUPERADMIN_TG_IDS || "")
    .split(/[, ]+/)
    .map((x) => Number(String(x || "").trim()))
    .filter((x) => Number.isFinite(x) && x > 0);

  if (!superAdmins.includes(Number(fromId))) {
    await tgSend(chatId, "⛔ Brak uprawnień (tylko SUPERADMIN).");
    return;
  }

  const parts = String(msg.text || "").trim().split(/\s+/);
  const tgId = Number(parts[1] || 0);

  if (!Number.isFinite(tgId) || tgId <= 0) {
    await tgSend(chatId, "Użycie: /daj_admina <telegram_user_id>");
    return;
  }

  try {
    await dbQuery("UPDATE users SET is_admin=TRUE WHERE telegram_user_id=$1", [tgId]).catch(() => {});
    const check = await dbQuery("SELECT id FROM users WHERE telegram_user_id=$1 LIMIT 1", [tgId]);
    if (!check.rows.length) {
      await tgSend(chatId, `ℹ️ Nie znaleziono użytkownika o telegram_user_id=${tgId} (najpierw musi zrobić /start).`);
      return;
    }
    await tgSend(chatId, `✅ Nadano ADMIN dla telegram_user_id=${tgId}`);
  } catch (e) {
    await tgSend(chatId, `❌ Błąd nadawania admina: ${escapeHtml(String(e?.message || e))}`);
  }
}

// ---------- platinum filters ----------
function stripFilters(obj) {
  try {
    const o = { ...(obj || {}) };
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (v == null) delete o[k];
      else if (Array.isArray(v) && v.length === 0) delete o[k];
      else if (typeof v === "string" && v.trim() === "") delete o[k];
    }
    return o;
  } catch {
    return {};
  }
}

async function requirePlatinum(msg, user) {
  // strict if we can determine plan; bypass only if schema/view fails
  try {
    const ent = await getUserEntitlementsByTelegramId(user.telegram_user_id);
    const code = String(ent?.plan_code || "").toLowerCase();
    if (code === "platinum") return true;
    await tgSend(msg.chat.id, "⛔ Te filtry są dostępne tylko w planie Platinum.");
    return false;
  } catch {
    return true;
  }
}

async function getLinkFilters(userId, linkId) {
  if (!(await hasColumn("links", "filters"))) throw new Error("filters_column_missing");
  const r = await dbQuery("SELECT filters FROM public.links WHERE id=$1 AND user_id=$2 LIMIT 1", [Number(linkId), Number(userId)]);
  return r && r.rowCount ? (r.rows[0].filters || {}) : null;
}

async function setLinkFilters(userId, linkId, nextFilters) {
  if (!(await hasColumn("links", "filters"))) throw new Error("filters_column_missing");
  const js = JSON.stringify(stripFilters(nextFilters || {}));
  await dbQuery("UPDATE public.links SET filters=$1::jsonb WHERE id=$2 AND user_id=$3", [js, Number(linkId), Number(userId)]);
}

async function handleCena(msg, user) {
  if (!(await requirePlatinum(msg, user))) return;

  const parts = String(msg.text || "").trim().split(/\s+/);
  if (parts.length < 3) {
    await tgSend(msg.chat.id, "Użycie: /cena <ID> <MIN> <MAX>  albo  /cena <ID> off");
    return;
  }

  const id = Number(parts[1]);
  const mode = String(parts[2] || "").toLowerCase();

  let cur;
  try { cur = await getLinkFilters(user.id, id); } catch { cur = null; }
  if (cur == null) {
    await tgSend(msg.chat.id, "❌ Nie znaleziono linku o takim ID na tym koncie.");
    return;
  }

  const f = { ...(cur || {}) };

  if (mode === "off") {
    f.minPrice = null;
    f.maxPrice = null;
    await setLinkFilters(user.id, id, f);
    await tgSend(msg.chat.id, `✅ /cena OFF dla ID ${id}`);
    return;
  }

  if (parts.length < 4) {
    await tgSend(msg.chat.id, "Użycie: /cena <ID> <MIN> <MAX>");
    return;
  }

  const mn = Number(parts[2]);
  const mx = Number(parts[3]);
  if (!Number.isFinite(mn) || !Number.isFinite(mx)) {
    await tgSend(msg.chat.id, "❌ MIN/MAX muszą być liczbami.");
    return;
  }

  f.minPrice = mn;
  f.maxPrice = mx;
  await setLinkFilters(user.id, id, f);
  await tgSend(msg.chat.id, `✅ Ustawiono cenę dla ID ${id}: ${mn}–${mx}`);
}

async function handleRozmiar(msg, user) {
  if (!(await requirePlatinum(msg, user))) return;

  const raw = String(msg.text || "").trim();
  const parts = raw.split(/\s+/);
  if (parts.length < 3) {
    await tgSend(msg.chat.id, "Użycie: /rozmiar <ID> <R1,R2,...>  albo  /rozmiar <ID> off");
    return;
  }

  const id = Number(parts[1]);
  const mode = String(parts[2] || "").toLowerCase();

  let cur;
  try { cur = await getLinkFilters(user.id, id); } catch { cur = null; }
  if (cur == null) {
    await tgSend(msg.chat.id, "❌ Nie znaleziono linku o takim ID na tym koncie.");
    return;
  }

  const f = { ...(cur || {}) };

  if (mode === "off") {
    f.sizes = null;
    await setLinkFilters(user.id, id, f);
    await tgSend(msg.chat.id, `✅ /rozmiar OFF dla ID ${id}`);
    return;
  }

  const sizesRaw = raw.split(/\s+/).slice(2).join(" ").trim();
  const sizes = sizesRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!sizes.length) {
    await tgSend(msg.chat.id, "❌ Podaj rozmiar(y), np. /rozmiar 153 44,45");
    return;
  }

  f.sizes = sizes;
  await setLinkFilters(user.id, id, f);
  await tgSend(msg.chat.id, `✅ Ustawiono rozmiar(y) dla ID ${id}: ${sizes.join(", ")}`);
}

async function handleMarka(msg, user) {
  if (!(await requirePlatinum(msg, user))) return;

  const raw = String(msg.text || "").trim();
  const parts = raw.split(/\s+/);
  if (parts.length < 3) {
    await tgSend(msg.chat.id, "Użycie: /marka <ID> <BRAND1,BRAND2,...>  albo  /marka <ID> off");
    return;
  }

  const id = Number(parts[1]);
  const mode = String(parts[2] || "").toLowerCase();

  let cur;
  try { cur = await getLinkFilters(user.id, id); } catch { cur = null; }
  if (cur == null) {
    await tgSend(msg.chat.id, "❌ Nie znaleziono linku o takim ID na tym koncie.");
    return;
  }

  const f = { ...(cur || {}) };

  if (mode === "off") {
    f.brand = null;
    await setLinkFilters(user.id, id, f);
    await tgSend(msg.chat.id, `✅ /marka OFF dla ID ${id}`);
    return;
  }

  const brandsRaw = raw.split(/\s+/).slice(2).join(" ").trim();
  const brands = brandsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!brands.length) {
    await tgSend(msg.chat.id, "❌ Podaj markę(i), np. /marka 153 Nike,Jordan");
    return;
  }

  f.brand = brands;
  await setLinkFilters(user.id, id, f);
  await tgSend(msg.chat.id, `✅ Ustawiono markę(i) dla ID ${id}: ${brands.join(", ")}`);
}

async function handleFiltry(msg, user) {
  const parts = String(msg.text || "").trim().split(/\s+/);
  if (parts.length < 2) {
    await tgSend(msg.chat.id, "Użycie: /filtry <ID>");
    return;
  }
  const id = Number(parts[1]);

  let cur;
  try { cur = await getLinkFilters(user.id, id); } catch { cur = null; }
  if (cur == null) {
    await tgSend(msg.chat.id, "❌ Nie znaleziono linku o takim ID na tym koncie.");
    return;
  }

  const pretty = JSON.stringify(cur || {}, null, 2);
  await tgSend(msg.chat.id, `ℹ️ Filtry dla ID ${id}:\n<code>${escapeHtml(pretty)}</code>`, { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
}

async function handleResetFiltry(msg, user) {
  if (!(await requirePlatinum(msg, user))) return;

  const parts = String(msg.text || "").trim().split(/\s+/);
  if (parts.length < 2) {
    await tgSend(msg.chat.id, "Użycie: /resetfiltry <ID>");
    return;
  }
  const id = Number(parts[1]);

  let cur;
  try { cur = await getLinkFilters(user.id, id); } catch { cur = null; }
  if (cur == null) {
    await tgSend(msg.chat.id, "❌ Nie znaleziono linku o takim ID na tym koncie.");
    return;
  }

  await setLinkFilters(user.id, id, {});
  await tgSend(msg.chat.id, `✅ Wyczyszczono filtry dla ID ${id}`);
}

const { handleNewestStrict, handleCheapest } = createHistoryHandlers({
  tgSend: (...a) => tgSend(...a),
  fydResolveLang: (...a) => fydResolveLang(...a),
  escapeHtml,
  dbQuery,
  hasColumn,
  stripPrefixIcons,
  dedupePanelLoginUrlText,
  appendUrlFromKeyboard,
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

