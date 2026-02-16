// Unified i18n system with EN as base and hard fallback

const TRANSLATIONS = {
  en: {
    // Commands
    cmd: {
      help: "Available commands:\n/start - Start bot\n/help - Show help\n/dodaj - Add search\n/usun - Remove search\n/lista - List searches\n/status - Show status\n/on - Enable notifications\n/off - Disable notifications\n/pojedyncze - Single mode\n/zbiorcze - Batch mode\n/cisza - Set quiet hours\n/cisza_off - Disable quiet hours\n/najnowsze [ID] - Show newest items\n/najtansze [ID] - Show cheapest items\n/plany - Show plans\n/panel - Get panel link\n/lang - Change language",
      
      unauthorized: "❌ Unauthorized (admin only).",
      provide_id: "❌ Provide Telegram ID: /admin_reset <telegram_id>",
      user_not_found: "❌ User not found for Telegram ID {id}",
      user_not_in_db: "Can't see you in database. Use /start or /dodaj.",
      user_not_registered: "Can't see you in database yet.\nFirst use /dodaj (registers account), then /status.",
      
      link_not_found: "Couldn't find link with ID <b>{id}</b> on your account. Use /lista.",
      no_links: "You don't have any links yet.",
      
      usage_usun: "Provide link ID, e.g.:\n<code>/usun 18</code>",
      usage_najnowsze: "Usage: <code>/najnowsze [ID]</code>\nWithout ID: all links\nWith ID: specific link\n\nExamples:\n<code>/najnowsze</code>\n<code>/najnowsze 18</code>",
      usage_najtansze: "Usage: <code>/najtansze [ID]</code>\nWithout ID: all links\nWith ID: specific link\n\nExamples:\n<code>/najtansze</code>\n<code>/najtansze 18</code>",
      usage_dodaj: "Usage:\n<code>/dodaj &lt;url&gt; [name]</code>\n\nExample:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      
      error_panel: "❌ Failed to generate panel link.\n\nrequestId: {requestId}",
      error_payment_config: "❌ Payment configuration error.\n\nrequestId: {requestId}",
      error_addon_config: "❌ Addon configuration error.\n\nrequestId: {requestId}",
      error_no_purchase: "❌ No purchase options available.",
      error_payment_create: "❌ Error creating payment.\n\nrequestId: {requestId}",
      error_lista: "❌ Error fetching link list.",
      error_usun: "❌ Error disabling link.",
      error_dodaj: "❌ Error adding link.",
      error_status: "❌ Error fetching status.",
      error_stripe_not_configured: "❌ Stripe not configured.\n\nrequestId: {requestId}",
      error_addon_not_configured: "❌ No configuration for addon.\n\nrequestId: {requestId}",
    },
    
    // /dodaj specific messages
    dodaj: {
      invalid_url: "First parameter must be a valid URL, e.g.:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      trial_expired: "⏰ Your Trial plan has expired.\nMonitoring in Trial is no longer available.\n\nTo continue using the bot, choose a paid plan (Starter / Growth / Platinum).",
      plan_expired: "⏰ Your plan has expired.\nTo add new links and resume monitoring, renew your plan in the customer panel.",
      no_active_plan_trial_used: "You don't have an active plan with link monitoring.\nTrial has already been used. Purchase Starter / Growth / Platinum plan.",
      no_active_plan_trial_available: "You don't have an active plan with link monitoring.\nYou can start a one-time Trial (3 days / 5 links) or choose Starter / Growth / Platinum plan.",
      success: "✅ Added new link for monitoring:\n\nID <b>{id}</b> — {name}\n<code>{url}</code>\n\nActive links: {active}/{limit}\n\nCheck links with: <code>/lista</code>",
      no_name: "(no name)",
    },
    
    // /najnowsze specific
    najnowsze: {
      header: "🧾 Newest offers\n<b>{name}</b> <i>(ID {id})</i>\n",
      no_history: "\nNo saved history for this link yet.",
      no_title: "(no title)",
      truncated: "… (truncated – message length limit)\n",
      link_not_found_detail: "Can't see link <b>{id}</b> on your account. Check <code>/lista</code>.",
    },
    
    // Notifications
    notif: {
      enabled: "✅ Notifications ENABLED for this chat.",
      disabled: "⛔ Notifications DISABLED for this chat.",
      mode_single: "📨 Mode set: <b>single</b> (default for this chat).",
      mode_batch: "📦 Mode set: <b>batch</b> (default for this chat).",
    },
    
    // Quiet hours
    quiet: {
      status_on: "🌙 Quiet hours: <b>ENABLED</b>, hours {from}:00–{to}:00",
      status_off: "🌙 Quiet hours: <b>disabled</b>.\nSet: <code>/cisza 22-7</code>",
      usage: "Provide range as HH-HH, e.g. <code>/cisza 22-7</code>",
      invalid_hours: "Hours must be in range 0–23, e.g. <code>/cisza 22-7</code>",
      set: "🌙 Quiet hours set: <b>{from}:00–{to}:00</b>",
      disabled: "🌙 Quiet hours <b>disabled</b>.",
      disabled_alt: "🌙 Quiet hours: <b>DISABLED</b>",
    },
    
    // Lista
    lista: {
      header: "📋 Active monitored links:\n\n",
      footer: "Disable: <code>/usun ID</code>\ne.g. <code>/usun 18</code>",
      no_name: "(no name)",
    },
    
    // Usun
    usun: {
      success: "✅ Stopped monitoring link:\n\n",
      footer: "You can re-enable it in the panel or add it again as a new search.",
    },
    
    // Najnowsze
    najnowsze: {
      header: "🆕 Newest items for link ID <b>{id}</b>",
      no_history: "No saved history for this link yet.",
    },
    
    // Status
    status: {
      title: "ℹ️ Bot Status",
      plan: "Plan: {name} (until {exp})",
      plan_with_addons: "Plan: {name} (until {exp})\nAddons (+10 links each): {addons}",
      links_enabled: "Active searches (enabled): {enabled}/{limit}",
      links_total: "Total searches (in database): {total}/{limit}",
      daily_limit: "Daily notification limit: {limit}",
      notif_enabled: "✅ Notifications ENABLED",
      notif_disabled: "⛔ Notifications DISABLED",
      notif_mode: "Default mode for this chat: {mode}",
      notif_daily: "Today's notifications: {daily}/{limit}",
      quiet_on: "Quiet hours: enabled ({from}:00–{to}:00)",
      quiet_off: "Quiet hours: disabled",
      per_link_hint: "Commands: /on /off /single /batch\nPer link: /single_ID /batch_ID /off_ID /on_ID",
      no_links: "No active searches.",
      links_header: "Search list:",
    },
    
    // Language
    lang: {
      current: "Current language: <b>{name}</b>",
      available: "Available languages:",
      unknown: "❌ Unknown language code: <code>{code}</code>",
      confirm: "✅ Language set to: <b>{name}</b>",
    }
  },
  
  pl: {
    // Polish translations (już istniejące)
    cmd: {
      help: "Dostępne komendy:\n/start - Start bota\n/help - Pomoc\n/dodaj - Dodaj wyszukiwanie\n/usun - Usuń wyszukiwanie\n/lista - Lista wyszukiwań\n/status - Status\n/on - Włącz powiadomienia\n/off - Wyłącz powiadomienia\n/pojedyncze - Tryb pojedynczy\n/zbiorcze - Tryb zbiorczy\n/cisza - Ustaw ciszę nocną\n/cisza_off - Wyłącz ciszę nocną\n/najnowsze [ID] - Pokaż najnowsze\n/najtansze [ID] - Pokaż najtańsze\n/plany - Pokaż plany\n/panel - Link do panelu\n/lang - Zmień język",
      
      unauthorized: "❌ Brak uprawnień (tylko admin).",
      provide_id: "❌ Podaj Telegram ID: /admin_reset <telegram_id>",
      user_not_found: "❌ Nie znaleziono użytkownika dla Telegram ID {id}",
      
      link_not_found: "Nie znalazłem linku o ID <b>{id}</b> na Twoim koncie. Użyj /lista.",
      no_links: "Nie masz jeszcze żadnych linków.",
      
      usage_usun: "Podaj ID linku, np.:\n<code>/usun 18</code>",
      usage_najnowsze: "Użycie: <code>/najnowsze [ID]</code>\nBez ID: wszystkie linki\nZ ID: konkretny link\n\nPrzykłady:\n<code>/najnowsze</code>\n<code>/najnowsze 18</code>",
      usage_najtansze: "Użycie: <code>/najtansze [ID]</code>\nBez ID: wszystkie linki\nZ ID: konkretny link\n\nPrzykłady:\n<code>/najtansze</code>\n<code>/najtansze 18</code>",
      usage_dodaj: "Użycie:\n<code>/dodaj &lt;url&gt; [nazwa]</code>\n\nPrzykład:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      
      error_panel: "❌ Nie udało się wygenerować linku do panelu.\n\nrequestId: {requestId}",
      error_payment_config: "❌ Błąd konfiguracji płatności.\n\nrequestId: {requestId}",
      error_addon_config: "❌ Błąd konfiguracji dodatku.\n\nrequestId: {requestId}",
      error_no_purchase: "❌ Brak dostępnych opcji zakupu.",
      error_payment_create: "❌ Błąd tworzenia płatności.\n\nrequestId: {requestId}",
      error_lista: "❌ Błąd przy pobieraniu listy linków.",
      error_usun: "❌ Błąd przy wyłączaniu linku.",
      error_dodaj: "❌ Błąd przy dodawaniu linku.",
      error_status: "❌ Błąd przy pobieraniu statusu.",
      error_stripe_not_configured: "❌ Stripe nie skonfigurowany.\n\nrequestId: {requestId}",
      error_addon_not_configured: "❌ Brak konfiguracji dla dodatku.\n\nrequestId: {requestId}",
      user_not_in_db: "Nie widzę Cię w bazie. Użyj /start lub /dodaj.",
      user_not_registered: "Nie widzę Cię jeszcze w bazie.\nNajpierw użyj /dodaj (zarejestruje konto), a potem /status.",
    },
    
    dodaj: {
      invalid_url: "Pierwszy parametr musi być poprawnym URL, np.:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      trial_expired: "⏰ Twój plan Trial wygasł.\nMonitoring w Trial jest już niedostępny.\n\nAby dalej korzystać z bota, wybierz plan płatny (Starter / Growth / Platinum).",
      plan_expired: "⏰ Twój plan wygasł.\nAby dodać nowe linki i wznowić monitoring, przedłuż plan w panelu klienta.",
      no_active_plan_trial_used: "Nie masz aktywnego planu z monitoringiem linków.\nTrial został już wykorzystany. Wykup plan Starter / Growth / Platinum.",
      no_active_plan_trial_available: "Nie masz aktywnego planu z monitoringiem linków.\nMożesz uruchomić jednorazowo Trial (3 dni / 5 linków) albo wybrać plan Starter / Growth / Platinum.",
      success: "✅ Dodałem nowy link do monitorowania:\n\nID <b>{id}</b> — {name}\n<code>{url}</code>\n\nAktywne linki: {active}/{limit}\n\nLinki sprawdzisz komendą: <code>/lista</code>",
      no_name: "(bez nazwy)",
    },
    
    najnowsze: {
      header: "🧾 Najnowsze oferty\n<b>{name}</b> <i>(ID {id})</i>\n",
      no_history: "\nBrak zapisanej historii dla tego linku (jeszcze).",
      no_title: "(bez tytułu)",
      truncated: "… (ucięto – limit długości wiadomości)\n",
      link_not_found_detail: "Nie widzę linku <b>{id}</b> na Twoim koncie. Sprawdź <code>/lista</code>.",
    },

    // /najtansze (najtańsze wysłane oferty)
    najtansze: {
      header_per_link: "💰 Najtańsze wysłane oferty dla linku ID <b>{id}</b> <i>({name})</i>",
      header_global: "💰 Najtańsze wysłane (od {since})",
      no_history_per_link: "Brak wysłanych ofert z ceną dla linku <b>{id}</b> od {since}.",
      no_history_global: "Brak wysłanych ofert z ceną od {since}.",
      footer: "Pełna historia:",
    },
    
    // Enhanced najnowsze (najnowsze wysłane oferty)
    najnowsze_enhanced: {
      header_per_link: "🧾 Najnowsze wysłane (link {id}): <b>{name}</b>\nOd: {since}",
      header_global: "🧾 Najnowsze wysłane (od {since})",
      no_history_per_link: "Brak wysłanych ofert dla linku <b>{id}</b> od {since}.",
      no_history_global: "Brak wysłanych ofert od {since}.",
      footer: "Pełna historia:",
      no_title: "(bez tytułu)",
    },
        notif: {
      enabled: "✅ Powiadomienia WŁĄCZONE na tym czacie.",
      disabled: "⛔ Powiadomienia WYŁĄCZONE na tym czacie.",
      mode_single: "📨 Ustawiono tryb: <b>pojedynczo</b> (domyślny na tym czacie).",
      mode_batch: "📦 Ustawiono tryb: <b>zbiorczo</b> (domyślny na tym czacie).",
    },
    
    quiet: {
      status_on: "🌙 Cisza nocna: <b>WŁĄCZONA</b>, godziny {from}:00–{to}:00",
      status_off: "🌙 Cisza nocna: <b>wyłączona</b>.\nUstaw: <code>/cisza 22-7</code>",
      usage: "Podaj zakres jako HH-HH, np. <code>/cisza 22-7</code>",
      invalid_hours: "Godziny muszą być w zakresie 0–23, np. <code>/cisza 22-7</code>",
      set: "🌙 Ustawiono ciszę nocną: <b>{from}:00–{to}:00</b>",
      disabled: "🌙 Cisza nocna <b>wyłączona</b>.",
      disabled_alt: "🌙 Cisza nocna: <b>WYŁĄCZONA</b>",
    },
    
    lista: {
      header: "📋 Aktywne monitorowane linki:\n\n",
      footer: "Wyłącz: <code>/usun ID</code>\nnp. <code>/usun 18</code>",
      no_name: "(bez nazwy)",
    },
    
    usun: {
      success: "✅ Wyłączyłem monitorowanie linku:\n\n",
      footer: "Możesz go włączyć ponownie w panelu albo dodać ponownie jako nowe monitorowanie.",
    },
    
    najnowsze: {
      header: "🆕 Najnowsze pozycje dla linku ID <b>{id}</b>",
      no_history: "Brak zapisanej historii dla tego linku (jeszcze).",
    },
    
    status: {
      title: "ℹ️ Status bota",
      plan: "Plan: {name} (do {exp})",
      plan_with_addons: "Plan: {name} (do {exp})\nDodatki (addon +10): {addons}",
      links_enabled: "Aktywne wyszukiwania (włączone): {enabled}/{limit}",
      links_total: "Łącznie wyszukiwań (w bazie): {total}/{limit}",
      daily_limit: "Limit dziennych powiadomień: {limit}",
      notif_enabled: "✅ Powiadomienia WŁĄCZONE",
      notif_disabled: "⛔ Powiadomienia WYŁĄCZONE",
      notif_mode: "Tryb domyślny na tym czacie: {mode}",
      notif_daily: "Dzisiejsze powiadomienia: {daily}/{limit}",
      quiet_on: "Cisza nocna: włączona ({from}:00–{to}:00)",
      quiet_off: "Cisza nocna: wyłączona",
      per_link_hint: "Komendy: /on /off /pojedyncze /zbiorcze\nPer link: /pojedyncze_ID /zbiorcze_ID /off_ID /on_ID",
      no_links: "Brak aktywnych wyszukiwań.",
      links_header: "Lista wyszukiwań:",
    },
    
    lang: {
      current: "Obecny język: <b>{name}</b>",
      available: "Dostępne języki:",
      unknown: "❌ Nieznany kod języka: <code>{code}</code>",
      confirm: "✅ Ustawiono język: <b>{name}</b>",
    }
  }
};

// Interpolate variables in string
function interpolate(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (_, key) => {
    return vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : `{${key}}`;
  });
}

// Get translation by path (e.g. "cmd.help")
function getByPath(obj, path) {
  const parts = String(path).split(".");
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object" || !(p in cur)) return null;
    cur = cur[p];
  }
  return cur;
}

// Main translation function with EN fallback
export function t(lang, key, vars = {}) {
  // Try requested language first
  let dict = TRANSLATIONS[lang];
  let val = dict ? getByPath(dict, key) : null;
  
  // Fallback to EN (hard requirement)
  if (val === null) {
    dict = TRANSLATIONS.en;
    val = dict ? getByPath(dict, key) : null;
    
    // Log missing translation
    if (val === null) {
      console.error(`[i18n_missing] lang=${lang} key=${key} fallback=en (NOT FOUND)`);
      return key; // Return key as last resort
    }
    
    if (lang !== "en") {
      console.log(`[i18n_fallback] lang=${lang} key=${key} -> en`);
    }
  }
  
  return interpolate(val, vars);
}

// Get user language with EN as default (never PL)
export function getUserLang(user) {
  if (!user) return "en";
  
  const lc = String(user.language_code || user.lang || "").toLowerCase();
  
  // Map language codes
  if (lc.startsWith("pl")) return "pl";
  if (lc.startsWith("de")) return "de";
  if (lc.startsWith("fr")) return "fr";
  if (lc.startsWith("hr")) return "hr";
  
  // Default to EN (not PL!)
  return "en";
}

export default { t, getUserLang, TRANSLATIONS };
