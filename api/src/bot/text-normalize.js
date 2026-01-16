// extracted from api/telegram-bot.js (NO behavior change)

// ---------- panel login URL dedupe ----------
function dedupePanelLoginUrlText(text) {
  try {
    if (typeof text !== "string") return text;

    const re = /https?:\/\/[^\s]+\/api\/auth\/login\?token=[a-f0-9]+/gi;
    const m = text.match(re) || [];
    if (m.length <= 1) return text;

    const url = m[0];
    const lines = text.split(/\r?\n/);
    const hasPanelLine = lines.some((ln) => String(ln || "").includes("Panel:") && String(ln || "").includes(url));

    const out = [];
    let rawSeen = 0;
    for (const ln of lines) {
      const t = String(ln || "").trim();
      if (t === url) {
        if (hasPanelLine) continue;
        rawSeen += 1;
        if (rawSeen > 1) continue;
      }
      out.push(ln);
    }
    const nt = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    return nt || `Panel: ${url}`;
  } catch {
    return text;
  }
}

// ---------- if text has no URL but keyboard has url => append raw url line ----------
function appendUrlFromKeyboard(text, payload) {
  try {
    const s = String(text ?? "");
    if (s.includes("http://") || s.includes("https://")) return s;

    const kb = payload?.reply_markup?.inline_keyboard;
    if (!Array.isArray(kb)) return s;

    for (const row of kb) {
      if (!Array.isArray(row)) continue;
      for (const btn of row) {
        const u = btn && typeof btn.url === "string" ? btn.url : "";
        if (u.startsWith("http://") || u.startsWith("https://")) {
          return s.replace(/\s+$/g, "") + "\n" + u;
        }
      }
    }
    return s;
  } catch {
    return String(text ?? "");
  }
}


export { dedupePanelLoginUrlText, appendUrlFromKeyboard };
