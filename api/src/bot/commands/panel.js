/**
 * /panel extracted from api/telegram-bot.js
 * Deps passed via factory to avoid hidden coupling.
 */

export function createHandlePanel(deps) {
  const { randomBytes, dbQuery, tgSend, escapeHtml, fydResolveLang, getPanelBaseUrl } = deps;

  return async function handlePanel(msg, user) {
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

    const base = (typeof getPanelBaseUrl === "function" ? getPanelBaseUrl() : "") || "https://panel.findyourdeal.app";
    const url = `${base}/api/auth/login?token=${tok}`;

    // IMPORTANT: url in separate line (dedupe + no weird appends)
    await tgSend(
      chatId,
      `Panel:\n${escapeHtml(url)}\n${isPl ? "Token ważny 10 minut." : "Token valid for 10 minutes."}`,
      { disable_web_page_preview: true, link_preview_options: { is_disabled: true } }
    );
  };
}
