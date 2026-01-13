import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";

const TG = process.env.TELEGRAM_BOT_TOKEN || "";

if (!TG) {
  console.error("Brak TELEGRAM_BOT_TOKEN w .env – wychodzę.");
  process.exit(1);
}

// mała pauza
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function main() {
  console.log("=== Minimalny Telegram bot startuje (DEBUG) ===");
  console.log("Token zaczyna się od:", TG.slice(0, 10) + "...");

  let offset = 0;

  while (true) {
    try {
      const url = `https://api.telegram.org/bot${TG}/getUpdates?timeout=20&offset=${offset}`;
      console.log("Wołam getUpdates:", url);

      const res = await fetch(url);
      const data = await res.json();

      if (!data.ok) {
        console.error("Telegram getUpdates ERROR:", data);
        // przy błędzie zrób krótką przerwę i próbuj dalej
        await sleep(3000);
        continue;
      }

      if (data.result.length === 0) {
        // brak nowych wiadomości – logujemy rzadko
        console.log("Brak nowych update'ów (pusto).");
      } else {
        console.log("Odebrane update'y:", JSON.stringify(data.result, null, 2));
      }

      for (const upd of data.result) {
        offset = upd.update_id + 1;

        const chatId = upd.message?.chat?.id;
        const text = upd.message?.text;

        console.log("Update:", {
          update_id: upd.update_id,
          chatId,
          text,
        });

        if (chatId && text) {
          if (text === "/start") {
            await sendMessage(chatId, "Cześć, to minimalny bot FindYourDeal. Działam ✅");
          } else if (text === "/ping") {
            await sendMessage(chatId, "pong 🏓");
          } else {
            await sendMessage(chatId, `Dostałem: ${text}`);
          }
        }
      }
    } catch (err) {
      console.error("FATAL w pętli getUpdates:", err);
      await sleep(5000);
    }
  }
}

async function sendMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TG}/sendMessage`;
  const body = new URLSearchParams({ chat_id: String(chatId), text });

  try {
    const res = await fetch(url, {
      method: "POST",
      body,
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("Błąd przy sendMessage:", data);
    } else {
      console.log("Wysłano wiadomość do", chatId);
    }
  } catch (err) {
    console.error("sendMessage exception:", err);
  }
}

main().catch((e) => {
  console.error("Nie udało się wystartować bota:", e);
  process.exit(1);
});
