"use strict";

export function createNazwaHandler({ tgSend, escapeHtml, fydResolveLang, dbQuery }) {
  return async function handleNazwa(msg, user) {
    const chatId = String(msg.chat.id);
    const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");

    const raw = String(msg.text || "").trim();
    const parts = raw.split(/\s+/);
    const linkId = Number(parts[1] || 0);
    const rawName = parts.slice(2).join(" ").trim();

    if (!Number.isFinite(linkId) || linkId <= 0 || !rawName) {
      await tgSend(chatId, lang === "pl"
        ? "Użycie: /nazwa <ID> <Twoja nazwa>\nPrzykład: /nazwa 116 Oferty iPhone 16\nWyczyszczenie: /nazwa 116 -"
        : "Usage: /nazwa <ID> <Your name>\nExample: /nazwa 116 iPhone 16 offers\nClear: /nazwa 116 -"
      );
      return;
    }

    const name = (rawName === "-" ? "" : rawName).slice(0, 60);

    try {
      const r = await dbQuery(
        "UPDATE links SET name=$1, label=$1 WHERE id=$2 AND user_id=$3 RETURNING id",
        [name || null, linkId, Number(user.id)]
      );
      if (!r.rowCount) {
        await tgSend(chatId, lang === "pl"
          ? `ℹ️ Nie znaleziono linku o ID ${linkId} na Twoim koncie.`
          : `ℹ️ Link ID ${linkId} not found in your account.`
        );
        return;
      }

      await tgSend(chatId, lang === "pl"
        ? (name ? `✅ Ustawiono nazwę dla ID ${linkId}: ${escapeHtml(name)}` : `✅ Wyczyszczono nazwę dla ID ${linkId}.`)
        : (name ? `✅ Name set for ID ${linkId}: ${escapeHtml(name)}` : `✅ Name cleared for ID ${linkId}.`)
      );
    } catch (e) {
      await tgSend(chatId, `❌ Error: ${escapeHtml(String(e?.message || e))}`);
    }
  };
}
