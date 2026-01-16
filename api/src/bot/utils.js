// extracted from api/telegram-bot.js (NO behavior change)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normLang(x) {
  const raw = String(x || "").trim().toLowerCase();
  const base = raw.includes("-") ? raw.split("-")[0] : raw;
  return base;
}

export { sleep, escapeHtml, normLang };
