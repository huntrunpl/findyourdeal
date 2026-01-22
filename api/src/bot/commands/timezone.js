/**
 * /timezone (/tz /strefa)
 * Stores per-user timezone in users.timezone (IANA TZ, e.g. Europe/Warsaw).
 *
 * Usage:
 * - /timezone                 -> show current + help
 * - /timezone Europe/London   -> set
 * - /timezone warsaw          -> set Europe/Warsaw
 * - /timezone reset           -> set Europe/Warsaw
 */

function normalizeArg(s) {
  return String(s || "").trim();
}

function isValidIanaTz(tz) {
  const z = String(tz || "").trim();
  if (!z) return false;
  if (z.length > 64) return false;
  try {
    // throws RangeError if invalid
    new Intl.DateTimeFormat("en-US", { timeZone: z }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function fmtNowInTz(tz) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
  } catch {
    return "";
  }
}

function canonicalizeTz(input) {
  const a = String(input || "").trim();
  if (!a) return "";

  const low = a.toLowerCase();

  // common aliases
  if (low === "warsaw" || low === "poland" || low === "pl" || low === "europawarsaw") return "Europe/Warsaw";
  if (low === "reset" || low === "default") return "Europe/Warsaw";

  // allow "Europe-Warsaw" or "Europe Warsaw"
  const cleaned = a.replace(/\s+/g, "/").replace(/-/g, "/");
  if (isValidIanaTz(cleaned)) return cleaned;

  // original
  if (isValidIanaTz(a)) return a;

  return "";
}

export function createHandleTimezone(deps) {
  const { tgSend, fydResolveLang, dbQuery, escapeHtml } = deps;

  if (!tgSend) throw new Error("createHandleTimezone: tgSend missing");
  if (!fydResolveLang) throw new Error("createHandleTimezone: fydResolveLang missing");
  if (!dbQuery) throw new Error("createHandleTimezone: dbQuery missing");
  if (!escapeHtml) throw new Error("createHandleTimezone: escapeHtml missing");

  return {
    handleTimezone: async (msg, user, argText) => {
      const chatId = String(msg.chat.id);
      const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
      const L = String(lang || "en").toLowerCase().startsWith("pl") ? "pl" : "en";

      const uid = Number(user?.id);
      if (!Number.isFinite(uid) || uid <= 0) return;

      // read current
      let current = "Europe/Warsaw";
      try {
        const r = await dbQuery(
          `SELECT COALESCE(NULLIF(timezone,''),'Europe/Warsaw') AS tz
             FROM users
            WHERE id=$1
            LIMIT 1`,
          [uid]
        );
        current = String(r.rows?.[0]?.tz || "Europe/Warsaw");
      } catch {}

      const arg = normalizeArg(argText);

      // show current
      if (!arg) {
        const nowStr = fmtNowInTz(current);
        if (L === "pl") {
          await tgSend(
            chatId,
            `🕒 Twoja strefa: <b>${escapeHtml(current)}</b>\n` +
              (nowStr ? `Teraz: <b>${escapeHtml(nowStr)}</b>\n\n` : `\n`) +
              `Ustawienie:\n` +
              `• /timezone Europe/London\n` +
              `• /timezone warsaw (domyślna)\n` +
              `• /timezone reset`
          );
        } else {
          await tgSend(
            chatId,
            `🕒 Your timezone: <b>${escapeHtml(current)}</b>\n` +
              (nowStr ? `Now: <b>${escapeHtml(nowStr)}</b>\n\n` : `\n`) +
              `Set it:\n` +
              `• /timezone Europe/London\n` +
              `• /timezone warsaw (default)\n` +
              `• /timezone reset`
          );
        }
        return;
      }

      const tz = canonicalizeTz(arg);
      if (!tz) {
        if (L === "pl") {
          await tgSend(
            chatId,
            `❌ Niepoprawna strefa: <b>${escapeHtml(arg)}</b>\n` +
              `Podaj nazwę IANA, np. <b>Europe/Warsaw</b>, <b>Europe/London</b>, <b>America/New_York</b>.`
          );
        } else {
          await tgSend(
            chatId,
            `❌ Invalid timezone: <b>${escapeHtml(arg)}</b>\n` +
              `Use an IANA name, e.g. <b>Europe/Warsaw</b>, <b>Europe/London</b>, <b>America/New_York</b>.`
          );
        }
        return;
      }

      // save
      try {
        await dbQuery(`UPDATE users SET timezone=$2 WHERE id=$1`, [uid, tz]);
      } catch {
        if (L === "pl") await tgSend(chatId, `❌ Nie udało się zapisać strefy. Spróbuj ponownie.`);
        else await tgSend(chatId, `❌ Failed to save timezone. Please try again.`);
        return;
      }

      const nowStr = fmtNowInTz(tz);
      if (L === "pl") {
        await tgSend(
          chatId,
          `✅ Ustawiono strefę: <b>${escapeHtml(tz)}</b>\n` + (nowStr ? `Teraz: <b>${escapeHtml(nowStr)}</b>` : ``)
        );
      } else {
        await tgSend(
          chatId,
          `✅ Timezone set: <b>${escapeHtml(tz)}</b>\n` + (nowStr ? `Now: <b>${escapeHtml(nowStr)}</b>` : ``)
        );
      }
    },
  };
}
