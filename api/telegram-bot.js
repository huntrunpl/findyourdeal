import "./env.js";

import fetch from "node-fetch";
import { randomBytes } from "node:crypto";
import pg from "pg";
import { sleep, escapeHtml, normLang } from "./src/bot/utils.js";
import { createTg } from "./src/bot/tg.js";
import { stripeGet, stripePostForm } from "./src/bot/stripe.js";
import { getPlanIdByCode, planLabel, nowPlusMinutes, createActivationToken, createPlanCheckoutSession, createAddon10CheckoutSession } from "./src/bot/plans.js";
import { dedupePanelLoginUrlText, appendUrlFromKeyboard } from "./src/bot/text-normalize.js";
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




// ---------- i18n (language list) ----------
const FYD_DEFAULT_LANG = "en";
const FYD_SUPPORTED_LANGS = [
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "cs", name: "Čeština", flag: "🇨🇿" },
  { code: "sk", name: "Slovenčina", flag: "🇸🇰" },
];

function isSupportedLang(l) {
  return FYD_SUPPORTED_LANGS.some((x) => x.code === l);
}
// ---------- i18n END ----------

// ---------- schema cache ----------
const __colCache = new Map(); // key: "table.column" -> boolean
async function hasColumn(table, column) {
  const key = `${table}.${column}`;
  if (__colCache.has(key)) return __colCache.get(key);

  try {
    const r = await dbQuery(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 AND column_name=$2
       LIMIT 1`,
      [String(table), String(column)]
    );
    const ok = !!r.rowCount;
    __colCache.set(key, ok);
    return ok;
  } catch {
    __colCache.set(key, false);
    return false;
  }
}

// ---------- language read/write (panel <-> tg) ----------
async function getUserLangByUserId(userId) {
  const uid = Number(userId);
  if (!uid) return null;

  // prefer users.lang, then users.language
  try {
    if (await hasColumn("users", "lang")) {
      const r = await dbQuery(`SELECT lang FROM public.users WHERE id=$1 LIMIT 1`, [uid]);
      const v = normLang(r?.rows?.[0]?.lang || "");
      if (v && isSupportedLang(v)) return v;
    }
  } catch {}

  try {
    if (await hasColumn("users", "language")) {
      const r = await dbQuery(`SELECT language FROM public.users WHERE id=$1 LIMIT 1`, [uid]);
      const v = normLang(r?.rows?.[0]?.language || "");
      if (v && isSupportedLang(v)) return v;
    }
  } catch {}

  return null;
}

async function maybeMigrateChatLangToUser(chatId, userId) {
  try {
    if (!(await hasColumn("chat_notifications", "language"))) return null;

    const r = await dbQuery(
      `SELECT language FROM public.chat_notifications WHERE chat_id=$1 AND user_id=$2 LIMIT 1`,
      [String(chatId), Number(userId)]
    );
    const v = normLang(r?.rows?.[0]?.language || "");
    if (!v || !isSupportedLang(v)) return null;

    // write into users.lang / users.language if empty (best-effort)
    try {
      if (await hasColumn("users", "lang")) {
        await dbQuery(
          `UPDATE public.users SET lang=$2, updated_at=NOW()
           WHERE id=$1 AND (lang IS NULL OR lang='') AND (lang IS NULL OR lang='')`,
          [Number(userId), v]
        );
      }
    } catch {}
    try {
      if (await hasColumn("users", "language")) {
        await dbQuery(
          `UPDATE public.users SET language=$2, updated_at=NOW()
           WHERE id=$1 AND (language IS NULL OR language='') AND (language IS NULL OR language='')`,
          [Number(userId), v]
        );
      }
    } catch {}

    return v;
  } catch {
    return null;
  }
}

async function OLD_getLangFromUsers(chatId, user, telegramLangCode = "") {
  const uid = Number(user?.id || 0);

  // 1) DB is source of truth
  if (uid) {
    const dbLang = await getUserLangByUserId(uid);
    if (dbLang) return dbLang;

    // 2) migrate legacy chat_notifications.language -> users
    const legacy = await maybeMigrateChatLangToUser(chatId, uid);
    if (legacy) return legacy;
  }

  // 3) fallback: telegram language_code and persist if possible
  const guess0 = normLang(telegramLangCode || user?.language_code || user?.language || "");
  const guess = isSupportedLang(guess0) ? guess0 : FYD_DEFAULT_LANG;

  if (uid) {
    try {
      if (await hasColumn("users", "lang")) {
        await dbQuery(
          `UPDATE public.users SET lang=$2, updated_at=NOW()
           WHERE id=$1 AND (lang IS NULL OR lang='') AND (lang IS NULL OR lang='')`,
          [uid, guess]
        );
      }
    } catch {}
    try {
      if (await hasColumn("users", "language")) {
        await dbQuery(
          `UPDATE public.users SET language=$2, updated_at=NOW()
           WHERE id=$1 AND (language IS NULL OR language='') AND (language IS NULL OR language='')`,
          [uid, guess]
        );
      }
    } catch {}
  }

  return guess;
}

async function setLang(chatId, user, langCode) {
  const uid = Number(user?.id || 0);
  const lang = isSupportedLang(normLang(langCode)) ? normLang(langCode) : FYD_DEFAULT_LANG;

  if (uid) {
    try {
      if (await hasColumn("users", "lang")) {
        await dbQuery(`UPDATE public.users SET lang=$2, updated_at=NOW() WHERE id=$1`, [uid, lang]);
      }
    } catch {}
    try {
      if (await hasColumn("users", "language")) {
        await dbQuery(`UPDATE public.users SET language=$2, updated_at=NOW() WHERE id=$1`, [uid, lang]);
      }
    } catch {}
  }

  // keep per-chat language in sync (if column exists)
  try {
    await ensureChatNotificationsRowDb(String(chatId), uid);
    if (await hasColumn("chat_notifications", "language")) {
      await dbQuery(
        `UPDATE public.chat_notifications SET language=$3, updated_at=NOW()
         WHERE chat_id=$1 AND user_id=$2`,
        [String(chatId), uid, lang]
      );
    }
  } catch {}

  return lang;
}

// ---------- telegram button i18n (disable/single/batch) ----------
const __btnI18n = {
  en: { disable: "Disable this link", single: "Single", batch: "Batch" },
  pl: { disable: "Wyłącz ten link", single: "Pojedynczo", batch: "Zbiorczo" },
  de: { disable: "Diesen Link deaktivieren", single: "Einzeln", batch: "Gebündelt" },
  fr: { disable: "Désactiver ce lien", single: "Individuel", batch: "Groupé" },
  es: { disable: "Desactivar este enlace", single: "Individual", batch: "Agrupado" },
  it: { disable: "Disattiva questo link", single: "Singolo", batch: "Raggruppato" },
  pt: { disable: "Desativar este link", single: "Individual", batch: "Agrupado" },
  ro: { disable: "Dezactivează acest link", single: "Individual", batch: "Grupat" },
  nl: { disable: "Deze link uitschakelen", single: "Enkel", batch: "Gebundeld" },
  cs: { disable: "Vypnout tento odkaz", single: "Jednotlivě", batch: "Hromadně" },
  sk: { disable: "Vypnúť tento odkaz", single: "Jednotlivo", batch: "Hromadne" },
};

function stripPrefixIcons(t) {
  return String(t || "").replace(/^[^\p{L}\p{N}]+/gu, "").trim();
}

function isDisableText(t) {
  const s = String(t || "").toLowerCase();
  return s.includes("wyłącz") || s.includes("wylacz") || s.includes("disable") || s.includes("vypnout") || s.includes("dezactiv");
}
function isSingleText(t) {
  const s = String(t || "").toLowerCase();
  return s.includes("pojedyncz") || s.includes("single") || s.includes("jednotl") || s.includes("individ");
}
function isBatchText(t) {
  const s = String(t || "").toLowerCase();
  return s.includes("zbiorcz") || s.includes("batch") || s.includes("hromad") || s.includes("group") || s.includes("agrup");
}

async function fixInlineButtonsI18n(payload) {
  try {
    if (!payload || typeof payload !== "object") return payload;
    const rm = payload.reply_markup;
    if (!rm) return payload;

    let obj = rm;
    let wasString = false;

    if (typeof rm === "string") {
      try {
        obj = JSON.parse(rm);
        wasString = true;
      } catch {
        return payload;
      }
    }
    if (!obj || !Array.isArray(obj.inline_keyboard)) return payload;

    // chat_id in private chats == telegram_user_id
    const tgUserId = payload.chat_id;
    let lang = "en";
    try {
      const r = await dbQuery(
        `SELECT COALESCE(NULLIF(lang,''), NULLIF(language,'')) AS l
         FROM public.users
         WHERE telegram_user_id=$1
         LIMIT 1`,
        [Number(tgUserId)]
      );
      const v = normLang(r?.rows?.[0]?.l || "");
      if (v && isSupportedLang(v)) lang = v;
    } catch {}

    const pack = __btnI18n[lang] || __btnI18n.en;

    for (const row of obj.inline_keyboard) {
      if (!Array.isArray(row)) continue;
      for (const btn of row) {
        if (!btn || typeof btn !== "object") continue;
        if (!btn.text) continue;
        const base = stripPrefixIcons(btn.text);

        if (isDisableText(base)) btn.text = pack.disable;
        else if (isSingleText(base)) btn.text = pack.single;
        else if (isBatchText(base)) btn.text = pack.batch;
      }
    }

    payload.reply_markup = wasString ? JSON.stringify(obj) : obj;
    return payload;
  } catch {
    return payload;
  }
}

const { messageWantsPreviewOn, tgCall, tgSend, tgAnswerCb } = createTg({
  TG,
  fetchFn: fetch,
  dbQuery,
  fixInlineButtonsI18n,
  dedupePanelLoginUrlText,
  appendUrlFromKeyboard,
});

// ---------- telegram call ----------




// ---------- /help /lang ----------
async function handleLang(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  const current = langLabel(lang);
  await tgSend(
    chatId,
    `${t(lang, "choose_language")}\n${t(lang, "language_current", { language: escapeHtml(current) })}`,
    { reply_markup: buildLanguageKeyboard() }
  );
}

async function handleHelp(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  await tgSend(chatId, t(lang, "help_text"));
}

async function handleDefault(msg, user, argText) {
  const chatId = String(msg.chat.id);
  const fromLang = msg?.from?.language_code || "";
  const lang = await fydResolveLang(chatId, user, fromLang);

  const idStr = String(argText || "").trim().split(/\s+/)[0] || "";
  const linkId = Number(idStr);
  if (!linkId || !Number.isFinite(linkId)) {
    if (lang === "pl") {
      await tgSend(chatId, "Użycie: /domyślnie ID (np. /domyślnie 64)");
    } else {
      await tgSend(chatId, "Usage: /domyslnie ID (e.g. /domyslnie 64)");
    }
    return;
  }

  // sprawdzenie, czy link należy do użytkownika
  try {
    const chk = await dbQuery(
      "SELECT id FROM links WHERE id=$1 AND user_id=$2 LIMIT 1",
      [linkId, Number(user.id)]
    );
    if (!chk.rowCount) {
      if (lang === "pl") {
        await tgSend(chatId, `❌ Link <b>${linkId}</b> nie należy do Twojego konta.`);
      } else {
        await tgSend(chatId, `❌ Link <b>${linkId}</b> is not on your account.`);
      }
      return;
    }
  } catch (e) {
    console.error("[tg-bot] /domyslnie check error:", e);
    if (lang === "pl") {
      await tgSend(chatId, "❌ Błąd podczas sprawdzania linku.");
    } else {
      await tgSend(chatId, "❌ Error while checking link.");
    }
    return;
  }

  // usunięcie override z link_notification_modes
  try {
    await clearLinkNotificationMode(user.id, chatId, linkId).catch(() => {});
  } catch (e) {
    console.error("[tg-bot] /domyslnie clear error:", e);
    if (lang === "pl") {
      await tgSend(chatId, "❌ Nie udało się usunąć nadpisanego trybu dla linku.");
    } else {
      await tgSend(chatId, "❌ Failed to clear per-link mode override.");
    }
    return;
  }

  // odczyt domyślnego trybu czatu (single / batch)
  let chatModeLabel = "";
  try {
    const cn = await dbQuery(
      "SELECT mode FROM chat_notifications WHERE chat_id=$1 AND user_id=$2 LIMIT 1",
      [chatId, Number(user.id)]
    ).catch(() => ({ rows: [] }));
    const chatMode = String(cn.rows?.[0]?.mode || "single").toLowerCase();
    chatModeLabel =
      chatMode === "batch"
        ? (lang === "pl" ? "zbiorczo" : "batch")
        : (lang === "pl" ? "pojedynczo" : "single");
  } catch (e) {
    console.error("[tg-bot] /domyslnie chat mode read error:", e);
  }

  if (!chatModeLabel) {
    if (lang === "pl") chatModeLabel = "pojedynczo";
    else chatModeLabel = "single";
  }

  if (lang === "pl") {
    await tgSend(
      chatId,
      `✅ Link <b>${linkId}</b> przywrócony do ustawień domyślnych czatu (tryb: <b>${chatModeLabel}</b>).`
    );
  } else {
    await tgSend(
      chatId,
      `✅ Link <b>${linkId}</b> has been reset to chat default mode (<b>${chatModeLabel}</b>).`
    );
  }
}


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
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");

  try {
    const r = await dbQuery(
      `SELECT id, COALESCE(NULLIF(label,''), NULLIF(name,''), 'Monitoring') AS name, url
       FROM public.links
       WHERE user_id=$1 AND active=true
       ORDER BY id ASC`,
      [Number(user.id)]
    );

    const rows = r.rows || [];
    if (!rows.length) {
      await tgSend(chatId, lang === "pl" ? "Brak aktywnych linków. Dodaj: /dodaj <URL>" : "No active links. Add: /add <URL>");
      return;
    }

    let out = lang === "pl" ? "📋 Aktywne monitorowane linki:\n\n" : "📋 Active monitored links:\n\n";

    for (const row of rows) {
      out += `ID ${Number(row.id)} — ${escapeHtml(String(row.name || "Monitoring"))}\n`;
      out += `${escapeHtml(String(row.url || ""))}\n\n`;
    }

    out += (lang === "pl"
      ? "Usuń: /usun ID\nnp. /usun 18\n\nHistoria konkretnego linku: /najnowsze ID\n"
      : "Remove: /remove ID\nex. /remove 18\n\nHistory for a specific link: /latest ID\n"
    );

    for (const row of rows) {
      out += `/najnowsze ${Number(row.id)} — ${escapeHtml(String(row.name || "Monitoring"))}\n`;
    }

    await tgSend(chatId, out.trim(), { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
  } catch (e) {
    await tgSend(chatId, lang === "pl"
      ? `❌ Błąd /lista: ${escapeHtml(e?.message || e)}`
      : `❌ /list error: ${escapeHtml(e?.message || e)}`
    );
  }
}

// ---------- /add ----------
async function handleAdd(msg, user, argText) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");

  if (!argText) {
    await tgSend(chatId, lang === "pl"
      ? "Użycie:\n<code>/dodaj &lt;url&gt; [nazwa]</code>\n\nPrzykład:\n<code>/dodaj https://m.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>"
      : "Usage:\n<code>/add &lt;url&gt; [name]</code>\n\nExample:\n<code>/add https://m.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>"
    );
    return;
  }

  const parts = argText.split(/\s+/);
  const url = parts[0];
  const name = parts.slice(1).join(" ") || null;

  if (!url || !/^https?:\/\//i.test(url)) {
    await tgSend(chatId, lang === "pl"
      ? "Pierwszy parametr musi być URL, np. <code>/dodaj https://m.olx.pl/oferty/?q=iphone14</code>"
      : "First parameter must be a URL, e.g. <code>/add https://m.olx.pl/oferty/?q=iphone14</code>"
    );
    return;
  }

  const ent = await getUserEntitlementsByTelegramId(user.telegram_user_id).catch(() => null);
  const limit = Number(ent?.links_limit_total ?? 0);
  if (!ent || !(limit > 0)) {
    await tgSend(chatId, lang === "pl"
      ? "❌ Nie masz aktywnego planu. Użyj /plany żeby kupić plan."
      : "❌ You don't have an active plan. Use /plans to buy a plan."
    );
    return;
  }

  const totalLinks = await countActiveLinksForUserId(user.id).catch(() => 0);
  if (totalLinks >= limit) {
    await tgSend(chatId, lang === "pl"
      ? `❌ Osiągnięto limit linków: <b>${totalLinks}/${limit}</b>`
      : `❌ Link limit reached: <b>${totalLinks}/${limit}</b>`
    );
    return;
  }

  const row = await insertLinkForUserId(user.id, name, url);
  await tgSend(
    chatId,
    (lang === "pl"
      ? `✅ Dodałem nowy link:\n\nID <b>${row.id}</b> — ${escapeHtml(row.name || "(bez nazwy)")}\n<code>${escapeHtml(row.url)}</code>\n\nLinki (łącznie): ${totalLinks + 1}/${limit}\n\nSprawdź: <code>/lista</code>`
      : `✅ Added a new link:\n\nID <b>${row.id}</b> — ${escapeHtml(row.name || "(no name)")}\n<code>${escapeHtml(row.url)}</code>\n\nLinks total: ${totalLinks + 1}/${limit}\n\nCheck: <code>/list</code>`
    ),
    { disable_web_page_preview: true, link_preview_options: { is_disabled: true } }
  );
}

// ---------- /remove (hard delete) ----------
async function handleRemove(msg, user, argText) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  const id = parseInt(argText, 10);

  if (!id) {
    await tgSend(chatId, lang === "pl"
      ? "Podaj ID linku, np.:\n<code>/usun 18</code>"
      : "Provide link ID, e.g.:\n<code>/remove 18</code>"
    );
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const r0 = await client.query(
      `SELECT id,
              COALESCE(NULLIF(label,''), NULLIF(name,''), '') AS name,
              COALESCE(url,'') AS url
       FROM links
       WHERE id=$1 AND user_id=$2
       LIMIT 1`,
      [id, Number(user.id)]
    );

    if (!r0.rowCount) {
      await client.query("ROLLBACK");
      await tgSend(chatId, lang === "pl"
        ? `Nie znalazłem linku <b>${id}</b> na Twoim koncie. Użyj /lista.`
        : `I can't find link <b>${id}</b> on your account. Use /list.`
      );
      return;
    }

    const row = r0.rows[0];

    // dependencies best-effort
    try { await client.query("DELETE FROM link_items WHERE link_id=$1", [id]); } catch {}
    try { await client.query("DELETE FROM link_notification_modes WHERE link_id=$1 AND user_id=$2", [id, Number(user.id)]); } catch {}

    const r1 = await client.query(
      "DELETE FROM links WHERE id=$1 AND user_id=$2 RETURNING id",
      [id, Number(user.id)]
    );

    if (!r1.rowCount) {
      await client.query("ROLLBACK");
      await tgSend(chatId, lang === "pl"
        ? `Nie znalazłem linku <b>${id}</b> na Twoim koncie. Użyj /lista.`
        : `I can't find link <b>${id}</b> on your account. Use /list.`
      );
      return;
    }

    await client.query("COMMIT");

    await tgSend(chatId, lang === "pl"
      ? `🗑️ Usunąłem link (zwolniono miejsce):\n\nID <b>${row.id}</b> — ${escapeHtml(row.name || "(bez nazwy)")}\n<code>${escapeHtml(row.url || "")}</code>`
      : `🗑️ Removed link (slot freed):\n\nID <b>${row.id}</b> — ${escapeHtml(row.name || "(no name)")}\n<code>${escapeHtml(row.url || "")}</code>`
    );
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    await tgSend(chatId, lang === "pl"
      ? `❌ Błąd usuwania linku: ${escapeHtml(String(e?.message || e))}`
      : `❌ Error removing link: ${escapeHtml(String(e?.message || e))}`
    );
  } finally {
    try { client.release(); } catch {}
  }
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
async function handlePanel(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  const isPl = lang === "pl";

  const userId = Number(user?.id || 0);
  if (!userId) {
    await tgSend(chatId, isPl ? "Błąd: nie mogę ustalić user_id do panelu." : "Error: cannot resolve user_id for panel.");
    return;
  }

  const tok = randomBytes(24).toString("hex");
  await dbQuery(
    "INSERT INTO panel_login_tokens (token, user_id, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL '10 minutes')",
    [tok, userId]
  );

  const base = process.env.PANEL_BASE_URL || "https://panel.findyourdeal.app";
  const url = `${base}/api/auth/login?token=${tok}`;

  // IMPORTANT: url in separate line (dedupe + no weird appends)
  await tgSend(chatId, `Panel:\n${escapeHtml(url)}\n${isPl ? "Token ważny 10 minut." : "Token valid for 10 minutes."}`, { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
}

// ---------- /status (full) ----------
function formatWarsawDate(dt) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t) => (parts.find((p) => p.type === t)?.value || "");
  const dd = get("day"), mm = get("month"), yyyy = get("year"), hh = get("hour"), mi = get("minute");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

async function handleStatus(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  const L = normLang(lang);

  const S = {
    en: {
      title: "ℹ️ Bot status",
      plan: (p, until) => `Plan: ${p}${until ? ` (until ${until})` : ""}`,
      active: (a, lim) => `Active searches (enabled): ${a}/${lim}`,
      total: (t0, lim) => `Total searches (in DB): ${t0}/${lim}`,
      addons: (n) => `Add-ons (+10): ${n}`,
      history: (n) => `Total history limit: ${n}`,
      daily: (n) => `Daily notifications limit: ${n}`,
      notifOn: "✅ Notifications ENABLED",
      notifOff: "⛔ Notifications DISABLED",
      mode: (m) => `Default mode in this chat: ${m}`,
      today: (c, lim) => `Today's notifications: ${c}/${lim}`,
      change: "Change: /on /off /single /batch",
      quietOff: "Quiet hours: disabled",
      quietOn: (f, t) => `Quiet hours: ENABLED, hours ${f}:00–${t}:00`,
      linksHdr: "All searches:",
      perLink: "Per-link mode: /single_ID /batch_ID /off_ID /on_ID (e.g. /batch_18)",
      mSingle: "single",
      mBatch: "batch",
    },
    pl: {
      title: "ℹ️ Status bota",
      plan: (p, until) => `Plan: ${p}${until ? ` (do ${until})` : ""}`,
      active: (a, lim) => `Aktywne wyszukiwania (włączone): ${a}/${lim}`,
      total: (t0, lim) => `Łącznie wyszukiwań (w bazie): ${t0}/${lim}`,
      addons: (n) => `Dodatki (addon +10): ${n}`,
      history: (n) => `Łączny limit ofert (zgodnie z planem): ${n}`,
      daily: (n) => `Limit dziennych powiadomień: ${n}`,
      notifOn: "✅ Powiadomienia WŁĄCZONE",
      notifOff: "⛔ Powiadomienia WYŁĄCZONE",
      mode: (m) => `Tryb domyślny na tym czacie: ${m}`,
      today: (c, lim) => `Dzisiejsze powiadomienia: ${c}/${lim}`,
      change: "Zmiana: /on /off /pojedyncze /zbiorcze",
      quietOff: "Cisza nocna: wyłączona",
      quietOn: (f, t) => `Cisza nocna: WŁĄCZONA, godziny ${f}:00–${t}:00`,
      linksHdr: "Wszystkie wyszukiwania:",
      perLink: "Tryb per link: /pojedyncze_ID /zbiorcze_ID /off_ID /on_ID (np. /zbiorcze_18)",
      mSingle: "pojedynczo",
      mBatch: "zbiorczo",
    },
  };
  const T = S[L] || S.en;

  const ent = await getUserEntitlementsByTelegramId(user.telegram_user_id).catch(() => null);
  const planCode = String(ent?.plan_code || "").toLowerCase();
  const planName = planLabel(planCode || "plan");
  const untilStr = ent?.expires_at ? formatWarsawDate(ent.expires_at) : "";

  let linksLimit = Number(ent?.links_limit_total ?? 0);
  if (!Number.isFinite(linksLimit) || linksLimit <= 0) linksLimit = "?";

  // addon qty (best effort)
  let addons = 0;
  try {
    const r = await dbQuery(
      `SELECT COALESCE(SUM(COALESCE(addon_qty,0)),0)::int AS n
       FROM subscriptions
       WHERE user_id=$1 AND status='active'`,
      [Number(user.id)]
    );
    addons = Number(r.rows?.[0]?.n ?? 0);
    if (!Number.isFinite(addons) || addons < 0) addons = 0;
  } catch {}

  const baseHistory =
    planCode === "platinum" ? 800 :
    planCode === "growth" || planCode === "pro" ? 700 :
    planCode === "starter" || planCode === "basic" ? 600 :
    planCode === "trial" ? 200 : 0;

  const baseDaily =
    planCode === "platinum" ? 200 :
    planCode === "growth" || planCode === "pro" ? 400 :
    planCode === "starter" || planCode === "basic" ? 200 :
    planCode === "trial" ? 200 : 0;

  let historyLimit = Number(ent?.history_total_limit ?? ent?.history_limit_total ?? ent?.history_limit ?? 0);
  if (!Number.isFinite(historyLimit) || historyLimit <= 0) historyLimit = baseHistory + addons * 100;

  let dailyLimit = Number(ent?.daily_notifications_limit ?? ent?.daily_limit ?? ent?.daily_notifications ?? 0);
  if (!Number.isFinite(dailyLimit) || dailyLimit <= 0) dailyLimit = baseDaily + addons * 100;

  // counts
  let enabled = 0, total = 0;
  try {
    const r1 = await dbQuery(`SELECT COUNT(*)::int AS n FROM links WHERE user_id=$1 AND active=TRUE`, [Number(user.id)]);
    enabled = Number(r1.rows?.[0]?.n ?? 0) || 0;
    const r2 = await dbQuery(`SELECT COUNT(*)::int AS n FROM links WHERE user_id=$1`, [Number(user.id)]);
    total = Number(r2.rows?.[0]?.n ?? 0) || 0;
  } catch {}

  // chat notifications (on/off + domyślny tryb czatu)
  let notifEnabled = true;
  let chatMode = "single";

  try {
    const r = await dbQuery(
      `SELECT enabled, mode
         FROM chat_notifications
        WHERE chat_id=$1 AND user_id=$2
        LIMIT 1`,
      [String(chatId), Number(user.id)]
    );
    const row = r.rows?.[0];
    if (row) {
      notifEnabled = row.enabled !== false;
      chatMode = String(row.mode || "single").toLowerCase() === "batch" ? "batch" : "single";
    }
  } catch {}

  // FYD: dzisiejsze powiadomienia — czytamy licznik z chat_notifications
  // (sumarycznie po wszystkich czatach użytkownika, tylko dla bieżącego dnia)
  let dailyCount = 0;
  try {
    const rDaily = await dbQuery(
      `SELECT COALESCE(SUM(
                CASE
                  WHEN daily_count_date IS DISTINCT FROM CURRENT_DATE THEN 0
                  ELSE COALESCE(daily_count,0)
                END
              ),0)::int AS c
         FROM public.chat_notifications
        WHERE user_id=$1`,
      [Number(user.id)]
    );
    const c = Number(rDaily?.rows?.[0]?.c ?? 0);
    if (Number.isFinite(c) && c >= 0) dailyCount = c;
  } catch {}

  // clamp i higiena: nie pokazujemy więcej niż limit
  if (!Number.isFinite(dailyCount) || dailyCount < 0) dailyCount = 0;
  if (dailyLimit > 0 && dailyCount > dailyLimit) {
    dailyCount = dailyLimit;
    try {
      // best-effort: przy okazji /status przycinamy też licznik w bazie
      await dbQuery(
        `UPDATE public.chat_notifications
            SET daily_count = LEAST(
                  CASE
                    WHEN daily_count_date IS DISTINCT FROM CURRENT_DATE THEN 0
                    ELSE COALESCE(daily_count,0)
                  END,
                  $2
                ),
                daily_count_date = CURRENT_DATE,
                updated_at = NOW()
          WHERE user_id=$1`,
        [Number(user.id), dailyLimit]
      );
    } catch {}
  }

  const modeLabel = (m) => (m === "batch" ? T.mBatch : T.mSingle);

  // quiet hours
  let quietLine = T.quietOff;
  try {
    const qh = await getQuietHours(String(chatId));
    if (qh && qh.quiet_enabled) quietLine = T.quietOn(qh.quiet_from, qh.quiet_to);
  } catch {}

  // list enabled links + per-link mode
  let linksText = "";
  try {
    const r = await dbQuery(
      `SELECT id,
              COALESCE(NULLIF(label,''), NULLIF(name,''), 'Monitoring') AS name,
              source,
              active
         FROM links
        WHERE user_id=$1 AND active=TRUE
        ORDER BY id ASC`,
      [Number(user.id)]
    );

    for (const row of (r.rows || [])) {
      let per = null;
      try {
        const m = await dbQuery(
          `SELECT mode
             FROM link_notification_modes
            WHERE user_id=$1 AND chat_id=$2 AND link_id=$3
            ORDER BY updated_at DESC
            LIMIT 1`,
          [Number(user.id), String(chatId), Number(row.id)]
        );
        per = m.rows?.[0]?.mode || null;
      } catch {}

      const eff = per ? String(per).toLowerCase() : chatMode;
      const monOn = row.active === true || String(row.active) === "t" || String(row.active).toLowerCase() === "true";
      const monIcon = monOn ? "✅" : "⛔";
      const notifIcon = eff === "off" ? "🔕" : "🔔";
      const src = String(row.source || "").toUpperCase() || "LINK";
      const name = escapeHtml(row.name || "(no name)");
      const mLabel = eff === "off" ? "OFF" : modeLabel(eff === "batch" ? "batch" : "single");
      linksText += `• ${monIcon}${notifIcon} ${row.id} – ${name} (${src}) – ${L === "pl" ? "tryb" : "mode"}: ${escapeHtml(mLabel)}\n`;
    }
  } catch {}

  const out =
    `${T.title}\n\n` +
    `${T.plan(escapeHtml(planName), escapeHtml(untilStr))}\n\n` +
    `${T.active(enabled, linksLimit)}\n` +
    `${T.total(total, linksLimit)}\n\n` +
    `${T.addons(addons)}\n` +
    `${T.history(historyLimit)}\n` +
    `${T.daily(dailyLimit)}\n\n` +
    `${notifEnabled ? T.notifOn : T.notifOff}\n` +
    `${T.mode(modeLabel(chatMode))}\n` +
    `${T.today(dailyCount, dailyLimit)}\n` +
    `${T.change}\n\n` +
    `${quietLine}\n\n` +
    `${T.linksHdr}\n` +
    (linksText || (L === "pl" ? "(brak)\n" : "(none)\n")) +
    `\n${T.perLink}`;

  await tgSend(chatId, out.trim(), { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
}

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
async function handleCallback(update) {
  const cq = update.callback_query;
  if (!cq) return;

  const data = cq.data || "";
  const chatId = cq.message?.chat?.id;
  const fromId = cq.from?.id ? String(cq.from.id) : null;

  if (!chatId || !fromId) {
    await tgAnswerCb(cq.id, "Missing chat/user data.");
    return;
  }

  const u = await getUserWithPlanByTelegramId(fromId);
  if (!u?.id) {
    await tgAnswerCb(cq.id, "Use /start.", true);
    return;
  }

  await ensureChatNotificationsRowDb(String(chatId), u.id);

  const mLang = data.match(/^lang:([a-z]{2})$/i);
  if (mLang) {
    const newLang = isSupportedLang(normLang(mLang[1])) ? normLang(mLang[1]) : FYD_DEFAULT_LANG;
    await setLang(String(chatId), u, newLang);
    await tgAnswerCb(cq.id, "OK");
    await tgSend(String(chatId), t(newLang, "language_set", { language: escapeHtml(langLabel(newLang)) }));
    return;
  }

  const m = data.match(/^lnmode:(\d+):(off|single|batch)$/i);
  if (m) {
    const linkId = Number(m[1]);
    const mode = String(m[2]).toLowerCase();
    const res = await setPerLinkMode(String(chatId), u.id, linkId, mode);
    if (!res.ok) { await tgAnswerCb(cq.id, "Can't set mode.", true); return; }
    const lang = await fydResolveLang(String(chatId), u, cq?.from?.language_code || "");
    const pretty =
      res.mode === "batch" ? (lang === "pl" ? "zbiorczo" : "batch") :
      res.mode === "off" ? "OFF" :
      (lang === "pl" ? "pojedynczo" : "single");
    await tgAnswerCb(cq.id, lang === "pl" ? `Ustawiono: ${pretty}` : `Set: ${pretty}`);
    return;
  }

  await tgAnswerCb(cq.id, "Unknown action.");
}

// ---------- long polling ----------
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

// ---------- command normalization ----------
function normalizeCommand(cmdRaw) {
  const c0 = String(cmdRaw || "").trim().toLowerCase().split("@")[0];
  const c = c0.normalize("NFD").replace(/\p{Diacritic}/gu, "");

  const map = new Map([
    ["/help", "/help"], ["/pomoc", "/help"],
    ["/start", "/start"],
    ["/plany", "/plans"], ["/kup", "/plans"], ["/plans", "/plans"],
    ["/lista", "/list"], ["/list", "/list"],
    ["/dodaj", "/add"], ["/add", "/add"],
    ["/usun", "/remove"], ["/remove", "/remove"],
    ["/status", "/status"], ["/config", "/status"],
    ["/cisza", "/quiet"], ["/quiet", "/quiet"],
    ["/cisza_off", "/quiet_off"], ["/quiet_off", "/quiet_off"],
    ["/najnowsze", "/latest"], ["/latest", "/latest"],
    ["/najtansze", "/cheapest"], ["/cheapest", "/cheapest"],
    ["/pojedyncze", "/single"], ["/pojedynczo", "/single"], ["/single", "/single"],
    ["/zbiorcze", "/batch"], ["/batch", "/batch"], ["/domyslnie", "/default"],
    ["/on", "/on"], ["/off", "/off"],
    ["/panel", "/panel"],
    ["/lang", "/lang"],
    ["/starter", "/starter"], ["/growth", "/growth"], ["/platinum", "/platinum"],
    ["/addon10", "/addon10"],
    ["/cena", "/cena"], ["/rozmiar", "/rozmiar"], ["/marka", "/marka"],
    ["/filtry", "/filtry"], ["/resetfiltry", "/resetfiltry"],
    ["/usun_uzytkownika", "/usun_uzytkownika"],
    ["/daj_admina", "/daj_admina"],
    ["/nazwa", "/nazwa"],
    ["/technik", "/technik"],
  ]);

  return map.get(c) || c;
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

// ---------- update handler ----------
async function handleUpdate(update) {
  if (update.callback_query) {
    await handleCallback(update);
    return;
  }

  const msg = update.message || update.edited_message;
  if (!msg || !msg.text) return;

  const chatType = msg.chat?.type || "";
  if (chatType && chatType !== "private") {
    await tgSend(String(msg.chat.id), "❌ Private chat only.");
    return;
  }

  if (!__dbReady) {
    await initDbRetryLoop();
  }

  const chatId = String(msg.chat.id);
  const from = msg.from || {};
  const tgId = from.id ? String(from.id) : null;
  if (!tgId) return;

  // allow spaced variants: /on 18 etc => /on_18
  let text = String(msg.text ?? "").trim();
  const mSpace = text.match(/^\/(on|off|single|batch|pojedyncze|pojedynczo|zbiorcze)(?:@\w+)?\s+(\d+)\b/i);
  if (mSpace) {
    const cmd = mSpace[1].toLowerCase() === "pojedynczo" ? "pojedyncze" : mSpace[1].toLowerCase();
    text = `/${cmd}_${mSpace[2]}`;
  }

  await ensureUser(from.id, from.username || null, from.first_name || null, from.last_name || null, from.language_code || null);

  const user = await getUserWithPlanByTelegramId(tgId);
  if (!user?.id) {
    await tgSend(chatId, "Use /start.");
    return;
  }

  await ensureChatNotificationsRowDb(chatId, user.id);

  const [commandRaw, ...rest] = text.split(/\s+/);
  const __cmd0 = String(commandRaw || "").split("@")[0];

  // FYD: baseline reset hook DISABLED.
  // Teraz /on i /on_ID opierają się na notify_from w chat_notifications/links
  // oraz logice w workerze. Nie ruszamy tutaj historii ani baseline\'ów.
  const command = normalizeCommand(__cmd0);
  const argText = rest.join(" ").trim();

  // per-link commands: /single_18 /batch_18 /off_18 /on_18 (+ pl: /pojedyncze_18 /zbiorcze_18)
  const perLink = command.match(/^\/(pojedyncze|zbiorcze|single|batch|off|on)_(\d+)$/i);
  if (perLink) {
    const kind = perLink[1].toLowerCase();
    const linkId = Number(perLink[2]);
    const lang = await fydResolveLang(chatId, user, from.language_code || "");

    if (kind === "on") {
      const chk = await dbQuery(`SELECT id FROM links WHERE id=$1 AND user_id=$2 LIMIT 1`, [linkId, Number(user.id)]);
      if (!chk.rowCount) {
        await tgSend(chatId, lang === "pl"
          ? `❌ Link <b>${linkId}</b> nie należy do Twojego konta.`
          : `❌ Link <b>${linkId}</b> is not on your account.`
        );
        return;
      }

      await clearLinkNotificationMode(user.id, chatId, linkId).catch(() => {});

      const cn = await dbQuery(`SELECT mode FROM chat_notifications WHERE chat_id=$1 AND user_id=$2 LIMIT 1`, [chatId, Number(user.id)]).catch(() => ({ rows: [] }));
      const chatMode = String(cn.rows?.[0]?.mode || "single").toLowerCase() === "batch"
        ? (lang === "pl" ? "zbiorczo" : "batch")
        : (lang === "pl" ? "pojedynczo" : "single");

      await tgSend(chatId, lang === "pl"
        ? `✅ Link <b>${linkId}</b> WŁĄCZONY (dziedziczy tryb czatu: <b>${chatMode}</b>).`
        : `✅ Link <b>${linkId}</b> ENABLED (inherits chat mode: <b>${chatMode}</b>).`
      );
      return;
    }

    const mode = (kind === "zbiorcze" || kind === "batch") ? "batch" : kind === "off" ? "off" : "single";
    const res = await setPerLinkMode(chatId, user.id, linkId, mode);
    if (!res.ok) {
      await tgSend(chatId, lang === "pl" ? "❌ Link nie należy do Twojego konta." : "❌ Link is not on your account.");
      return;
    }
    const pretty =
      res.mode === "batch" ? (lang === "pl" ? "zbiorczo" : "batch") :
      res.mode === "off" ? "OFF" :
      (lang === "pl" ? "pojedynczo" : "single");
    await tgSend(chatId, lang === "pl"
      ? `✅ Link <b>${linkId}</b> ustawiony: <b>${pretty}</b>`
      : `✅ Link <b>${linkId}</b> set to: <b>${pretty}</b>`
    );
    return;
  }

  // standard commands
  if (command === "/start") return handleHelp(msg, user);
  if (command === "/help") return handleHelp(msg, user);
  if (command === "/lang") return handleLang(msg, user);
  if (command === "/status") return handleStatus(msg, user);

  if (command === "/plans") return handlePlans(msg, user);
  if (command === "/starter") return handleBuyPlan(msg, user, "starter");
  if (command === "/growth") return handleBuyPlan(msg, user, "growth");
  if (command === "/platinum") return handleBuyPlan(msg, user, "platinum");
  if (command === "/addon10") return handleAddon10(msg, user);

  if (command === "/cena") return handleCena(msg, user);
  if (command === "/rozmiar") return handleRozmiar(msg, user);
  if (command === "/marka") return handleMarka(msg, user);
  if (command === "/filtry") return handleFiltry(msg, user);
  if (command === "/resetfiltry") return handleResetFiltry(msg, user);

  if (command === "/latest") return handleNewestStrict(msg, user);
  if (command === "/cheapest") return handleCheapest(msg, user);

  if (command === "/panel") return handlePanel(msg, user);
  if (command === "/list") return handleList(msg, user);
  if (command === "/remove") return handleRemove(msg, user, argText);
  if (command === "/add") return handleAdd(msg, user, argText);

  if (command === "/on") return globalOnAndArm(msg, user);
  if (command === "/off") return globalOff(msg, user);
  if (command === "/single") return handleModeSingle(msg, user);
  if (command === "/batch") return handleModeBatch(msg, user);
  if (command === "/default") return handleDefault(msg, user, argText);

  if (command === "/quiet_off") return handleQuietOff(msg, user);
  if (command === "/quiet") return handleQuiet(msg, user);

  if (command === "/usun_uzytkownika") return handleUsunUzytkownika(msg, user);
  if (command === "/daj_admina") return handleDajAdmina(msg, user);
  if (command === "/nazwa") return handleNazwa(msg, user);
  if (command === "/technik") return handleTechnik(msg, user, argText);

  const lang = await fydResolveLang(chatId, user, from.language_code || "");
  await tgSend(chatId, t(lang, "unknown_command") || (lang === "pl" ? "❓ Nieznana komenda. Użyj /help." : "❓ Unknown command. Use /help."));
}

// ---------- main ----------
async function main() {
  console.log("telegram-bot.js start");
  await initDbRetryLoop();

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
      await sleep(1500);
    }
  }
}
// ---- run only when executed directly (no side-effects on import) ----
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("telegram-bot fatal error", e);
    process.exit(1);
  });
}

