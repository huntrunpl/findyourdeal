// extracted from api/telegram-bot.js (NO behavior change)

// ---------- i18n (language list) ----------
const FYD_DEFAULT_LANG = "en";
const FYD_SUPPORTED_LANGS = [
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "cs", name: "Čeština", flag: "🇨🇿" },
  { code: "sk", name: "Slovenčina", flag: "🇸🇰" },
];

function isSupportedLang(l) {
  return FYD_SUPPORTED_LANGS.some((x) => x.code === l);
}
// ---------- i18n END ----------

export { FYD_DEFAULT_LANG, FYD_SUPPORTED_LANGS, isSupportedLang };
