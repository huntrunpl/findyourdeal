// extracted from api/telegram-bot.js (NO behavior change)
//
// IMPORTANT:
// This module must not rely on undeclared globals.
// We inject dependencies from telegram-bot.js via createTg(ctx).

function messageWantsPreviewOn(text) {
  const s = String(text || "");
  return /vinted\.pl\/items\//i.test(s) || /olx\.pl\/(d\/)?oferta\//i.test(s);
}

function createTg(ctx) {
  const {
    TG,
    fetchFn,
    dbQuery,
    fixInlineButtonsI18n,
    dedupePanelLoginUrlText,
    appendUrlFromKeyboard,
  } = ctx || {};

  if (!TG) throw new Error("TG token missing in createTg(ctx)");
  if (!fetchFn) throw new Error("fetchFn missing in createTg(ctx)");
  if (!dbQuery) throw new Error("dbQuery missing in createTg(ctx)");
  if (!fixInlineButtonsI18n) throw new Error("fixInlineButtonsI18n missing in createTg(ctx)");
  if (!dedupePanelLoginUrlText) throw new Error("dedupePanelLoginUrlText missing in createTg(ctx)");
  if (!appendUrlFromKeyboard) throw new Error("appendUrlFromKeyboard missing in createTg(ctx)");

  async function tgCall(method, payload) {
    const url = `https://api.telegram.org/bot${TG}/${method}`;

    if (payload && typeof payload === "object") {
      if (typeof payload.text === "string") {
        payload.text = dedupePanelLoginUrlText(payload.text);
        payload.text = appendUrlFromKeyboard(payload.text, payload);
      }

      if (method === "sendMessage") {
        if (payload.parse_mode === undefined) payload.parse_mode = "HTML";

        const wantsOn = messageWantsPreviewOn(payload.text);
        if (payload.disable_web_page_preview === undefined) {
          payload.disable_web_page_preview = wantsOn ? false : true;
        }
        try {
          if (payload.link_preview_options === undefined) {
            payload.link_preview_options = { is_disabled: !!payload.disable_web_page_preview };
          }
        } catch {}
      }
    }

    payload = await fixInlineButtonsI18n(payload);

    const res = await fetchFn(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });

    return res.json().catch(() => ({}));
  }

  async function tgSend(chatId, text, extra = {}) {
    // FYD: trial daily limit enforcement (only for offer messages) — NO CHANGE
    try {
      const s = String(text || "");
      const isOffer = messageWantsPreviewOn(s);

      if (isOffer) {
        const cid = String(chatId);
        const cn = await dbQuery(
          `SELECT user_id,
                  CASE WHEN daily_count_date IS DISTINCT FROM CURRENT_DATE THEN 0 ELSE COALESCE(daily_count,0) END AS daily_count
           FROM public.chat_notifications
           WHERE chat_id=$1
           LIMIT 1`,
          [cid]
        ).catch(() => ({ rows: [] }));

        const uid = Number(cn?.rows?.[0]?.user_id || 0);
        let cur = Number(cn?.rows?.[0]?.daily_count || 0);
        if (!Number.isFinite(cur) || cur < 0) cur = 0;

        if (uid > 0) {
          const er = await dbQuery(
            `SELECT LOWER(COALESCE(plan_code,'')) AS plan_code
             FROM public.user_entitlements_v
             WHERE user_id=$1
             LIMIT 1`,
            [uid]
          ).catch(() => ({ rows: [] }));

          const plan = String(er?.rows?.[0]?.plan_code || "");
          if (plan === "trial") {
            const lim = 200;
            const nV = (s.match(/vinted\.pl\/items\//ig) || []).length;
            const nO = (s.match(/olx\.pl\/(d\/)?oferta\//ig) || []).length;
            const inc = Math.max(1, nV + nO);

            await dbQuery(
              `UPDATE public.chat_notifications
               SET daily_count_date = CURRENT_DATE,
                   daily_count = LEAST($3, CASE WHEN daily_count_date IS DISTINCT FROM CURRENT_DATE THEN 0 ELSE COALESCE(daily_count,0) END),
                   updated_at = NOW()
               WHERE chat_id=$1 AND user_id=$2`,
              [cid, uid, lim]
            ).catch(() => {});

            if (cur > lim) cur = lim;
            if (cur + inc > lim) {
              console.log(`FYD: DAILY_LIMIT BLOCK chat=${cid} user_id=${uid} cur=${cur} inc=${inc} lim=${lim}`);
              return { ok: true, blocked: true };
            }
          }
        }
      }
    } catch (e) {
      console.log("FYD: DAILY_LIMIT check error", e?.message || e);
    }

    const payload = { chat_id: chatId, text: String(text ?? ""), ...extra };
    if (payload.parse_mode === undefined) payload.parse_mode = "HTML";
    return tgCall("sendMessage", payload);
  }

  async function tgAnswerCb(callbackQueryId, text, showAlert = false) {
    try {
      await tgCall("answerCallbackQuery", {
        callback_query_id: callbackQueryId,
        text: String(text || ""),
        show_alert: !!showAlert,
      });
    } catch {}
  }

  return { messageWantsPreviewOn, tgCall, tgSend, tgAnswerCb };
}

export { createTg, messageWantsPreviewOn };
