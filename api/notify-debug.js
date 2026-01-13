import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import pg from "pg";

const { Pool } = pg;

const TG = process.env.TELEGRAM_BOT_TOKEN || "";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  if (!TG) {
    console.error("Brak TELEGRAM_BOT_TOKEN w env workera");
    process.exit(1);
  }

  // Bierzemy dowolny włączony czat usera 1
  const chatsResult = await pool.query(
    `
    SELECT chat_id
    FROM chat_notifications
    WHERE user_id = 1
      AND enabled = TRUE
    LIMIT 1
    `
  );

  if (chatsResult.rowCount === 0) {
    console.error("Brak włączonych powiadomień (chat_notifications) dla user_id = 1");
    process.exit(1);
  }

  const chatId = chatsResult.rows[0].chat_id;
  console.log("Wysyłam test do chat_id:", chatId);

  const url = `https://api.telegram.org/bot${TG}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: "🔔 Test powiadomienia z workera (notify-debug.js)",
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const data = await res.json();
  console.log("Odpowiedź Telegram API:", JSON.stringify(data, null, 2));

  await pool.end();
}

main().catch((err) => {
  console.error("Błąd notify-debug:", err);
  process.exit(1);
});
