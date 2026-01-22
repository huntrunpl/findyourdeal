/**
 * Update handler factory extracted from api/telegram-bot.js (no behavior change).
 *
 * ctx must provide:
 * - handleCallback(update)
 * - tgSend(chatId, text, opts?)
 * - ensureUser(tgId, username, firstName, lastName, languageCode)
 * - getUserWithPlanByTelegramId(tgId)
 * - ensureChatNotificationsRowDb(chatId, userId)
 * - dbReady getter: __dbReady boolean
 * - initDbRetryLoop()
 * - dbQuery(sql, params)
 * - clearLinkNotificationMode(userId, chatId, linkId)
 * - setPerLinkMode(chatId, userId, linkId, mode)
 * - hasColumn(table, column) [not used here, but keep ctx consistent elsewhere]
 * - fydResolveLang(chatId, user, fromLanguageCode)
 * - handlers: handleHelp, handleLang, handleStatus, handlePlans, handleBuyPlan, handleAddon10,
 *            handleCena, handleRozmiar, handleMarka, handleFiltry, handleResetFiltry,
 *            handleNewestStrict, handleCheapest, handlePanel, handleList, handleRemove, handleAdd,
 *            globalOnAndArm, globalOff, handleModeSingle, handleModeBatch, handleDefault,
 *            handleQuietOff, handleQuiet, handleUsunUzytkownika, handleDajAdmina, handleNazwa, handleTechnik
 * - t(lang, key) function for unknown command fallback
 */
export function createHandleUpdate(ctx) {
  const {
    handleCallback,
    tgSend,
    ensureUser,
    getUserWithPlanByTelegramId,
    ensureChatNotificationsRowDb,
    dbReadyRef,
    initDbRetryLoop,
    fydResolveLang,
    dbQuery,
    clearLinkNotificationMode,
    setPerLinkMode,

    handleHelp,
    handleLang,
    handleStatus,
    handlePlans,
    handleBuyPlan,
    handleAddon10,
    handleTimezone,

    handleCena,
    handleRozmiar,
    handleMarka,
    handleFiltry,
    handleResetFiltry,

    handleNewestStrict,
    handleCheapest,

    handlePanel,
    handleList,
    handleRemove,
    handleAdd,

    globalOnAndArm,
    globalOff,
    handleModeSingle,
    handleModeBatch,
    handleDefault,

    handleQuietOff,
    handleQuiet,

    handleUsunUzytkownika,
    handleDajAdmina,
    handleNazwa,
    handleTechnik,

    t,
  } = ctx;

  function normalizeCommand(cmdRaw) {
    const c0 = String(cmdRaw || "").trim().toLowerCase().split("@")[0];
    const c = c0.normalize("NFD").replace(/\p{Diacritic}/gu, "");

    const map = new Map([
      ["/help", "/help"], ["/pomoc", "/help"],
      ["/start", "/start"],
      ["/plany", "/plans"], ["/kup", "/plans"], ["/plans", "/plans"],
      ["/lista", "/list"], ["/list", "/list"],
      ["/dodaj", "/add"], ["/add", "/add"],
      ["/usun", "/remove"], ["/remove", "/remove"],
      ["/status", "/status"], ["/config", "/status"],
      ["/cisza", "/quiet"], ["/quiet", "/quiet"],
      ["/cisza_off", "/quiet_off"], ["/quiet_off", "/quiet_off"],
      ["/najnowsze", "/latest"], ["/latest", "/latest"],
      ["/najtansze", "/cheapest"], ["/cheapest", "/cheapest"],
      ["/pojedyncze", "/single"], ["/pojedynczo", "/single"], ["/single", "/single"],
      ["/zbiorcze", "/batch"], ["/batch", "/batch"], ["/domyslnie", "/default"],
      ["/on", "/on"], ["/off", "/off"],
      ["/panel", "/panel"],
      ["/lang", "/lang"],
      ["/starter", "/starter"], ["/growth", "/growth"], ["/platinum", "/platinum"],
      ["/addon10", "/addon10"],
      ["/timezone", "/timezone"], ["/strefa", "/timezone"], ["/tz", "/timezone"],
      ["/cena", "/cena"], ["/rozmiar", "/rozmiar"], ["/marka", "/marka"],
      ["/filtry", "/filtry"], ["/resetfiltry", "/resetfiltry"],
      ["/usun_uzytkownika", "/usun_uzytkownika"],
      ["/daj_admina", "/daj_admina"],
      ["/nazwa", "/nazwa"],
      ["/technik", "/technik"],
    ]);

    return map.get(c) || c;
  }

  return async function handleUpdate(update) {
    if (update.callback_query) {
      await handleCallback(update);
      return;
    }

    const msg = update.message || update.edited_message;
    if (!msg || !msg.text) return;

    const chatType = msg.chat?.type || "";
    if (chatType && chatType !== "private") {
      await tgSend(String(msg.chat.id), "❌ Private chat only.");
      return;
    }

    if (!dbReadyRef.value) {
      await initDbRetryLoop();
      dbReadyRef.value = true;
    }

    const chatId = String(msg.chat.id);
    const from = msg.from || {};
    const tgId = from.id ? String(from.id) : null;
    if (!tgId) return;

    // allow spaced variants: /on 18 etc => /on_18
    let text = String(msg.text ?? "").trim();
    const mSpace = text.match(/^\/(on|off|single|batch|pojedyncze|pojedynczo|zbiorcze)(?:@\w+)?\s+(\d+)\b/i);
    if (mSpace) {
      const cmd = mSpace[1].toLowerCase() === "pojedynczo" ? "pojedyncze" : mSpace[1].toLowerCase();
      text = `/${cmd}_${mSpace[2]}`;
    }

    await ensureUser(from.id, from.username || null, from.first_name || null, from.last_name || null, from.language_code || null);

    const user = await getUserWithPlanByTelegramId(tgId);
    if (!user?.id) {
      await tgSend(chatId, "Use /start.");
      return;
    }

    await ensureChatNotificationsRowDb(chatId, user.id);

    const [commandRaw, ...rest] = text.split(/\s+/);
    const __cmd0 = String(commandRaw || "").split("@")[0];

    const command = normalizeCommand(__cmd0);
    const argText = rest.join(" ").trim();

    // per-link commands: /single_18 /batch_18 /off_18 /on_18 (+ pl: /pojedyncze_18 /zbiorcze_18)
    const perLink = command.match(/^\/(pojedyncze|zbiorcze|single|batch|off|on)_(\d+)$/i);
    if (perLink) {
      const kind = perLink[1].toLowerCase();
      const linkId = Number(perLink[2]);
      const lang = await fydResolveLang(chatId, user, from.language_code || "");

      if (kind === "on") {
        const chk = await dbQuery(`SELECT id FROM links WHERE id=$1 AND user_id=$2 LIMIT 1`, [linkId, Number(user.id)]);
        if (!chk.rowCount) {
          await tgSend(chatId, lang === "pl"
            ? `❌ Link <b>${linkId}</b> nie należy do Twojego konta.`
            : `❌ Link <b>${linkId}</b> is not on your account.`
          );
          return;
        }

        await clearLinkNotificationMode(user.id, chatId, linkId).catch(() => {});

        const cn = await dbQuery(`SELECT mode FROM chat_notifications WHERE chat_id=$1 AND user_id=$2 LIMIT 1`, [chatId, Number(user.id)]).catch(() => ({ rows: [] }));
        const chatMode = String(cn.rows?.[0]?.mode || "single").toLowerCase() === "batch"
          ? (lang === "pl" ? "zbiorczo" : "batch")
          : (lang === "pl" ? "pojedynczo" : "single");

        await tgSend(chatId, lang === "pl"
          ? `✅ Link <b>${linkId}</b> WŁĄCZONY (dziedziczy tryb czatu: <b>${chatMode}</b>).`
          : `✅ Link <b>${linkId}</b> ENABLED (inherits chat mode: <b>${chatMode}</b>).`
        );
        return;
      }

      const mode = (kind === "zbiorcze" || kind === "batch") ? "batch" : kind === "off" ? "off" : "single";
      const res = await setPerLinkMode(chatId, user.id, linkId, mode);
      if (!res.ok) {
        await tgSend(chatId, lang === "pl" ? "❌ Link nie należy do Twojego konta." : "❌ Link is not on your account.");
        return;
      }
      const pretty =
        res.mode === "batch" ? (lang === "pl" ? "zbiorczo" : "batch") :
        res.mode === "off" ? "OFF" :
        (lang === "pl" ? "pojedynczo" : "single");
      await tgSend(chatId, lang === "pl"
        ? `✅ Link <b>${linkId}</b> ustawiony: <b>${pretty}</b>`
        : `✅ Link <b>${linkId}</b> set to: <b>${pretty}</b>`
      );
      return;
    }

    // standard commands
    if (command === "/start") return handleHelp(msg, user);
    if (command === "/help") return handleHelp(msg, user);
    if (command === "/lang") return handleLang(msg, user);
    if (command === "/status") return handleStatus(msg, user);

    if (command === "/plans") return handlePlans(msg, user);
    if (command === "/starter") return handleBuyPlan(msg, user, "starter");
    if (command === "/growth") return handleBuyPlan(msg, user, "growth");
    if (command === "/platinum") return handleBuyPlan(msg, user, "platinum");
    if (command === "/addon10") return handleAddon10(msg, user);

    if (command === "/timezone") return handleTimezone(msg, user, argText);

    if (command === "/cena") return handleCena(msg, user);
    if (command === "/rozmiar") return handleRozmiar(msg, user);
    if (command === "/marka") return handleMarka(msg, user);
    if (command === "/filtry") return handleFiltry(msg, user);
    if (command === "/resetfiltry") return handleResetFiltry(msg, user);

    if (command === "/latest") return handleNewestStrict(msg, user);
    if (command === "/cheapest") return handleCheapest(msg, user);

    if (command === "/panel") return handlePanel(msg, user);
    if (command === "/list") return handleList(msg, user);
    if (command === "/remove") return handleRemove(msg, user, argText);
    if (command === "/add") return handleAdd(msg, user, argText);

    if (command === "/on") return globalOnAndArm(msg, user);
    if (command === "/off") return globalOff(msg, user);
    if (command === "/single") return handleModeSingle(msg, user);
    if (command === "/batch") return handleModeBatch(msg, user);
    if (command === "/default") return handleDefault(msg, user, argText);

    if (command === "/quiet_off") return handleQuietOff(msg, user);
    if (command === "/quiet") return handleQuiet(msg, user);

    if (command === "/usun_uzytkownika") return handleUsunUzytkownika(msg, user);
    if (command === "/daj_admina") return handleDajAdmina(msg, user);
    if (command === "/nazwa") return handleNazwa(msg, user);
    if (command === "/technik") return handleTechnik(msg, user, argText);

    const lang = await fydResolveLang(chatId, user, from.language_code || "");
    await tgSend(chatId, t(lang, "unknown_command") || (lang === "pl" ? "❓ Nieznana komenda. Użyj /help." : "❓ Unknown command. Use /help."));
  };
}
