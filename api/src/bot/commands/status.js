/**
 * /status extracted from api/telegram-bot.js
 * Deps are injected to avoid side-effects / TDZ.
 */

function formatWarsawDate(dt) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t) => (parts.find((p) => p.type === t)?.value || "");
  const dd = get("day"), mm = get("month"), yyyy = get("year"), hh = get("hour"), mi = get("minute");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function safeTz(tz) {
  const z = String(tz || "").trim();
  if (!z || z.length > 64) return "Europe/Warsaw";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: z }).format(new Date());
    return z;
  } catch {
    return "Europe/Warsaw";
  }
}

export function createHandleStatus(deps) {
  const {
    tgSend,
    escapeHtml,
    fydResolveLang,
    normLang,
    planLabel,
    getUserEntitlementsByTelegramId,
    getQuietHours,
    dbQuery,
  } = deps;

  return async function handleStatus(msg, user) {
    const chatId = String(msg.chat.id);
    const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
    const L = normLang(lang);

    const S = {
      en: {
        title: "ℹ️ Bot status",
        plan: (p, until) => `Plan: ${p}${until ? ` (until ${until})` : ""}`,
        active: (a, lim) => `Active searches (enabled): ${a}/${lim}`,
        total: (t0, lim) => `Total searches (in DB): ${t0}/${lim}`,
        addons: (n) => `Add-ons (+10): ${n}`,
        history: (n) => `Total history limit: ${n}`,
        daily: (n) => `Daily notifications limit: ${n}`,
        notifOn: "✅ Notifications ENABLED",
        notifOff: "⛔ Notifications DISABLED",
        mode: (m) => `Default mode in this chat: ${m}`,
        today: (c, lim) => `Today's notifications: ${c}/${lim}`,
        change: "Change: /on /off /single /batch",
        quietOff: "Quiet hours: disabled",
        quietOn: (f, t) => `Quiet hours: ENABLED, hours ${f}:00–${t}:00`,
        linksHdr: "All searches:",
        perLink: "Per-link mode: /single_ID /batch_ID /off_ID /on_ID (e.g. /batch_18)",
        mSingle: "single",
        mBatch: "batch",
      },
      pl: {
        title: "ℹ️ Status bota",
        plan: (p, until) => `Plan: ${p}${until ? ` (do ${until})` : ""}`,
        active: (a, lim) => `Aktywne wyszukiwania (włączone): ${a}/${lim}`,
        total: (t0, lim) => `Łącznie wyszukiwań (w bazie): ${t0}/${lim}`,
        addons: (n) => `Dodatki (addon +10): ${n}`,
        history: (n) => `Łączny limit ofert (zgodnie z planem): ${n}`,
        daily: (n) => `Limit dziennych powiadomień: ${n}`,
        notifOn: "✅ Powiadomienia WŁĄCZONE",
        notifOff: "⛔ Powiadomienia WYŁĄCZONE",
        mode: (m) => `Tryb domyślny na tym czacie: ${m}`,
        today: (c, lim) => `Dzisiejsze powiadomienia: ${c}/${lim}`,
        change: "Zmiana: /on /off /pojedyncze /zbiorcze",
        quietOff: "Cisza nocna: wyłączona",
        quietOn: (f, t) => `Cisza nocna: WŁĄCZONA, godziny ${f}:00–${t}:00`,
        linksHdr: "Wszystkie wyszukiwania:",
        perLink: "Tryb per link: /pojedyncze_ID /zbiorcze_ID /off_ID /on_ID (np. /zbiorcze_18)",
        mSingle: "pojedynczo",
        mBatch: "zbiorczo",
      },
    };
    const T = S[L] || S.en;

    const ent = await getUserEntitlementsByTelegramId(user.telegram_user_id).catch(() => null);
    const planCode = String(ent?.plan_code || "").toLowerCase();
    const planName = planLabel(planCode || "plan");
    const untilStr = ent?.expires_at ? formatWarsawDate(ent.expires_at) : "";

    let linksLimit = Number(ent?.links_limit_total ?? 0);
    if (!Number.isFinite(linksLimit) || linksLimit <= 0) linksLimit = "?";

    // addon qty (best effort)
    let addons = 0;
    try {
      const r = await dbQuery(
        `SELECT COALESCE(SUM(COALESCE(addon_qty,0)),0)::int AS n
         FROM subscriptions
         WHERE user_id=$1 AND status='active'`,
        [Number(user.id)]
      );
      addons = Number(r.rows?.[0]?.n ?? 0);
      if (!Number.isFinite(addons) || addons < 0) addons = 0;
    } catch {}

    const baseHistory =
      planCode === "platinum" ? 800 :
      planCode === "growth" || planCode === "pro" ? 700 :
      planCode === "starter" || planCode === "basic" ? 600 :
      planCode === "trial" ? 200 : 0;

    const baseDaily =
      planCode === "platinum" ? 200 :
      planCode === "growth" || planCode === "pro" ? 400 :
      planCode === "starter" || planCode === "basic" ? 200 :
      planCode === "trial" ? 200 : 0;

    let historyLimit = Number(ent?.history_total_limit ?? ent?.history_limit_total ?? ent?.history_limit ?? 0);
    if (!Number.isFinite(historyLimit) || historyLimit <= 0) historyLimit = baseHistory + addons * 100;

    let dailyLimit = Number(ent?.daily_notifications_limit ?? ent?.daily_notifications ?? 0);
    if (!Number.isFinite(dailyLimit) || dailyLimit <= 0) dailyLimit = baseDaily + addons * 100;

    // counts
    let enabled = 0, total = 0;
    try {
      const r1 = await dbQuery(`SELECT COUNT(*)::int AS n FROM links WHERE user_id=$1 AND active=TRUE`, [Number(user.id)]);
      enabled = Number(r1.rows?.[0]?.n ?? 0) || 0;
      const r2 = await dbQuery(`SELECT COUNT(*)::int AS n FROM links WHERE user_id=$1`, [Number(user.id)]);
      total = Number(r2.rows?.[0]?.n ?? 0) || 0;
    } catch {}

    // chat notifications (on/off + domyślny tryb czatu)
    let notifEnabled = true;
    let chatMode = "single";

    try {
      const r = await dbQuery(
        `SELECT enabled, mode
           FROM chat_notifications
          WHERE chat_id=$1 AND user_id=$2
          LIMIT 1`,
        [String(chatId), Number(user.id)]
      );
      const row = r.rows?.[0];
      if (row) {
        notifEnabled = row.enabled !== false;
        chatMode = String(row.mode || "single").toLowerCase() === "batch" ? "batch" : "single";
      }
    } catch {}

    
    // per-user timezone (default Europe/Warsaw)
    let userTz = "Europe/Warsaw";
    try {
      const rTz = await dbQuery(
        `SELECT COALESCE(NULLIF(timezone,''),'Europe/Warsaw') AS tz
           FROM public.users
          WHERE id=$1
          LIMIT 1`,
        [Number(user.id)]
      );
      userTz = safeTz(rTz.rows?.[0]?.tz || "Europe/Warsaw");
    } catch {
      userTz = "Europe/Warsaw";
    }

// dzisiejsze powiadomienia — sumarycznie po wszystkich czatach użytkownika, bieżący dzień
    let dailyCount = 0;
    try {
      const rDaily = await dbQuery(
        `SELECT COALESCE(SUM(
                  CASE
                    WHEN daily_count_date IS DISTINCT FROM (NOW() AT TIME ZONE $2)::date THEN 0
                    ELSE COALESCE(daily_count,0)
                  END
                ),0)::int AS c
           FROM public.chat_notifications
          WHERE user_id=$1`,
        [Number(user.id), userTz]
      );
      const c = Number(rDaily?.rows?.[0]?.c ?? 0);
      if (Number.isFinite(c) && c >= 0) dailyCount = c;
    } catch {}

    // clamp i higiena: nie pokazujemy więcej niż limit
    if (!Number.isFinite(dailyCount) || dailyCount < 0) dailyCount = 0;
    if (dailyLimit > 0 && dailyCount > dailyLimit) {
      dailyCount = dailyLimit;
      try {
        await dbQuery(
          `UPDATE public.chat_notifications
              SET daily_count = LEAST(
                    CASE
                      WHEN daily_count_date IS DISTINCT FROM (NOW() AT TIME ZONE $3)::date THEN 0
                      ELSE COALESCE(daily_count,0)
                    END,
                    $2
                  ),
                  daily_count_date = (NOW() AT TIME ZONE $3)::date,
                  updated_at = NOW()
            WHERE user_id=$1`,
          [Number(user.id), dailyLimit, userTz]
        );
      } catch {}
    }

    const modeLabel = (m) => (m === "batch" ? T.mBatch : T.mSingle);

    // quiet hours
    let quietLine = T.quietOff;
    try {
      const qh = await getQuietHours(String(chatId));
      if (qh && qh.quiet_enabled) quietLine = T.quietOn(qh.quiet_from, qh.quiet_to);
    } catch {}

    // list enabled links + per-link mode
    let linksText = "";
    try {
      const r = await dbQuery(
        `SELECT id,
                COALESCE(NULLIF(label,''), NULLIF(name,''), 'Monitoring') AS name,
                source,
                active
           FROM links
          WHERE user_id=$1 AND active=TRUE
          ORDER BY id ASC`,
        [Number(user.id)]
      );

      for (const row of (r.rows || [])) {
        let per = null;
        try {
          const m = await dbQuery(
            `SELECT mode
               FROM link_notification_modes
              WHERE user_id=$1 AND chat_id=$2 AND link_id=$3
              ORDER BY updated_at DESC
              LIMIT 1`,
            [Number(user.id), String(chatId), Number(row.id)]
          );
          per = m.rows?.[0]?.mode || null;
        } catch {}

        const eff = per ? String(per).toLowerCase() : chatMode;
        const monOn = row.active === true || String(row.active) === "t" || String(row.active).toLowerCase() === "true";
        const monIcon = monOn ? "✅" : "⛔";
        const notifIcon = eff === "off" ? "🔕" : "🔔";
        const src = String(row.source || "").toUpperCase() || "LINK";
        const name = escapeHtml(row.name || "(no name)");
        const mLabel = eff === "off" ? "OFF" : modeLabel(eff === "batch" ? "batch" : "single");
        linksText += `• ${monIcon}${notifIcon} ${row.id} – ${name} (${src}) – ${L === "pl" ? "tryb" : "mode"}: ${escapeHtml(mLabel)}\n`;
      }
    } catch {}

    const out =
      `${T.title}\n\n` +
      `${T.plan(escapeHtml(planName), escapeHtml(untilStr))}\n\n` +
      `${T.active(enabled, linksLimit)}\n` +
      `${T.total(total, linksLimit)}\n\n` +
      `${T.addons(addons)}\n` +
      `${T.history(historyLimit)}\n` +
      `${T.daily(dailyLimit)}\n\n` +
      `${notifEnabled ? T.notifOn : T.notifOff}\n` +
      `${T.mode(modeLabel(chatMode))}\n` +
      `${T.today(dailyCount, dailyLimit)}\n` +
      `${T.change}\n\n` +
      `${quietLine}\n\n` +
      `${T.linksHdr}\n` +
      (linksText || (L === "pl" ? "(brak)\n" : "(none)\n")) +
      `\n${T.perLink}`;

    await tgSend(chatId, out.trim(), { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
  };
}
