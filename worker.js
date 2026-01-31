import dotenv from "dotenv";
dotenv.config();

import { chromium, request } from "playwright";
import {
  initDb,
  getLinksForWorker,
  getSeenItemKeys,
  insertLinkItems,
  updateLastKey,
  pruneLinkItems,
} from "./db.js";

import fetch from "node-fetch";
import pg from "pg";

const { Pool } = pg;

// Osobny pool tylko do chat_notifications / link_notification_modes
const notifyPool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool();

// =================== KONFIG TELEGRAM / WORKER ===================

const TG = process.env.TELEGRAM_BOT_TOKEN || "";

const API_BASE = process.env.API_BASE || "http://api:3000";


const userLimitsCache = new Map(); // tgUserId -> limits
async function getUserLimits(telegramUserId) {
  const key = String(telegramUserId || "");
  if (!key) return null;
  if (userLimitsCache.has(key)) return userLimitsCache.get(key);

  try {
    const r = await fetch(API_BASE + "/me", {
      headers: { "X-Telegram-User-Id": key },
    });
    if (!r.ok) return null;

    const j = await r.json();
    const f = j?.features || {};
    const out = {
      sources_allowed: Array.isArray(f.sources_allowed) ? f.sources_allowed : null,
      history_keep_per_link: Number(f.history_keep_per_link || 0) || null,
      max_items_per_link_per_loop: Number(f.max_items_per_link_per_loop || 0) || null,
      links_limit: Number(f.links_limit || 0) || null,
    };

    userLimitsCache.set(key, out);
    return out;
  } catch (e) {
    return null;
  }
}


// debug logi
const DEBUG =
  process.env.DEBUG_WORKER === "true" || process.env.DEBUG === "true";

function logDebug(...args) {
  if (DEBUG) console.log(...args);
}

// =================== PROXY (ENV) ===================
// Wymaga w .env / compose:
// PROXY_SERVER=http://geo.iproyal.com:12321
// PROXY_USERNAME=...
// PROXY_PASSWORD=...
const PROXY_SERVER = process.env.PROXY_SERVER || "";
const PROXY_USERNAME = process.env.PROXY_USERNAME || "";
const PROXY_PASSWORD = process.env.PROXY_PASSWORD || "";

const PROXY =
  PROXY_SERVER && PROXY_USERNAME && PROXY_PASSWORD
    ? {
        server: PROXY_SERVER,
        username: PROXY_USERNAME,
        password: PROXY_PASSWORD,
      }
    : null;

if (DEBUG) {
  console.log(
    `[proxy] enabled=${!!PROXY} server=${PROXY_SERVER || "-"} user=${
      PROXY_USERNAME ? "YES" : "NO"
    } pass=${PROXY_PASSWORD ? "YES" : "NO"}`
  );
}

function cleanKey(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const low = s.toLowerCase();
  if (low === "null" || low === "undefined") return null;
  return s;
}

function normalizeVintedItemUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);

    if (u.pathname.startsWith("/items/")) {
      u.search = "";
      u.hash = "";
      return u.toString();
    }

    const ref = u.searchParams.get("ref_url");
    if (ref) {
      try {
        const decoded = decodeURIComponent(ref);
        const u2 = new URL(decoded);
        if (u2.pathname.startsWith("/items/")) {
          u2.search = "";
          u2.hash = "";
          return u2.toString();
        }
      } catch {
        // ignore
      }
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

// Konfiguracja workera
const LOOP_DELAY_MS = Number(process.env.LOOP_DELAY_MS || 300000); // przerwa między kolejnymi loopOnce
const SLEEP_BETWEEN_ITEMS_MS = Number(process.env.SLEEP_BETWEEN_ITEMS_MS || 1200); // przerwa między wysyłkami do Telegrama

// Domyślne limity
const MAX_ITEMS_PER_LINK_PER_LOOP = Number(process.env.MAX_ITEMS_PER_LINK_PER_LOOP || 10); // max ofert na 1 link w 1 pętli
const MIN_BATCH_ITEMS = 1; // minimalna liczba ofert, żeby wysłać paczkę w trybie /zbiorcze

// ile historii trzymać w DB na link (żeby nie puchło)
const HISTORY_KEEP_PER_LINK = Number(process.env.HISTORY_KEEP_PER_LINK || 500);

// Konfiguracja per źródło
const SOURCE_CONFIG = {
  olx: {
    maxPerLoop: MAX_ITEMS_PER_LINK_PER_LOOP,
    minBatchItems: MIN_BATCH_ITEMS,
  },
  vinted: {
    maxPerLoop: MAX_ITEMS_PER_LINK_PER_LOOP,
    minBatchItems: MIN_BATCH_ITEMS,
  },
  default: {
    maxPerLoop: MAX_ITEMS_PER_LINK_PER_LOOP,
    minBatchItems: MIN_BATCH_ITEMS,
  },
};

function getSourceConfig(source) {
  const key = (source || "").toLowerCase();
  return SOURCE_CONFIG[key] || SOURCE_CONFIG.default;
}

// Bufory dla trybu /zbiorcze – klucz: "userId:chatId:linkId"
const batchBuffers = new Map();
// ---------- Helpery ogólne ----------

function normalizeOlxUrl(u = "") {
  try {
    let out = String(u ?? "").trim();
    if (!out) return "";

    // czasem last_key bywa zapisany jako samo ID (np. ID18xxxx) – zostaw
    if (/^ID[0-9A-Za-z]+$/.test(out)) return out;

    // jeśli to nie wygląda jak URL, nie kombinuj
    if (!/^https?:\/\//i.test(out)) return out;

    const url = new URL(out);

    // ujednolicenia
    url.hash = "";
    url.search = "";

    // OLX bywa na m.olx.pl albo z /d/ – kanonizujemy do jednego formatu
    url.hostname = "www.olx.pl";
    url.pathname = url.pathname.replace(/^\/d\//, "/");
    url.pathname = url.pathname.replace(/\/+$/, "");

    return url.toString().replace(/\/+$/, "");
  } catch {
    return String(u ?? "").trim();
  }
}



function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTodayStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getItemKey(it) {
  return it?.itemKey || it?.item_key || it?.itemKeyNormalized || null;
}

/**
 * Zwraca tylko elementy "przed" lastKey (czyli nowsze w kolejności newest-first)
 * oraz informację czy lastKey został znaleziony na liście.
 */
function takeNewItemsUntilLastKey(items, lastKey) {
  if (!lastKey) return { fresh: [], found: false };

  const out = [];
  let found = false;

  for (const it of items || []) {
    const k = getItemKey(it);
    if (!k) continue;
    if (k === lastKey) {
      found = true;
      break; // STOP na last_key
    }
    out.push(it);
  }

  return { fresh: out, found };
}

function isHourInQuietRange(hour, from, to) {
  if (typeof hour !== "number") return false;
  if (typeof from !== "number" || typeof to !== "number") return false;

  hour = ((hour % 24) + 24) % 24;
  from = ((from % 24) + 24) % 24;
  to = ((to % 24) + 24) % 24;

  if (from === to) return false;

  if (from < to) return hour >= from && hour < to;
  return hour >= from || hour < to;
}

function detectSource(url) {
  try {
    const u = new URL(url);
    const h = (u.hostname || "").toLowerCase();
    if (h.includes("olx.")) return "olx";
    if (h.includes("vinted.")) return "vinted";
    return null;
  } catch {
    return null;
  }
}

// Vinted: wyciągamy ID z /items/<id>-...
function getVintedItemIdFromUrl(urlOrKey) {
  try {
    const u = new URL(urlOrKey);
    const m = u.pathname.match(/^\/items\/(\d+)(?:-|\/|$)/i);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  } catch {
    const s = String(urlOrKey || "").trim();
    if (/^\d+$/.test(s)) return Number(s);
    return null;
  }
}

function normalizeKey(url) {
  try {
    const u = new URL(url);
    const host = (u.hostname || "").toLowerCase();

    // OLX
    if (host.includes("olx.")) {
      u.hostname = "www.olx.pl";

      const m = u.pathname.match(/\/(d\/)?oferta\/([^/?#]+)(\/.*)?$/);
      if (m) {
        const slug = m[2];
        u.pathname = `/oferta/${slug}`;
      }

      u.search = "";
      u.hash = "";
      return u.toString();
    }

    // Vinted
    if (host.includes("vinted.")) {
      if (u.pathname === "/session-refresh") {
        const ref = u.searchParams.get("ref_url");
        if (ref) {
          try {
            const decoded = decodeURIComponent(ref);
            const u2 = new URL(decoded, `${u.protocol}//${u.host}`);

            if (u2.pathname.startsWith("/items/")) {
              const m2 = u2.pathname.match(/^\/items\/(\d+)/i);
              if (m2) u2.pathname = `/items/${m2[1]}`;
              u2.search = "";
              u2.hash = "";
              return u2.toString();
            }
          } catch {
            // ignore
          }
        }
      }

      if (u.pathname.startsWith("/items/")) {
        const m = u.pathname.match(/^\/items\/(\d+)/i);
        if (m) u.pathname = `/items/${m[1]}`;
        u.search = "";
        u.hash = "";
        return u.toString();
      }
    }

    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

function deriveOlxTitleFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (!parts.length) return null;

    let last = parts[parts.length - 1];
    last = last.replace(/\.[a-z0-9]+$/i, "");

    let slugParts = last.split("-");

    slugParts = slugParts.filter((p) => {
      const up = p.toUpperCase();
      if (up.startsWith("CID")) return false;
      if (up.startsWith("ID") && up.length > 2) return false;
      return true;
    });

    if (!slugParts.length) return null;

    const pretty = slugParts
      .join(" ")
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return pretty || null;
  } catch {
    return null;
  }
}

// Minimalne escape HTML dla Telegrama (parse_mode=HTML)
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Parsowanie "1 399 zł" / "1,399 PLN" itd.
function parsePrice(text) {
  if (!text) return { price: null, currency: null };

  const m = String(text).match(/([\d\s.,]+)\s*([A-Za-z€$łŁ]+)?/i);
  if (!m) return { price: null, currency: null };

  const numStr = m[1].replace(/\s/g, "").replace(",", ".");
  const price = Number.parseFloat(numStr);
  const rawCurr = (m[2] || "").toUpperCase();

  let currency = null;
  if (/PLN|ZŁ|ZL/.test(rawCurr)) currency = "PLN";
  else if (/EUR|€/.test(rawCurr)) currency = "EUR";
  else if (/USD|\$/.test(rawCurr)) currency = "USD";
  else if (rawCurr) currency = rawCurr;

  return {
    price: Number.isFinite(price) ? price : null,
    currency,
  };
}

// Parsowanie atrybutu title z Vinted (fallback dla DOM)
function parseVintedMeta(titleAttr, fallbackTitle) {
  if (!titleAttr) {
    return {
      title: fallbackTitle || "",
      brand: null,
      size: null,
      condition: null,
      rawPriceFromTitle: null,
    };
  }

  const segments = titleAttr.split(/\s*,\s*/);
  let title = segments[0] || fallbackTitle || "";

  let brand = null;
  let size = null;
  let condition = null;
  let rawPriceFromTitle = null;

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i] || "";
    const lower = seg.toLowerCase();
    let m;

    m = seg.match(/^marka:\s*(.+)$/i);
    if (m) {
      brand = m[1].trim();
      continue;
    }

    m = seg.match(/^(stan|condition):\s*(.+)$/i);
    if (m) {
      condition = m[2].trim();
      continue;
    }

    m = seg.match(/^rozmiar:\s*(.+)$/i);
    if (m) {
      size = m[1].trim();
      continue;
    }

    if (/\d/.test(seg) && !/zawiera/i.test(lower)) {
      rawPriceFromTitle = seg.trim();
    }
  }

  return {
    title,
    brand,
    size,
    condition,
    rawPriceFromTitle,
  };
}

// Domyślna waluta dla Vinted na podstawie URL-a / domeny
function getVintedFallbackCurrency(linkUrl) {
  try {
    const u = new URL(linkUrl);
    const cur = u.searchParams.get("currency");
    if (cur) return cur.toUpperCase();
    const h = (u.hostname || "").toLowerCase();
    if (h.endsWith(".pl")) return "PLN";
    if (h.endsWith(".fr")) return "EUR";
    if (h.endsWith(".de")) return "EUR";
    if (h.endsWith(".be")) return "EUR";
    if (h.endsWith(".es")) return "EUR";
    if (h.endsWith(".it")) return "EUR";
  } catch {
    // ignore
  }
  return null;
}

// Buduje URL do API Vinted na podstawie URL /catalog
function buildVintedApiUrl(catalogUrl) {
  const u = new URL(catalogUrl);
  const api = new URL("/api/v2/catalog/items", u.origin);

  const inP = u.searchParams;
  const outP = api.searchParams;

  // wymagane
  outP.set("page", inP.get("page") || "1");
  outP.set("per_page", "96");

  // scalary
  const scalarKeys = [
    "search_text",
    "currency",
    "price_from",
    "price_to",
    "order",
    "search_by_image_uuid",
  ];
  for (const k of scalarKeys) {
    const v = inP.get(k);
    if (v != null && v !== "") outP.set(k, v);
  }

  // domyślnie newest_first jeśli nie ma
  if (!outP.get("order")) outP.set("order", "newest_first");

  // tablice
  for (const [k, v] of inP.entries()) {
    if (k === "time") continue;
    if (k === "catalog[]") outP.append("catalog_ids[]", v);
    else if (k === "catalog_ids[]") outP.append("catalog_ids[]", v);
    else if (k === "size_ids[]") outP.append("size_ids[]", v);
    else if (k === "brand_ids[]") outP.append("brand_ids[]", v);
    else if (k === "status_ids[]") outP.append("status_ids[]", v);
    else if (k === "color_ids[]") outP.append("color_ids[]", v);
    else if (k === "material_ids[]") outP.append("material_ids[]", v);
  }

  return api.toString();
}

// ---------- Filtrowanie pod użytkownika ----------

function matchFilters(item, filters = {}) {
  if (!filters || Object.keys(filters).length === 0) return true;

  const price = typeof item.price === "number" ? item.price : null;

  if (filters.minPrice != null && price != null && price < filters.minPrice) {
    return false;
  }
  if (filters.maxPrice != null && price != null && price > filters.maxPrice) {
    return false;
  }

  if (Array.isArray(filters.brand) && filters.brand.length) {
    const brandLower = (item.brand || "").toLowerCase();
    const ok = filters.brand.some((b) =>
      brandLower.includes(String(b).toLowerCase())
    );
    if (!ok) return false;
  }

  if (Array.isArray(filters.sizes) && filters.sizes.length) {
    const sizeLower = (item.size || "").toLowerCase();
    const ok = filters.sizes.some(
      (s) => sizeLower === String(s).toLowerCase()
    );
    if (!ok) return false;
  }

  if (Array.isArray(filters.conditions) && filters.conditions.length) {
    const condLower = (item.condition || "").toLowerCase();
    const ok = filters.conditions.some((c) =>
      condLower.includes(String(c).toLowerCase())
    );
    if (!ok) return false;
  }

  return true;
}

// ---------- Telegram – wysyłka (photo / message, retry na 429) ----------
async function sendTelegram(method, payload) {
  if (!TG) {
    console.error(
      "sendTelegram: brak TELEGRAM_BOT_TOKEN (TG) – nie wysyłam wiadomości"
    );
    return { ok: false, status: 0, body: null, rawText: null };
  }

  const url = `https://api.telegram.org/bot${TG}/${method}`;

  while (true) {
    try {
      logDebug(
        "sendTelegram: request",
        JSON.stringify({
          method,
          url,
          chat_id: payload && payload.chat_id,
        })
      );

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => "");
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      if (res.status === 429) {
        let retry = 30;
        try {
          if (parsed?.parameters?.retry_after) {
            retry = Number(parsed.parameters.retry_after) || retry;
          }
        } catch {
          // ignore
        }

        console.warn(
          `sendTelegram: rate limit 429, retry_after=${retry}s, body=${text}`
        );
        await sleep(retry * 1000);
        continue;
      }

      const ok = res.ok && (parsed?.ok !== false);

      if (!ok) {
        console.error(
          "sendTelegram: HTTP/Telegram error",
          JSON.stringify({
            status: res.status,
            statusText: res.statusText,
            body: text,
          })
        );
      } else {
        logDebug(
          "sendTelegram: OK",
          JSON.stringify({
            method,
            status: res.status,
            chat_id: payload && payload.chat_id,
          })
        );
      }

      return { ok, status: res.status, body: parsed ?? text, rawText: text };
    } catch (err) {
      console.error("sendTelegram: exception", err);
      await sleep(2000);
      return { ok: false, status: 0, body: null, rawText: null };
    }
  }
}

function formatLinkHeader(link) {
  const src = (link.source || detectSource(link.url) || "").toUpperCase();

  let label = link.name || "";

  if (!label) {
    if (src === "OLX") label = "OLX wyszukiwanie";
    else if (src === "VINTED") label = "Vinted wyszukiwanie";
    else label = link.url || "Monitoring";
  }

  const idPart = link.id ? ` · <i>ID ${link.id}</i>` : "";
  return `🔍 <b>${escapeHtml(label)}</b>${idPart}`;
}

async function countSentOffersSince(userId, chatId, since) {
  try {
    const res = await notifyPool.query(
      `SELECT COUNT(*)::int AS cnt FROM sent_offers WHERE user_id = $1 AND chat_id = $2 AND sent_at >= $3`,
      [Number(userId), String(chatId), since]
    );
    return res.rows[0]?.cnt ?? 0;
  } catch (e) {
    console.error("countSentOffersSince error", e);
    return 0;
  }
}

async function insertSentOffers(rows = []) {
  const arr = Array.isArray(rows) ? rows.filter(Boolean) : [];
  if (!arr.length) return 0;

  const userIds = [];
  const chatIds = [];
  const linkIds = [];
  const itemIds = [];
  const prices = [];
  const currencies = [];
  const titles = [];
  const urls = [];
  const sentAts = [];

  for (const r of arr) {
    userIds.push(Number(r.user_id));
    chatIds.push(String(r.chat_id));
    linkIds.push(Number(r.link_id));
    itemIds.push(String(r.item_id));
    prices.push(r.price != null ? Number(r.price) : null);
    currencies.push(r.currency != null ? String(r.currency) : null);
    titles.push(r.title != null ? String(r.title) : null);
    urls.push(r.url != null ? String(r.url) : null);
    sentAts.push(r.sent_at ? r.sent_at : new Date());
  }

  const res = await notifyPool.query(
    `
    INSERT INTO sent_offers (user_id, chat_id, link_id, item_id, price, currency, title, url, sent_at)
    SELECT * FROM UNNEST(
      $1::int[],
      $2::text[],
      $3::int[],
      $4::text[],
      $5::numeric[],
      $6::text[],
      $7::text[],
      $8::text[],
      $9::timestamptz[]
    )
    ON CONFLICT (chat_id, link_id, item_id) DO NOTHING
    `,
    [userIds, chatIds, linkIds, itemIds, prices, currencies, titles, urls, sentAts]
  );

  return res.rowCount || 0;
}

function toSentOfferRow(userId, chatId, link, item) {
  const itemId = getItemKey(item) || item?.url || item?.title || null;
  if (!userId || !chatId || !link?.id || !itemId) return null;

  return {
    user_id: Number(userId),
    chat_id: String(chatId),
    link_id: Number(link.id),
    item_id: String(itemId),
    price: item?.price,
    currency: item?.currency,
    title: item?.title,
    url: item?.url,
    sent_at: new Date(),
  };
}

function hiddenLink(url) {
  return `<a href="${escapeHtml(url)}">\u200B</a>`;
}

// wysyłka pojedynczej karty (photo / message) na konkretny chat
async function tgSendItem(chatId, link, item, lang = "en", meta = {}) {
  if (!TG) return { sent: false, inserted: 0 };

  const userId = meta?.userId ?? link.user_id ?? link.userId ?? null;

  const src = (link.source || detectSource(link.url) || "").toLowerCase();
  
  // Normalizuj język (pl-PL → pl, en-US → en, itp.)
  const normalizedLang = (lang || "en").toLowerCase().split("-")[0];
  
  // Mapy tekstów per język
  const texts = {
    pl: {
      disable: "🔕 Wyłącz ten link",
      single: "📨 Pojedynczo",
      batch: "📦 Zbiorczo",
      buyNow: "⚡ Kup teraz",
    },
    en: {
      disable: "🔕 Disable this link",
      single: "📨 Single",
      batch: "📦 Batch",
      buyNow: "⚡ Buy now",
    },
  };
  
  const t = texts[normalizedLang] || texts.en;

  const header = formatLinkHeader(link);
  let caption = `${header}\n\n<b>${escapeHtml(item.title || "")}</b>\n`;

  if (item.price != null) {
    const priceStr = `${item.price} ${item.currency || ""}`.trim();
    caption += `\n💰 ${escapeHtml(priceStr)}`;
  }

  if (item.brand) caption += `\n🏷️ ${escapeHtml(item.brand)}`;
  if (item.size) caption += `\n📏 ${escapeHtml(item.size)}`;
  if (item.condition) caption += `\n✨ ${escapeHtml(item.condition)}`;

  caption += `\n\n${hiddenLink(item.url)}`;

  const keyboard = [
    [
      {
        text: "URL",
        url: item.url,
      },
    ],
  ];

  if (src === "olx" && item.hasOlxDelivery && item.buyUrl) {
    keyboard.push([
      {
        text: t.buyNow,
        url: item.buyUrl,
      },
    ]);
  }

  keyboard.push([
    {
      text: t.disable,
      callback_data: `lnmode:${link.id}:off`,
    },
  ]);
  keyboard.push([
    {
      text: t.single,
      callback_data: `lnmode:${link.id}:single`,
    },
    {
      text: t.batch,
      callback_data: `lnmode:${link.id}:batch`,
    },
  ]);

  const replyMarkup = { inline_keyboard: keyboard };

  const canSendPhoto =
    src === "vinted" &&
    item.photoUrl &&
    typeof item.photoUrl === "string" &&
    /^https?:\/\//i.test(item.photoUrl);

  const sendRes = canSendPhoto
    ? await sendTelegram("sendPhoto", {
        chat_id: chatId,
        photo: item.photoUrl,
        caption,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      })
    : await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: caption,
        parse_mode: "HTML",
        disable_web_page_preview: false,
        reply_markup: replyMarkup,
      });

  const sentOk = !!sendRes?.ok;
  let inserted = 0;

  if (sentOk) {
    const row = toSentOfferRow(userId, chatId, link, item);
    if (row) {
      inserted = await insertSentOffers([row]);
    }
    if (inserted) {
      console.error(`[sent_debug] chat=${chatId} link=${link.id} sent_n=${inserted}`);
    }
  }

  await sleep(SLEEP_BETWEEN_ITEMS_MS);
  return { sent: sentOk, inserted };
}

// tekst do trybu /zbiorcze
function buildBatchMessage(link, items, skippedExtra = 0) {
  const header = formatLinkHeader(link);
  let text = `🆕 Nowe ogłoszenia\n${header}\n\n`;

  items.forEach((item, idx) => {
    const title = escapeHtml(item.title || "");
    const priceStr =
      item.price != null
        ? `${item.price} ${item.currency || ""}`.trim()
        : "";

    text += `${idx + 1}. ${title}\n`;
    if (priceStr) text += `💰 ${escapeHtml(priceStr)}\n`;
    text += `${item.url}\n\n`;
  });

  if (skippedExtra > 0) text += `+ ${skippedExtra} dodatkowych ofert.\n\n`;
  text += `Pełną historię zobaczysz w /najnowsze ${link.id}`;

  return text.trim();
}

function makeBatchKey(chatId, userId, linkId) {
  return `${userId}:${chatId}:${linkId}`;
}

// Wysyłka powiadomień dla danego linku
async function notifyChatsForLink(link, items, skippedExtra, opts = {}) {
  if (!items || !items.length) return;

  const minBatchItems = opts.minBatchItems || MIN_BATCH_ITEMS;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nowHour = now.getHours();
  const todayStart = getTodayStart();

  try {
    const res = await notifyPool.query(
      `
      SELECT
        cn.chat_id,
        cn.user_id,
        cn.enabled,
        cn.mode AS chat_mode,
        cn.daily_count,
        cn.daily_count_date,
        LOWER(COALESCE(lnm.mode, cn.mode)) AS effective_mode,
        lnm.mode AS link_mode,
        u.plan_name,
        u.extra_link_packs,
        COALESCE(NULLIF(u.lang,''), 'en') AS lang,
        u.timezone,
        qh.quiet_enabled,
        qh.quiet_from,
        qh.quiet_to
      FROM links l
      JOIN chat_notifications cn
        ON cn.user_id = l.user_id
       AND (l.chat_id IS NULL OR cn.chat_id = l.chat_id)
      JOIN users u
        ON u.id = l.user_id
      LEFT JOIN link_notification_modes lnm
        ON lnm.user_id = cn.user_id
       AND lnm.chat_id = cn.chat_id
       AND lnm.link_id = l.id
      LEFT JOIN chat_quiet_hours qh
        ON qh.chat_id = cn.chat_id
      WHERE l.id = $1
      `,
      [link.id]
    );

    if (!res.rowCount) {
      logDebug(
        `notifyChatsForLink: link ${link.id} – brak rekordów chat_notifications`
      );
      return;
    }

    let chatRows = res.rows.map((row) => ({
      ...row,
      mode: (row.effective_mode || "single").toLowerCase(),
    }));

    if (DEBUG) {
      logDebug(
        `[notify] link=${link.id} candidates=${chatRows.length} items=${items.length} skipped=${
          skippedExtra || 0
        }`
      );
      for (const r of chatRows) {
        logDebug(
          `[notify] link=${link.id} chat=${r.chat_id} enabled=${r.enabled} chat_mode=${
            r.chat_mode
          } link_mode=${r.link_mode || "-"} effective=${r.mode}`
        );
      }
    }

    // 1) odfiltruj czaty WYŁĄCZONE + OFF
    const before = chatRows.length;
    chatRows = chatRows.filter((row) => {
      if (!row.enabled) {
        logDebug(
          `[skip] link=${link.id} chat=${row.chat_id} reason=chat_disabled`
        );
        return false;
      }
      if (row.mode === "off") {
        logDebug(
          `[skip] link=${link.id} chat=${row.chat_id} reason=mode_off chat_mode=${row.chat_mode} link_mode=${
            row.link_mode || "-"
          }`
        );
        return false;
      }
      return true;
    });

    if (!chatRows.length) {
      logDebug(
        `notifyChatsForLink: link ${link.id} – po filtrach 0 czatów (disabled/off) (było ${before})`
      );
      return;
    }

    for (const row of chatRows) {
      const chatId = row.chat_id;
      const userId = row.user_id;

      // 2) cisza nocna
      const quietEnabled = !!row.quiet_enabled;
      const quietFrom =
        typeof row.quiet_from === "number" ? row.quiet_from : 22;
      const quietTo = typeof row.quiet_to === "number" ? row.quiet_to : 7;

      // Oblicz godzinę w timezone użytkownika
      const userTz = row.timezone || "Europe/Warsaw";
      let userHour = nowHour;
      try {
        const userTime = new Date().toLocaleString("en-US", {
          timeZone: userTz,
          hour: "numeric",
          hour12: false,
        });
        userHour = parseInt(userTime, 10);
      } catch (e) {
        logDebug(`[warn] link=${link.id} chat=${chatId} invalid timezone=${userTz}, using server hour`);
      }

      if (quietEnabled && isHourInQuietRange(userHour, quietFrom, quietTo)) {
        logDebug(
          `[skip] link=${link.id} chat=${chatId} reason=quiet_hours userHour=${userHour} userTz=${userTz} range=${quietFrom}-${quietTo}`
        );
        continue;
      }

      // 3) limity dzienne – liczymy z sent_offers (SoT)
      const dailyCount = await countSentOffersSince(userId, chatId, todayStart);

      const planName = (row.plan_name || "none").toLowerCase();
      const extraPacks = Number(row.extra_link_packs || 0);

      let maxDaily = 0;
      switch (planName) {
        case "trial":
          maxDaily = 50;
          break;
        case "starter":
          maxDaily = 200;
          break;
        case "growth":
          maxDaily = 400;
          break;
        case "platinum":
          maxDaily = 700 + extraPacks * 100;
          break;
        default:
          maxDaily = 0;
      }

      const remainingDaily = Math.max(0, maxDaily - dailyCount);

      if (maxDaily <= 0 || remainingDaily <= 0) {
        logDebug(
          `[skip] link=${link.id} chat=${chatId} reason=daily_limit count=${dailyCount} max=${maxDaily}`
        );

        await notifyPool.query(
          `
          UPDATE chat_notifications
          SET daily_count = $1,
              daily_count_date = $2
          WHERE chat_id = $3 AND user_id = $4
          `,
          [dailyCount, todayStr, chatId, userId]
        );
        batchBuffers.delete(makeBatchKey(chatId, userId, link.id));
        continue;
      }

      const mode = row.mode === "batch" ? "batch" : "single";

      let itemsForChat = items.slice(0, remainingDaily);
      const droppedByDaily = items.length - itemsForChat.length;
      let skippedForChat = (skippedExtra || 0) + droppedByDaily;

      if (!itemsForChat.length) {
        await notifyPool.query(
          `
          UPDATE chat_notifications
          SET daily_count = $1,
              daily_count_date = $2
          WHERE chat_id = $3 AND user_id = $4
          `,
          [dailyCount, todayStr, chatId, userId]
        );
        continue;
      }

      logDebug(
        `[send] link=${link.id} chat=${chatId} mode=${mode} items=${itemsForChat.length} skipped=${
          skippedForChat || 0
        } limit_left=${remainingDaily}`
      );

      let sentSomething = false;
      let insertedTotal = 0;

      if (mode === "single") {
        for (const item of itemsForChat) {
          const { sent, inserted } = await tgSendItem(chatId, link, item, row.lang, { userId });
          if (sent) sentSomething = true;
          insertedTotal += inserted || 0;
        }
      } else {
        const key = makeBatchKey(chatId, userId, link.id);
        const existing = batchBuffers.get(key) || { items: [], skippedExtra: 0 };

        // przytnij istniejący bufor jeśli przekracza dostępny limit dzienny
        const trimmedExisting = existing.items.slice(0, remainingDaily);
        const trimmedOut = existing.items.length - trimmedExisting.length;
        let totalSkipped = (existing.skippedExtra || 0) + trimmedOut + skippedForChat;

        const availableForNew = Math.max(0, remainingDaily - trimmedExisting.length);
        const newItems = itemsForChat.slice(0, availableForNew);
        const droppedNew = itemsForChat.length - newItems.length;
        totalSkipped += droppedNew;

        const bufferState = { items: [...trimmedExisting, ...newItems], skippedExtra: totalSkipped };

        if (bufferState.items.length < minBatchItems && bufferState.skippedExtra === 0) {
          batchBuffers.set(key, bufferState);
          logDebug(
            `[batch] link=${link.id} chat=${chatId} buffered=${bufferState.items.length} min=${minBatchItems}`
          );
        } else {
          const text = buildBatchMessage(link, bufferState.items, bufferState.skippedExtra);
          const sendRes = await sendTelegram("sendMessage", {
            chat_id: chatId,
            text,
            parse_mode: "HTML",
            disable_web_page_preview: false,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🔕 Wyłącz ten link", callback_data: `lnmode:${link.id}:off` },
                ],
                [
                  { text: "📨 Pojedynczo", callback_data: `lnmode:${link.id}:single` },
                  { text: "📦 Zbiorczo", callback_data: `lnmode:${link.id}:batch` },
                ],
              ],
            },
          });

          if (sendRes?.ok) {
            const rows = bufferState.items
              .map((it) => toSentOfferRow(userId, chatId, link, it))
              .filter(Boolean);
            if (rows.length) {
              insertedTotal = await insertSentOffers(rows);
              if (insertedTotal) {
                console.error(`[sent_debug] chat=${chatId} link=${link.id} sent_n=${insertedTotal}`);
              }
            }
            sentSomething = true;
          }

          batchBuffers.delete(key);
        }
      }

      if (sentSomething) {
        const newDaily = Math.min(maxDaily, dailyCount + insertedTotal);

        await notifyPool.query(
          `
          UPDATE chat_notifications
          SET last_notified_at = NOW(),
              daily_count = $1,
              daily_count_date = $2
          WHERE chat_id = $3 AND user_id = $4
          `,
          [newDaily, todayStr, chatId, userId]
        );
      } else {
        await notifyPool.query(
          `
          UPDATE chat_notifications
          SET daily_count = $1,
              daily_count_date = $2
          WHERE chat_id = $3 AND user_id = $4
          `,
          [dailyCount, todayStr, chatId, userId]
        );
      }
    }
  } catch (err) {
    console.error("Błąd notifyChatsForLink:", err);
  }
}

// ---------- Scraping OLX ----------

async function scrapeOlx(url) {
  const launchOpts = {
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  };
  if (PROXY) launchOpts.proxy = PROXY;

  const browser = await chromium.launch(launchOpts);
  const context = await browser.newContext({
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

let page = await context.newPage();

const setupPage = async (p) => {

// Przyspieszenie: nie ładuj ciężkich zasobów
await p.route(/.*/i, (route) => {
  const t = route.request().resourceType();
  if (t === "image" || t === "media" || t === "font") return route.abort();
  return route.continue();
});

  p.setDefaultNavigationTimeout(60000);
  p.setDefaultTimeout(60000);
};

  try {
await setupPage(page);

// Retry na OLX (czasem siada / muli)
let lastErr = null;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    // NAJWAŻNIEJSZE: NIE używamy networkidle
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Poczekaj aż pojawią się karty
    await page.waitForSelector('div[data-cy="l-card"]', { timeout: 25000 });

    // krótki oddech na domknięcie DOM
    await page.waitForTimeout(800);

    lastErr = null;
    break;
  } catch (e) {
    lastErr = e;
    console.log(`OLX goto attempt ${attempt}/3 failed: ${e?.message || e}`);

    // Jeśli strona się wysypała / zamknęła – twórz nową i jedziemy dalej
    if (page.isClosed()) {
      page = await context.newPage();
      await setupPage(page);
    }

    // UWAGA: nie używamy page.waitForTimeout w catch (bo page może być zamknięta)
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
}

if (lastErr) throw lastErr;

    const rawItems = await page.$$eval('div[data-cy="l-card"]', (cards) => {
      const results = [];

      for (const card of cards) {
        const linkEl = card.querySelector(
          'a[href*="/oferta/"], a[href*="/d/oferta/"]'
        );
        if (!linkEl) continue;

                const url = (() => {
          try {
            const u = new URL(linkEl.href);
            u.hash = "";
            u.search = "";
            u.pathname = u.pathname.replace(/^\/d\/oferta\//, "/oferta/");
            return u.toString();
          } catch (e) {
            return (linkEl.href || "").split("#")[0].split("?")[0].replace("/d/oferta/", "/oferta/");
          }
        })();

        let title = "";

        const titleEl =
          card.querySelector('[data-cy="ad-card-title"]') ||
          card.querySelector('[data-testid="ad-title"]') ||
          linkEl.querySelector("h6") ||
          linkEl.querySelector("h3") ||
          card.querySelector("h6") ||
          card.querySelector("h3");

        if (titleEl) title = (titleEl.innerText || titleEl.textContent || "").trim();
        if (!title && linkEl.getAttribute("title"))
          title = linkEl.getAttribute("title").trim();
        if (!title) title = (linkEl.innerText || linkEl.textContent || "").trim();

        let priceText = "";
        const priceEl =
          card.querySelector('[data-testid="ad-price"]') ||
          card.querySelector('[data-cy="ad-card-price"]');
        if (priceEl) priceText = (priceEl.innerText || priceEl.textContent || "").trim();

        // UWAGA: obrazy blokujemy routem, więc photoUrl często będzie null (to OK)
        const img = card.querySelector("img");
        let photoUrl = null;
        if (img) {
          photoUrl =
            img.src ||
            img.getAttribute("src") ||
            img.getAttribute("data-src") ||
            (img.getAttribute("srcset") || "").split(" ")[0] ||
            null;
        }

        const text = card.innerText || card.textContent || "";
        const hasOlxDelivery = /Przesyłka OLX/i.test(text);

        results.push({
          url,
          title,
          rawPrice: priceText,
          photoUrl,
          hasOlxDelivery,
        });
      }

      return results;
    });

    if (rawItems[0]) logDebug("OLX first item debug:", rawItems[0]);

    const items = rawItems.map((it) => {
      let finalTitle = it.title || "";
      if (!finalTitle || /^wyróżnione$/i.test(finalTitle)) {
        const fromUrl = deriveOlxTitleFromUrl(it.url);
        if (fromUrl) finalTitle = fromUrl;
      }

      const { price, currency } = parsePrice(it.rawPrice);
      const url = normalizeOlxUrl(it.url);
      const itemKey = normalizeKey(url);

      return {
        url,
        title: finalTitle,
        price,
        currency,
        brand: null,
        size: null,
        condition: null,
        photoUrl: it.photoUrl,
        hasOlxDelivery: it.hasOlxDelivery,
        buyUrl: it.hasOlxDelivery ? it.url : null,
        itemKey,
        item_key: itemKey,
      };
    });
    return items;
  } finally {
    await page.close().catch(() => null);
    await context.close().catch(() => null);
    await browser.close().catch(() => null);
  }
}

// ---------- Scraping Vinted ----------

function pickArrayFromApi(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.catalog_items)) return data.catalog_items;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data?.catalog_items)) return data.data.catalog_items;
  return [];
}

async function scrapeVinted(url) {
  let q = "";
  let origin = "";
  try {
    const u = new URL(url);
    q = u.searchParams.get("search_text") || "";
    origin = u.origin;
  } catch {
    // ignore
  }

  const fallbackCurrency = getVintedFallbackCurrency(url);

  // 1) API Vinted przez Playwright request
  try {
    const apiUrl = buildVintedApiUrl(url);
    logDebug(`Vinted API url: ${apiUrl}`);

    if (!origin) {
      try {
        origin = new URL(apiUrl).origin;
      } catch {
        // ignore
      }
    }

    const api = await request.newContext({
      proxy: PROXY || undefined,
      baseURL: origin || undefined,
      extraHTTPHeaders: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept-language": "pl-PL,pl;q=0.9,en;q=0.8",
      },
    });

    try {
      // Warm-up: złap anon cookies / token
      if (origin) {
        await api.get("/", {
          headers: {
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
      }

      // Drugi warm-up: wejście na realny /catalog
      try {
        await api.get(url, {
          headers: {
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            referer: origin ? origin + "/" : undefined,
          },
        });
      } catch {
        // ignore
      }

      const res = await api.get(apiUrl, {
        headers: {
          accept: "application/json, text/plain, */*",
          "x-requested-with": "XMLHttpRequest",
          referer: url,
        },
      });

      const txt = await res.text().catch(() => "");
      if (!res.ok()) {
        logDebug(`Vinted API HTTP ${res.status()}: ${txt.slice(0, 180)}`);
        throw new Error(`HTTP_${res.status()}`);
      }

      let apiData = null;
      try {
        apiData = JSON.parse(txt);
      } catch {
        logDebug("Vinted API JSON_PARSE error");
        throw new Error("JSON_PARSE");
      }

      const arr = pickArrayFromApi(apiData);
      if (arr && arr.length) {
        const mapped = arr
          .map((it) => {
            const id =
              typeof it?.id === "number"
                ? it.id
                : Number.isFinite(Number(it?.id))
                ? Number(it.id)
                : null;

            const urlAbs =
              it?.url && typeof it.url === "string"
                ? it.url.startsWith("http")
                  ? it.url
                  : origin
                  ? new URL(it.url, origin).toString()
                  : it.url
                : id && origin
                ? `${origin}/items/${id}`
                : null;

            if (!urlAbs) return null;

            const title =
              it?.title ||
              it?.name ||
              it?.description ||
              it?.brand_title ||
              "";

            const priceAmount =
              it?.price?.amount ??
              it?.price?.value ??
              it?.price ??
              it?.total_item_price?.amount ??
              null;

            const price =
              priceAmount != null && String(priceAmount).trim() !== ""
                ? Number(String(priceAmount).replace(",", "."))
                : null;

            const currency =
              it?.price?.currency_code ||
              it?.currency ||
              fallbackCurrency ||
              null;

            const photoUrl =
              it?.photo?.url ||
              it?.photo?.full_size_url ||
              it?.photo?.high_resolution?.url ||
              (Array.isArray(it?.photos) && it.photos[0]?.url) ||
              null;

            const brand =
              it?.brand_title || it?.brand || it?.brand_name || null;

            const size =
              it?.size_title || it?.size || it?.size_name || null;

            const condition =
              it?.status_title ||
              it?.status ||
              it?.item_condition ||
              null;

            const itemKey = normalizeKey(urlAbs);
            const vintedId = getVintedItemIdFromUrl(itemKey) || id || null;

            return {
              url: urlAbs,
              title: String(title || "").trim(),
              price: Number.isFinite(price) ? price : null,
              currency: currency ? String(currency).toUpperCase() : null,
              brand: brand ? String(brand).trim() : null,
              size: size ? String(size).trim() : null,
              condition: condition ? String(condition).trim() : null,
              photoUrl: photoUrl ? String(photoUrl) : null,
              itemKey,
              item_key: itemKey,
              vintedId: typeof vintedId === "number" ? vintedId : null,
            };
          })
          .filter(Boolean)
          .filter((it) => {
            try {
              const u = new URL(it.itemKey || it.url);
              const h = (u.hostname || "").toLowerCase();
              return h.includes("vinted.") && u.pathname.startsWith("/items/");
            } catch {
              return false;
            }
          });

        logDebug(
          `Vinted(API pw request): items=${mapped.length}, q="${q}", currency="${
            fallbackCurrency || ""
          }"`
        );
        return mapped;
      }

      logDebug(`Vinted(API pw request): 0 items, q="${q}"`);
    } finally {
      await api.dispose().catch(() => null);
    }
  } catch (e) {
    logDebug("Vinted API (pw request) failed -> fallback DOM:", e?.message || e);
  }

  // 2) Fallback: DOM przez Chromium
  const launchOpts = {
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  };
  if (PROXY) launchOpts.proxy = PROXY;

  const browser = await chromium.launch(launchOpts);

  const context = await browser.newContext({
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2000);

    // jeśli Vinted zrzuci na /session-refresh, wróć do ref_url
    try {
      const cur = page.url();
      if (cur.includes("/session-refresh")) {
        const u = new URL(cur);
        const ref = u.searchParams.get("ref_url");
        if (ref) {
          const decoded = decodeURIComponent(ref);
          const u2 = new URL(decoded, `${u.protocol}//${u.host}`);
          await page.goto(u2.toString(), {
            waitUntil: "domcontentloaded",
            timeout: 45000,
          });
          await page.waitForTimeout(3000);
        }
      }
    } catch {
      // ignore
    }

    await page
      .waitForSelector(
        '[data-testid="feed-container"] [data-testid="product-card"], main a[href^="/items/"]',
        { timeout: 12000 }
      )
      .catch(() => null);

    await page.waitForTimeout(1500);

    const rawItems = await page
      .$$eval('main a[href^="/items/"]', (anchors) => {
        const seen = new Set();
        const results = [];

        function extractPhotoUrl(rootEl) {
          let el = rootEl;
          for (let depth = 0; depth < 6 && el; depth++) {
            const img = el.querySelector("img");
            if (img) {
              const srcset = img.getAttribute("srcset") || "";
              const primaryFromSrcset = srcset.split(" ")[0] || null;
              return (
                img.src ||
                img.getAttribute("src") ||
                img.getAttribute("data-src") ||
                primaryFromSrcset
              );
            }
            el = el.parentElement;
          }
          return null;
        }

        for (const a of anchors) {
          const href = a.href;
          if (!href || !href.includes("/items/")) continue;
          if (seen.has(href)) continue;
          seen.add(href);

          const titleAttr = a.getAttribute("title") || "";
          const text = a.textContent ? a.textContent.trim() : "";
          const photoUrl = extractPhotoUrl(a);

          results.push({
            url: href,
            titleAttr,
            text,
            rawPrice: "",
            photoUrl,
          });
        }

        return results;
      })
      .catch(() => []);

    logDebug(`Vinted(DOM) HTML: count=${rawItems.length}, q="${q}"`);

    const mappedItems = (rawItems || [])
      .map((it) => {
        const meta = parseVintedMeta(it.titleAttr, it.text);
        const rawPrice = meta.rawPriceFromTitle || it.rawPrice;
        const { price, currency } = parsePrice(rawPrice);
        const itemKey = normalizeKey(url);
        const vintedId =
          getVintedItemIdFromUrl(itemKey) || getVintedItemIdFromUrl(it.url);

        return {
          url,
          title: meta.title || it.text || "",
          price,
          currency: currency || fallbackCurrency,
          brand: meta.brand,
          size: meta.size,
          condition: meta.condition,
          photoUrl: it.photoUrl,
          itemKey,
          item_key: itemKey,
          vintedId,
        };
      })
      .filter((it) => {
        try {
          const u = new URL(it.itemKey || it.url);
          const h = (u.hostname || "").toLowerCase();
          return h.includes("vinted.") && u.pathname.startsWith("/items/");
        } catch {
          return false;
        }
      });

    return mappedItems;
  } finally {
    await context.close().catch(() => null);
    await browser.close().catch(() => null);
  }
}

// ---------- Główna logika workera ----------

function safeParseFilters(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

function sortItemsForNotify(source, items) {
  const src = (source || "").toLowerCase();
  if (src === "vinted") {
    // newest-first po vintedId jeśli mamy
    return [...(items || [])].sort((a, b) => {
      const ai = typeof a.vintedId === "number" ? a.vintedId : -1;
      const bi = typeof b.vintedId === "number" ? b.vintedId : -1;
      return bi - ai;
    });
  }
  return items || [];
}

async function processLink(link) {
  const source = (link.source || detectSource(link.url) || "").toLowerCase();

  const tgUserId = link.telegram_user_id || link.telegramUserId || null;
  const limits = tgUserId ? await getUserLimits(tgUserId) : null;


  if (limits?.sources_allowed && Array.isArray(limits.sources_allowed) && !limits.sources_allowed.includes(source)) {
    console.log(`[link ${link.id}] SOURCE_NOT_ALLOWED_BY_PLAN source=${source} allowed=${JSON.stringify(limits.sources_allowed)}`);
    return;
  }
  if (!source) {
    logDebug(`Worker: unknown source for link ${link.id}, url=${link.url}`);
    return;
  }

  console.log(`Worker: checking ${link.url}`);

  let scraped = [];
  if (source === "olx") scraped = await scrapeOlx(link.url);
  else if (source === "vinted") scraped = await scrapeVinted(link.url);
  else {
    console.log(`Worker: unsupported source=${source} for link ${link.id}`);
    return;
  }
  const lastKey = cleanKey(
    source === "olx"
      ? normalizeOlxUrl(String(link.last_key ?? link.lastKey ?? ""))
      : String(link.last_key ?? link.lastKey ?? "")
  );
  const hasLastKey = lastKey !== null;

  console.log(
    `[link ${link.id}] source=${source} scraped=${scraped.length} lastKey=${
      hasLastKey ? "YES" : "NO"
    } lastKeyVal=${lastKey ?? "(null)"}`
  );

  const cfg = getSourceConfig(source);
  const maxPerLoop = Number(limits?.max_items_per_link_per_loop || cfg.maxPerLoop);
  const minBatchItems = cfg.minBatchItems;

  const filters = safeParseFilters(link.filters);
  const filtered = (scraped || []).filter((it) => matchFilters(it, filters));

  console.log(
    `[link ${link.id}] filtered=${filtered.length} filtersKeys=${
      Object.keys(filters || {}).length
    }`
  );

  if (!filtered.length) {
    logDebug(`Worker: no items after filters for link ${link.id}`);
    return;
  }

  // porządek newest-first
  const orderedAll =
    source === "vinted" ? sortItemsForNotify(source, filtered) : filtered;

  // ======= BASELINE: nowy link -> ustaw last_key i nic nie zapisuj/nie wysyłaj
  if (!lastKey) {
    const newestKey = getItemKey(orderedAll[0]);
    if (newestKey) {
      await updateLastKey(link.id, newestKey);
      console.log(
        `[baseline] link ${link.id} last_key ustawiony na: ${newestKey}`
      );
    } else {
      console.log(
        `[baseline] link ${link.id} brak itemKey do ustawienia last_key (pusto po scrapie/filtrach)`
      );
    }
    return;
  }

  // ======= normalnie: bierz tylko "nowsze niż last_key"
  const { fresh: freshByLastKey, found } = takeNewItemsUntilLastKey(
    orderedAll,
    lastKey
  );
  // Jeśli last_key nie znaleziony na liście:
  // najczęściej znaczy, że last_key wypadł poza 1. stronę (dużo nowych ogłoszeń).
  // Zamiast milczeć, robimy 'catch-up' na podstawie bieżącej strony + seen-check.
  if (!found) {
    const newestKey = getItemKey(orderedAll[0]);

    const keysToCheck = orderedAll.map(getItemKey).filter(Boolean);
    const seenSet = await getSeenItemKeys(link.id, keysToCheck);

    const freshNotSeen = orderedAll.filter((it) => {
      const k = getItemKey(it);
      return k && !seenSet.has(k);
    });

    if (!freshNotSeen.length) {
      if (newestKey && newestKey !== lastKey) await updateLastKey(link.id, newestKey);
      logDebug(
        `[resync] link ${link.id} last_key nie znaleziony, ale brak nowych (same seen) -> ustawiam na: ${newestKey || "(null)"}`
      );
      return;
    }

    await insertLinkItems(link.id, freshNotSeen);

    const toSend = freshNotSeen.slice(0, maxPerLoop);
    const skipped = freshNotSeen.length - toSend.length;

    await notifyChatsForLink(link, toSend, skipped, { minBatchItems });

    if (newestKey) await updateLastKey(link.id, newestKey);

    const keep = Number(limits?.history_keep_per_link || HISTORY_KEEP_PER_LINK);
    if (Number.isFinite(keep) && keep > 0) await pruneLinkItems(link.id, keep);

    logDebug(
      `[catchup] link ${link.id} last_key wypadł poza stronę -> wysłano=${toSend.length} pominięto=${skipped}`
    );
    return;
  }

  if (!freshByLastKey.length) {
    const newestKey = getItemKey(orderedAll[0]);
    if (newestKey && newestKey !== lastKey) {
      await updateLastKey(link.id, newestKey);
    }
    logDebug(`Worker: no fresh items before last_key for link ${link.id}`);
    return;
  }

  // ======= seen-check TYLKO dla tych świeżych
  const keysToCheck = freshByLastKey.map(getItemKey).filter(Boolean);
  const seenSet = await getSeenItemKeys(link.id, keysToCheck);

  const freshNotSeen = freshByLastKey.filter((it) => {
    const k = getItemKey(it);
    return k && !seenSet.has(k);
  });

  if (!freshNotSeen.length) {
    const newestKey = getItemKey(orderedAll[0]);
    if (newestKey && newestKey !== lastKey) {
      await updateLastKey(link.id, newestKey);
    }
    logDebug(
      `Worker: fresh items existed but all already seen for link ${link.id}`
    );
    return;
  }

  // zapisujemy do DB wszystkie świeże nie-widziane
  await insertLinkItems(link.id, freshNotSeen);

  // wysyłka limitowana
  const toSend = freshNotSeen.slice(0, maxPerLoop);
  const skipped = freshNotSeen.length - toSend.length;

  if (toSend.length) {
    await notifyChatsForLink(link, toSend, skipped, { minBatchItems });
  }

  // przesuwamy last_key na aktualnie najnowszy z listingu
  const newestKey = getItemKey(orderedAll[0]);
  if (newestKey) {
    await updateLastKey(link.id, newestKey);
  }

  // przytnij historię
  const keep = Number(limits?.history_keep_per_link || HISTORY_KEEP_PER_LINK);
  if (Number.isFinite(keep) && keep > 0) {
    await pruneLinkItems(link.id, keep);
  }
}

async function loopOnce() {
  await initDb();
  const links = await getLinksForWorker();
  console.log(`Worker: found links: ${links.length}`);

  // grupujemy per telegram_user_id
  const byUser = new Map(); // tgId(str) -> links[]
  for (const link of links) {
    const tgId = link.telegram_user_id || link.telegramUserId || null;
    const key = tgId ? String(tgId) : "__no_tg__";
    if (!byUser.has(key)) byUser.set(key, []);
    byUser.get(key).push(link);
  }

  for (const [tgId, userLinks] of byUser.entries()) {
    // legacy safety – jakby brak tgId, to lecimy bez limitu
    if (tgId === "__no_tg__") {
      for (const link of userLinks) {
        try {
          await processLink(link);
        } catch (err) {
          console.error(`Worker: error for link ${link.id}`, err);
        }
      }
      continue;
    }

    // limit planu: ile linków usera maks obsługujemy (bez względu na active/inactive w DB – tu i tak mamy tylko active)
    const lim = await getUserLimits(tgId);
    const cap = Number(lim?.links_limit || 0);

    const sorted = [...userLinks].sort((a, b) => Number(a.id) - Number(b.id));
    const toProcess = (cap > 0) ? sorted.slice(0, cap) : sorted;

    if (cap > 0 && sorted.length > cap) {
      console.log(`[user ${tgId}] worker cap links_limit=${cap} active_links_seen=${sorted.length} -> processing=${toProcess.length}`);
    }

    for (const link of toProcess) {
      try {
        await processLink(link);
      } catch (err) {
        console.error(`Worker: error for link ${link.id}`, err);
      }
    }
  }
}


async function main() {
  console.log("Worker start");
  console.log(`[config] LOOP_DELAY_MS=${LOOP_DELAY_MS}ms SLEEP_BETWEEN_ITEMS_MS=${SLEEP_BETWEEN_ITEMS_MS}ms MAX_ITEMS_PER_LINK_PER_LOOP=${MAX_ITEMS_PER_LINK_PER_LOOP}`);

  while (true) {
    try {
      await loopOnce();
    } catch (err) {
      console.error("Worker: loopOnce error", err);
    }
    await sleep(LOOP_DELAY_MS);
  }
}

main().catch((err) => {
  console.error("Worker fatal error", err);
  process.exit(1);
});
