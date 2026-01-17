/**
 * Chat notification commands extracted from api/telegram-bot.js
 * - /quiet, /quiet_off
 * - /on, /off
 * - /single, /batch
 *
 * Deps injected to avoid TDZ / hidden coupling.
 */

export function createChatNotificationsHandlers(deps) {
  const {
    tgSend,
    fydResolveLang,
    dbQuery,
    hasColumn,
    ensureChatNotificationsRowDb,
    getQuietHours,
    setQuietHours,
    disableQuietHours,
    escapeHtml,
  } = deps;

  async function handleQuiet(msg, user) {
    const chatId = String(msg.chat.id);
    const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
    const arg = String(msg.text || "").trim().split(/\s+/).slice(1).join(" ").trim();

    if (!arg) {
      const qh = await getQuietHours(chatId).catch(() => null);
      if (qh?.quiet_enabled) {
        await tgSend(chatId, lang === "pl"
          ? `🌙 Cisza nocna: <b>WŁĄCZONA</b>, godziny ${qh.quiet_from}:00–${qh.quiet_to}:00`
          : `🌙 Quiet hours: <b>ENABLED</b>, hours ${qh.quiet_from}:00–${qh.quiet_to}:00`
        );
      } else {
        await tgSend(chatId, lang === "pl"
          ? "🌙 Cisza nocna: <b>wyłączona</b>.\nUstaw: <code>/cisza 22-7</code>"
          : "🌙 Quiet hours: <b>disabled</b>.\nSet: <code>/quiet 22-7</code>"
        );
      }
      return;
    }

    const m = arg.match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
    if (!m) {
      await tgSend(chatId, lang === "pl"
        ? "Podaj zakres jako HH-HH, np. <code>/cisza 22-7</code>"
        : "Provide range as HH-HH, e.g. <code>/quiet 22-7</code>"
      );
      return;
    }

    const fromHour = Number(m[1]);
    const toHour = Number(m[2]);
    if (!Number.isFinite(fromHour) || !Number.isFinite(toHour) || fromHour < 0 || fromHour > 23 || toHour < 0 || toHour > 23) {
      await tgSend(chatId, lang === "pl"
        ? "Godziny muszą być w zakresie 0–23, np. <code>/cisza 22-7</code>"
        : "Hours must be 0–23, e.g. <code>/quiet 22-7</code>"
      );
      return;
    }

    await setQuietHours(chatId, fromHour, toHour);
    await tgSend(chatId, lang === "pl"
      ? `🌙 Ustawiono ciszę nocną: <b>${fromHour}:00–${toHour}:00</b>`
      : `🌙 Quiet hours set: <b>${fromHour}:00–${toHour}:00</b>`
    );
  }

  async function handleQuietOff(msg, user) {
    const chatId = String(msg.chat.id);
    await disableQuietHours(chatId);
    const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
    await tgSend(chatId, lang === "pl" ? "🌙 Cisza nocna: <b>WYŁĄCZONA</b>" : "🌙 Quiet hours: <b>DISABLED</b>");
  }

  async function globalOn(msg, user) {
    const chatId = String(msg.chat.id);
    const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
    await ensureChatNotificationsRowDb(chatId, user.id);

    await dbQuery(
      `INSERT INTO chat_notifications (chat_id,user_id,enabled,mode,notify_from,updated_at)
       VALUES ($1,$2,TRUE,'single',NOW(),NOW())
       ON CONFLICT (chat_id,user_id)
       DO UPDATE SET enabled=TRUE, notify_from=NOW(), updated_at=NOW()`,
      [chatId, Number(user.id)]
    );

    await tgSend(chatId, lang === "pl"
      ? "✅ Powiadomienia WŁĄCZONE. Od teraz wysyłam tylko <b>nowe</b> ogłoszenia."
      : "✅ Notifications ENABLED. From now on I will send only <b>new</b> offers."
    );
  }

  async function globalOff(msg, user) {
    const chatId = String(msg.chat.id);
    const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
    await ensureChatNotificationsRowDb(chatId, user.id);

    await dbQuery(
      `INSERT INTO chat_notifications (chat_id,user_id,enabled,mode,updated_at)
       VALUES ($1,$2,FALSE,'single',NOW())
       ON CONFLICT (chat_id,user_id)
       DO UPDATE SET enabled=FALSE, updated_at=NOW()`,
      [chatId, Number(user.id)]
    );

    await tgSend(chatId, lang === "pl"
      ? "⛔ Powiadomienia WYŁĄCZONE (dla wszystkich linków na tym czacie)."
      : "⛔ Notifications DISABLED (for all links in this chat)."
    );
  }

  async function armLinks(userId, chatId, linkId = null) {
    const uid = Number(userId);
    const cid = String(chatId);
    if (!uid) return;

    let ids = [];

    // try with chat_id column if exists; else fallback
    const hasChatIdCol = await hasColumn("links", "chat_id").catch(() => false);

    if (linkId != null && Number.isFinite(Number(linkId))) {
      try {
        const r = await dbQuery(
          hasChatIdCol
            ? `SELECT id FROM public.links WHERE id=$3 AND user_id=$1 AND active=true AND (chat_id IS NULL OR chat_id=$2) LIMIT 1`
            : `SELECT id FROM public.links WHERE id=$2 AND user_id=$1 AND active=true LIMIT 1`,
          hasChatIdCol ? [uid, cid, Number(linkId)] : [uid, Number(linkId)]
        );
        ids = (r.rows || []).map((x) => Number(x.id));
      } catch {}
    } else {
      try {
        const r = await dbQuery(
          hasChatIdCol
            ? `SELECT id FROM public.links WHERE user_id=$1 AND active=true AND (chat_id IS NULL OR chat_id=$2) ORDER BY id`
            : `SELECT id FROM public.links WHERE user_id=$1 AND active=true ORDER BY id`,
          hasChatIdCol ? [uid, cid] : [uid]
        );
        ids = (r.rows || []).map((x) => Number(x.id));
      } catch {}
    }

    if (!ids.length) return;

    // history reset
    await dbQuery(`DELETE FROM public.link_items WHERE link_id = ANY($1::bigint[])`, [ids]).catch(() => {});
    // baseline reset (best effort)
    try {
      const hasLastKey = await hasColumn("links", "last_key");
      const hasLastSeenAt = await hasColumn("links", "last_seen_at");
      const sets = [];
      if (hasLastKey) sets.push("last_key=NULL");
      if (hasLastSeenAt) sets.push("last_seen_at=NULL");
      if (sets.length) {
        await dbQuery(`UPDATE public.links SET ${sets.join(", ")} WHERE id = ANY($1::bigint[])`, [ids]).catch(() => {});
      }
    } catch {}
  }

  async function globalOnAndArm(msg, user) {
    // Global /on: włącza powiadomienia i ustawia notify_from=NOW() dla tego czatu.
    // Nie dotykamy historii ani baseline linków – tym zajmuje się worker z użyciem notify_from.
    await globalOn(msg, user);
  }

  async function handleModeSingle(msg, user) {
    const chatId = String(msg.chat.id);
    await ensureChatNotificationsRowDb(chatId, user.id);
    await dbQuery(`UPDATE chat_notifications SET mode='single', updated_at=NOW() WHERE chat_id=$1 AND user_id=$2`, [chatId, user.id]);
    const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
    await tgSend(chatId, lang === "pl"
      ? "📨 Ustawiono tryb: <b>pojedynczo</b> (domyślny na tym czacie)."
      : "📨 Mode set: <b>single</b> (default in this chat)."
    );
  }

  async function handleModeBatch(msg, user) {
    const chatId = String(msg.chat.id);
    await ensureChatNotificationsRowDb(chatId, user.id);
    await dbQuery(`UPDATE chat_notifications SET mode='batch', updated_at=NOW() WHERE chat_id=$1 AND user_id=$2`, [chatId, user.id]);
    const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
    await tgSend(chatId, lang === "pl"
      ? "📦 Ustawiono tryb: <b>zbiorczo</b> (domyślny na tym czacie)."
      : "📦 Mode set: <b>batch</b> (default in this chat)."
    );
  }

  return {
    handleQuiet,
    handleQuietOff,
    globalOn,
    globalOff,
    armLinks,
    globalOnAndArm,
    handleModeSingle,
    handleModeBatch,
  };
}
