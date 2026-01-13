import fetch from "node-fetch";

const TG_TOKEN = process.env.TELEGRAM_TOKEN;
const TG_CHAT  = process.env.TELEGRAM_CHAT;

export async function sendMessage(text) {
  if (!TG_TOKEN || !TG_CHAT) {
    console.log("Telegram not configured");
    return;
  }

  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT,
        text,
        parse_mode: "HTML"
      })
    });
  } catch (err) {
    console.error("Telegram error:", err);
  }
}
