// extracted from api/telegram-bot.js (NO behavior change)

// ---------- telegram button i18n (disable/single/batch) ----------
const __btnI18n = {
  en: { disable: "Disable this link", single: "Single", batch: "Batch" },
  pl: { disable: "Wyłącz ten link", single: "Pojedynczo", batch: "Zbiorczo" },
  de: { disable: "Diesen Link deaktivieren", single: "Einzeln", batch: "Gebündelt" },
  fr: { disable: "Désactiver ce lien", single: "Individuel", batch: "Groupé" },
  es: { disable: "Desactivar este enlace", single: "Individual", batch: "Agrupado" },
  it: { disable: "Disattiva questo link", single: "Singolo", batch: "Raggruppato" },
  pt: { disable: "Desativar este link", single: "Individual", batch: "Agrupado" },
  ro: { disable: "Dezactivează acest link", single: "Individual", batch: "Grupat" },
  nl: { disable: "Deze link uitschakelen", single: "Enkel", batch: "Gebundeld" },
  cs: { disable: "Vypnout tento odkaz", single: "Jednotlivě", batch: "Hromadně" },
  sk: { disable: "Vypnúť tento odkaz", single: "Jednotlivo", batch: "Hromadne" },
};

function stripPrefixIcons(t) {
  return String(t || "").replace(/^[^\p{L}\p{N}]+/gu, "").trim();
}

function isDisableText(t) {
  const s = String(t || "").toLowerCase();
  return s.includes("wyłącz") || s.includes("wylacz") || s.includes("disable") || s.includes("vypnout") || s.includes("dezactiv");
}
function isSingleText(t) {
  const s = String(t || "").toLowerCase();
  return s.includes("pojedyncz") || s.includes("single") || s.includes("jednotl") || s.includes("individ");
}
function isBatchText(t) {
  const s = String(t || "").toLowerCase();
  return s.includes("zbiorcz") || s.includes("batch") || s.includes("hromad") || s.includes("group") || s.includes("agrup");
}

async function fixInlineButtonsI18n(payload) {
  try {
    if (!payload || typeof payload !== "object") return payload;
    const rm = payload.reply_markup;
    if (!rm) return payload;

    let obj = rm;
    let wasString = false;

    if (typeof rm === "string") {
      try {
        obj = JSON.parse(rm);
        wasString = true;
      } catch {
        return payload;
      }
    }
    if (!obj || !Array.isArray(obj.inline_keyboard)) return payload;

    // chat_id in private chats == telegram_user_id
    const tgUserId = payload.chat_id;
    let lang = "en";
    try {
      const r = await dbQuery(
        `SELECT COALESCE(NULLIF(lang,''), NULLIF(language,'')) AS l
         FROM public.users
         WHERE telegram_user_id=$1
         LIMIT 1`,
        [Number(tgUserId)]
      );
      const v = normLang(r?.rows?.[0]?.l || "");
      if (v && isSupportedLang(v)) lang = v;
    } catch {}

    const pack = __btnI18n[lang] || __btnI18n.en;

    for (const row of obj.inline_keyboard) {
      if (!Array.isArray(row)) continue;
      for (const btn of row) {
        if (!btn || typeof btn !== "object") continue;
        if (!btn.text) continue;
        const base = stripPrefixIcons(btn.text);

        if (isDisableText(base)) btn.text = pack.disable;
        else if (isSingleText(base)) btn.text = pack.single;
        else if (isBatchText(base)) btn.text = pack.batch;
      }
    }

    payload.reply_markup = wasString ? JSON.stringify(obj) : obj;
    return payload;
  } catch {
    return payload;
  }
}



export { stripPrefixIcons, isDisableText, isSingleText, isBatchText, fixInlineButtonsI18n };
