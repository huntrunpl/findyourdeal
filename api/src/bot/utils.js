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

// ---------- i18n (language list) ----------
const FYD_DEFAULT_LANG = "en";
const FYD_SUPPORTED_LANGS = [
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },

export { sleep, escapeHtml, normLang };
