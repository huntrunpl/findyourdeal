export type LangCode = "en" | "pl" | "de" | "it";

export const LANGS: Array<{ code: LangCode; name: string; flag: string }> = [
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
];

const LANG_SET = new Set<LangCode>(LANGS.map((l) => l.code));

export function normLang(raw?: string): LangCode {
  const v = String(raw || "").trim().toLowerCase();
  const base = v.includes("-") ? v.split("-")[0] : v;
  return (LANG_SET.has(base as LangCode) ? (base as LangCode) : "en");
}

type Dict = Record<string, string>;

const DICT: Record<LangCode, Dict> = {
  en: {
    nav_links: "Searches",
    nav_billing: "Billing",

    plan_label: "Plan",
    active_label: "Active",
    expires_prefix: "expires",

    tg_commands_title: "Telegram commands",

    search_label: "Search (name / URL)",
    only_active: "only enabled",
    filter_btn: "Filter",
    clear_btn: "Clear",

    reset_btn: "Reset baseline",
    mode_single: "single",
    mode_batch: "batch",
    mode_inherit: "inherit",
  },

  pl: {
    nav_links: "Wyszukiwania",
    nav_billing: "Billing",

    plan_label: "Plan",
    active_label: "Aktywne",
    expires_prefix: "do",

    tg_commands_title: "Komendy w Telegramie",

    search_label: "Szukaj (nazwa / URL)",
    only_active: "tylko włączone",
    filter_btn: "Filtruj",
    clear_btn: "Wyczyść",

    reset_btn: "Resetuj bazę (baseline)",
    mode_single: "pojedynczo",
    mode_batch: "zbiorczo",
    mode_inherit: "dziedzicz",
  },

  de: {
    nav_links: "Suchen",
    nav_billing: "Abrechnung",

    plan_label: "Plan",
    active_label: "Aktiv",
    expires_prefix: "bis",

    tg_commands_title: "Telegram-Befehle",

    search_label: "Suchen (Name / URL)",
    only_active: "nur aktiv",
    filter_btn: "Filtern",
    clear_btn: "Leeren",

    reset_btn: "Baseline zurücksetzen",
    mode_single: "einzeln",
    mode_batch: "gebündelt",
    mode_inherit: "erben",
  },

  it: {
    nav_links: "Ricerche",
    nav_billing: "Fatturazione",

    plan_label: "Piano",
    active_label: "Attivi",
    expires_prefix: "fino al",

    tg_commands_title: "Comandi Telegram",

    search_label: "Cerca (nome / URL)",
    only_active: "solo attivi",
    filter_btn: "Filtra",
    clear_btn: "Pulisci",

    reset_btn: "Reset baseline",
    mode_single: "singolo",
    mode_batch: "raggruppato",
    mode_inherit: "eredita",
  },
};

export function t(lang: string, key: string) {
  const L = normLang(lang);
  return DICT[L]?.[key] ?? DICT.en[key] ?? key;
}

export function planName(code: string) {
  const c = String(code || "").trim().toLowerCase();
  const map: Record<string, string> = {
    trial: "Trial",
    basic: "Basic",
    growth: "Growth",
    platinum: "Platinum",
    free: "Free",
  };
  return map[c] || (c ? c.charAt(0).toUpperCase() + c.slice(1) : "Free");
}

// Backward compat
export const normalizeLang = normLang;
