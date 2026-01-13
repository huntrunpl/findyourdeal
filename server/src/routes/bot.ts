import { Router } from "express";
import axios from "axios";
import db from "../db";

const router = Router();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error("Brak zmiennej środowiskowej TELEGRAM_BOT_TOKEN");
}
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Pomocnicza funkcja wysyłania wiadomości
async function sendMessage(chatId: number | string, text: string) {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  } catch (err) {
    console.error("Błąd sendMessage:", (err as any).message || err);
  }
}

// Dzielimy długie odpowiedzi na części (limit Telegrama ~4096 znaków)
function chunkText(text: string, limit = 4000): string[] {
  if (text.length <= limit) return [text];

  const parts: string[] = [];
  const blocks = text.split("\n\n"); // dzielimy po pustych liniach (między pozycjami)

  let current = "";
  for (const block of blocks) {
    const plus = (current ? current + "\n\n" : "") + block;
    if (plus.length > limit) {
      if (current) parts.push(current);
      current = block;
    } else {
      current = plus;
    }
  }
  if (current) parts.push(current);

  return parts;
}

router.post("/telegram/webhook", async (req, res) => {
  const update = req.body;

  try {
    const message = update.message || update.edited_message;
    if (!message || !message.text) {
      return res.sendStatus(200);
    }

    const chatId = message.chat.id;
    const userId = message.from?.id ?? 0;
    const text: string = (message.text || "").trim();

    if (!text.startsWith("/")) {
      await sendMessage(
        chatId,
        "Użyj jednej z komend:\n" +
          "/start - info o bocie\n" +
          "/dodaj <url> [nazwa] - dodaj link do monitorowania\n" +
          "/lista - pokaż listę linków\n" +
          "/usun <id> - usuń link po ID"
      );
      return res.sendStatus(200);
    }

    const [command, ...args] = text.split(/\s+/);

    // ===========================
    // /start
    // ===========================
    if (command === "/start") {
      await sendMessage(
        chatId,
        "Cześć! 👋\n\n" +
          "Jestem botem do monitorowania ogłoszeń z OLX.\n\n" +
          "Dostępne komendy:\n" +
          "/dodaj <url> [nazwa] – dodaj nowy link do monitorowania\n" +
          "/lista – pokaż wszystkie Twoje linki\n" +
          "/usun <id> – usuń link po ID z listy"
      );
      return res.sendStatus(200);
    }

    // ===========================
    // /dodaj <url> [nazwa...]
    // ===========================
    if (command === "/dodaj") {
      if (args.length === 0) {
        await sendMessage(
          chatId,
          "Użycie:\n/dodaj <url> [nazwa]\n\nPrzykład:\n/dodaj https://m.olx.pl/oferty/?q=iphone14 iPhone 14 monitoring"
        );
        return res.sendStatus(200);
      }

      const url = args[0];
      const name = args.slice(1).join(" ") || url;

      try {
        // Zapis do bazy
        const row = await db.one(
          `
          INSERT INTO links (user_id, name, url, source, active, chat_id, thread_id, last_key, last_seen_at)
          VALUES ($1, $2, $3, $4, true, $5, $6, $7, $8)
          RETURNING id, name, url
        `,
          [
            userId,
            name,
            url,
            "olx",
            chatId,
            null,
            null,
            null,
          ]
        );

        await sendMessage(
          chatId,
          "✅ Dodano nowy link do monitorowania:\n\n" +
            `<b>ID:</b> ${row.id}\n` +
            `<b>Nazwa:</b> ${row.name}\n` +
            `<b>URL:</b> ${row.url}\n\n` +
            "Możesz podejrzeć wszystko komendą /lista"
        );
      } catch (err) {
        console.error("Błąd /dodaj:", err);
        await sendMessage(
          chatId,
          "❌ Wystąpił błąd przy dodawaniu linku. Spróbuj ponownie później."
        );
      }

      return res.sendStatus(200);
    }

    // ===========================
    // /lista
    // ===========================
    if (command === "/lista") {
      try {
        const links = await db.any(
          `
          SELECT id, name, url, active, created_at
          FROM links
          WHERE user_id = $1
          ORDER BY id ASC
        `,
          [userId]
        );

        if (links.length === 0) {
          await sendMessage(
            chatId,
            "Nie masz jeszcze żadnych zapisanych linków.\n\n" +
              "Dodaj pierwszy komendą:\n" +
              "/dodaj <url> [nazwa]"
          );
          return res.sendStatus(200);
        }

        const lines = links.map((l: any) => {
          const active = l.active ? "✅ aktywny" : "⛔️ wyłączony";
          const created =
            l.created_at instanceof Date
              ? l.created_at.toISOString().slice(0, 19).replace("T", " ")
              : l.created_at;

          return (
            `ID: <b>${l.id}</b>\n` +
            `Nazwa: ${l.name}\n` +
            `URL: ${l.url}\n` +
            `Status: ${active}\n` +
            `Dodano: ${created}`
          );
        });

        const fullText =
          "📋 Twoje linki:\n\n" + lines.join("\n\n") + "\n\n" +
          "Aby usunąć link wpisz:\n" +
          "/usun <id> (np. /usun 3)";

        const chunks = chunkText(fullText);
        for (const part of chunks) {
          await sendMessage(chatId, part);
        }
      } catch (err) {
        console.error("Błąd /lista:", err);
        await sendMessage(
          chatId,
          "❌ Wystąpił błąd przy pobieraniu listy linków."
        );
      }

      return res.sendStatus(200);
    }

    // ===========================
    // /usun <id>
    // ===========================
    if (command === "/usun") {
      if (args.length === 0) {
        await sendMessage(
          chatId,
          "Użycie:\n/usun <id>\n\nID znajdziesz w komendzie /lista.\nPrzykład:\n/usun 5"
        );
        return res.sendStatus(200);
      }

      const idStr = args[0].trim();
      const id = Number(idStr);

      if (!Number.isInteger(id) || id <= 0) {
        await sendMessage(
          chatId,
          "❌ Nieprawidłowe ID.\nUżycie:\n/usun <id>\n\nPrzykład:\n/usun 5"
        );
        return res.sendStatus(200);
      }

      try {
        const deleted = await db.oneOrNone(
          `
          DELETE FROM links
          WHERE id = $1 AND user_id = $2
          RETURNING id, name, url
        `,
          [id, userId]
        );

        if (!deleted) {
          await sendMessage(
            chatId,
            `Nie znaleziono linku o ID <b>${id}</b> dla tego użytkownika.\n` +
              "Sprawdź listę komendą /lista."
          );
        } else {
          await sendMessage(
            chatId,
            "✅ Usunięto link:\n\n" +
              `<b>ID:</b> ${deleted.id}\n` +
              `<b>Nazwa:</b> ${deleted.name}\n` +
              `<b>URL:</b> ${deleted.url}`
          );
        }
      } catch (err) {
        console.error("Błąd /usun:", err);
        await sendMessage(
          chatId,
          "❌ Wystąpił błąd przy usuwaniu linku. Spróbuj ponownie."
        );
      }

      return res.sendStatus(200);
    }

    // ===========================
    // /help oraz inne komendy
    // ===========================
    if (command === "/help") {
      await sendMessage(
        chatId,
        "Dostępne komendy:\n" +
          "/start – podstawowe informacje\n" +
          "/dodaj <url> [nazwa] – dodaj link do monitorowania\n" +
          "/lista – pokaż listę linków\n" +
          "/usun <id> – usuń link z listy"
      );
      return res.sendStatus(200);
    }

    // Nieznana komenda
    await sendMessage(
      chatId,
      "Nie znam tej komendy.\n\n" +
        "Dostępne:\n" +
        "/start\n" +
        "/dodaj <url> [nazwa]\n" +
        "/lista\n" +
        "/usun <id>"
    );

    return res.sendStatus(200);
  } catch (err) {
    console.error("Błąd w /telegram/webhook:", err);
    // Telegram wymaga 200 nawet przy błędach, żeby nie powtarzał webhooka
    return res.sendStatus(200);
  }
});

export default router;
