// extracted from api/telegram-bot.js (NO behavior change)

// ---------- /help /lang ----------
async function handleLang(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  const current = langLabel(lang);
  await tgSend(
    chatId,
    `${t(lang, "choose_language")}\n${t(lang, "language_current", { language: escapeHtml(current) })}`,
    { reply_markup: buildLanguageKeyboard() }
  );
}

async function handleHelp(msg, user) {
  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  await tgSend(chatId, t(lang, "help_text"));
}

async function handleDefault(msg, user, argText) {
  const chatId = String(msg.chat.id);
  const fromLang = msg?.from?.language_code || "";
  const lang = await fydResolveLang(chatId, user, fromLang);

  const idStr = String(argText || "").trim().split(/\s+/)[0] || "";
  const linkId = Number(idStr);
  if (!linkId || !Number.isFinite(linkId)) {
    if (lang === "pl") {
      await tgSend(chatId, "Użycie: /domyślnie ID (np. /domyślnie 64)");
    } else {
      await tgSend(chatId, "Usage: /domyslnie ID (e.g. /domyslnie 64)");
    }
    return;
  }

  // sprawdzenie, czy link należy do użytkownika
  try {
    const chk = await dbQuery(
      "SELECT id FROM links WHERE id=$1 AND user_id=$2 LIMIT 1",
      [linkId, Number(user.id)]
    );
    if (!chk.rowCount) {
      if (lang === "pl") {
        await tgSend(chatId, `❌ Link <b>${linkId}</b> nie należy do Twojego konta.`);
      } else {
        await tgSend(chatId, `❌ Link <b>${linkId}</b> is not on your account.`);
      }
      return;
    }
  } catch (e) {
    console.error("[tg-bot] /domyslnie check error:", e);
    if (lang === "pl") {
      await tgSend(chatId, "❌ Błąd podczas sprawdzania linku.");
    } else {
      await tgSend(chatId, "❌ Error while checking link.");
    }
    return;
  }

  // usunięcie override z link_notification_modes
  try {
    await clearLinkNotificationMode(user.id, chatId, linkId).catch(() => {});
  } catch (e) {
    console.error("[tg-bot] /domyslnie clear error:", e);
    if (lang === "pl") {
      await tgSend(chatId, "❌ Nie udało się usunąć nadpisanego trybu dla linku.");
    } else {
      await tgSend(chatId, "❌ Failed to clear per-link mode override.");
    }
    return;
  }

  // odczyt domyślnego trybu czatu (single / batch)
  let chatModeLabel = "";
  try {
    const cn = await dbQuery(
      "SELECT mode FROM chat_notifications WHERE chat_id=$1 AND user_id=$2 LIMIT 1",
      [chatId, Number(user.id)]
    ).catch(() => ({ rows: [] }));
    const chatMode = String(cn.rows?.[0]?.mode || "single").toLowerCase();
    chatModeLabel =
      chatMode === "batch"
        ? (lang === "pl" ? "zbiorczo" : "batch")
        : (lang === "pl" ? "pojedynczo" : "single");
  } catch (e) {
    console.error("[tg-bot] /domyslnie chat mode read error:", e);
  }

  if (!chatModeLabel) {
    if (lang === "pl") chatModeLabel = "pojedynczo";
    else chatModeLabel = "single";
  }

  if (lang === "pl") {
    await tgSend(
      chatId,
      `✅ Link <b>${linkId}</b> przywrócony do ustawień domyślnych czatu (tryb: <b>${chatModeLabel}</b>).`
    );
  } else {
    await tgSend(
      chatId,
      `✅ Link <b>${linkId}</b> has been reset to chat default mode (<b>${chatModeLabel}</b>).`
    );
  }
}



export { handleLang, handleHelp, handleDefault };
