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
import { handleList as handleListCmd, handleAdd as handleAddCmd, handleRemove as handleRemoveCmd } from "./src/bot/commands/links.js";
import { createHandlePanel } from "./src/bot/commands/panel.js";
import { createHandleStatus } from "./src/bot/commands/status.js";
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
async function handleQuiet(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  const arg = String(msg.text || "").trim().split(/\s+/).slice(1).join(" ").trim();

  if (!arg) {
    const qh = await getQuietHours(chatId).catch(() => null);
    if (qh?.quiet_enabled) {
      await tgSend(chatId, lang === "pl"
        ? `🌙 Cisza nocna: <b>WŁĄCZONA</b>, godziny ${qh.quiet_from}:00–${qh.quiet_to}:00`
        : `🌙 Quiet hours: <b>ENABLED</b>, hours ${qh.quiet_from}:00–${qh.quiet_to}:00`
      );
    } else {
      await tgSend(chatId, lang === "pl"
        ? "🌙 Cisza nocna: <b>wyłączona</b>.\nUstaw: <code>/cisza 22-7</code>"
        : "🌙 Quiet hours: <b>disabled</b>.\nSet: <code>/quiet 22-7</code>"
      );
    }
    return;
  }

  const m = arg.match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
  if (!m) {
    await tgSend(chatId, lang === "pl"
      ? "Podaj zakres jako HH-HH, np. <code>/cisza 22-7</code>"
      : "Provide range as HH-HH, e.g. <code>/quiet 22-7</code>"
    );
    return;
  }

  const fromHour = Number(m[1]);
  const toHour = Number(m[2]);
  if (!Number.isFinite(fromHour) || !Number.isFinite(toHour) || fromHour < 0 || fromHour > 23 || toHour < 0 || toHour > 23) {
    await tgSend(chatId, lang === "pl"
      ? "Godziny muszą być w zakresie 0–23, np. <code>/cisza 22-7</code>"
      : "Hours must be 0–23, e.g. <code>/quiet 22-7</code>"
    );
    return;
  }

  await setQuietHours(chatId, fromHour, toHour);
  await tgSend(chatId, lang === "pl"
    ? `🌙 Ustawiono ciszę nocną: <b>${fromHour}:00–${toHour}:00</b>`
    : `🌙 Quiet hours set: <b>${fromHour}:00–${toHour}:00</b>`
  );
}

async function handleQuietOff(msg, user) {
  const chatId = String(msg.chat.id);
  await disableQuietHours(chatId);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  await tgSend(chatId, lang === "pl" ? "🌙 Cisza nocna: <b>WYŁĄCZONA</b>" : "🌙 Quiet hours: <b>DISABLED</b>");
}

// ---------- global /on /off + arming baseline ----------
async function globalOn(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  await ensureChatNotificationsRowDb(chatId, user.id);

  await dbQuery(
    `INSERT INTO chat_notifications (chat_id,user_id,enabled,mode,notify_from,updated_at)
     VALUES ($1,$2,TRUE,'single',NOW(),NOW())
     ON CONFLICT (chat_id,user_id)
     DO UPDATE SET enabled=TRUE, notify_from=NOW(), updated_at=NOW()`,
    [chatId, Number(user.id)]
  );

  await tgSend(chatId, lang === "pl"
    ? "✅ Powiadomienia WŁĄCZONE. Od teraz wysyłam tylko <b>nowe</b> ogłoszenia."
    : "✅ Notifications ENABLED. From now on I will send only <b>new</b> offers."
  );
}

async function globalOff(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  await ensureChatNotificationsRowDb(chatId, user.id);

  await dbQuery(
    `INSERT INTO chat_notifications (chat_id,user_id,enabled,mode,updated_at)
     VALUES ($1,$2,FALSE,'single',NOW())
     ON CONFLICT (chat_id,user_id)
     DO UPDATE SET enabled=FALSE, updated_at=NOW()`,
    [chatId, Number(user.id)]
  );

  await tgSend(chatId, lang === "pl"
    ? "⛔ Powiadomienia WYŁĄCZONE (dla wszystkich linków na tym czacie)."
    : "⛔ Notifications DISABLED (for all links in this chat)."
  );
}

async function armLinks(userId, chatId, linkId = null) {
  const uid = Number(userId);
  const cid = String(chatId);
  if (!uid) return;

  let ids = [];

  // try with chat_id column if exists; else fallback
  const hasChatIdCol = await hasColumn("links", "chat_id").catch(() => false);

  if (linkId != null && Number.isFinite(Number(linkId))) {
    try {
      const r = await dbQuery(
        hasChatIdCol
          ? `SELECT id FROM public.links WHERE id=$3 AND user_id=$1 AND active=true AND (chat_id IS NULL OR chat_id=$2) LIMIT 1`
          : `SELECT id FROM public.links WHERE id=$2 AND user_id=$1 AND active=true LIMIT 1`,
        hasChatIdCol ? [uid, cid, Number(linkId)] : [uid, Number(linkId)]
      );
      ids = (r.rows || []).map((x) => Number(x.id));
    } catch {}
  } else {
    try {
      const r = await dbQuery(
        hasChatIdCol
          ? `SELECT id FROM public.links WHERE user_id=$1 AND active=true AND (chat_id IS NULL OR chat_id=$2) ORDER BY id`
          : `SELECT id FROM public.links WHERE user_id=$1 AND active=true ORDER BY id`,
        hasChatIdCol ? [uid, cid] : [uid]
      );
      ids = (r.rows || []).map((x) => Number(x.id));
    } catch {}
  }

  if (!ids.length) return;

  // history reset
  await dbQuery(`DELETE FROM public.link_items WHERE link_id = ANY($1::bigint[])`, [ids]).catch(() => {});
  // baseline reset (best effort)
  try {
    const hasLastKey = await hasColumn("links", "last_key");
    const hasLastSeenAt = await hasColumn("links", "last_seen_at");
    const sets = [];
    if (hasLastKey) sets.push("last_key=NULL");
    if (hasLastSeenAt) sets.push("last_seen_at=NULL");
    if (sets.length) {
      await dbQuery(`UPDATE public.links SET ${sets.join(", ")} WHERE id = ANY($1::bigint[])`, [ids]).catch(() => {});
    }
  } catch {}
}

async function globalOnAndArm(msg, user) {
  // Global /on: włącza powiadomienia i ustawia notify_from=NOW() dla tego czatu.
  // Nie dotykamy historii ani baseline linków – tym zajmuje się worker z użyciem notify_from.
  await globalOn(msg, user);
}

async function handleModeSingle(msg, user) {
  const chatId = String(msg.chat.id);
  await ensureChatNotificationsRowDb(chatId, user.id);
  await dbQuery(`UPDATE chat_notifications SET mode='single', updated_at=NOW() WHERE chat_id=$1 AND user_id=$2`, [chatId, user.id]);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  await tgSend(chatId, lang === "pl"
    ? "📨 Ustawiono tryb: <b>pojedynczo</b> (domyślny na tym czacie)."
    : "📨 Mode set: <b>single</b> (default in this chat)."
  );
}

async function handleModeBatch(msg, user) {
  const chatId = String(msg.chat.id);
  await ensureChatNotificationsRowDb(chatId, user.id);
  await dbQuery(`UPDATE chat_notifications SET mode='batch', updated_at=NOW() WHERE chat_id=$1 AND user_id=$2`, [chatId, user.id]);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  await tgSend(chatId, lang === "pl"
    ? "📦 Ustawiono tryb: <b>zbiorczo</b> (domyślny na tym czacie)."
    : "📦 Mode set: <b>batch</b> (default in this chat)."
  );
}

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

// ---------- /najnowsze (strict) ----------
function extractTs(payload, createdAt) {
  try {
    const candidates = [
      payload?.created_time, payload?.createdTime, payload?.created_at_ts, payload?.createdAtTs,
      payload?.created_at, payload?.createdAt, payload?.posted_at, payload?.postedAt,
      payload?.published_at, payload?.publishedAt, payload?.time, payload?.timestamp,
    ];
    for (const v of candidates) {
      if (v == null) continue;
      if (typeof v === "number" && Number.isFinite(v)) return v < 1e11 ? v * 1000 : v;
      if (typeof v === "string") {
        const s = v.trim();
        if (/^\d{9,13}$/.test(s)) {
          const n = parseInt(s, 10);
          return n < 1e11 ? n * 1000 : n;
        }
        const d = Date.parse(s);
        if (!Number.isNaN(d)) return d;
      }
    }
  } catch {}

  try {
    const d2 = Date.parse(String(createdAt || ""));
    if (!Number.isNaN(d2)) return d2;
  } catch {}
  return 0;
}

async function handleNewestStrict(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");

  const pick = (row, keys) => {
    for (const k of keys) {
      const v = row?.[k];
      if (v === null || typeof v === "undefined") continue;
      const s = String(v).trim();
      if (s) return s;
    }
    return "";
  };

  const pickNum = (row, keys) => {
    for (const k of keys) {
      const v = row?.[k];
      if (v === null || typeof v === "undefined") continue;
      if (typeof v === "number" && Number.isFinite(v)) return v;
      const s = String(v).replace(",", ".").trim();
      const n = Number(s);
      if (Number.isFinite(n)) return n;
    }
    return null;
  };

  const toItem = (row) => {
    const title = pick(row, ["title", "offer_title", "item_title", "name"]) || "(no title)";
    const url = pick(row, ["url", "item_url", "offer_url", "link", "href"]);
    const price = pickNum(row, ["price_pln", "price", "amount", "value"]);
    const cur = pick(row, ["currency", "curr", "currency_code", "currencycode"]);
    const linkId = Number(row?.link_id || row?.linkid || 0);
    const linkName = pick(row, ["link_name", "linkname"]) || "";
    return {
      ts: extractTs(row?.payload || row?.data || row || null, row?.created_at || row?.createdAt || row?.seen_at || null),
      id: Number(row?.id || 0),
      title,
      url,
      price,
      cur,
      linkId,
      linkName,
    };
  };

  try {
    const raw = String(msg.text || "").trim();
    const parts = raw.split(/\s+/);
    const linkIdArg = Number(parts[1] || 0);

    // /najnowsze ID
    if (Number.isFinite(linkIdArg) && linkIdArg > 0) {
      const lk = await dbQuery(
        `SELECT id, COALESCE(NULLIF(label,''), NULLIF(name,''), 'Monitoring') AS name
         FROM public.links
         WHERE id=$1 AND user_id=$2
         LIMIT 1`,
        [linkIdArg, Number(user.id)]
      );

      if (!lk.rowCount) {
        await tgSend(chatId, lang === "pl"
          ? `❌ Link <b>${linkIdArg}</b> nie należy do Twojego konta.`
          : `❌ Link <b>${linkIdArg}</b> is not on your account.`
        );
        return;
      }

      const linkName = String(lk.rows[0]?.name || "").trim();

      const r = await dbQuery(
        `SELECT *
         FROM public.link_items
         WHERE link_id=$1
         ORDER BY id DESC
         LIMIT 120`,
        [linkIdArg]
      );

      const rows = (r.rows || []).map((row) => {
        const x = toItem(row);
        x.linkId = linkIdArg;
        x.linkName = linkName;
        return x;
      });

      rows.sort((a, b) => (b.ts - a.ts) || (b.id - a.id));
      const top = rows.slice(0, 10);

      if (!top.length) {
        await tgSend(chatId, lang === "pl" ? "Brak zapisanych ofert dla tego linku." : "No saved items for this link.");
        return;
      }

      let out = lang === "pl" ? "🆕 Najnowsze oferty (z historii):\n\n" : "🆕 Latest offers (from history):\n\n";
      for (let i = 0; i < top.length; i++) {
        const it = top[i];
        out += `${i + 1}. ${escapeHtml(it.title)} [${linkIdArg} – ${escapeHtml(linkName)}]\n`;
        if (it.price != null) out += `💰 ${escapeHtml(String(it.price))}${it.cur ? " " + escapeHtml(String(it.cur)) : ""}\n`;
        if (it.url) out += `${escapeHtml(it.url)}\n`;
        out += "\n";
      }

      await tgSend(chatId, out.trim(), { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
      return;
    }

    // /najnowsze (GLOBAL)
    const g = await dbQuery(
      `SELECT li.*, COALESCE(NULLIF(l.label,''), NULLIF(l.name,''), 'Monitoring') AS link_name
       FROM public.link_items li
       JOIN public.links l ON l.id=li.link_id
       WHERE l.user_id=$1 AND l.active=true
       ORDER BY li.id DESC
       LIMIT 240`,
      [Number(user.id)]
    );

    const rows = (g.rows || []).map(toItem);
    rows.sort((a, b) => (b.ts - a.ts) || (b.id - a.id));
    const top = rows.slice(0, 10);

    if (!top.length) {
      await tgSend(chatId, lang === "pl" ? "Brak zapisanych ofert w historii." : "No saved items in history.");
      return;
    }

    let out = lang === "pl" ? "🆕 Najnowsze oferty (GLOBALNIE):\n\n" : "🆕 Latest offers (GLOBAL):\n\n";
    for (let i = 0; i < top.length; i++) {
      const it = top[i];
      out += `${i + 1}. ${escapeHtml(it.title)} [${it.linkId} – ${escapeHtml(it.linkName)}]\n`;
      if (it.price != null) out += `💰 ${escapeHtml(String(it.price))}${it.cur ? " " + escapeHtml(String(it.cur)) : ""}\n`;
      if (it.url) out += `${escapeHtml(it.url)}\n`;
      out += "\n";
    }
    out += (lang === "pl"
      ? "Pełna historia konkretnego linku: /najnowsze ID"
      : "Full history for a specific link: /latest ID"
    );

    await tgSend(chatId, out.trim(), { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
  } catch (e) {
    await tgSend(chatId, lang === "pl"
      ? `❌ Błąd /najnowsze: ${escapeHtml(String(e?.message || e))}`
      : `❌ /latest error: ${escapeHtml(String(e?.message || e))}`
    );
  }
}

// ---------- /najtansze (schema-aware) ----------
let __LINKITEMS_META = null;

function qi(id) {
  return `"${String(id).replace(/"/g, '""')}"`;
}

async function linkItemsMeta() {
  if (__LINKITEMS_META) return __LINKITEMS_META;

  const colsR = await dbQuery(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema='public' AND table_name='link_items'
     ORDER BY ordinal_position`
  );
  const cols = new Set((colsR.rows || []).map((r) => String(r.column_name)));

  const pick = (cands) => {
    for (const c of cands) if (cols.has(c)) return c;
    return null;
  };

  const ts = pick(["first_seen_at", "created_at", "seen_at", "inserted_at", "updated_at"]);
  const url = pick(["url", "item_url", "href", "link"]);
  const title = pick(["title", "name", "item_title"]);
  const price = pick(["price", "price_value", "amount", "price_pln"]);
  const currency = pick(["currency", "cur", "currency_code"]);

  __LINKITEMS_META = { ts, url, title, price, currency };
  return __LINKITEMS_META;
}

async function handleCheapest(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");

  const parts = String(msg.text || "").trim().split(/\s+/);
  const linkId = Number(parts[1] || 0);
  const useLink = Number.isFinite(linkId) && linkId > 0;

  const head = lang === "pl" ? "💸 Najtańsze oferty (z historii):" : "💸 Cheapest offers (from history):";
  const none = lang === "pl" ? "Brak zapisanych ofert w historii." : "No saved offers in history.";
  const bad = lang === "pl" ? "Nieprawidłowe ID linku." : "Invalid link ID.";

  if (parts.length > 1 && !useLink) {
    await tgSend(chatId, bad);
    return;
  }

  const m = await linkItemsMeta();
  if (!m.ts || !m.url || !m.price) {
    await tgSend(chatId, none);
    return;
  }

  const ts = qi(m.ts);
  const url = qi(m.url);
  const title = m.title ? qi(m.title) : null;
  const price = qi(m.price);
  const currency = m.currency ? qi(m.currency) : null;

  const where = useLink ? "AND li.link_id=$2" : "";
  const params = useLink ? [Number(user.id), linkId] : [Number(user.id)];

  const sql = `
    SELECT
      li.link_id,
      COALESCE(l.label, l.name, '') AS link_name,
      ${title ? `COALESCE(li.${title}::text,'')` : `''`} AS title,
      li.${price} AS price,
      ${currency ? `COALESCE(li.${currency}::text,'')` : `''`} AS currency,
      li.${url}::text AS url,
      li.${ts} AS ts
    FROM link_items li
    JOIN links l ON l.id=li.link_id
    WHERE l.user_id=$1
      ${where}
      AND li.${price} IS NOT NULL
    ORDER BY li.${price} ASC, li.${ts} DESC
    LIMIT 10
  `;

  const r = await dbQuery(sql, params);
  if (!r.rows || !r.rows.length) {
    await tgSend(chatId, none);
    return;
  }

  let out = head + "\n\n";
  let i = 1;
  for (const row of r.rows) {
    const t0 = String(row.title || "").trim();
    const u0 = String(row.url || "").trim();
    const p0 = row.price != null && row.price !== "" ? String(row.price) : "";
    const c0 = String(row.currency || "").trim();
    const tag = row.link_name ? ` [${row.link_id} – ${row.link_name}]` : ` [${row.link_id}]`;

    out += `${i}. ${escapeHtml(t0 || (lang === "pl" ? "(bez tytułu)" : "(no title)"))}${escapeHtml(tag)}\n`;
    out += `💰 ${escapeHtml(p0)}${c0 ? " " + escapeHtml(c0) : ""}\n`;
    out += `${escapeHtml(u0)}\n\n`;
    i++;
  }

  await tgSend(chatId, out.trim(), { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
}

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

