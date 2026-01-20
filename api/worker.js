import "./env.js";
import { createVintedNormalize } from "./src/worker/vinted-normalize.js";
// __FYD_VINTED_TITLE_FROM_URL_V2__
const __vintedN = createVintedNormalize({ normalizeKey: (...a) => normalizeKey(...a) });
const __fydDeriveVintedTitleFromUrl = __vintedN.deriveVintedTitleFromUrl;
const __fydEnsureVintedItemFields = __vintedN.ensureVintedItemFields;
const __fydFixVintedItems = __vintedN.fixVintedItems;


// ---- FYD_LINK_FILTERS_V2 (auto) ----
function __fydToNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : NaN;
}

function __fydNormalizeItemKeyFromUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  const lower = s.toLowerCase();

  // Vinted: /items/<numeric-id>
  if (lower.includes("vinted.") && lower.includes("/items/")) {
    const m = s.match(/\/items\/(\d+)/i);
    if (m && m[1]) return `vinted:${m[1]}`;
  }

  // OLX: ...-IDxxxxxx.html
  if (lower.includes("olx.") && lower.includes("/oferta/")) {
    const m = s.match(/-ID([0-9A-Za-z]+)\.html/i);
    if (m && m[1]) return `olx:${m[1]}`;
  }

  // fallback: bez query/hash
  return s.split("#")[0].split("?")[0];
}

function __fydParsePriceRange(linkUrl) {
  const out = { hasAny: false, from: NaN, to: NaN };
  try {
    const u = new URL(String(linkUrl || ""));
    const sp = u.searchParams;

    // Vinted
    const vFrom = sp.get("price_from");
    const vTo   = sp.get("price_to");

    // OLX (URLSearchParams dekoduje %5B %5D)
    const oFrom = sp.get("search[filter_float_price:from]");
    const oTo   = sp.get("search[filter_float_price:to]");

    const fromRaw = (vFrom != null && vFrom !== "") ? vFrom : ((oFrom != null && oFrom !== "") ? oFrom : "");
    const toRaw   = (vTo   != null && vTo   !== "") ? vTo   : ((oTo   != null && oTo   !== "") ? oTo   : "");

    const f = __fydToNumber(fromRaw);
    const t = __fydToNumber(toRaw);

    if (Number.isFinite(f)) out.from = f;
    if (Number.isFinite(t)) out.to = t;

    out.hasAny = Number.isFinite(out.from) || Number.isFinite(out.to);
  } catch {}
  return out;
}

function __fydFilterAndNormalizeItems(linkUrl, items) {
  const r = __fydParsePriceRange(linkUrl);
  const out = [];
  for (const it0 of (items || [])) {
    const it = it0 || {};
    const u = it.url || it.item_key || "";
    const nk = __fydNormalizeItemKeyFromUrl(u);
    if (!nk) continue;
    it.item_key = nk;

    if (r.hasAny) {
      const p = __fydToNumber(it.price);
      if (!Number.isFinite(p)) continue;
      if (Number.isFinite(r.from) && p < r.from) continue;
      if (Number.isFinite(r.to) && p > r.to) continue;
    }
    out.push(it);
  }
  return out;
}

function __fydRefreshVintedTime(linkUrl) {
  try {
    const u = new URL(String(linkUrl || ""));
    if (!u.hostname.toLowerCase().includes("vinted.")) return String(linkUrl || "");
    if (u.searchParams.has("time")) {
      u.searchParams.set("time", String(Math.floor(Date.now() / 1000)));
    }
    return u.toString();
  } catch {
    return String(linkUrl || "");
  }
}
// ---- /FYD_LINK_FILTERS_V2 ----

// ---- Proxy flag helper (shared) ----
function __fydProxyEnabledBool() {
  const v = String(process.env.PROXY_ENABLED || "").trim().toLowerCase();
  const srv = String(process.env.PROXY_SERVER || "").trim();
  if (!srv) return false;
  return v === "1" || v === "true" || v === "yes";
}







// ---- OLX CloudFront backoff (global) ----
if (globalThis.__olxBackoffUntil == null) globalThis.__olxBackoffUntil = 0;
if (globalThis.__olxCloudfrontHits == null) globalThis.__olxCloudfrontHits = 0;
// ---- OLX CloudFront backoff END ----
// ---- FORCE OLX WWW (disable m.olx.pl) ----
function __fixOlxUrl(u) {
  const s = String(u || "");
  if (!s.includes("olx.pl")) return s;
  try {
    const x = new URL(s);
    if (x.hostname === "m.olx.pl") x.hostname = "www.olx.pl";
    return x.toString();
  } catch {
    return s
      .replace("://m.olx.pl", "://www.olx.pl")
      .replace("//m.olx.pl", "//www.olx.pl");
  }
}
// ---- FORCE OLX WWW END ----
// ---- PROXY config (worker) ----
const PROXY = (() => {
  const enabled = String(process.env.PROXY_ENABLED || "").trim();
  if (!enabled || enabled === "0" || enabled.toLowerCase() === "false") return null;

  // prefer full server url if provided
  let server = String(process.env.PROXY_SERVER || "").trim();

  // else build from host+port
  const host = String(process.env.PROXY_HOST || "").trim();
  const port = String(process.env.PROXY_PORT || "").trim();
    if (!server && host && port) server = `http://${host}:${port}`;
  if (!server) return null;

  const username = String(process.env.PROXY_USERNAME || process.env.PROXY_USER || "").trim();
  const password = String(process.env.PROXY_PASSWORD || process.env.PROXY_PASS || "").trim();

  const proxy = { server };
  if (username) proxy.username = username;
  if (password) proxy.password = password;
  return proxy;
})();




// __FYD_OUTGOING_TEXT_FIX_V1__
function __fydAppendVintedUrl(url) {
  // FYD FIX: nie zmieniamy parametrów linku (OLX/Vinted) – URL ma być 1:1
  return String(url || "").trim();
}


function __fydAppendUrlFromKeyboard(text, payload) {
  try {
    text = String(text ?? "");
    if (text.includes("http://") || text.includes("https://")) return text;

    const kb = payload && payload.reply_markup && payload.reply_markup.inline_keyboard;
    if (!Array.isArray(kb)) return text;

    for (const row of kb) {
      if (!Array.isArray(row)) continue;
      for (const btn of row) {
        const u = btn && typeof btn.url === "string" ? btn.url : "";
        if (u.startsWith("http://") || u.startsWith("https://")) {
          return text + "\n" + u;
        }
      }
    }
    return text;
  } catch {
    return String(text ?? "");
  }
}

function __fydFixOutgoingText(text, payload) {
  text = __fydAppendVintedUrl(text);
  text = __fydAppendUrlFromKeyboard(text, payload);
  return text;
}

import { chromium, request } from "playwright";

/* __FYD_PW_PROXY_PREAUTH_V1__ */
import * as http from "http";
import * as net from "net";

/* __FYD_PW_PREAUTH_CACHE_WRAP_V1__ */
let __FYD_PW_PREAUTH_CACHE = null;
let __FYD_PW_PREAUTH_INFLIGHT = null;
/* __FYD_PW_PREAUTH_CACHE_V3__ */
let __FYD_PW_PREAUTH_PROMISE_V3 = null;
async function __fydStartPreauthProxyIfNeeded() {
  // __FYD_PREAUTH_HARD_DISABLED
  return null;

  /* __FYD_DISABLE_PW_PREAUTH_V1__ */
  // Disabled: prevents spawning local playwright-preauth proxy per request.
  // We rely on Playwright's native proxy auth via launchOpts.proxy (server/username/password).
  return null;

  if (__FYD_PW_PREAUTH_PROMISE_V3) return await __FYD_PW_PREAUTH_PROMISE_V3;
  __FYD_PW_PREAUTH_PROMISE_V3 = (async () => {
    try { return await __fydStartPreauthProxyIfNeeded__impl(); } catch { return null; }
  })();
  return await __FYD_PW_PREAUTH_PROMISE_V3;
}

async function __fydStartPreauthProxyIfNeeded__impl() {
  if (__FYD_PW_PREAUTH_CACHE) return __FYD_PW_PREAUTH_CACHE;
  if (__FYD_PW_PREAUTH_INFLIGHT) return await __FYD_PW_PREAUTH_INFLIGHT;
  __FYD_PW_PREAUTH_INFLIGHT = (async () => {
    const r = await __fydStartPreauthProxyIfNeeded__orig();
    if (r && r.server) __FYD_PW_PREAUTH_CACHE = r;
    return r;
  })();
  try { return await __FYD_PW_PREAUTH_INFLIGHT; }
  finally { __FYD_PW_PREAUTH_INFLIGHT = null; }
}

/* __FYD_PW_PREAUTH_SINGLETON_FROM_LOG_V5__ */

async function __fydStartPreauthProxyIfNeeded__orig(...__args) {

  const g = globalThis;

  if (g.__FYD_PW_PREAUTH_SINGLETON_V5_RESULT) return g.__FYD_PW_PREAUTH_SINGLETON_V5_RESULT;

  if (g.__FYD_PW_PREAUTH_SINGLETON_V5_PROMISE) return await g.__FYD_PW_PREAUTH_SINGLETON_V5_PROMISE;

  g.__FYD_PW_PREAUTH_SINGLETON_V5_PROMISE = (async () => {

    const r = await __fydStartPreauthProxyIfNeeded__orig__impl(...__args);

    g.__FYD_PW_PREAUTH_SINGLETON_V5_RESULT = r;

    return r;

  })();

  return await g.__FYD_PW_PREAUTH_SINGLETON_V5_PROMISE;

}


async function __fydStartPreauthProxyIfNeeded__orig__impl() {
  const en = (() => { const v = String(process.env.PROXY_ENABLED || "").trim().toLowerCase(); return (v === "1" || v === "true" || v === "yes") ? "true" : ""; })();if (!["1", "true", "yes", "on"].includes(en)) return null;

  const upstream = String(process.env.PROXY_SERVER || "").trim();
  const user = String(process.env.PROXY_USERNAME || process.env.PROXY_USER || "").trim();
  const pass = String(process.env.PROXY_PASSWORD || process.env.PROXY_PASS || "").trim();

  if (!upstream || !user || !pass) return null;

  if (/^socks5:\/\//i.test(upstream)) {
    console.warn("[proxy] PROXY_SERVER=socks5://... — Chromium nie wspiera socks5 auth. Ustaw PROXY_SERVER na http://host:port");
    return null;
  }

  let U;
  try {
    U = new URL(upstream);
  } catch {
    console.warn("[proxy] zły PROXY_SERVER:", upstream);
    return null;
  }

  const host = U.hostname;
  const port = Number(U.port || 80);
  const auth = Buffer.from(user + ":" + pass).toString("base64");

  const srv = http.createServer();

  srv.on("connect", (req, clientSocket, head) => {
    const [dstHost, dstPortRaw] = String(req.url || "").split(":");
    const dstPort = Number(dstPortRaw || 443);

    const upstreamSocket = net.connect(port, host, () => {
      upstreamSocket.write(
        "CONNECT " + dstHost + ":" + dstPort + " HTTP/1.1\r\n" +
          "Host: " + dstHost + ":" + dstPort + "\r\n" +
          "Proxy-Authorization: Basic " + auth + "\r\n" +
          "Connection: keep-alive\r\n\r\n"
      );
    });

    upstreamSocket.once("data", (chunk) => {
      const s = chunk.toString("utf8");
      if (!/^HTTP\/1\.[01]\s+200\b/i.test(s)) {
        try {
          clientSocket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n");
        } catch {}
        clientSocket.destroy();
        upstreamSocket.destroy();
        return;
      }

      try {
        clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      } catch {}
      if (head && head.length) upstreamSocket.write(head);

      clientSocket.pipe(upstreamSocket);
      upstreamSocket.pipe(clientSocket);
    });

    upstreamSocket.on("error", () => {
      try {
        clientSocket.destroy();
      } catch {}
    });
    clientSocket.on("error", () => {
      try {
        upstreamSocket.destroy();
      } catch {}
    });
  });

  await new Promise((res) => srv.listen(0, "127.0.0.1", res));
  const localPort = srv.address().port;
  const localServer = "http://127.0.0.1:" + localPort;

  console.log("[proxy] playwright-preauth local=" + localServer + " upstream=" + upstream);
  return { server: localServer, _srv: srv };
}

import {
  initDb,
  getLinksForWorker,
  getSeenItemKeys,
  insertLinkItems,
  updateLastKey,
  pruneLinkItems,
} from "./db.js";
import _fetch from "node-fetch";
import pg from "pg";

const { Pool } = pg;

// Osobny pool tylko do chat_notifications / link_notification_modes / limity dzienne
const notifyPool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool();

// ---- FYD helpers (restored) ----

// ---- key normalization (restored) ----
function cleanKey(x) {
  if (x === null || x === undefined) return "";
  const s = String(x).trim();
  if (!s) return "";
  try {
    if (s.startsWith("http://") || s.startsWith("https://")) {
      const u = new URL(s);
      u.hash = "";
      u.search = "";
      return u.toString();
    }
  } catch {}
  return s;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function __fydParseFeatureValue(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "true") return true;
  if (s === "false") return false;
  if (s !== "" && /^[0-9]+$/.test(s)) return Number(s);
  if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
    try { return JSON.parse(s); } catch {}
  }
  return v;
}

async function getUserLimits(telegramUserId) {
  try {
    const tgid = Number(telegramUserId);
    if (!Number.isFinite(tgid) || tgid <= 0) return null;

    const subQ = `
      SELECT u.id AS user_id,
             COALESCE(p.code, 'free') AS plan_code,
             COALESCE(s.addon_qty, 0) AS addon_qty
      FROM users u
      LEFT JOIN LATERAL (
        SELECT *
        FROM subscriptions
        WHERE user_id = u.id AND status = 'active'
        ORDER BY id DESC
        LIMIT 1
      ) s ON true
      LEFT JOIN plans p ON p.id = s.plan_id
      WHERE u.telegram_user_id = $1
      LIMIT 1
    `;
    const subR = await notifyPool.query(subQ, [tgid]);
    const row = subR?.rows?.[0];
    if (!row) return null;

    const planCode = String(row.plan_code || "free");
    const addonQty = Number(row.addon_qty || 0);

    const pfQ = `
      SELECT pf.feature_key, pf.feature_value
      FROM plan_features pf
      JOIN plans p ON p.id = pf.plan_id
      WHERE p.code = $1
      ORDER BY pf.feature_key
    `;
    const pfR = await notifyPool.query(pfQ, [planCode]);

    const limits = { plan_code: planCode, addon_qty: addonQty };
    for (const r of (pfR?.rows || [])) {
      limits[r.feature_key] = __fydParseFeatureValue(r.feature_value);
    }
    return limits;
  } catch {
    return null;
  }
}
// ---- FYD helpers (restored) END ----


// __FYD_TG_WRAPPED_FETCH_V2
const __FYD_TG_LANG_CACHE = new Map(); // chat_id -> { lang, ts }

async function __fydLangForChat(chatId) {
  const cid = Number(chatId);
  if (!Number.isFinite(cid)) return "en";
  const now = Date.now();
  const hit = __FYD_TG_LANG_CACHE.get(cid);
  if (hit && (now - hit.ts) < 60000) return hit.lang;

  let lang = "";

  // 1) per-chat (grupy też)
  try {
    const r = await notifyPool.query("SELECT language AS lang FROM public.chat_notifications WHERE chat_id=$1 LIMIT 1", [cid]);
    if (r?.rows?.[0]?.lang) lang = String(r.rows[0].lang);
  } catch {}

  // 2) fallback -> users.lang
  if (!lang) {
    try {
      const r = await notifyPool.query("SELECT language AS lang FROM public.users WHERE telegram_user_id=$1 LIMIT 1", [cid]);
      if (r?.rows?.[0]?.lang) lang = String(r.rows[0].lang);
    } catch {}
  }

  const raw = String(lang || "").trim().toLowerCase();
  const base = raw.includes("-") ? raw.split("-")[0] : raw;
  const out = base || "en";
  __FYD_TG_LANG_CACHE.set(cid, { lang: out, ts: now });
  return out;
}

function __fydBtn(lang, key) {
  const L = String(lang || "en");
  const d = {
    en: { disable:"Disable this link", single:"Single", batch:"Batch" },
    pl: { disable:"Wyłącz ten link", single:"Pojedynczo", batch:"Zbiorczo" },
    cs: { disable:"Vypnout tento odkaz", single:"Jednotlivě", batch:"Hromadně" },
  };
  const pack = d[L] || d.en;
  return pack[key] || d.en[key] || String(key);
}

function __fydStripIcons(t) {
  return String(t || "").replace(/^[^\p{L}\p{N}]+/gu, "").trim();
}
function __fydIsDisable(t) {
  t = t.toLowerCase();
  return t.includes("wyłącz") || t.includes("wylacz") || t.includes("disable") || t.includes("vypnout");
}
function __fydIsSingle(t) {
  t = t.toLowerCase();
  return t.includes("pojedyncz") || t.includes("single") || t.includes("jednotliv");
}
function __fydIsBatch(t) {
  t = t.toLowerCase();
  return t.includes("zbiorcz") || t.includes("batch") || t.includes("hromad");
}

function __fydNormalizeInlineKeyboard(obj, lang) {
  if (!obj || !Array.isArray(obj.inline_keyboard)) return obj;
  for (const row of obj.inline_keyboard) {
    if (!Array.isArray(row)) continue;
    for (const btn of row) {
      if (!btn || typeof btn !== "object" || typeof btn.text !== "string") continue;
      const base = __fydStripIcons(btn.text);
      if (__fydIsDisable(base)) btn.text = __fydBtn(lang, "disable");
      else if (__fydIsSingle(base)) btn.text = __fydBtn(lang, "single");
      else if (__fydIsBatch(base)) btn.text = __fydBtn(lang, "batch");
    }
  }
  return obj;
}

function __isFormData(body) {
  return body && typeof body === "object"
    && typeof body.get === "function"
    && typeof body.set === "function"
    && typeof body.entries === "function";
}

function __fydParseBodyToPayload(opts) {
  const headers = (opts && opts.headers) ? opts.headers : {};
  const body = opts ? opts.body : undefined;

  if (__isFormData(body)) return { mode: "formdata", payload: null };

  if (typeof body === "string") {
    try {
      const obj = JSON.parse(body);
      return { mode: "json", payload: obj };
    } catch {}
    try {
      const params = new URLSearchParams(body);
      const obj = Object.fromEntries(params.entries());
      return { mode: "urlencoded", payload: obj };
    } catch {}
    return null;
  }

  try {
    if (body && typeof body === "object" && body.constructor && body.constructor.name === "URLSearchParams") {
      const obj = Object.fromEntries(body.entries());
      return { mode: "urlencoded", payload: obj };
    }
  } catch {}

  return null;
}

function __fydWritePayload(opts, mode, payload) {
  const nopts = Object.assign({}, opts || {});
  if (mode === "json") {
    nopts.body = JSON.stringify(payload);
    return nopts;
  }
  if (payload && typeof payload.reply_markup === "object") {
    payload.reply_markup = JSON.stringify(payload.reply_markup);
  }
  nopts.body = new URLSearchParams(payload).toString();
  return nopts;
}

// UWAGA: od tego miejsca cała reszta pliku używa `fetch` -> idzie przez tę bramkę
const fetch = async (url, opts) => {
  const u = String(url || "");
  if (!u.includes("api.telegram.org")) return _fetch(url, opts);

  const method = String((opts && opts.method) ? opts.method : "GET").toUpperCase();
  if (method !== "POST") return _fetch(url, opts);

  // 1) FormData (sendPhoto / media) — tu V1 przegrywał
  const body = opts ? opts.body : undefined;
  if (__isFormData(body)) {
    const chatId = body.get("chat_id");
    const lang = await __fydLangForChat(chatId);

    const rm = body.get("reply_markup");
    if (rm && typeof rm === "string") {
      try {
        const obj = JSON.parse(rm);
        body.set("reply_markup", JSON.stringify(__fydNormalizeInlineKeyboard(obj, lang)));
      } catch {}
    }

    // preview ON dla sendMessage, jeśli akurat idzie FormData
    if (u.includes("/sendMessage")) {
      try { body.set("disable_web_page_preview", "false"); } catch {}
      try { body.set("link_preview_options", JSON.stringify({ is_disabled: false })); } catch {}
    }

    return _fetch(url, opts);
  }

  // 2) JSON / urlencoded
  const parsed = __fydParseBodyToPayload(opts);
  if (!parsed || (parsed.mode !== "json" && parsed.mode !== "urlencoded")) return _fetch(url, opts);

  const payload = parsed.payload;
  if (!payload || typeof payload !== "object") return _fetch(url, opts);

  const lang = await __fydLangForChat(payload.chat_id);

  if (u.includes("/sendMessage")) {
    payload.disable_web_page_preview = false;
    payload.link_preview_options = { is_disabled: false };
  }

  if (payload.reply_markup) {
    if (typeof payload.reply_markup === "string") {
      try {
        const obj = JSON.parse(payload.reply_markup);
        payload.reply_markup = JSON.stringify(__fydNormalizeInlineKeyboard(obj, lang));
      } catch {}
    } else if (typeof payload.reply_markup === "object") {
      payload.reply_markup = __fydNormalizeInlineKeyboard(payload.reply_markup, lang);
    }
  }

  const nopts = __fydWritePayload(opts, parsed.mode, payload);
  return _fetch(url, nopts);
};
// =================== KONFIG TELEGRAM / WORKER ===================

// ---- FYD_ITEMKEY_NORM_V2 ----
function __fydNormalizeKey(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const lower = s.toLowerCase();

  // already normalized
  if (lower.startsWith("vinted:") || lower.startsWith("olx:")) return s;

  // Vinted: /items/<numeric-id>
  if (lower.includes("vinted.") && lower.includes("/items/")) {
    const m = s.match(/\/items\/(\d+)/i);
    if (m && m[1]) return `vinted:${m[1]}`;
  }

  // OLX: ...-ID<alnum>.html
  if (lower.includes("olx.") && lower.includes("-id")) {
    const m = s.match(/-ID([0-9A-Za-z]+)\.html/i);
    if (m && m[1]) return `olx:${m[1]}`;
  }

  // fallback: strip query/hash
  return s.replace(/[?#].*$/, "");
}

function __fydNormalizeKeys(arr) {
  return (Array.isArray(arr) ? arr : []).map(__fydNormalizeKey).filter(Boolean);
}

function __fydNormalizeItems(items) {
  const out = [];
  for (const it of (Array.isArray(items) ? items : [])) {
    const url = (it && (it.url || it.item_key || it.itemKey)) || "";
    const nk = __fydNormalizeKey(url);
    if (!nk) continue;
    out.push({ ...it, item_key: nk });
  }
  return out;
}
// ---- FYD_ITEMKEY_NORM_V2 END ----



// __FYD_WORKER_TG_OUTBOUND_NORM_V2
async function __fydLangForChatWorker(chatId) {
  let lang = "en";
  try {
    const cid = Number(chatId);
    if (Number.isFinite(cid) && cid > 0) {
      // private chat: chat_id == telegram_user_id
      const r = await notifyPool.query("SELECT language AS lang FROM public.users WHERE telegram_user_id=$1 LIMIT 1", [cid]);
      if (r?.rows?.[0]?.lang) lang = String(r.rows[0].lang);
    }
  } catch {}
  const raw = String(lang || "").trim().toLowerCase();
  const base = raw.includes("-") ? raw.split("-")[0] : raw;
  return base || "en";
}

function __fydTWorker(lang, key) {
  const L = String(lang || "en");
  const d = {
    en: { disable:"Disable this link", single:"Single", batch:"Batch" },
    pl: { disable:"Wyłącz ten link", single:"Pojedynczo", batch:"Zbiorczo" },
    cs: { disable:"Vypnout tento odkaz", single:"Jednotlivě", batch:"Hromadně" },
  };
  const pack = d[L] || d.en;
  return pack[key] || d.en[key] || String(key);
}

function __fydStripIconsWorker(t) {
  return String(t || "").replace(/^[^\p{L}\p{N}]+/gu, "").trim();
}
function __fydIsDisableWorker(t) {
  t = t.toLowerCase();
  return t.includes("wyłącz") || t.includes("wylacz") || t.includes("disable") || t.includes("vypnout");
}
function __fydIsSingleWorker(t) {
  t = t.toLowerCase();
  return t.includes("pojedyncz") || t.includes("single") || t.includes("jednotliv");
}
function __fydIsBatchWorker(t) {
  t = t.toLowerCase();
  return t.includes("zbiorcz") || t.includes("batch") || t.includes("hromad");
}

async function __fydNormalizeTgPayloadWorker(url, payload) {
  try {
    if (!payload || typeof payload !== "object") return payload;

    const lang = await __fydLangForChatWorker(payload.chat_id);

    // sendMessage: preview ON (żeby częściej był obrazek z link preview)
    const ep = String(url || "").split("?")[0];
    if (ep.includes("/sendMessage")) {
      payload.disable_web_page_preview = false;
      payload.link_preview_options = { is_disabled: false };
    }

    // inline buttons: bez ikon + w języku z DB
    let rm = payload.reply_markup;
    if (!rm) return payload;

    let obj = rm;
    let wasString = false;
    if (typeof rm === "string") {
      try { obj = JSON.parse(rm); wasString = true; } catch { return payload; }
    }
    if (!obj || !Array.isArray(obj.inline_keyboard)) return payload;

    for (const row of obj.inline_keyboard) {
      if (!Array.isArray(row)) continue;
      for (const btn of row) {
        if (!btn || typeof btn !== "object" || typeof btn.text !== "string") continue;
        const base = __fydStripIconsWorker(btn.text);
        if (__fydIsDisableWorker(base)) btn.text = __fydTWorker(lang, "disable");
        else if (__fydIsSingleWorker(base)) btn.text = __fydTWorker(lang, "single");
        else if (__fydIsBatchWorker(base)) btn.text = __fydTWorker(lang, "batch");
      }
    }

    payload.reply_markup = wasString ? JSON.stringify(obj) : obj;
    return payload;
  } catch {
    return payload;
  }
}

const __FYD_TG_FETCH_ORIG_V2 = fetch;
async function __fydTgFetch(url, opts) {
  try {
    const u = String(url || "");
    if (!u.includes("api.telegram.org")) return __FYD_TG_FETCH_ORIG_V2(url, opts);

    const method = (opts && opts.method) ? String(opts.method).toUpperCase() : "GET";
    if (method !== "POST") return __FYD_TG_FETCH_ORIG_V2(url, opts);

    const body = opts && opts.body;
    if (typeof body !== "string") return __FYD_TG_FETCH_ORIG_V2(url, opts);

    let payload;
    try { payload = JSON.parse(body); } catch { return __FYD_TG_FETCH_ORIG_V2(url, opts); }

    payload = await __fydNormalizeTgPayloadWorker(u, payload);

    const nopts = Object.assign({}, (opts || {}));
    nopts.body = JSON.stringify(payload);
    return __FYD_TG_FETCH_ORIG_V2(url, nopts);
  } catch {
    return __FYD_TG_FETCH_ORIG_V2(url, opts);
  }
}
const TG = process.env.TELEGRAM_BOT_TOKEN || "";


/* __FYD_PW_PREAUTH_ONCE_V6__ */
async function __fydGetPreauthProxyOnce() { return null; }

/* __FYD_PW_PREAUTH_ONCE_V1__ */
async function __fydGetPreauthProxy() { return null; }


const API_BASE = process.env.API_BASE || "http://api:3000";

// ---- PROXY config (worker) ----
const __PROXY_ON = (() => { const v = String(process.env.PROXY_ENABLED || "").trim().toLowerCase(); return (v === "1" || v === "true" || v === "yes"); })();const PROXY_SERVER = process.env.PROXY_SERVER || "";
const PROXY_USERNAME = process.env.PROXY_USERNAME || process.env.PROXY_USER || "";
const PROXY_PASSWORD = process.env.PROXY_PASSWORD || process.env.PROXY_PASS || "";
const __FYD_PROXY_DUP_V2 =
  (( __PROXY_ON === "1" || __PROXY_ON === "true" || __PROXY_ON === "yes") && PROXY_SERVER)
    ? { server: PROXY_SERVER, username: PROXY_USERNAME, password: PROXY_PASSWORD }
    : null;



// debug logi
const DEBUG = process.env.DEBUG_WORKER === "true" || process.env.DEBUG === "true";

function logDebug(...args) {
  if (DEBUG) console.log(...args);
}

// ---- OLX CloudFront backoff helper ----
async function __olxCloudfrontMaybeBackoff(page) {
  const now = Date.now();
  const until = globalThis.__olxBackoffUntil || 0;
  if (now < until) throw new Error("OLX_BACKOFF_ACTIVE");

  const title = String((await page.title().catch(() => "")) || "");
  const t = title.toLowerCase();
  if (t.includes("request could not be satisfied")) {
    const hits = (globalThis.__olxCloudfrontHits = (globalThis.__olxCloudfrontHits || 0) + 1);
    console.log("[olx] OLX_CLOUDFRONT_BLOCK_DETECTED hits=" + hits + " title=" + title);
    const backoffMs = parseInt(process.env.OLX_BACKOFF_MS || "600000", 10);
    if (hits >= 3) {
      globalThis.__olxBackoffUntil = Date.now() + backoffMs;
      globalThis.__olxCloudfrontHits = 0;
      console.log("[olx] OLX_BACKOFF_SET ms=" + backoffMs);
    }
    throw new Error("OLX_CLOUDFRONT_BLOCK");
  }
}
// ---- OLX CloudFront backoff helper END ----

function __urlStr(u) {
  try {
    if (typeof u === "string") return u;
    if (u && typeof u === "object") {
      if (typeof u.href === "string") return u.href;
      if (typeof u.url === "string") return u.url;
      if (typeof u.toString === "function") return u.toString();
    }
  } catch {}
  return String(u || "");
}


// __FYD_BLOCK_HOSTS_V1__
const __FYD_BLOCK_HOST_RE = /(baxter\.olx\.org|cookielaw\.org|onetrust\.com|doubleclick\.net|googlesyndication\.com|googleadservices\.com|imasdk\.googleapis\.com|btloader\.com|maze\.co|ad-delivery\.net|dns-finder\.com|cdn\.jsdelivr\.net|www\.google\.com|eprivacy-storage\.eu-sharedservices\.olxcdn\.com)$/i;

// ---- FYD: reduce proxy transfer (Playwright) + Vinted previews + link label in offers ----
async function __fydBlockHeavyAssets(target) {
  try {
    await target.route("**/*", (route) => {
      const req = route.request();
      const t = req.resourceType();
        try { const h = new URL(req.url()).hostname.toLowerCase(); if (__FYD_BLOCK_HOST_RE.test(h)) return route.abort(); } catch {}

      // block big trackers/ads (proxy cost)
      try {
        const h = new URL(req.url()).hostname.toLowerCase();
        if (__FYD_BLOCK_HOST_RE.test(h)) return route.abort();
      } catch {}

      // block heavy assets (we only need HTML/JSON)
      if (t === "image" || t === "media" || t === "font") return route.abort();

      return route.continue();
    });
  } catch {}
}

function __fydDecorateItems(link, items) {
  const label = String(link?.label || "").trim();
      return items;
  const prefix = label + " · ";
  return (items || []).map((it) => {
    const title = it?.title != null ? String(it.title) : "";
    return { ...it, title: prefix + title };
  });
}

// Telegram podgląd dla Vinted: dopnij jawny URL do /items/... na końcu wiadomości
// (Telegram robi preview po og:image, ale najpewniej gdy ma "goły" URL w treści).
function __fydEnsureVintedPreviewUrl(text) {
  const s = String(text || "");
  if (!s.includes("vinted.") || !s.includes("/items/")) return s;

  const m1 = s.match(/https?:\/\/[^\s"']*vinted\.[^\s"']*\/items\/[^\s<>"']+/i);
  const m2 = s.match(/href="(https?:\/\/[^"]*vinted\.[^"]*\/items\/[^"]+)"/i);
  const url = (m1 && m1[0]) || (m2 && m2[1]) || "";
  if (!url) return s;

  const esc = url.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  const lineRe = new RegExp("(^|\\n)" + esc + "(\\n|$)");
  if (lineRe.test(s)) return s;

  return s.replace(/\s+$/, "") + "\n" + url;
}

// Konfiguracja workera
const LOOP_DELAY_MS = Number(process.env.LOOP_DELAY_MS || 300000);
const SLEEP_BETWEEN_ITEMS_MS = Number(process.env.SLEEP_BETWEEN_ITEMS_MS || 1200);

const MAX_ITEMS_PER_LINK_PER_LOOP = Number(process.env.MAX_ITEMS_PER_LINK_PER_LOOP || 10);
const MIN_BATCH_ITEMS = 1;

const HISTORY_KEEP_PER_LINK = Number(process.env.HISTORY_KEEP_PER_LINK || 500);

const SOURCE_CONFIG = {
  olx: { maxPerLoop: MAX_ITEMS_PER_LINK_PER_LOOP, minBatchItems: MIN_BATCH_ITEMS },
  vinted: { maxPerLoop: MAX_ITEMS_PER_LINK_PER_LOOP, minBatchItems: MIN_BATCH_ITEMS },
  default: { maxPerLoop: MAX_ITEMS_PER_LINK_PER_LOOP, minBatchItems: MIN_BATCH_ITEMS },
};

function getSourceConfig(source) {
  const key = (source || "").toLowerCase();
  return SOURCE_CONFIG[key] || SOURCE_CONFIG.default;
}

// Bufory dla trybu /zbiorcze – klucz: "userId:chatId:linkId"
const batchBuffers = new Map();

function normalizeOlxUrl(u = "") {
  try {
    let out = String(u ?? "").trim();
    if (!out) return "";
    if (/^ID[0-9A-Za-z]+$/.test(out)) return out;
    if (!/^https?:\/\//i.test(out)) return out;

    const url = new URL(out);
    url.hash = "";

    // zostawiamy query (filtry / order / dist)
    url.hostname = "www.olx.pl";
    url.pathname = url.pathname.replace(/^\/d\//, "/");
    url.pathname = url.pathname.replace(/\/+$/, "");

    // wymuś trailing slash dla listingów .../q-.../
    if (/\/q-[^/]+$/i.test(url.pathname)) url.pathname += "/";

    return url.toString();
  } catch {
    return String(u ?? "").trim();
  }
}




function getItemKey(it) {
  return it?.itemKey || it?.item_key || it?.itemKeyNormalized || null;
}

function takeNewItemsUntilLastKey(items, lastKey) {
  if (!lastKey) return { fresh: [], found: false };

  const out = [];
  let found = false;

  for (const it of items || []) {
    const k = getItemKey(it);
    if (!k) continue;
    if (k === lastKey) {
      found = true;
      break;
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

function normalizeKey(url) {
  try {
    const u = new URL(url);
    const host = (u.hostname || "").toLowerCase();

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
          } catch {}
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

// Minimalne escape HTML dla Telegrama
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Parsowanie ceny
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

  return { price: Number.isFinite(price) ? price : null, currency };
}

// Telegram send (retry 429)

// __FYD_SENDTELEGRAM_LABEL_I18N_V1__
const __FYD_META_CACHE = new Map();

function __fydEsc(x) {
  return String(x || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function __fydNormLang(x) {
  const raw = String(x || "").trim().toLowerCase();
  const base = raw.includes("-") ? raw.split("-")[0] : raw;
  return base || "en";
}

const __FYD_I18N = {
  en: { new_listings: "New listings", full_history: "Full history:", btn_disable: "Disable this link", btn_single: "Single", btn_batch: "Batch" },
  pl: { new_listings: "Nowe ogłoszenia", full_history: "Pełną historię zobaczysz w", btn_disable: "Wyłącz ten link", btn_single: "Pojedynczo", btn_batch: "Zbiorczo" },
  de: { new_listings: "Neue Angebote", full_history: "Voller Verlauf:", btn_disable: "Link deaktivieren", btn_single: "Einzeln", btn_batch: "Sammel" },
  fr: { new_listings: "Nouvelles annonces", full_history: "Historique complet :", btn_disable: "Désactiver ce lien", btn_single: "Unitaire", btn_batch: "Groupé" },
  es: { new_listings: "Nuevos anuncios", full_history: "Historial completo:", btn_disable: "Desactivar este enlace", btn_single: "Individual", btn_batch: "Por lotes" },
  it: { new_listings: "Nuovi annunci", full_history: "Cronologia completa:", btn_disable: "Disattiva questo link", btn_single: "Singolo", btn_batch: "Raggruppato" },
  pt: { new_listings: "Novos anúncios", full_history: "Histórico completo:", btn_disable: "Desativar este link", btn_single: "Individual", btn_batch: "Em lote" },
  nl: { new_listings: "Nieuwe advertenties", full_history: "Volledige geschiedenis:", btn_disable: "Deze link uitzetten", btn_single: "Los", btn_batch: "Batch" },
  ro: { new_listings: "Anunțuri noi", full_history: "Istoric complet:", btn_disable: "Dezactivează acest link", btn_single: "Individual", btn_batch: "În lot" },
  cs: { new_listings: "Nové inzeráty", full_history: "Celá historie:", btn_disable: "Vypnout tento odkaz", btn_single: "Jednotlivě", btn_batch: "Hromadně" },
  hu: { new_listings: "Új hirdetések", full_history: "Teljes előzmény:", btn_disable: "Link kikapcsolása", btn_single: "Egyenként", btn_batch: "Csoportosan" },
};

function __fydT(lang, key) {
  const l = __fydNormLang(lang);
  return (__FYD_I18N[l] && __FYD_I18N[l][key]) || (__FYD_I18N.en && __FYD_I18N.en[key]) || key;
}

async function __fydGetMetaByLinkId(linkId) {
  const now = Date.now();
  const cached = __FYD_META_CACHE.get(linkId);
  if (cached && now - cached.ts < 30 * 1000) return cached;

  try {
    const db = (typeof notifyPool !== "undefined" && notifyPool) ? notifyPool : null;

    if (!db || typeof db.query !== "function") {
      const meta = { id: linkId, label: "", lang: "en", ts: now };
      __FYD_META_CACHE.set(linkId, meta);
      return meta;
    }

    const r = await db.query(
      "SELECT COALESCE(l.label,'') AS label, COALESCE(u.lang,'en') AS lang FROM links l JOIN users u ON u.id=l.user_id WHERE l.id=$1",
      [linkId]
    );
    const row = (r.rows && r.rows[0]) || {};
    const meta = { id: linkId, label: String(row.label || "").trim(), lang: String(row.lang || "en"), ts: now };
    __FYD_META_CACHE.set(linkId, meta);
    return meta;
  } catch {
    const meta = { id: linkId, label: "", lang: "en", ts: now };
    __FYD_META_CACHE.set(linkId, meta);
    return meta;
  }
}

function __fydRewriteTextAndButtons(text, meta, payload) {
  const lang = __fydNormLang(meta.lang);
  let out = String(text || "");

  // 🆕 ...
  out = out.replace(
    /^(?:🆕\s*)?(?:New listings|Nowe ogłoszenia|Neue Angebote|Nouvelles annonces|Nuevos anuncios|Nuovi annunci|Novos anúncios|Nieuwe advertenties|Anunțuri noi|Nové inzeráty|Új hirdetések)\s*$/m,
    "🆕 " + __fydT(lang, "new_listings")
  );

  // 🔍 ... · ID N -> jeśli label istnieje, to podmień tytuł na label
  if (meta.label) {
    const re = new RegExp("^(\\s*(?:🔍|🔎)\\s*)(.*?)\\s*·\\s*ID\\s*" + meta.id + "\\b", "m");
    out = out.replace(re, function (_, pref) {
      return pref + __fydEsc(meta.label) + " · ID " + meta.id;
    });

    // fallback: obsłuż też "ID <b>119</b>"
    const re2 = new RegExp("^(\\s*(?:🔍|🔎)\\s*).*?\\s*·\\s*\\bID\\b\\s*(?:<[^>]*>\\s*)?" + meta.id + "(?:\\s*<\\/[^>]+>)?\\s*$", "m");
    out = out.replace(re2, function (_, pref) {
      return pref + __fydEsc(meta.label) + " · ID " + meta.id;
    });
  }

  // linia z /najnowsze N (jeśli występuje)
  const reHist = new RegExp("^.*\\/najnowsze\\s+" + meta.id + "\\s*$", "m");
  out = out.replace(reHist, __fydT(lang, "full_history") + " /najnowsze " + meta.id);

  // fallback: podmień też różne prefiksy
  const reHist2 = new RegExp("^[^\\n]*\\/najnowsze\\s+" + meta.id + "[^\\n]*$", "m");
  out = out.replace(reHist2, __fydT(lang, "full_history") + " /najnowsze " + meta.id);

  // przyciski inline_keyboard
  try {
    const rm = payload && payload.reply_markup;
    if (rm && Array.isArray(rm.inline_keyboard)) {
      for (const row of rm.inline_keyboard) {
        if (!Array.isArray(row)) continue;
        for (const btn of row) {
          if (!btn || typeof btn.text !== "string") continue;
          const t = btn.text.trim();
          if (t === "Wyłącz ten link" || t === "Disable this link" || t === "🔕 Wyłącz ten link") btn.text = __fydT(lang, "btn_disable");
          if (t === "Pojedynczo" || t === "Single" || t === "📨 Pojedynczo") btn.text = __fydT(lang, "btn_single");
          if (t === "Zbiorczo" || t === "Batch" || t === "📦 Zbiorczo") btn.text = __fydT(lang, "btn_batch");
        }
      }
    }
  } catch {}

  return out;
}

async function sendTelegram(method, payload) {
  /* __FYD_TG_LIMITS_V1__ */
  // Telegram hard limits: sendMessage text 4096 chars, captions ~1024.
  // Truncujemy, żeby nie było 400: "message is too long".
  try {
    if (method === "sendMessage" && payload && typeof payload.text === "string" && payload.text.length > 3900) {
      payload = { ...payload, text: payload.text.slice(0, 3900) + "\n…(obcięte: limit Telegram 4096)" };
    }
    if ((method === "sendPhoto" || method === "sendDocument" || method === "sendVideo" || method === "sendAnimation") &&
        payload && typeof payload.caption === "string" && payload.caption.length > 900) {
      payload = { ...payload, caption: payload.caption.slice(0, 900) + "…" };
    }
  } catch {}
/* __FYD_TG_LIMITS_V1__ END */

  // TG: limit długości + unikaj albumów (ucięte miniatury)
  try {
    if (typeof method === "string" && payload && typeof payload === "object") {
      const __trim = (str, lim) => {
        const t = String(str || "");
        if (t.length <= lim) return t;
        return t.slice(0, lim - 20) + "\n…(ucięto)";
      };

      if (typeof payload.text === "string") payload.text = __trim(payload.text, 3900);
      if (typeof payload.caption === "string") payload.caption = __trim(payload.caption, 900);

      // Albumy -> 1 zdjęcie (sendPhoto), żeby nie było „ucięć” podglądu
      if (method === "sendMediaGroup" && Array.isArray(payload.media) && payload.media.length) {
        const first = payload.media[0] || {};
        const photo = first.media || first.file_id || first.url;
        const caption = first.caption || payload.caption || "";
        method = "sendPhoto";
        payload = {
          chat_id: payload.chat_id,
          photo,
          caption: __trim(caption, 900),
          parse_mode: first.parse_mode || payload.parse_mode,
        };
      }
    }
  } catch {}


  try {
    if (method === "sendMessage" && payload && typeof payload.text === "string") {
      payload.text = __fydFixOutgoingText(payload.text, payload);
    }
    if (method === "sendPhoto" && payload && typeof payload.caption === "string") {
      payload.caption = __fydFixOutgoingText(payload.caption, payload);
    }
  } catch {}

  // label + i18n nagłówków
  try {
    if (method === "sendMessage" && payload && typeof payload.text === "string") {
      const mId = String(payload.text).match(/\bID\b\s*(?:<[^>]*>\s*)?(\d{1,9})/);
      if (mId) {
        const linkId = Number(mId[1]);
        if (Number.isFinite(linkId) && linkId > 0) {
          const meta = await __fydGetMetaByLinkId(linkId);
          payload.text = __fydRewriteTextAndButtons(payload.text, meta, payload);
        }
      }
    }
  } catch {}

  if (!TG) {
    console.error("sendTelegram: brak TELEGRAM_BOT_TOKEN – nie wysyłam");
    return;
  }

  const url = `https://api.telegram.org/bot${TG}/${method}`;

  while (true) {
    try {
      const res = await __fydTgFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => "");

      if (res.status === 429) {
        let retry = 30;
        try {
          const data = JSON.parse(text);
          if (data?.parameters?.retry_after) retry = Number(data.parameters.retry_after) || retry;
        } catch {}
        console.warn(`sendTelegram: 429 retry_after=${retry}s`);
        await sleep(retry * 1000);
        continue;
      }

      if (!res.ok) {
        console.error("sendTelegram: HTTP error", res.status, res.statusText, text);
      }

      break;
    } catch (err) {
      console.error("sendTelegram: exception", err);
      await sleep(2000);
      break;
    }
  }
}

function formatLinkHeader(link) {
  const src = (link.source || detectSource(link.url) || "").toUpperCase();
  let label = link.label || link.name || "";
  if (!label) {
    if (src === "OLX") label = "OLX wyszukiwanie";
    else if (src === "VINTED") label = "Vinted wyszukiwanie";
    else label = link.url || "Monitoring";
  }
  const idPart = link.id ? ` · <i>ID ${link.id}</i>` : "";
  return `🔍 <b>${escapeHtml(label)}</b>${idPart}`;
}

function hiddenLink(url) {
  return `<a href="${escapeHtml(url)}">\u200B</a>`;
}

// __FYD_CLEAN_TITLE_V1__
// OLX/Vinted potrafią mieć w "title" kilka linii (np. cena, 'do negocjacji').
// Żeby nie było śmieci w wiadomościach: bierzemy tylko pierwszą sensowną linię i czyścimy whitespace.
function __fydCleanTitle(raw) {
  const s = String(raw || "").replace(/\r/g, "").trim();
  if (!s) return "";
  const first = s.split("\n").map(x => String(x || "").trim()).filter(Boolean)[0] || "";
  return first.replace(/\s+/g, " ").trim();
}
// __FYD_CLEAN_TITLE_V1__ END

// __FYD_BTN_I18N_WORKER_V1__
function __fydLangBaseBtn(x) {
  const raw = String(x || "").trim().toLowerCase();
  return raw.includes("-") ? raw.split("-")[0] : (raw || "en");
}
function __fydBtnText(lang, key) {
  const L = __fydLangBaseBtn(lang) || "en";
  const dict = {
    en: { disable:"Disable this link", single:"Single", batch:"Batch" },
    pl: { disable:"Wyłącz ten link", single:"Pojedynczo", batch:"Zbiorczo" },
    de: { disable:"Diesen Link deaktivieren", single:"Einzeln", batch:"Gebündelt" },
    fr: { disable:"Désactiver ce lien", single:"Individuel", batch:"Groupé" },
    es: { disable:"Desactivar este enlace", single:"Individual", batch:"Agrupado" },
    it: { disable:"Disattiva questo link", single:"Singolo", batch:"Raggruppato" },
    pt: { disable:"Desativar este link", single:"Individual", batch:"Agrupado" },
    ro: { disable:"Dezactivează acest link", single:"Individual", batch:"Grupat" },
    nl: { disable:"Deze link uitschakelen", single:"Enkel", batch:"Gebundeld" },
    cs: { disable:"Vypnout tento odkaz", single:"Jednotlivě", batch:"Hromadně" },
    sk: { disable:"Vypnúť tento odkaz", single:"Jednotlivo", batch:"Hromadne" },
    hu: { disable:"Link kikapcsolása", single:"Egyenként", batch:"Csoportosan" },
    hr: { disable:"Isključi ovu poveznicu", single:"Pojedinačno", batch:"Skupno" },
    sr: { disable:"Isključi ovu vezu", single:"Pojedinačno", batch:"Zbirno" },
    bs: { disable:"Isključi ovaj link", single:"Pojedinačno", batch:"Zbirno" },
    uk: { disable:"Вимкнути це посилання", single:"Окремо", batch:"Пакетом" },
    ru: { disable:"Отключить эту ссылку", single:"По одной", batch:"Пакетом" },
  };
  const d = dict[L] || dict.en;
  return d[key] || dict.en[key] || String(key);
}


async function tgSendItem(chatId, link, item, userLang) {
  const src = (link.source || detectSource(link.url) || "").toLowerCase();

  const lang = __fydLangBaseBtn(userLang || "en");

  // twarde ujednolicenie Vinted itemów przed formatowaniem single
  if (src === "vinted") item = __fydEnsureVintedItemFields(item);
  /* __FYD_PHOTO_FALLBACK_V1__ */
  try {
    if (item && !item.photo) {
      item.photo = item.photo_url || item.photoUrl || item.image || item.image_url || item.thumbnail || item.thumb || null;
    }
  } catch {}

  const header = formatLinkHeader(link);

  const __rawTitle =
    String(item?.title || item?.name || item?.itemTitle || "").trim() ||
    (src === "vinted" ? (__fydDeriveVintedTitleFromUrl(item?.url) || "") : "");
  const title = __fydCleanTitle(__rawTitle);
let caption = `${header}\n\n<b>${escapeHtml(title || "")}</b>\n`;

  if (item.price != null) {
    const priceStr = `${item.price} ${item.currency || ""}`.trim();
    caption += `\n💰 ${escapeHtml(priceStr)}`;
  }
  if (item.brand) caption += `\n🏷️ ${escapeHtml(item.brand)}`;
  if (item.size) caption += `\n📏 ${escapeHtml(item.size)}`;
  if (item.condition) caption += `\n✨ ${escapeHtml(item.condition)}`;

  // wymagane: pełny URL zawsze w treści + preview (hidden link)
  const url = String(item.url || "").trim();
  caption += `\n\n${hiddenLink(url)}${escapeHtml(url)}`;

  const keyboard = [
    [{ text: "URL", url }],
    [{ text: __fydBtnText(lang, "disable"), callback_data: `lnmode:${link.id}:off` }],
    [
      { text: __fydBtnText(lang, "single"), callback_data: `lnmode:${link.id}:single` },
      { text: __fydBtnText(lang, "batch"), callback_data: `lnmode:${link.id}:batch` },
    ],
  ];

  const replyMarkup = { inline_keyboard: keyboard };

  const photo = (item && (item.photoUrl || item.photo)) || null;
  const canSendPhoto =
    src === "vinted" &&
    typeof photo === "string" &&
    /^https?:\/\//i.test(photo);

  if (canSendPhoto) {
    await sendTelegram("sendPhoto", {
      chat_id: chatId,
      photo,
      caption,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    });
  } else {
    await sendTelegram("sendMessage", {
      chat_id: chatId,
      text: caption,
      parse_mode: "HTML",
      disable_web_page_preview: false,
      reply_markup: replyMarkup,
    });
  }

  await sleep(SLEEP_BETWEEN_ITEMS_MS);
}

function __itemOrderKey(item) {
  if (!item) return 0;

  const v =
    item.publishedMs ?? item.published_ms ??
    item.publishedAt ?? item.published_at ??
    item.createdAtTs ?? item.created_at_ts ??
    item.createdAt ?? item.created_at ??
    item.updatedAtTs ?? item.updated_at_ts ??
    item.firstSeenAt ?? item.first_seen_at ??
    item.seenAt ?? item.seen_at ??
    item.ts ?? item.timestamp ?? item.time;

  if (v != null) {
    if (typeof v === "number") return v < 1000000000000 ? v * 1000 : v;
    const ms = Date.parse(String(v));
    if (Number.isFinite(ms)) return ms;
  }

  const idv = item.id ?? item.itemId ?? item.offerId ?? item.olxId ?? item.vintedId;
  if (typeof idv === "number") return idv;

  const sk = item.sortKey ?? item.sort_key;
  if (typeof sk === "number") return sk;

  return 0;
}

function sortItemsNewestFirst(items) {
      return items;

  const rows = items.map((it, idx) => {
    const raw =
      it?.listed_at || it?.listedAt ||
      it?.created_at || it?.createdAt ||
      it?.published_at || it?.publishedAt ||
      it?.first_seen_at || it?.firstSeenAt ||
      it?.first_seen || it?.firstSeen ||
      null;

    let ts = 0;
    if (typeof raw === "number") ts = raw > 10_000_000_000 ? raw : raw * 1000; // s->ms
    else if (typeof raw === "string" && raw.trim()) {
      const t = Date.parse(raw);
      ts = Number.isFinite(t) ? t : 0;
    }
    return { it, idx, ts };
  });

  const hasAnyTs = rows.some((r) => r.ts > 0);
      return items; // respektuj kolejność z URL/scrapera

  rows.sort((a, b) => (b.ts - a.ts) || (a.idx - b.idx));
  return rows.map((r) => r.it);
}


function buildBatchMessage(link, items, skippedExtra = 0) {
  items = sortItemsNewestFirst(items);
  const header = formatLinkHeader(link);

  // Telegram sendMessage hard limit = 4096 chars.
  // Używamy bezpiecznego limitu, żeby NIGDY nie uciąć URL-a.
  const MAX = 3900;

  const safeFooter = (extraCount) => {
    let t = "";
    if (extraCount > 0) t += `+ ${extraCount} dodatkowych ofert.\n\n`;
    t += `Pełną historię zobaczysz w /najnowsze ${link.id}`;
    return t;
  };

  let text = `🆕 Nowe ogłoszenia\n${header}\n\n`;

  const arr = Array.isArray(items) ? items : [];
  let kept = 0;

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i] || {};
    const title = escapeHtml(__fydCleanTitle(String(item.title || item.name || item.itemTitle || "")));
    const priceStr = item.price != null ? `${item.price} ${item.currency || ""}`.trim() : "";

    // URL zawsze jako osobna linia i NIGDY nie ucinamy go w połowie
    const urlLine = String(item.url || "").trim();
    const block =
      `${i + 1}. ${title}\n` +
      (priceStr ? `💰 ${escapeHtml(priceStr)}\n` : "") +
      `${escapeHtml(urlLine)}\n\n`;

    const remaining = (arr.length - (i + 1)) + (Number(skippedExtra) || 0);
    const candidate = (text + block + safeFooter(remaining)).trim();

    if (candidate.length > MAX) break;

    text += block;
    kept += 1;
  }

  const extraCount = (arr.length - kept) + (Number(skippedExtra) || 0);
  text = (text + safeFooter(extraCount)).trim();

  // Ostateczny bezpiecznik: jeśli nawet header+footer są długie (bardzo rzadkie)
  if (text.length > MAX) {
    // usuń wszystko poza nagłówkiem i footerem
    const base = `🆕 Nowe ogłoszenia\n${header}\n\n`;
    const footer = safeFooter((arr.length) + (Number(skippedExtra) || 0));
    text = (base + footer).trim();
  }

  return text;
}

function makeBatchKey(chatId, userId, linkId) {
  return `${userId}:${chatId}:${linkId}`;
}

// ---- FYD_DAILYCOUNT_BUMP_V1 ----
// Zlicza dzienne powiadomienia w public.chat_notifications (dla /status)
async function __fydBumpChatDailyCount(db, chatId, userId, inc = 1) {
  const cid = String(chatId || "").trim();
  const uid = Number(userId);
  const step = Number(inc) || 1;
  if (!cid || !Number.isFinite(uid) || uid <= 0 || step <= 0) return;

  try {
    console.log(
      "[daily_bump_debug] chat=" + cid +
      " user=" + uid +
      " inc=" + step +
      " date=" + new Date().toISOString()
    );
    await db.query(
      `
      UPDATE chat_notifications
      SET daily_count = CASE
            WHEN daily_count_date IS NULL OR daily_count_date::date <> CURRENT_DATE
              THEN $1
            ELSE COALESCE(daily_count, 0) + $1
          END,
          daily_count_date = CURRENT_DATE,
          updated_at = NOW()
      WHERE chat_id = $2 AND user_id = $3
      `,
      [step, cid, uid]
    );
  } catch (e) {
    console.error("WARN: __fydBumpChatDailyCount failed:", e?.message || e);
  }
}

// ---- FYD_DAILYCOUNT_BUMP_V1 END ----



async function notifyChatsForLink(link, items, skippedExtra, opts = {}) {
  console.log(`[notify_debug_start] link_id=${link.id} items_in=${(items || []).length}`);
  if (!items || !items.length) return;

  items = sortItemsNewestFirst(items);
  const minBatchItems = opts.minBatchItems || MIN_BATCH_ITEMS;

    const __warsawDay = (d) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Warsaw",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d instanceof Date ? d : new Date());

  const __warsawHour = () =>
    Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Warsaw",
        hour: "2-digit",
        hour12: false,
      }).format(new Date())
    );

  const todayStr = __warsawDay();
  const nowHour = __warsawHour();

  try {
    const res = await notifyPool.query(
      `
      SELECT
        cn.chat_id,
        cn.user_id,
        cn.notify_from AS chat_notify_from,
        l.notify_from AS link_notify_from,
        cn.enabled,
        cn.mode AS chat_mode,
        COALESCE(NULLIF(cn.language,''), NULLIF(u.lang,''), NULLIF(u.language,''), 'en') AS lang,
        cn.daily_count,
        cn.daily_count_date,
        LOWER(COALESCE(lnm.mode, cn.mode)) AS effective_mode,
        lnm.mode AS link_mode,
        qh.quiet_enabled,
        qh.quiet_from,
        qh.quiet_to
      FROM links l
      JOIN chat_notifications cn
        ON cn.user_id = l.user_id
       AND (l.chat_id IS NULL OR cn.chat_id = l.chat_id)
      JOIN users u
        ON u.id = cn.user_id
      LEFT JOIN LATERAL (
        SELECT mode
        FROM link_notification_modes
        WHERE user_id = cn.user_id
          AND chat_id = cn.chat_id
          AND link_id = l.id
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 1
      ) lnm ON TRUE
      LEFT JOIN chat_quiet_hours qh
        ON qh.chat_id = cn.chat_id
      WHERE l.id = $1
      `,
      [link.id]
    );

    if (!res.rowCount) {
      logDebug(`notifyChatsForLink: link ${link.id} – brak chat_notifications`);
      return;
    }

    let chatRows = res.rows.map((row) => ({
      ...row,
      mode: (row.effective_mode || "single").toLowerCase(),
    }));

    // 1) wyłączone + OFF
    chatRows = chatRows.filter((row) => row.enabled && row.mode !== "off");
    if (!chatRows.length) return;

                // --- FYD: respect /dodaj + /on + panel-enable markers (notify_from) ---
        try {
          const beforeN = Array.isArray(items) ? items.length : 0;
          console.log("[notify_from_debug] link_id=" + link.id + " beforeN=" + beforeN + " todayStr=" + todayStr);

          if (Array.isArray(items) && items.length) {
            const filtered = items.filter((it) => {
              const raw =
                it?.first_seen_at || it?.firstSeenAt ||
                it?.listed_at || it?.listedAt ||
                it?.created_at || it?.createdAt ||
                it?.published_at || it?.publishedAt ||
                null;

              // brak timestampu -> nie blokujemy
              if (!raw) return true;

              let ts = 0;
              if (typeof raw === "number") {
                ts = raw > 10_000_000_000 ? raw : raw * 1000;
              } else if (typeof raw === "string" && raw.trim()) {
                const t = Date.parse(raw);
                ts = Number.isFinite(t) ? t : 0;
              }
              if (!ts) return true;

              // GLOBALNY RESET O PÓŁNOCY (Warszawa): tylko dzisiejszy dzień
              let itemDayStr = null;
              try {
                itemDayStr = new Intl.DateTimeFormat("en-CA", {
                  timeZone: "Europe/Warsaw",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(new Date(ts));
              } catch {
                itemDayStr = null;
              }

              if (itemDayStr && itemDayStr < todayStr) {
                // starsze niż dzisiejszy dzień – wywalamy
                return false;
              }

              // UWAGA: notify_from (chat_notify_from / link_notify_from) NA RAZIE WYŁĄCZONY
              // jeśli będziemy chcieli przywrócić, dokładamy tu warunek ts >= __startAt

              return true;
            });

            const removed = beforeN - filtered.length;
            console.log("[notify_from_debug] link_id=" + link.id + " afterN=" + filtered.length + " removed=" + removed + " todayStr=" + todayStr);

            if (removed > 0) skippedExtra = (skippedExtra || 0) + removed;
            items = filtered;
          }
        } catch (e) {
          console.error("[notify_from] filter error:", e);
        }

    if (!items || !items.length) return;

    for (const row of chatRows) {
      const chatId = row.chat_id;
      const userId = row.user_id;
      const rowLang = __fydLangBaseBtn(row.lang || "en");

      // 2) cisza nocna
      const quietEnabled = !!row.quiet_enabled;
      const quietFrom = typeof row.quiet_from === "number" ? row.quiet_from : 22;
      const quietTo = typeof row.quiet_to === "number" ? row.quiet_to : 7;

      if (quietEnabled && isHourInQuietRange(nowHour, quietFrom, quietTo)) {
        logDebug(`notify_debug_quiet chat=${chatId} user=${userId} from=${quietFrom} to=${quietTo} now=${nowHour}`);
        continue;
      }

      // 3) dzienny limit – na podstawie chat_notifications (realnie wysłane oferty z tego czatu)
      const maxDaily = await getDailyLimitForUserId(notifyPool, userId);

      let dailyCount = 0;
      let dailyDateStr = null;
      try {
        const dc = Number(row.daily_count || 0);
        const ddate = row.daily_count_date;
        try {
          if (ddate) {
            const d = new Date(ddate);
            if (Number.isFinite(d.getTime())) {
              // YYYY-MM-DD – spójne z todayStr
              dailyDateStr = d.toISOString().slice(0, 10);
            } else {
              dailyDateStr = String(ddate).slice(0, 10);
            }
          } else {
            dailyDateStr = null;
          }
        } catch {
          dailyDateStr = ddate ? String(ddate).slice(0, 10) : null;
        }
        // porównujemy datę z Warsaw (todayStr) z datą w chat_notifications
        if (dailyDateStr === todayStr) {
          if (Number.isFinite(dc) && dc >= 0) {
            dailyCount = dc;
          }
        }
      } catch (e) {
        try {
          console.error("[daily_count_fetch_err] user_id=" + userId, e?.message || e);
        } catch {}
      }

      logDebug(`notify_debug_daily chat=${chatId} user=${userId} count=${dailyCount} date=${dailyDateStr} max=${maxDaily}`);

      if (dailyCount >= maxDaily) {
        logDebug(`notify_debug_limit chat=${chatId} user=${userId} count=${dailyCount} max=${maxDaily}`);
        console.log(
          `[notify_debug_limit] link_id=${link.id} chat_id=${chatId} user_id=${userId} dailyCount=${dailyCount} maxDaily=${maxDaily} today=${todayStr}`
        );
        continue;
      }

      const mode = row.mode === "batch" ? "batch" : "single";
      let sentSomething = false;
      let sentCount = 0;

      if (mode === "single") {
        const remaining = Math.max(0, maxDaily - dailyCount);
        if (remaining <= 0) continue;

        const slice = items.slice(0, remaining);
        for (const item of slice) {
          await tgSendItem(chatId, link, item, rowLang);
          await __fydBumpChatDailyCount(notifyPool, chatId, userId, 1);
          sentSomething = true;
          sentCount += 1;
        }
      } else {
        const key = makeBatchKey(chatId, userId, link.id);
        const existing = batchBuffers.get(key) || { items: [], skippedExtra: 0 };

        existing.items.push(...items);
        if (typeof skippedExtra === "number" && skippedExtra > 0) {
          existing.skippedExtra += skippedExtra;
        }

        if (existing.items.length < minBatchItems && existing.skippedExtra === 0) {
          // za mało ogłoszeń do sensownego batcha – buforujemy dalej
          batchBuffers.set(key, existing);
        } else {
          const totalOffers = existing.items.length + (existing.skippedExtra || 0);
          const remaining = Math.max(0, maxDaily - dailyCount);

          if (remaining <= 0 || totalOffers <= 0) {
            // limit wybity albo zero ofert – czyścimy bufor i nic nie wysyłamy
            batchBuffers.delete(key);
          } else {
            const allowedOffers = Math.min(remaining, totalOffers);

            // jeżeli mamy więcej ofert niż możemy wysłać w limicie – przytnij do allowedOffers
            if (totalOffers > allowedOffers) {
              if (existing.items.length > allowedOffers) {
                existing.items = existing.items.slice(0, allowedOffers);
              }
              // nadwyżka poza limitem – ignorujemy, nie nabijamy jej do licznika
              existing.skippedExtra = 0;
            }

            const inc = existing.items.length + (existing.skippedExtra || 0);

            if (inc > 0) {
              const text = buildBatchMessage(link, existing.items, existing.skippedExtra);
              await sendTelegram("sendMessage", {
                chat_id: chatId,
                text,
                parse_mode: "HTML",
                disable_web_page_preview: false,
                reply_markup: {
                  inline_keyboard: [
                    [{ text: __fydBtnText(rowLang, "disable"), callback_data: `lnmode:${link.id}:off` }],
                    [
                      { text: __fydBtnText(rowLang, "single"), callback_data: `lnmode:${link.id}:single` },
                      { text: __fydBtnText(rowLang, "batch"), callback_data: `lnmode:${link.id}:batch` },
                    ],
                  ],
                },
              });
              await __fydBumpChatDailyCount(notifyPool, chatId, userId, inc);
              batchBuffers.delete(key);
              sentSomething = true;
            } else {
              batchBuffers.delete(key);
            }
          }
        }
      }

      if (sentSomething) {
        await notifyPool.query(
          `
          UPDATE chat_notifications
          SET last_notified_at = NOW(),
              updated_at = NOW()
          WHERE chat_id = $1 AND user_id = $2
          `,
          [chatId, userId]
        );
      }
    }
  } catch (err) {
    console.error("Błąd notifyChatsForLink:", err);
  }
}
// ---- FYD: daily notifications limit (used by notifyChatsForLink) ----
async function getDailyLimitForUserId(db, userId) {
  const uid = Number(userId);
  if (!Number.isFinite(uid) || uid <= 0) return 200;

  const baseFromPlan = (planCode) => {
    const p = String(planCode || "").toLowerCase();
    if (p === "platinum") return 200;
    if (p === "growth" || p === "pro") return 400;
    if (p === "starter" || p === "basic") return 200;
    if (p === "trial") return 200;
    return 200;
  };

  let planCode = "";
  let dailyFromView = 0;

  try {
    const r = await db.query(
      `SELECT
         COALESCE(daily_notifications_limit, daily_notifications, 0) AS daily,
         COALESCE(plan_code, plan, code, '') AS plan_code
       FROM user_entitlements_v
       WHERE user_id=$1
       LIMIT 1`,
      [uid]
    );
    if (r && r.rows && r.rows.length) {
      dailyFromView = Number(r.rows[0].daily || 0);
      planCode = r.rows[0].plan_code || "";
    }
  } catch (e) {
    console.log("[daily_limit_debug_err] user_id=" + uid, e?.message || e);
  }

  let addons = 0;
  try {
    const rAdd = await db.query(
      `SELECT COALESCE(SUM(COALESCE(addon_qty,0)),0)::int AS n
       FROM subscriptions
       WHERE user_id=$1 AND status='active'`,
      [uid]
    );
    addons = Number(rAdd.rows?.[0]?.n ?? 0) || 0;
    if (!Number.isFinite(addons) || addons < 0) addons = 0;
  } catch (e) {
    console.log("[daily_limit_addons_err] user_id=" + uid, e?.message || e);
  }

  let maxDaily = 0;
  if (Number.isFinite(dailyFromView) && dailyFromView > 0) {
    maxDaily = dailyFromView;
  } else {
    maxDaily = baseFromPlan(planCode) + addons * 100;
  }

  if (!Number.isFinite(maxDaily) || maxDaily <= 0) maxDaily = 200;

  console.log("[daily_limit_debug_v2] user_id=" + uid +
    " plan_code=" + planCode +
    " daily_from_view=" + dailyFromView +
    " addons=" + addons +
    " maxDaily=" + maxDaily);

  return maxDaily;
}

// ---- FYD: daily notifications limit END ----

// ---------- Scraping OLX ----------
async function scrapeOlx(url, __fydAttempt = 1, __fydForceNoProxy = false) {
  url = normalizeOlxUrl(String(url || ""));

  const __fydProxyEnabled = (() => { const v = String(process.env.PROXY_ENABLED || "").trim().toLowerCase(); return (v === "1" || v === "true" || v === "yes"); })();
// __FYD_OLX_RETRY_WRAPPER_V2__
  // __FYD_SCRAPE_OLX_RELAUNCH_V1__
// __FYD_PROXY_FIX_V3__
  // FYD proxy config (single source of truth, no TDZ)
  const __fydProxyOnRaw = String(process.env.PROXY_ENABLED || "").trim().toLowerCase();
  const __fydProxyEnabledV3 =
    (__fydProxyOnRaw === "1" || __fydProxyOnRaw === "true" || __fydProxyOnRaw === "yes" || __fydProxyOnRaw === "on") &&
    String(process.env.PROXY_SERVER || "").trim();

  const __fydProxyOpts = __fydProxyEnabledV3
    ? {
        server: String(process.env.PROXY_SERVER || "").trim(),
        username: String(process.env.PROXY_USERNAME || process.env.PROXY_USER || "").trim(),
        password: String(process.env.PROXY_PASSWORD || process.env.PROXY_PASS || "").trim(),
      }
    : undefined;

  // Robust: relaunch browser on crashes + last attempt without proxy (OLX często nie lubi proxy)
  const baseArgs = ["--no-sandbox", "--disable-dev-shm-usage"];

  const makeContext = async (useProxy) => {
    const launchOpts = { args: baseArgs.slice() };
    // FYD: proxy only for Vinted (OLX without proxy)
    if (false && useProxy && __fydProxyOpts) launchOpts.proxy = __fydProxyOpts;

    await __fydChromiumGuard("pw");

    const browser = await chromium.launch(launchOpts);
    const context = await browser.newContext({
  proxy: (useProxy && __fydProxyOpts) ? __fydProxyOpts : undefined,

      locale: "pl-PL",
      timezoneId: "Europe/Warsaw",
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    context.setDefaultTimeout(45000);
    context.setDefaultNavigationTimeout(45000);
    return { browser, context };
  };

  const setupPage = async (p) => {
    try {
      await p.route(/.*/i, (route) => {
        const t = route.request().resourceType();
        try { const h = new URL(route.request().url()).hostname.toLowerCase(); if (__FYD_BLOCK_HOST_RE.test(h)) return route.abort(); } catch {}
        if (t === "image" || t === "media" || t === "font") return route.abort();
        return route.continue();
      });
    } catch {}
    p.setDefaultNavigationTimeout(60000);
    p.setDefaultTimeout(60000);
  };

  function deriveOlxTitleFromUrl(u) {
    try {
      const uu = new URL(u);
      const parts = uu.pathname.split("/").filter(Boolean);
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

  let lastErr = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const useProxy = (!__fydForceNoProxy) && (attempt === 2) && !!__fydProxyOpts; // OLX: attempt2 proxy fallback
    console.log(`[olx] attempt /2 START (proxy=${useProxy ? "on" : "off"}) url=${normalizeOlxUrl(normalizeOlxUrl(url))}`);

    const __now = Date.now();
    const __until = globalThis.__olxBackoffUntil || 0;
    if (__now < __until) {
      const __last = globalThis.__olxBackoffLastLog || 0;
      if (__now - __last > 30000) {
        globalThis.__olxBackoffLastLog = __now;
        console.log(`[olx] OLX_BACKOFF_ACTIVE left_ms=${__until - __now}`);
      }
      return [];
    }
    try { console.log(`[olx] attempt /2 start (proxy=${useProxy ? "on" : "off"}) url=${normalizeOlxUrl(normalizeOlxUrl(url))}`); } catch {}


    let browser = null;
    const __closeAll = async () => {
      try { if (page) await page.close().catch(() => null); } catch {}
      try { if (context) await context.close().catch(() => null); } catch {}
      try { if (browser) await browser.close().catch(() => null); } catch {}
    };

    let context = null;
    let page = null;

    try {
      ({ browser, context } = await makeContext(useProxy));
      page = await context.newPage();

      // blokuj ciężkie zasoby
      try {
        await page.route("**/*", (route) => {
          const t = route.request().resourceType();
        try { const h = new URL(route.request().url()).hostname.toLowerCase(); if (__FYD_BLOCK_HOST_RE.test(h)) return route.abort(); } catch {}
          if (t === "image" || t === "media" || t === "font") return route.abort();
          return route.continue();
        });
      } catch {}
      // await __fydBlockHeavyAssets(page); // DISABLED: breaks OLX dynamic loading
      // await setupPage(page); // DISABLED for OLX (debug)

      // nawigacja
      // __FYD_OLX_START_V2__
      console.log(`[olx] attempt /2 START (proxy=${useProxy ? "on" : "off"}) url=${normalizeOlxUrl(normalizeOlxUrl(url))}`);
            const navUrl = String(url || "").replace(/^https?:\/\/www\.olx\.pl/i, "https://www.olx.pl");
      await page.goto(__fixOlxUrl(navUrl), { waitUntil: "domcontentloaded", timeout: 60000 });
// __FYD_OLX_READY_LOG_V2__
      try { console.log(`[olx] ready (proxy=${useProxy ? "on" : "off"}) url=${page.url()}`); } catch {}
      // __FYD_OLX_READY_V1__
      // __FYD_OLX_AFTER_GOTO_V1__
      try {
        const __t = await page.title().catch(()=>"(no title)");
        const __u = page.url();
        const __cards = await page.locator('div[data-cy="l-card"]').count().catch(()=>-1);
        const __offers = await page.locator('a[href*="/d/oferta/"], a[href*="/oferta/"]').count().catch(()=>-1);
        console.log(`[olx] after_goto title=${__t} cards=${__cards} offerLinks=${__offers} url=${__u}`);

    await __olxCloudfrontMaybeBackoff(page);
        globalThis.__olxCloudfrontHits = 0;
        // __FYD_OLX_FAST_RETURN_V10__
        try {
          if (typeof page !== "undefined" && page && page.$$eval) {
            const __fydLinks = await page.$$eval('a[href*="/d/oferta/"]', (as) => {
              const out = [];
              for (const a of as) {
                const href = a && a.href ? String(a.href) : "";
                if (href) out.push(href);
              }
              return Array.from(new Set(out));
            });
            if (Array.isArray(__fydLinks) && __fydLinks.length) {
              console.log(`[olx] fast_return links=${__fydLinks.length}`);
              return __fydLinks;
            }
          }
        } catch (e) {}

      } catch {}

      // __FYD_OLX_READY_LOG_V1__
      try {
        console.log(`[olx] ready (proxy=${useProxy ? "on" : "off"}) url=${page.url()}`);
      } catch {}

  try {
    const __fydCookieBtn = page
      .locator('#onetrust-accept-btn-handler, button:has-text("Zgadzam"), button:has-text("Akceptuj"), button:has-text("Accept")')
      .first();
    if ((await __fydCookieBtn.count()) > 0) await __fydCookieBtn.click({ timeout: 3000 });
  } catch {}
  try {
  const __t = await page.title().catch(()=>"(no title)");
  const __u = page.url();
  const __c = await page.locator('div[data-cy="l-card"]').count().catch(()=>-1);
  console.log(`[olx] after_goto title=${__t} cards=${__c} url=${__u}`);
  // __FYD_OLX_FAST_RETURN_V10__
  try {
    if (typeof page !== "undefined" && page && page.$$eval) {
      const __fydLinks = await page.$$eval('a[href*="/d/oferta/"]', (as) => {
        const out = [];
        for (const a of as) {
          const href = a && a.href ? String(a.href) : "";
          if (href) out.push(href);
        }
        return Array.from(new Set(out));
      });
      if (Array.isArray(__fydLinks) && __fydLinks.length) {
        console.log(`[olx] fast_return links=${__fydLinks.length}`);
        return __fydLinks;
      }
    }
  } catch (e) {}

} catch {}
await page.waitForSelector('div[data-cy="l-card"]', { timeout: 60000 });
await page.waitForTimeout(800);

      const rawItems = await page.$$eval('div[data-cy="l-card"]', (cards) => {
        const results = [];
        for (const card of cards) {
          const linkEl = card.querySelector('a[href*="/oferta/"], a[href*="/d/oferta/"]');
          if (!linkEl) continue;

          const url = (() => {
            try {
              const u = new URL(linkEl.href);
              u.hash = "";
              u.search = "";
              u.pathname = u.pathname.replace(/^\/d\/oferta\//, "/oferta/");
              return u.toString();
            } catch {
              // __FYD_OLX_NO_EXIT_IN_CATCH_FINALLY__ return (linkEl.href || "").split("#")[0].split("?")[0].replace("/d/oferta/", "/oferta/");
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
          if (!title && linkEl.getAttribute("title")) title = linkEl.getAttribute("title").trim();
          if (!title) title = (linkEl.innerText || linkEl.textContent || "").trim();

          let priceText = "";
          const priceEl = card.querySelector('[data-testid="ad-price"]') || card.querySelector('[data-cy="ad-card-price"]');
          if (priceEl) priceText = (priceEl.innerText || priceEl.textContent || "").trim();

          const img = card.querySelector("img");
          let photoUrl = null;
          if (img) {
            photoUrl = img.src || img.getAttribute("src") || img.getAttribute("data-src") || (img.getAttribute("srcset") || "").split(" ")[0] || null;
          }

          const text = card.innerText || card.textContent || "";
          const hasOlxDelivery = /Przesyłka OLX/i.test(text);

          results.push({ url, title, rawPrice: priceText, photoUrl, hasOlxDelivery });
        }
        return results;
      });

      let items = rawItems.map((it) => {
        let finalTitle = it.title || "";
        if (!finalTitle || /^wyróżnione$/i.test(finalTitle)) {
          const fromUrl = deriveOlxTitleFromUrl(it.url);
          if (fromUrl) finalTitle = fromUrl;
        }

        const { price, currency } = parsePrice(it.rawPrice);
        const u = normalizeOlxUrl(it.url);
        const itemKey = normalizeKey(u);

        return {
          url: u,
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

      await __closeAll();
      return items;
    } catch (e) {
      lastErr = e;
      const msg = (e && e.message) ? e.message : String(e || "");
      console.log("[olx] attempt " + attempt + "/2 failed (proxy=" + (useProxy ? "on" : "off") + "): " + msg);
      await __closeAll();

      // CloudFront na direct -> od razu attempt2 przez proxy (bez sleep)
      if (msg === "OLX_CLOUDFRONT_BLOCK" && attempt === 1 && !__fydForceNoProxy && __fydProxyOpts) {
        continue;
      }
    }

    await sleep(1500 * attempt);

    if (attempt < 2) continue;
    throw lastErr;
  }
  // __FYD_OLX_ATTEMPTS_FALLBACK_V1__
  if (lastErr) return [];

      // FYD: removed early-exit to allow attempt 2/3
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




function getVintedFallbackCurrency(linkUrl) {
  try {
    const u = new URL(linkUrl);
    const cur = u.searchParams.get("currency");
    if (cur) return cur.toUpperCase();
    const h = (u.hostname || "").toLowerCase();
    if (h.endsWith(".pl")) return "PLN";
    return null;
  } catch {
    return null;
  }
}




function buildVintedApiUrl(catalogUrl) {
  const u = new URL(catalogUrl);
  const api = new URL("/api/v2/catalog/items", u.origin);

  const inP = u.searchParams;
  const outP = api.searchParams;

  outP.set("page", inP.get("page") || "1");
  outP.set("per_page", "96");

  const scalarKeys = ["search_text", "currency", "price_from", "price_to", "order", "search_by_image_uuid"];
  for (const k of scalarKeys) {
    const v = inP.get(k);
    if (v != null && v !== "") outP.set(k, v);
  }
  if (!outP.get("order")) outP.set("order", "newest_first");

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




function getVintedItemIdFromUrl(urlOrKey) {
  try {
    const u = new URL(urlOrKey);
    const m = u.pathname.match(/^\/items\/(\d+)(?:-|\/|$)/i);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  } catch {
    const s = String(urlOrKey || "").trim();
    if (/^\d+$/.test(s)) {
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }
}




function parseVintedMeta(titleAttr, fallbackTitle) {
  const fallback = String(fallbackTitle || "").trim();
  const tattr = String(titleAttr || "").trim();

  if (!tattr) {
    return { title: fallback, brand: null, size: null, condition: null, rawPriceFromTitle: null };
  }

  const segments = tattr.split(/\s*,\s*/);
  let title = (segments[0] || fallback || "").trim();

  let brand = null;
  let size = null;
  let condition = null;
  let rawPriceFromTitle = null;

  for (let i = 1; i < segments.length; i++) {
    const seg = String(segments[i] || "").trim();
    if (!seg) continue;

    const lower = seg.toLowerCase();
    let m;

    m = seg.match(/^marka:\s*(.+)$/i);
    if (m) { brand = m[1].trim(); continue; }

    m = seg.match(/^(stan|condition):\s*(.+)$/i);
    if (m) { condition = m[2].trim(); continue; }

    m = seg.match(/^rozmiar:\s*(.+)$/i);
    if (m) { size = m[1].trim(); continue; }

    m = seg.match(/^brand:\s*(.+)$/i);
    if (m) { brand = m[1].trim(); continue; }

    m = seg.match(/^size:\s*(.+)$/i);
    if (m) { size = m[1].trim(); continue; }

    if (!rawPriceFromTitle && /\d/.test(seg) && !/zawiera|includes/i.test(lower)) rawPriceFromTitle = seg;
  }

  return { title, brand, size, condition, rawPriceFromTitle };
}



/* __FYD_VINTED_PW_FORCE2_HELPER_V2__
   Playwright fallback dla Vinted katalogu:
   - bierze URL + titleAttr + text + photoUrl
   - mapuje do normalnych itemów (title/price/currency/photo) jak DOM fallback
*/
async function __fydVintedCatalogViaPlaywright(catalogUrl) {
  const url = String(catalogUrl || "").trim();
  if (!url) return [];

  let origin = "";
  try { origin = new URL(url).origin; } catch {}

  const fallbackCurrency = getVintedFallbackCurrency(url);

  await __fydChromiumGuard("pw");

  const browser = await chromium.launch({
  proxy: __fydProxyEnabledBool() ? {
    server: String(process.env.PROXY_SERVER || "").trim(),
    username: String(process.env.PROXY_USERNAME || process.env.PROXY_USER || "").trim(),
    password: String(process.env.PROXY_PASSWORD || process.env.PROXY_PASS || "").trim(),
  } : undefined,
 headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const context = await browser.newContext({
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  context.setDefaultTimeout(45000);
  context.setDefaultNavigationTimeout(45000);
  const page = await context.newPage();

  // ---- OLX CloudFront backoff (per-page goto override) ----
  const __origGoto = page.goto.bind(page);
  page.goto = async (u, opts) => {
    const fixed = __fixOlxUrl(u);
    const s = String(fixed || "");
    if (s.includes("olx.pl")) {
      const now = Date.now();
      const backoffMs = parseInt(process.env.OLX_BACKOFF_MS || "600000", 10);
      const until = globalThis.__olxBackoffUntil || 0;
      if (now < until) throw new Error("OLX_BACKOFF_ACTIVE");

      const res = await __origGoto(fixed, opts);

      const title = String(await page.title().catch(() => "") || "");
      if (title.includes("request could not be satisfied")) {
        globalThis.__olxBackoffUntil = Date.now() + backoffMs;
        throw new Error("OLX_CLOUDFRONT_BLOCK");
      }
      return res;
    }
    return __origGoto(fixed, opts);
  };
  // ---- OLX CloudFront backoff END ----

// __FYD_BLOCK_ASSETS_V1
try {
  await page.route("**/*", (route) => {
    const req = route.request();
    const t = req.resourceType();
        try { const h = new URL(req.url()).hostname.toLowerCase(); if (__FYD_BLOCK_HOST_RE.test(h)) return route.abort(); } catch {}
    if (t === "image" || t === "media" || t === "font") return route.abort();
    return route.continue();
  });
} catch {}
try {
  await page.route("**/*", (route) => {
    const t = route.request().resourceType();
        try { const h = new URL(route.request().url()).hostname.toLowerCase(); if (__FYD_BLOCK_HOST_RE.test(h)) return route.abort(); } catch {}
    if (t === "image" || t === "media" || t === "font") return route.abort();
    return route.continue();
  });
} catch {}
      // await __fydBlockHeavyAssets(page); // DISABLED: breaks OLX dynamic loading
  try {
    await page.route(/.*/i, (route) => {
      const t = route.request().resourceType();
        try { const h = new URL(route.request().url()).hostname.toLowerCase(); if (__FYD_BLOCK_HOST_RE.test(h)) return route.abort(); } catch {}
      if (t === "image" || t === "media" || t === "font") return route.abort();
      // obrazki zostawiamy "jak jest" (często atrybuty są i bez pobrania, ale nie blokujemy na siłę)
      return route.continue();
    });

    await page.goto(__fixOlxUrl(url), { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2200);

    await page.waitForSelector('main a[href^="/items/"]', { timeout: 12000 }).catch(() => null);

    const raw = await page.$$eval('main a[href^="/items/"]', (anchors) => {
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

        results.push({ url: href, titleAttr, text, photoUrl });
      }
      return results;
    }).catch(() => []);

    const mappedItems = (raw || [])
      .map((it) => {
        const meta = parseVintedMeta(it.titleAttr, it.text);
        const rawPrice = meta.rawPriceFromTitle || "";
        const { price, currency } = parsePrice(rawPrice);

        const itemKey = normalizeKey(it.url);
        const vintedId = getVintedItemIdFromUrl(itemKey);

        return {
          url: it.url,
          title: meta.title || it.text || "",
          price,
          currency: currency || fallbackCurrency,
          brand: meta.brand,
          size: meta.size,
          condition: meta.condition,
          photoUrl: it.photoUrl ? String(it.photoUrl) : null,
          itemKey,
          item_key: itemKey,
          vintedId,
        };
      })
      .filter(Boolean);

    return __fydFixVintedItems(mappedItems);
  } finally {
    await page.close().catch(() => null);
    await context.close().catch(() => null);
    await browser.close().catch(() => null);
  }
}

async function scrapeVinted(url) {
  let origin = "";
  try { origin = new URL(url).origin; } catch {}

  const fallbackCurrency = getVintedFallbackCurrency(url);

  // 1) API (pw request)
  try {
    const apiUrl = buildVintedApiUrl(url);

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
      if (origin) {
        await api.get("/", {
          headers: { accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
        });
      }

      const res = await api.get(apiUrl, {
        headers: {
          accept: "application/json, text/plain, */*",
          "x-requested-with": "XMLHttpRequest",
          referer: url,
        },
      });

      const txt = await res.text().catch(() => "");
      if (!res.ok()) throw new Error(`HTTP_${res.status()}`);

      let apiData = null;
      try { apiData = JSON.parse(txt); } catch { throw new Error("JSON_PARSE"); }

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

            const title = it?.title || it?.name || it?.description || it?.brand_title || "";

            const priceAmount = it?.price?.amount ?? it?.price?.value ?? it?.price ?? it?.total_item_price?.amount ?? null;
            const price =
              priceAmount != null && String(priceAmount).trim() !== ""
                ? Number(String(priceAmount).replace(",", "."))
                : null;

            const currency = it?.price?.currency_code || it?.currency || fallbackCurrency || null;

            const photoUrl =
              it?.photo?.url ||
              it?.photo?.full_size_url ||
              it?.photo?.high_resolution?.url ||
              (Array.isArray(it?.photos) && it.photos[0]?.url) ||
              null;

            const brand = it?.brand_title || it?.brand || it?.brand_name || null;
            const size = it?.size_title || it?.size || it?.size_name || null;
            const condition = it?.status_title || it?.status || it?.item_condition || null;

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
          .filter(Boolean);

        return __fydFixVintedItems(mapped);
      }
    } finally {
      await api.dispose().catch(() => null);
    }
  } catch (e) {
    logDebug("Vinted API failed -> fallback DOM:", e?.message || e);
    // fallback playwright catalog (rich DOM)
    try {
      const items = await __fydVintedCatalogViaPlaywright(url);
      console.log(`[vinted-pw] fallback items=${items.length} url=${url}`);
      return items;
    } catch (e2) {
      console.log("[vinted-pw] fallback FAIL:", (e2 && e2.message) ? e2.message : e2);
    }
  }

  // 2) DOM fallback (klasyczny)
  const launchOpts = { args: ["--no-sandbox", "--disable-dev-shm-usage"] };
  if (PROXY) launchOpts.proxy = PROXY;

  await __fydChromiumGuard("pw");

  const browser = await chromium.launch(launchOpts);
  const context = await browser.newContext({
  proxy: __fydProxyEnabledBool() ? {
    server: String(process.env.PROXY_SERVER || "").trim(),
    username: String(process.env.PROXY_USERNAME || process.env.PROXY_USER || "").trim(),
    password: String(process.env.PROXY_PASSWORD || process.env.PROXY_PASS || "").trim(),
  } : undefined,

    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  context.setDefaultTimeout(45000);
  context.setDefaultNavigationTimeout(45000);
  const page = await context.newPage();

  // ---- OLX CloudFront backoff (per-page goto override) ----
  const __origGoto = page.goto.bind(page);
  page.goto = async (u, opts) => {
    const fixed = __fixOlxUrl(u);
    const s = String(fixed || "");
    if (s.includes("olx.pl")) {
      const now = Date.now();
      const backoffMs = parseInt(process.env.OLX_BACKOFF_MS || "600000", 10);
      const until = globalThis.__olxBackoffUntil || 0;
      if (now < until) throw new Error("OLX_BACKOFF_ACTIVE");

      const res = await __origGoto(fixed, opts);

      const title = String(await page.title().catch(() => "") || "");
      if (title.includes("request could not be satisfied")) {
        globalThis.__olxBackoffUntil = Date.now() + backoffMs;
        throw new Error("OLX_CLOUDFRONT_BLOCK");
      }
      return res;
    }
    return __origGoto(fixed, opts);
  };
  // ---- OLX CloudFront backoff END ----

try {
  await page.route("**/*", (route) => {
    const t = route.request().resourceType();
        try { const h = new URL(route.request().url()).hostname.toLowerCase(); if (__FYD_BLOCK_HOST_RE.test(h)) return route.abort(); } catch {}
    if (t === "image" || t === "media" || t === "font") return route.abort();
    return route.continue();
  });
} catch {}
      // await __fydBlockHeavyAssets(page); // DISABLED: breaks OLX dynamic loading
  try {
    await page.goto(__fixOlxUrl(url), { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2000);

    await page.waitForSelector('main a[href^="/items/"]', { timeout: 12000 }).catch(() => null);

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

          results.push({ url: href, titleAttr, text, rawPrice: "", photoUrl });
        }

        return results;
      })
      .catch(() => []);

    const mappedItems = (rawItems || [])
      .map((it) => {
        const meta = parseVintedMeta(it.titleAttr, it.text);
        const rawPrice = meta.rawPriceFromTitle || it.rawPrice;
        const { price, currency } = parsePrice(rawPrice);
        const itemKey = normalizeKey(it.url);
        const vintedId = getVintedItemIdFromUrl(itemKey);

        return {
          url: it.url,
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
      .filter(Boolean);

    return __fydFixVintedItems(mappedItems);
  } finally {
    await context.close().catch(() => null);
    await browser.close().catch(() => null);
  }
}

// ---------- Filtrowanie ----------
function matchFilters(item, filters = {}) {
  if (!filters || Object.keys(filters).length === 0) return true;

  const price = typeof item.price === "number" ? item.price : null;

  if (filters.minPrice != null && price != null && price < filters.minPrice) return false;
  if (filters.maxPrice != null && price != null && price > filters.maxPrice) return false;

  if (Array.isArray(filters.brand) && filters.brand.length) {
    const brandLower = (item.brand || "").toLowerCase();
    const ok = filters.brand.some((b) => brandLower.includes(String(b).toLowerCase()));
    if (!ok) return false;
  }

  if (Array.isArray(filters.sizes) && filters.sizes.length) {
    const sizeLower = (item.size || "").toLowerCase();
    const ok = filters.sizes.some((s) => sizeLower === String(s).toLowerCase());
    if (!ok) return false;
  }

  if (Array.isArray(filters.conditions) && filters.conditions.length) {
    const condLower = (item.condition || "").toLowerCase();
    const ok = filters.conditions.some((c) => condLower.includes(String(c).toLowerCase()));
    if (!ok) return false;
  }

  return true;
}

function safeParseFilters(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return {};
}



// ---- FYD_URL_PRICE_BOUNDS_V1 ----
function __fydGetUrlPriceBounds(linkUrl) {
  let priceFrom = null;
  let priceTo = null;
  try {
    const u = new URL(String(linkUrl || ""));
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
  } catch {}
  return { priceFrom, priceTo };
}

function __fydApplyUrlPriceBounds(items, pb) {
  const arr = Array.isArray(items) ? items : [];
  const priceFrom = (pb && pb.priceFrom != null) ? pb.priceFrom : null;
  const priceTo   = (pb && pb.priceTo   != null) ? pb.priceTo   : null;
  if (priceFrom == null && priceTo == null) return arr; // no bounds
  return arr.filter((it) => {
    const p = (it && typeof it.price === "number" && Number.isFinite(it.price)) ? it.price : null;
    if (priceFrom != null && p != null && p < priceFrom) return false;
    if (priceTo != null && p != null && p > priceTo) return false;
    return true;
  });
}
// ---- FYD_URL_PRICE_BOUNDS_V1 END ----

function sortItemsForNotify(source, items) {
  const src = (source || "").toLowerCase();
  if (src === "vinted") {
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
  if (!source) return;

  const tgUserId = link.telegram_user_id || null;
  const limits = tgUserId ? await getUserLimits(tgUserId) : null;


  const __pb = __fydGetUrlPriceBounds(link.url);
  if (limits?.sources_allowed && Array.isArray(limits.sources_allowed) && !limits.sources_allowed.includes(source)) {
    console.log(`[link ${link.id}] SOURCE_NOT_ALLOWED_BY_PLAN source=${source}`);
    return;
  }

  console.log(`Worker: checking ${link.url}`);

  let scraped = [];
  if (source === "olx") {
    let u = String(link.url || "");
    try {
      const U = new URL(u);
      const m = U.pathname.match(/\/(?:d\/)?oferty\/q-([^\/]+)\//i);
      if (m && !U.searchParams.get("q")) {
        const term = decodeURIComponent(m[1]).replace(/-/g, " ").trim();
        if (term) U.searchParams.set("q", term);
      }
      u = U.toString();
    } catch {}
    scraped = await scrapeOlx(u);
  }
  else if (source === "vinted") scraped = await scrapeVinted(link.url);
  else return;

  // twarde ujednolicenie Vinted itemów już na wejściu
  if (source === "vinted") scraped = __fydFixVintedItems(scraped);

  const lastKey = cleanKey(
    source === "olx"
      ? normalizeOlxUrl(String(link.last_key ?? ""))
      : String(link.last_key ?? "")
  );

  const cfg = getSourceConfig(source);
  const maxPerLoop = Number(limits?.max_items_per_link_per_loop || cfg.maxPerLoop);
  const minBatchItems = cfg.minBatchItems;

  const filters = safeParseFilters(link.filters);
  const filtered = (scraped || []).filter((it) => matchFilters(it, filters));
  if (!filtered.length) return;

  let orderedAll = source === "vinted" ? sortItemsForNotify(source, filtered) : filtered;
  orderedAll = __fydApplyUrlPriceBounds(orderedAll, __pb);
  if (!orderedAll.length) return;

  // baseline: nowy link -> ustaw last_key i nie wysyłaj
  if (!lastKey) {
    const newestKey = getItemKey(orderedAll[0]);
    if (newestKey) await updateLastKey(link.id, __fydNormalizeItemKeyFromUrl(newestKey));
    return;
  }

  const { fresh: freshByLastKey, found } = takeNewItemsUntilLastKey(orderedAll, lastKey);

  if (!found) {
    const newestKey = getItemKey(orderedAll[0]);

    const keysToCheck = orderedAll.map(getItemKey).filter(Boolean);
    const seenSet = await getSeenItemKeys(link.id, (keysToCheck || []).map(__fydNormalizeItemKeyFromUrl));

    let freshNotSeen = orderedAll.filter((it) => {
      const k = getItemKey(it);
      return k && !seenSet.has(k);
    });

    if (!freshNotSeen.length) {
      if (newestKey && (__fydNormalizeKey(newestKey) !== __fydNormalizeKey(lastKey))) await updateLastKey(link.id, __fydNormalizeItemKeyFromUrl(newestKey));
      return;
    }

    if (source === "vinted") freshNotSeen = __fydFixVintedItems(freshNotSeen);

    const __insN = await insertLinkItems(link.id, __fydFilterAndNormalizeItems(link.url, freshNotSeen));
    console.log(`[insert] link_id=${link.id} +${__insN} (candidates=${freshNotSeen.length})`);

    const toSend = freshNotSeen.slice(0, maxPerLoop);
    const skipped = freshNotSeen.length - toSend.length;

    await notifyChatsForLink(link, __fydNormalizeItems(toSend), skipped, { minBatchItems });

    if (newestKey) await updateLastKey(link.id, __fydNormalizeItemKeyFromUrl(newestKey));

    const keep = Number(limits?.history_keep_per_link || HISTORY_KEEP_PER_LINK);
    if (Number.isFinite(keep) && keep > 0) await pruneLinkItems(link.id, keep);
    return;
  }

  if (!freshByLastKey.length) {
    const newestKey = getItemKey(orderedAll[0]);
    if (newestKey && (__fydNormalizeKey(newestKey) !== __fydNormalizeKey(lastKey))) await updateLastKey(link.id, __fydNormalizeItemKeyFromUrl(newestKey));
    return;
  }

  const keysToCheck = freshByLastKey.map(getItemKey).filter(Boolean);
  const seenSet = await getSeenItemKeys(link.id, (keysToCheck || []).map(__fydNormalizeItemKeyFromUrl));

  let freshNotSeen = freshByLastKey.filter((it) => {
    const k = getItemKey(it);
    return k && !seenSet.has(k);
  });

  if (!freshNotSeen.length) {
    const newestKey = getItemKey(orderedAll[0]);
    if (newestKey && (__fydNormalizeKey(newestKey) !== __fydNormalizeKey(lastKey))) await updateLastKey(link.id, __fydNormalizeItemKeyFromUrl(newestKey));
    return;
  }

  if (source === "vinted") freshNotSeen = __fydFixVintedItems(freshNotSeen);

  const __insN2 = await insertLinkItems(link.id, __fydFilterAndNormalizeItems(link.url, freshNotSeen));
  console.log(`[insert] link_id=${link.id} +${__insN2} (candidates=${freshNotSeen.length})`);

  const toSend = freshNotSeen.slice(0, maxPerLoop);
  const skipped = freshNotSeen.length - toSend.length;

  const __fydToSend = __fydFilterAndNormalizeItems(link.url, toSend);
    if (__fydToSend.length) await notifyChatsForLink(link, __fydNormalizeItems(__fydToSend), skipped, { minBatchItems });

  const newestKey = getItemKey(orderedAll[0]);
  if (newestKey) await updateLastKey(link.id, __fydNormalizeItemKeyFromUrl(newestKey));

  const keep = Number(limits?.history_keep_per_link || HISTORY_KEEP_PER_LINK);
  if (Number.isFinite(keep) && keep > 0) await pruneLinkItems(link.id, keep);
}

async function loopOnce() {
  await initDb();
  const links = await getLinksForWorker();
  console.log(`Worker: found links: ${links.length}`);

  // grupujemy per telegram_user_id (żeby cap był per user)
  const byUser = new Map(); // tgId(str) -> links[]
  for (const link of links) {
    const tgId = link.telegram_user_id ? String(link.telegram_user_id) : "__no_tg__";
    if (!byUser.has(tgId)) byUser.set(tgId, []);
    byUser.get(tgId).push(link);
  }

  for (const [tgId, userLinks] of byUser.entries()) {
    const sorted = [...userLinks].sort((a, b) => Number(a.id) - Number(b.id));

    let toProcess = sorted;

    if (tgId !== "__no_tg__") {
      const lim = await getUserLimits(tgId);
      const cap = Number(lim?.links_limit_total ?? lim?.links_limit ?? 0);
      if (cap > 0) toProcess = sorted.slice(0, cap);
      if (cap > 0 && sorted.length > cap) {
        console.log(`[user ${tgId}] cap=${cap} active_links=${sorted.length} -> processing=${toProcess.length}`);
      }
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

const __FYD_WORKER_IS_ENTRY = (() => {
  try {
    return import.meta.url === new URL(process.argv[1], "file:").href;
  } catch {
    return false;
  }
})();

if (__FYD_WORKER_IS_ENTRY) {
  main().catch((e) => { console.error("FATAL in worker main:", e); });
}

// ---- FYD: Chromium guard (prevents runaway Playwright) ----
const FYD_MAX_CHROMIUM_PROCS = Number(process.env.MAX_CHROMIUM_PROCS || 4);
const FYD_CHROMIUM_GUARD_SLEEP_MS = Number(process.env.CHROMIUM_GUARD_SLEEP_MS || 30000);
const FYD_MIN_AVAILABLE_MB = Number(process.env.MIN_AVAILABLE_MB || 512);

async function __fydGetAvailableMemMb() {
  try {
    const fs = await import("node:fs/promises");
    const txt = await fs.readFile("/proc/meminfo", "utf8");
    const m = txt.match(/^MemAvailable:\s+(\d+)\s+kB/m);
    if (m) return Math.floor(Number(m[1]) / 1024);
  } catch {}
  return null;
}

async function __fydGetChromiumProcCount() {
  try {
    const cp = await import("node:child_process");
    const out = cp.execSync("ps -eo cmd | grep -E 'ms-playwright/chromium_head|chrome-headless' | wc -l", {
      stdio: ["ignore", "pipe", "ignore"],
    });
    const n = Number(String(out || "").trim());
    return Number.isFinite(n) ? n : null;
  } catch {}
  return null;
}

async function __fydChromiumGuard(tag) {
  const maxP = Number.isFinite(FYD_MAX_CHROMIUM_PROCS) && FYD_MAX_CHROMIUM_PROCS > 0 ? FYD_MAX_CHROMIUM_PROCS : 4;
  const minMb = Number.isFinite(FYD_MIN_AVAILABLE_MB) && FYD_MIN_AVAILABLE_MB > 0 ? FYD_MIN_AVAILABLE_MB : 512;
  const sleepMs = Number.isFinite(FYD_CHROMIUM_GUARD_SLEEP_MS) && FYD_CHROMIUM_GUARD_SLEEP_MS > 0 ? FYD_CHROMIUM_GUARD_SLEEP_MS : 30000;

  while (true) {
    const p = await __fydGetChromiumProcCount();
    const avail = await __fydGetAvailableMemMb();

    const tooMany = (p != null && p > maxP);
    const tooLowMem = (avail != null && avail <= minMb);

    if (!tooMany && !tooLowMem) return;

    console.log(`[guard] ${tag || "chromium"} wait: procs=${p} max=${maxP} availMB=${avail} minMB=${minMb}`);
    await sleep(sleepMs);
  }
}
// ---- FYD: Chromium guard END ----
