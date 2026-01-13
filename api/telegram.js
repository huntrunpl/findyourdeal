/**
 * Minimal Telegram client used by API (sendMessage).
 */
export function createTelegramClient(env = process.env) {
  const token = env.TELEGRAM_BOT_TOKEN || "";
  const apiBase = token ? `https://api.telegram.org/bot${token}` : "";

  async function sendMessage(chatId, text) {
    if (!apiBase) return;
    try {
      await fetch(`${apiBase}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    } catch (err) {
      console.error("tgSend error:", err);
    }
  }

  return { sendMessage, apiBase };
}
