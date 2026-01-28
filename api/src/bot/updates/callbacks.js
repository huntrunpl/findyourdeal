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

  function modeLabel(lang, mode) {
    const m = String(mode || "single").toLowerCase();
    if (m === "batch") return t(lang, "mode_batch");
    if (m === "off") return t(lang, "mode_off");
    return t(lang, "mode_single");
  }

  return async function handleCallback(update) {
    const cq = update.callback_query;
    if (!cq) return;

    const data = cq.data || "";
    const chatId = cq.message?.chat?.id;
    const fromId = cq.from?.id ? String(cq.from.id) : null;
    const langFast = cq.from?.language_code || "en";

    if (!chatId || !fromId) {
      await tgAnswerCb(cq.id, t(langFast, "missing_chat_user"));
      return;
    }

    const u = await getUserWithPlanByTelegramId(fromId);
    if (!u?.id) {
      await tgAnswerCb(cq.id, t(langFast, "prompt_start"), true);
      return;
    }

    await ensureChatNotificationsRowDb(String(chatId), u.id);

    const mLang = data.match(/^lang:([a-z]{2})$/i);
    if (mLang) {
      const newLang = isSupportedLang(normLang(mLang[1])) ? normLang(mLang[1]) : FYD_DEFAULT_LANG;
      await setLang(String(chatId), u, newLang);
      await tgAnswerCb(cq.id, t(newLang, "language_switched"));
      await tgSend(String(chatId), t(newLang, "language_set", { language: escapeHtml(langLabel(newLang)) }));
      return;
    }

    const m = data.match(/^lnmode:(\d+):(off|single|batch)$/i);
    if (m) {
      const linkId = Number(m[1]);
      const mode = String(m[2]).toLowerCase();
      const res = await setPerLinkMode(String(chatId), u.id, linkId, mode);
      if (!res.ok) { 
        const lang = await fydResolveLang(String(chatId), u, cq?.from?.language_code || "");
        await tgAnswerCb(cq.id, t(lang, "cant_set_mode"), true); 
        return; 
      }
      const lang = await fydResolveLang(String(chatId), u, cq?.from?.language_code || "");
      const pretty = modeLabel(lang, res.mode);
      await tgAnswerCb(cq.id, t(lang, "link_mode_set_cb", { mode: pretty }));
      return;
    }

    await tgAnswerCb(cq.id, t(langFast, "unknown_action"));
  };
}
