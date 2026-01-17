import { escapeHtml, normLang } from "../utils.js";
import { FYD_DEFAULT_LANG, isSupportedLang } from "../i18n.js";
import { setLang } from "../lang-store.js";
import { t, langLabel } from "../../../i18n.js";

/**
 * Factory: returns callback_query handler bound to ctx dependencies.
 * ctx must provide:
 * - tgAnswerCb(id, text, showAlert?)
 * - tgSend(chatId, text, opts?)
 * - getUserWithPlanByTelegramId(tgId)
 * - ensureChatNotificationsRowDb(chatId, userId)
 * - fydResolveLang(chatId, user, fromLanguageCode)
 * - setPerLinkMode(chatId, userId, linkId, mode)
 */
export function createHandleCallback(ctx) {
  const {
    tgAnswerCb,
    tgSend,
    getUserWithPlanByTelegramId,
    ensureChatNotificationsRowDb,
    fydResolveLang,
    setPerLinkMode,
  } = ctx;

  return async function handleCallback(update) {
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
  };
}
