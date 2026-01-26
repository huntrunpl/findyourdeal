import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import pg from "pg";

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

// limit dzienny powiadomień na jeden chat – informacyjnie do /status
const MAX_DAILY_NOTIFICATIONS = 200;

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
  const full = String(text ?? "");

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
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...extraForThis,
      });

      if (!res || res.ok !== true) {
        console.error("Telegram send failed:", res?.description || res);
        console.error("chatId=", chatId, "textLen=", String(part).length);
      } else {
        console.log("Telegram sent:", res.result?.message_id, "chatId=", chatId, "len=", String(part).length);
      }
    } catch (err) {
      console.error("Telegram send error:", err.message || err);
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

const STATUS_I18N = (() => {
  const pl = {
    title: "ℹ️ Status bota",
    plan: (name, expStr, addons) => {
      const line = `Plan: ${name} (do ${expStr})`;
      return addons > 0 ? `${line}\nDodatki (addon +10): ${addons}` : line;
    },
    linksEnabled: (enabled, limit) => `Aktywne wyszukiwania (włączone): ${enabled}/${limit}`,
    linksTotal: (total, limit) => `Łącznie wyszukiwań (w bazie): ${total}/${limit}`,
    dailyLimit: (limit) => `Limit dziennych powiadomień: ${limit}`,
    chatLine: (enabled, mode, daily, limit) => {
      const status = enabled ? "✅ Powiadomienia WŁĄCZONE" : "⛔ Powiadomienia WYŁĄCZONE";
      const modeText = mode === "batch" ? "zbiorczo" : mode === "off" ? "wyłączone" : "pojedynczo";
      const dailyText = `Dzisiejsze powiadomienia: ${daily}/${limit}`;
      return `${status}\nTryb domyślny na tym czacie: ${modeText}\n${dailyText}`;
    },
    quietOn: (from, to) => `Cisza nocna: włączona (${from}:00–${to}:00)`,
    quietOff: "Cisza nocna: wyłączona",
    perLinkHint: "Komendy: /on /off /pojedyncze /zbiorcze\nPer link: /pojedyncze_ID /zbiorcze_ID /off_ID /on_ID",
    noLinks: "Brak aktywnych wyszukiwań.",
    linksHeader: "Lista wyszukiwań:",
    unknown: "(błąd)"
  };

  const en = {
    title: "ℹ️ Bot Status",
    plan: (name, expStr, addons) => {
      const line = `Plan: ${name} (until ${expStr})`;
      return addons > 0 ? `${line}\nAddons (+10 links each): ${addons}` : line;
    },
    linksEnabled: (enabled, limit) => `Active searches (enabled): ${enabled}/${limit}`,
    linksTotal: (total, limit) => `Total searches (in database): ${total}/${limit}`,
    dailyLimit: (limit) => `Daily notification limit: ${limit}`,
    chatLine: (enabled, mode, daily, limit) => {
      const status = enabled ? "✅ Notifications ENABLED" : "⛔ Notifications DISABLED";
      const modeText = mode === "batch" ? "batch" : mode === "off" ? "disabled" : "single";
      const dailyText = `Today's notifications: ${daily}/${limit}`;
      return `${status}\nDefault mode for this chat: ${modeText}\n${dailyText}`;
    },
    quietOn: (from, to) => `Quiet hours: enabled (${from}:00–${to}:00)`,
    quietOff: "Quiet hours: disabled",
    perLinkHint: "Commands: /on /off /single /batch\nPer link: /single_ID /batch_ID /off_ID /on_ID",
    noLinks: "No active searches.",
    linksHeader: "Search list:",
    unknown: "(error)"
  };

  const de = {
    title: "ℹ️ Bot-Status",
    plan: (name, expStr, addons) => {
      const line = `Plan: ${name} (bis ${expStr})`;
      return addons > 0 ? `${line}\nErweiterungen (+10 Links je): ${addons}` : line;
    },
    linksEnabled: (enabled, limit) => `Aktive Suchen (aktiviert): ${enabled}/${limit}`,
    linksTotal: (total, limit) => `Suchen gesamt (in Datenbank): ${total}/${limit}`,
    dailyLimit: (limit) => `Tägliches Benachrichtigungslimit: ${limit}`,
    chatLine: (enabled, mode, daily, limit) => {
      const status = enabled ? "✅ Benachrichtigungen AKTIVIERT" : "⛔ Benachrichtigungen DEAKTIVIERT";
      const modeText = mode === "batch" ? "Batch" : mode === "off" ? "deaktiviert" : "einzeln";
      const dailyText = `Heutige Benachrichtigungen: ${daily}/${limit}`;
      return `${status}\nStandardmodus für diesen Chat: ${modeText}\n${dailyText}`;
    },
    quietOn: (from, to) => `Ruhestunden: aktiviert (${from}:00–${to}:00)`,
    quietOff: "Ruhestunden: deaktiviert",
    perLinkHint: "Befehle: /on /off /single /batch\nPro Link: /single_ID /batch_ID /off_ID /on_ID",
    noLinks: "Keine aktiven Suchen.",
    linksHeader: "Suchliste:",
    unknown: "(Fehler)"
  };

  const fr = {
    title: "ℹ️ Statut du bot",
    plan: (name, expStr, addons) => {
      const line = `Plan: ${name} (jusqu'au ${expStr})`;
      return addons > 0 ? `${line}\nExtensions (+10 liens chacune): ${addons}` : line;
    },
    linksEnabled: (enabled, limit) => `Recherches actives (activées): ${enabled}/${limit}`,
    linksTotal: (total, limit) => `Total des recherches (en base): ${total}/${limit}`,
    dailyLimit: (limit) => `Limite quotidienne de notifications: ${limit}`,
    chatLine: (enabled, mode, daily, limit) => {
      const status = enabled ? "✅ Notifications ACTIVÉES" : "⛔ Notifications DÉSACTIVÉES";
      const modeText = mode === "batch" ? "groupé" : mode === "off" ? "désactivé" : "unique";
      const dailyText = `Notifications aujourd'hui: ${daily}/${limit}`;
      return `${status}\nMode par défaut pour ce chat: ${modeText}\n${dailyText}`;
    },
    quietOn: (from, to) => `Heures silencieuses: activées (${from}:00–${to}:00)`,
    quietOff: "Heures silencieuses: désactivées",
    perLinkHint: "Commandes: /on /off /single /batch\nPar lien: /single_ID /batch_ID /off_ID /on_ID",
    noLinks: "Aucune recherche active.",
    linksHeader: "Liste des recherches:",
    unknown: "(erreur)"
  };

  const es = {
    title: "ℹ️ Estado del bot",
    plan: (name, expStr, addons) => {
      const line = `Plan: ${name} (hasta ${expStr})`;
      return addons > 0 ? `${line}\nComplementos (+10 enlaces cada uno): ${addons}` : line;
    },
    linksEnabled: (enabled, limit) => `Búsquedas activas (habilitadas): ${enabled}/${limit}`,
    linksTotal: (total, limit) => `Total de búsquedas (en base de datos): ${total}/${limit}`,
    dailyLimit: (limit) => `Límite diario de notificaciones: ${limit}`,
    chatLine: (enabled, mode, daily, limit) => {
      const status = enabled ? "✅ Notificaciones HABILITADAS" : "⛔ Notificaciones DESHABILITADAS";
      const modeText = mode === "batch" ? "agrupado" : mode === "off" ? "deshabilitado" : "único";
      const dailyText = `Notificaciones hoy: ${daily}/${limit}`;
      return `${status}\nModo predeterminado para este chat: ${modeText}\n${dailyText}`;
    },
    quietOn: (from, to) => `Horas de silencio: habilitadas (${from}:00–${to}:00)`,
    quietOff: "Horas de silencio: deshabilitadas",
    perLinkHint: "Comandos: /on /off /single /batch\nPor enlace: /single_ID /batch_ID /off_ID /on_ID",
    noLinks: "No hay búsquedas activas.",
    linksHeader: "Lista de búsquedas:",
    unknown: "(error)"
  };

  return {
    pl,
    en,
    de,
    fr,
    es,
    it: en, // fallback to EN for remaining languages
    pt: en,
    ru: en,
    cs: en,
    hu: en,
    uk: en
  };
})();

function normalizeLangCode(lang) {
  const v = String(lang || "").toLowerCase();
  const code = v.split("-")[0];
  return STATUS_I18N[code] ? code : "en";
}

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
  // Prefer language_code first because DB trigger restricts lang to pl/en
  const lang = normalizeLangCode(user.language_code || user.lang || user.language || "en");
  const t = STATUS_I18N[lang] || STATUS_I18N.en;

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

  let text = `${t.title}\n\n`;
  text += `${t.plan(planName, planExp, extraPacks)}\n\n`;

  // Link counters
  try {
    const totalLinks = await countActiveLinksForUserId(userId);
    const enabledLinks = await countEnabledLinksForUserId(userId);
    text += `${t.linksEnabled(enabledLinks, linkLimit)}\n`;
    text += `${t.linksTotal(totalLinks, linkLimit)}\n`;
    if (dailyLimit) {
      text += `${t.dailyLimit(dailyLimit)}\n`;
    }
    text += `\n`;
  } catch (e) {
    console.error("buildStatusMessage: link counters error", e);
  }

  // Chat notification settings
  const todayStr = new Date().toISOString().slice(0, 10);
  let chatDefaultMode = "single";
  try {
    const res = await dbQuery(
      `
      SELECT enabled, mode, daily_count, daily_count_date
      FROM chat_notifications
      WHERE chat_id = $1 AND user_id = $2
      `,
      [String(chatId), userId]
    );

    if (res.rowCount) {
      const row = res.rows[0];
      const enabled = row.enabled !== false;
      const mode = (row.mode || "single").toLowerCase();
      chatDefaultMode = mode;

      let daily = row.daily_count || 0;
      let dateStr = null;
      if (row.daily_count_date) {
        dateStr = row.daily_count_date.toISOString
          ? row.daily_count_date.toISOString().slice(0, 10)
          : String(row.daily_count_date).slice(0, 10);
      }
      if (dateStr !== todayStr) daily = 0;

      const modeLabel = mode === "batch" ? "batch" : mode === "off" ? "off" : "single";
      text += `${t.chatLine(enabled, modeLabel, daily, dailyLimit)}\n\n`;
    } else {
      text += `${t.chatLine(true, "single", 0, dailyLimit)}\n\n`;
    }
  } catch (e) {
    console.error("buildStatusMessage: chat_notifications error", e);
    text += `${t.unknown}\n\n`;
  }

  // Quiet hours
  try {
    const qh = await getQuietHours(String(chatId));
    if (qh && qh.quiet_enabled) {
      text += `${t.quietOn(qh.quiet_from ?? 22, qh.quiet_to ?? 7)}\n\n`;
    } else {
      text += `${t.quietOff}\n\n`;
    }
  } catch (e) {
    console.error("buildStatusMessage: quiet_hours error", e);
    text += `${t.unknown}\n\n`;
  }

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
      text += `${t.noLinks}`;
    } else {
      text += `${t.linksHeader}\n`;
      for (const row of resLinks.rows) {
        const src = (row.source || "").toUpperCase() || "LINK";
        const name = row.name || row.url;
        const lm = row.link_mode == null ? null : String(row.link_mode).toLowerCase();
        const mode =
          lm === null
            ? chatDefaultMode
            : lm === "batch"
            ? "batch"
            : lm === "off"
            ? "off"
            : "single";

        const state = row.active ? "✅" : "⛔";
        text += `• ${state} ${row.id} – ${escapeHtml(name)} (${src}) – mode: ${mode}\n`;
      }

      text += `\n${t.perLinkHint}`;
    }
  } catch (e) {
    console.error("buildStatusMessage: links error", e);
    text += `${t.unknown}`;
  }

  return text.trim();
}

// ---------- /help /start ----------

async function handleHelp(msg) {
  const chatId = msg.chat.id;

  const text =
    "👋 Cześć! To bot FindYourDeal.\n\n" +
    "Podstawowe komendy:\n" +
    "/lista – pokaż Twoje aktywne monitorowane linki\n" +
    "/usun &lt;ID&gt; – wyłącz monitorowanie linku o ID\n" +
    "/dodaj &lt;url&gt; [nazwa] – dodaj nowy link do monitorowania\n" +
    "/status – status bota, planu i powiadomień\n\n" +
    "Powiadomienia PUSH na tym czacie:\n" +
    "/on – włącz\n" +
    "/off – wyłącz\n" +
    "/pojedyncze – pojedyncze karty\n" +
    "/zbiorcze – zbiorcza lista\n\n" +
    "Tryb per-link (TYLKO na tym czacie):\n" +
    "/pojedyncze_ID, /zbiorcze_ID, /off_ID (np. /zbiorcze_18)\n\n" +
    "Cisza nocna:\n" +
    "/cisza – pokaż\n" +
    "/cisza HH-HH – ustaw (np. /cisza 22-7)\n" +
    "/cisza_off – wyłącz\n\n" +
    "Historia:\n" +
    "/najnowsze &lt;ID&gt; – najnowsze oferty z historii linku\n\n" +
    "Przykłady:\n" +
    "<code>/lista</code>\n" +
    "<code>/usun 18</code>\n" +
    "<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>\n" +
    "<code>/najnowsze 18</code>";

  await tgSend(chatId, text);
}

// ---------- /lista ----------

async function handleLista(msg, user) {
  const chatId = msg.chat.id;

  try {
    const links = await getLinksByUserId(user.id, true);

    if (!links.length) {
      await tgSend(chatId, "Nie masz jeszcze żadnych linków łącznie.");
      return;
    }

    let text = "📋 Aktywne monitorowane linki:\n\n";
    for (const row of links) {
      text += `ID <b>${row.id}</b> — ${escapeHtml(row.name || "(bez nazwy)")}\n`;
      text += `<code>${escapeHtml(row.url)}</code>\n\n`;
    }
    text += "Wyłącz: <code>/usun ID</code>\nnp. <code>/usun 18</code>";

    await tgSend(chatId, text);
  } catch (err) {
    console.error("handleLista error:", err);
    await tgSend(chatId, "❌ Błąd przy pobieraniu listy linków.");
  }
}

// ---------- /usun ----------

async function handleUsun(msg, user, argText) {
  const chatId = msg.chat.id;
  const id = parseInt(argText, 10);

  if (!id) {
    await tgSend(chatId, "Podaj ID linku, np.:\n<code>/usun 18</code>");
    return;
  }

  try {
    const row = await deactivateLinkForUserId(id, user.id);

    if (!row) {
      await tgSend(
        chatId,
        `Nie znalazłem linku o ID <b>${id}</b> na Twoim koncie. Użyj /lista.`
      );
      return;
    }

    let text = "✅ Wyłączyłem monitorowanie linku:\n\n";
    text += `ID <b>${row.id}</b> — ${escapeHtml(row.name || "(bez nazwy)")}\n`;
    text += `<code>${escapeHtml(row.url)}</code>\n\n`;
    text += "Możesz go włączyć ponownie w panelu albo dodać ponownie jako nowe monitorowanie.";

    await tgSend(chatId, text);
  } catch (err) {
    console.error("handleUsun error:", err);
    await tgSend(chatId, "❌ Błąd przy wyłączaniu linku.");
  }
}

// ---------- /dodaj ----------

async function handleDodaj(msg, user, argText) {
  const chatId = msg.chat.id;

  if (!argText) {
    await tgSend(
      chatId,
      "Użycie:\n<code>/dodaj &lt;url&gt; [nazwa]</code>\n\n" +
        "Przykład:\n" +
        "<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>"
    );
    return;
  }

  const parts = argText.split(/\s+/);
  const url = parts[0];
  const name = parts.slice(1).join(" ") || null;

  if (!url || !/^https?:\/\//i.test(url)) {
    await tgSend(
      chatId,
      "Pierwszy parametr musi być poprawnym URL, np.:\n" +
        "<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>"
    );
    return;
  }

  // plan aktywny?
  const activePlan = isPlanActive(user, new Date());
  if (!activePlan) {
    // Trial wygasł
    if (String(user.plan_name || "").toLowerCase() === "trial" && user.trial_used) {
      await tgSend(
        chatId,
        [
          "⏰ Twój plan Trial wygasł.",
          "Monitoring w Trial jest już niedostępny.",
          "",
          "Aby dalej korzystać z bota, wybierz plan płatny (Starter / Growth / Platinum).",
        ].join("\n")
      );
      return;
    }

    // plan płatny wygasł
    const pn = String(user.plan_name || "").toLowerCase();
    if (pn === "starter" || pn === "growth" || pn === "platinum") {
      await tgSend(
        chatId,
        [
          "⏰ Twój plan wygasł.",
          "Aby dodać nowe linki i wznowić monitoring, przedłuż plan w panelu klienta.",
        ].join("\n")
      );
      return;
    }

    await tgSend(
      chatId,
      [
        "Nie masz aktywnego planu z monitoringiem linków.",
        user.trial_used
          ? "Trial został już wykorzystany. Wykup plan Starter / Growth / Platinum."
          : "Możesz uruchomić jednorazowo Trial (3 dni / 5 linków) albo wybrać plan Starter / Growth / Platinum.",
      ].join("\n")
    );
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

    await tgSend(
      chatId,
      [
        "✅ Dodałem nowy link do monitorowania:",
        "",
        `ID <b>${row.id}</b> — ${escapeHtml(row.name || "(bez nazwy)")}`,
        `<code>${escapeHtml(row.url)}</code>`,
        "",
        `Aktywne linki: ${activeLinks + 1}/${limit}`,
        "",
        "Linki sprawdzisz komendą: <code>/lista</code>",
      ].join("\n")
    );
  } catch (err) {
    console.error("handleDodaj error:", err);
    await tgSend(chatId, "❌ Błąd przy dodawaniu linku.");
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
    await tgSend(chatId, "❌ Błąd przy pobieraniu statusu.");
  }
}

// ---------- /on /off ----------

async function handleNotificationsOn(msg, user) {
  const chatId = String(msg.chat.id);

  await ensureChatNotificationsRow(chatId, user.id);

  await dbQuery(
    `
    INSERT INTO chat_notifications (chat_id, user_id, enabled, mode, updated_at)
    VALUES ($1, $2, TRUE, 'single', NOW())
    ON CONFLICT (chat_id, user_id) DO UPDATE SET
      enabled = TRUE,
      updated_at = NOW()
    `,
    [chatId, user.id]
  );

  await tgSend(chatId, "✅ Powiadomienia WŁĄCZONE na tym czacie.");
}

async function handleNotificationsOff(msg, user) {
  const chatId = String(msg.chat.id);

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

  await tgSend(chatId, "⛔ Powiadomienia WYŁĄCZONE na tym czacie.");
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

  await tgSend(chatId, "📨 Ustawiono tryb: <b>pojedynczo</b> (domyślny na tym czacie).");
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

  await tgSend(chatId, "📦 Ustawiono tryb: <b>zbiorczo</b> (domyślny na tym czacie).");
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
  if (!chk.rowCount) return { ok: false, reason: "Link nie należy do Twojego konta." };

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
const LANG_CODES = ["en", "pl", "de", "fr", "it", "es", "pt", "ru", "cs", "hu", "sk"];

// Language names with flags (for buttons)
const SUPPORTED_LANGS = {
  "en": "English 🇬🇧",
  "pl": "Polski 🇵🇱",
  "de": "Deutsch 🇩🇪",
  "fr": "Français 🇫🇷",
  "it": "Italiano 🇮🇹",
  "es": "Español 🇪🇸",
  "pt": "Português 🇵🇹",
  "ru": "Русский 🇷🇺",
  "cs": "Čeština 🇨🇿",
  "hu": "Magyar 🇭🇺",
  "sk": "Slovenčina 🇸🇰"
};

// Language names without flags (for text display)
const LANG_NAMES = {
  "en": "English",
  "pl": "Polski",
  "de": "Deutsch",
  "fr": "Français",
  "it": "Italiano",
  "es": "Español",
  "pt": "Português",
  "ru": "Русский",
  "cs": "Čeština",
  "hu": "Magyar",
  "sk": "Slovenčina"
};

// Confirmation templates per target language
const LANG_CONFIRM = {
  en: (name) => `✅ Language changed to: <b>${name}</b>`,
  pl: (name) => `✅ Język zmieniony na: <b>${name}</b>`,
  de: (name) => `✅ Sprache geändert zu: <b>${name}</b>`,
  fr: (name) => `✅ Langue changée en : <b>${name}</b>`,
  it: (name) => `✅ Lingua cambiata in: <b>${name}</b>`,
  es: (name) => `✅ Idioma cambiado a: <b>${name}</b>`,
  pt: (name) => `✅ Idioma alterado para: <b>${name}</b>`,
  ru: (name) => `✅ Язык изменён на: <b>${name}</b>`,
  cs: (name) => `✅ Jazyk změněn na: <b>${name}</b>`,
  hu: (name) => `✅ Nyelv módosítva erre: <b>${name}</b>`,
  sk: (name) => `✅ Jazyk zmenený na: <b>${name}</b>`
};

const getLangConfirmTemplate = (lang) => LANG_CONFIRM[lang] || LANG_CONFIRM.en;

async function handleLanguage(msg, user) {
  const chatId = String(msg.chat.id);
  const arg = (msg.text || "").trim().split(/\s+/).slice(1).join(" ").trim().toLowerCase();

  if (!arg) {
    const currentLang = user.lang || "en";
    const langName = SUPPORTED_LANGS[currentLang] || "English 🇬🇧";
    
    // Build inline keyboard with language buttons (2 columns, 6 rows = 12 buttons)
    const buttons = [];
    for (let i = 0; i < LANG_CODES.length; i += 2) {
      const row = [];
      row.push({ text: `${SUPPORTED_LANGS[LANG_CODES[i]]}`, callback_data: `setlang:${LANG_CODES[i]}` });
      if (i + 1 < LANG_CODES.length) {
        row.push({ text: `${SUPPORTED_LANGS[LANG_CODES[i + 1]]}`, callback_data: `setlang:${LANG_CODES[i + 1]}` });
      }
      buttons.push(row);
    }
    
    await tgSend(
      chatId,
      `🌍 Obecny język: <b>${langName}</b>`,
      {
        reply_markup: {
          inline_keyboard: buttons
        }
      }
    );
    return;
  }

  // Normalize: "pl-PL" -> "pl", "en-US" -> "en"
  const normalized = arg.split("-")[0].toLowerCase();
  
  if (!SUPPORTED_LANGS[normalized]) {
    // Use comma-separated codes for error message (short format)
    const langList = LANG_CODES.join(", ");
    await tgSend(chatId, `❌ Nieznany język. Obsługiwane: ${langList}`);
    return;
  }

  // Update users.lang AND language_code (trigger will sync)
  process.stderr.write(`[lang_debug] Updating user ${user.id} lang from ${user.lang} to ${normalized}\n`);
  await dbQuery(
    `UPDATE users
     SET lang = $1,
         language = $1,
         language_code = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [normalized, user.id]
  );
  process.stderr.write(`[lang_debug] Update completed for user ${user.id}\n`);

  const langName = LANG_NAMES[normalized];
  const confirmTemplate = getLangConfirmTemplate(normalized);
  await tgSend(chatId, confirmTemplate(langName));
}

// ---------- cisza nocna ----------

async function handleQuiet(msg) {
  const chatId = String(msg.chat.id);
  const arg = (msg.text || "").trim().split(/\s+/).slice(1).join(" ").trim();

  if (!arg) {
    const qh = await getQuietHours(chatId);
    if (qh?.quiet_enabled) {
      await tgSend(chatId, `🌙 Cisza nocna: <b>WŁĄCZONA</b>, godziny ${qh.quiet_from}:00–${qh.quiet_to}:00`);
    } else {
      await tgSend(chatId, "🌙 Cisza nocna: <b>wyłączona</b>.\nUstaw: <code>/cisza 22-7</code>");
    }
    return;
  }

  const m = arg.match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
  if (!m) {
    await tgSend(chatId, "Podaj zakres jako HH-HH, np. <code>/cisza 22-7</code>");
    return;
  }

  const fromHour = Number(m[1]);
  const toHour = Number(m[2]);

  if (
    !Number.isFinite(fromHour) || !Number.isFinite(toHour) ||
    fromHour < 0 || fromHour > 23 || toHour < 0 || toHour > 23
  ) {
    await tgSend(chatId, "Godziny muszą być w zakresie 0–23, np. <code>/cisza 22-7</code>");
    return;
  }

  await setQuietHours(chatId, fromHour, toHour);
  await tgSend(chatId, `🌙 Ustawiono ciszę nocną: <b>${fromHour}:00–${toHour}:00</b>`);
}

async function handleQuietOff(msg) {
  const chatId = String(msg.chat.id);
  await disableQuietHours(chatId);
  const confirmTemplate = getLangConfirmTemplate(normalized);
  await tgSend(chatId, confirmTemplate(langName));
  await tgSend(chatId, "🌙 Cisza nocna: <b>WYŁĄCZONA</b>");
}

// ---------- /najnowsze ----------

async function handleNajnowsze(msg, user, argText) {
  const chatId = String(msg.chat.id);
  const linkId = Number(argText);

  if (!Number.isFinite(linkId) || linkId <= 0) {
    await tgSend(chatId, "Użycie: <code>/najnowsze ID</code>\nnp. <code>/najnowsze 18</code>");
    return;
  }

  // link musi należeć do usera
  const chk = await dbQuery(
    `SELECT id, name, url, source FROM links WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [linkId, user.id]
  );

  if (!chk.rowCount) {
    await tgSend(chatId, `Nie widzę linku <b>${linkId}</b> na Twoim koncie. Sprawdź <code>/lista</code>.`);
    return;
  }

  const perLimit = getPerLinkItemLimit(user);

  const itemsQ = await dbQuery(
    `
    SELECT title, price, currency, url, first_seen_at
    FROM link_items
    WHERE link_id = $1
    ORDER BY first_seen_at DESC, id DESC
    LIMIT $2
    `,
    [linkId, perLimit]
  );

  const linkRow = chk.rows[0];
  const header = `🧾 Najnowsze oferty\n<b>${escapeHtml(linkRow.name || ("ID " + linkRow.id))}</b> <i>(ID ${linkRow.id})</i>\n`;

  if (!itemsQ.rowCount) {
    await tgSend(chatId, header + "\nBrak zapisanej historii dla tego linku (jeszcze).");
    return;
  }

  // buduj wiadomość (limit długości Telegrama ~4096)
  let out = header + "\n";
  let i = 1;
  for (const it of itemsQ.rows) {
    const title = escapeHtml(it.title || "(bez tytułu)");
    const priceStr =
      it.price != null ? `${it.price} ${it.currency || ""}`.trim() : "";
    const line =
      `${i}. <b>${title}</b>` +
      (priceStr ? `\n💰 ${escapeHtml(priceStr)}` : "") +
      (it.url ? `\n${escapeHtml(it.url)}` : "") +
      "\n\n";

    if ((out + line).length > 3800) {
      out += "… (ucięto – limit długości wiadomości)\n";
      break;
    }
    out += line;
    i++;
  }

  await tgSend(chatId, out.trim(), { disable_web_page_preview: true });
}

// ---------- callback_query z przycisków (lnmode:ID:mode) ----------

async function handleCallback(update) {
  const cq = update.callback_query;
  if (!cq) return;

  const data = cq.data || "";
  const chatId = cq.message?.chat?.id;
  const fromId = cq.from?.id ? String(cq.from.id) : null;

  if (!chatId || !fromId) {
    await tgAnswerCb(cq.id, "Brak danych czatu/użytkownika.");
    return;
  }

  const userId = await resolveUserIdFromTg(fromId);
  if (!userId) {
    await tgAnswerCb(cq.id, "Nie widzę Cię w bazie. Użyj /start lub /dodaj.");
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
      await tgAnswerCb(cq.id, res.reason || "Nie udało się ustawić trybu.", true);
      return;
    }

    const pretty =
      res.mode === "batch" ? "zbiorczo" : res.mode === "off" ? "OFF" : "pojedynczo";

    await tgAnswerCb(cq.id, `Ustawiono: ${pretty}`);
    return;
  }

  // setlang:<lang_code>
  const langMatch = data.match(/^setlang:([a-z]{2})$/i);
  if (langMatch) {
    const langCode = langMatch[1].toLowerCase();
    if (!SUPPORTED_LANGS[langCode]) {
      await tgAnswerCb(cq.id, "❌ Nieznany język.", true);
      return;
    }

    // Update user language
    process.stderr.write(`[lang_debug] Updating user ${userId} lang from ${cq.from?.language_code || 'unknown'} to ${langCode} (via callback)\n`);
    await dbQuery(
      `UPDATE users
       SET lang = $1,
           language = $1,
           language_code = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [langCode, userId]
    );

    const langName = LANG_NAMES[langCode];
    const confirmTemplate = getLangConfirmTemplate(langCode);
    await tgAnswerCb(cq.id, confirmTemplate(langName));
    return;
  }

  await tgAnswerCb(cq.id, "Nieznana akcja.");
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
let text = (msg.text ?? "").trim();

// NORMALIZACJA: pozwól na spację zamiast "_"
const m = text.match(/^\/(on|off|pojedyncze|pojedynczo|zbiorcze)\s+(\d+)\b/i);
if (m) {
  const cmd = m[1].toLowerCase() === "pojedynczo" ? "pojedyncze" : m[1].toLowerCase();
  text = `/${cmd}_${m[2]}`;
}

  console.log("TG message:", chatId, text);

  if (!tgId) {
    await tgSend(chatId, "Nie udało się ustalić Twojego ID Telegram. Spróbuj ponownie.");
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
    await tgSend(
      chatId,
      "Nie widzę Cię jeszcze w bazie.\nNajpierw użyj /dodaj (zarejestruje konto), a potem /status."
    );
    return;
  }

  await ensureChatNotificationsRow(String(chatId), user.id);

  // parsowanie komend
  const [commandRaw, ...rest] = text.split(/\s+/);
  const command = commandRaw.toLowerCase().split("\@")[0];
  const argText = rest.join(" ").trim();

// komendy per-link: /pojedyncze_18 /zbiorcze_18 /off_18 /on_18
const perLink = command.match(/^\/(pojedyncze|zbiorcze|off|on)_(\d+)$/i);
if (perLink) {
  const kind = perLink[1].toLowerCase();
  const linkId = Number(perLink[2]);

  // /on_ID = usuń override (wraca do domyślnego trybu czatu)
  if (kind === "on") {
    // zabezpieczenie: link musi należeć do usera
    const chk = await dbQuery(
      `SELECT id FROM links WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [Number(linkId), Number(user.id)]
    );
    if (!chk.rowCount) {
      await tgSend(chatId, `❌ Link <b>${linkId}</b> nie należy do Twojego konta.`);
      return;
    }

    await clearLinkNotificationMode(user.id, String(chatId), linkId);

    // odczytaj domyślny tryb czatu (żeby ładnie potwierdzić)
    const cn = await dbQuery(
      `SELECT mode FROM chat_notifications WHERE chat_id = $1 AND user_id = $2 LIMIT 1`,
      [String(chatId), Number(user.id)]
    );
    const chatMode =
      (cn.rows[0]?.mode || "single").toLowerCase() === "batch" ? "zbiorczo" : "pojedynczo";

    await tgSend(
      chatId,
      `✅ Link <b>${linkId}</b> na tym czacie WŁĄCZONY (dziedziczy tryb czatu: <b>${chatMode}</b>).`
    );
    return;
  }

  const mode = kind === "zbiorcze" ? "batch" : kind === "off" ? "off" : "single";
  const res = await setPerLinkMode(String(chatId), user.id, linkId, mode);

  if (!res.ok) {
    await tgSend(chatId, `❌ ${escapeHtml(res.reason || "Nie udało się ustawić trybu.")}`);
    return;
  }

  const pretty =
    res.mode === "batch" ? "zbiorczo" : res.mode === "off" ? "OFF" : "pojedynczo";

  await tgSend(chatId, `✅ Link <b>${linkId}</b> na tym czacie ustawiony: <b>${pretty}</b>`);
  return;
}

  if (command.startsWith("/start") || command.startsWith("/help")) {
    await handleHelp(msg);
  } else if (command.startsWith("/lista")) {
    await handleLista(msg, user);
  } else if (command.startsWith("/usun")) {
    await handleUsun(msg, user, argText);
  } else if (command.startsWith("/dodaj")) {
    await handleDodaj(msg, user, argText);
  } else if (command.startsWith("/status") || command.startsWith("/config")) {
    await handleStatus(msg, user);
  } else if (command === "/on") {
    await handleNotificationsOn(msg, user);
  } else if (command === "/off") {
    await handleNotificationsOff(msg, user);
  } else if (command === "/pojedyncze") {
    await handleModeSingle(msg, user);
  } else if (command === "/zbiorcze") {
    await handleModeBatch(msg, user);
  } else if (command.startsWith("/cisza_off")) {
    await handleQuietOff(msg);
  } else if (command.startsWith("/cisza")) {
    await handleQuiet(msg);
  } else if (command.startsWith("/lang")) {
    await handleLanguage(msg, user, argText);
  } else if (command.startsWith("/najnowsze")) {
    await handleNajnowsze(msg, user, argText);
  } else {
    await tgSend(chatId, "❓ Nieznana komenda. Użyj /help.");
  }
}

// ---------- main loop ----------

async function main() {
  // Log startup to verify stdout is connected to docker logs
  process.stdout.write("[tg-bot] Starting telegram-bot service\n");
  console.log("telegram-bot.js start");

  await initDb();

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
