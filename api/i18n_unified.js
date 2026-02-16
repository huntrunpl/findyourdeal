// Unified i18n system with EN as base and hard fallback

const TRANSLATIONS = {
  en: {
    // Commands
    cmd: {
      help_greeting: "👋 Hello! This is FindYourDeal bot.",
      help_basic: "Basic commands:",
      help_basic_lista: "/list – show your active monitored links",
      help_basic_usun: "/remove &lt;ID&gt; – disable monitoring for link ID",
      help_basic_dodaj: "/add &lt;url&gt; [name] – add new link to monitor",
      help_basic_status: "/status – bot status, plan, and notifications",
      help_basic_panel: "/panel – open management panel",
      help_basic_nazwa: "/name &lt;ID&gt; [name] – rename link (or /name ID - to clear)",
      help_notif: "PUSH notifications on this chat:",
      help_notif_on: "/on – enable",
      help_notif_off: "/off – disable",
      help_notif_single: "/single – single cards",
      help_notif_batch: "/batch – batch list",
      help_perlink: "Per-link mode (ONLY on this chat):",
      help_perlink_commands: "/single <ID>, /batch <ID>, /off <ID>, /on <ID> (e.g. /batch 18)",
      help_perlink_max: "/max &lt;ID&gt; &lt;value&gt; – limit items per loop (e.g. /max 18 3 or /max 18 off)",
      help_quiet: "Quiet hours:",
      help_quiet_show: "/quiet – show",
      help_quiet_set: "/quiet HH-HH – set (e.g. /quiet 22-7)",
      help_quiet_off: "/quiet off – disable",
      help_history: "Sent history:",
      help_history_najnowsze: "/latest – newest sent on this chat",
      help_history_najnowsze_id: "/latest &lt;ID&gt; – newest sent for link",
      help_history_najtansze: "/cheapest – cheapest sent on this chat",
      help_history_najtansze_id: "/cheapest &lt;ID&gt; – cheapest sent for link",
      help_plans: "Plans:",
      help_plans_show: "/plans – show available plans and purchase options",
      help_lang: "Language:",
      help_lang_set: "/lang &lt;code&gt; – set language (e.g. /lang en, /lang pl)",
      help_examples: "Examples:",
      help_examples_text: "<code>/list</code>\n<code>/remove 18</code>\n<code>/add https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>\n<code>/latest 18</code>",
      
      // Dynamic help descriptions
      help_basic_name: "name",
      help_basic_lista_desc: "– show your active monitored links",
      help_basic_usun_desc: "– disable monitoring for link ID",
      help_basic_dodaj_desc: "– add new link to monitor",
      help_basic_status_desc: "– bot status, plan, and notifications",
      help_basic_panel_desc: "– open management panel",
      help_basic_nazwa_desc: "– rename link (or /{nazwa} ID - to clear)",
      help_notif_on_desc: "– enable",
      help_notif_off_desc: "– disable",
      help_notif_single_desc: "– single cards",
      help_notif_batch_desc: "– batch list",
      help_value: "value",
      help_perlink_max_desc: "– limit items per loop (e.g. /max 18 3 or /max 18 off)",
      help_quiet_show_desc: "– show",
      help_quiet_set_desc: "– set (e.g. /quiet 22-7)",
      help_quiet_off_desc: "– disable",
      help_history_najnowsze_desc: "– newest sent on this chat",
      help_history_najnowsze_id_desc: "– newest sent for link",
      help_history_najtansze_desc: "– cheapest sent on this chat",
      help_history_najtansze_id_desc: "– cheapest sent for link",
      help_plans_show_desc: "– show available plans and purchase options",
      help_code: "code",
      help_lang_set_desc: "– set language (e.g. /lang en, /lang pl)",
      
      help_advanced_title: "🔧 <b>Advanced Commands</b>",
      help_advanced_basic_title: "Basic Management:",
      help_advanced_search_title: "Search & Filters:",
      help_advanced_notifications_title: "Notification Controls:",
      help_advanced_settings_title: "Settings & Configuration:",
      help_advanced_examples_title: "Examples:",
      help_advanced_title: "🔧 <b>Advanced Commands</b>",
      help_advanced_basic_title: "Basic Management:",
      help_advanced_search_title: "Search & Filters:",
      help_advanced_notifications_title: "Notification Controls:",
      help_advanced_settings_title: "Settings & Configuration:",
      help_advanced_examples_title: "Examples:",
      
      help: "Available commands:\n/start - Start bot\n/help - Show help\n/add - Add search\n/remove - Remove search\n/list - List searches\n/status - Show status\n/on - Enable notifications\n/off - Disable notifications\n/single - Single mode\n/batch - Batch mode\n/quiet - Set quiet hours\n/quiet off - Disable quiet hours\n/latest [ID] - Show newest items\n/cheapest [ID] - Show cheapest items\n/plans - Show plans\n/panel - Get panel link\n/lang - Change language",
      
      help_admin_text: "🔒 <b>FindYourDeal — Admin Commands</b>\n\n<b>ADMIN</b>\n\n/help_admin — show this admin help\n\n/tech &lt;telegram_user_id&gt; — show Telegram → user_id mapping (diagnostics)\n\n/debug — bot diagnostics (build, hash, uptime, DB connect)\n\n/debug_worker_links — list links actually scanned by the worker (max 50)\n\n/reset_daily &lt;telegram_user_id&gt; — reset user's daily notification/items counter (global, since midnight local timezone)\n\n/audit &lt;telegram_user_id&gt; [limit] — show admin audit log for target user (default: last 20 entries)\n\n<b>SUPERADMIN</b>\n\n/grant_admin &lt;telegram_user_id&gt; — grant ADMIN role to user\n\n/delete_user &lt;telegram_user_id&gt; — delete user and all related data (links, chats, offers) — IRREVERSIBLE",
      
      audit_usage: "Usage: /audit &lt;telegram_user_id&gt; [limit]\n\nExamples:\n<code>/audit 123456789</code> — last 20 entries\n<code>/audit 123456789 50</code> — last 50 entries\n\nLimit: 1-100 (default: 20)",
      audit_empty: "📋 No audit log entries found for telegram_user_id=<code>{target_tg_id}</code>",
      audit_header: "📋 <b>Admin Audit Log</b>\n\nTarget: telegram_user_id=<code>{target_tg_id}</code>\nShowing: <b>{count}</b> entries (limit: {limit})",
      audit_line: "🕐 <code>{timestamp}</code> UTC\n<b>{action}</b> | {status}\nCaller: <code>{caller_tg_id}</code> ({caller_role})\nReason: {reason}{payload}",
      
      commands_header: "⚡️ <b>Quick Commands</b>",
      commands_text: "/start — start bot and register\n/help — show full help\n/list — show your monitored links\n/add — add new link to monitor\n/remove — disable monitoring for link\n/status — bot status and plan info\n/panel — open web management panel\n/on — enable notifications\n/off — disable notifications\n/single — single card mode\n/batch — batch list mode\n/plans — show available plans",
      commands_footer: "💡 Use <code>/help</code> for complete command list with examples",
      
      unauthorized: "❌ Unauthorized (admin only).",
      provide_id: "❌ Provide Telegram ID: /admin_reset &lt;telegram_id&gt;",
      user_not_found: "❌ User not found for Telegram ID {id}",
      user_not_in_db: "Can't see you in database. Use /start or /dodaj.",
      user_not_registered: "Can't see you in database yet.\nFirst use /dodaj (registers account), then /status.",
      
      link_not_found: "Couldn't find link with ID <b>{id}</b> on your account. Use /lista.",
      no_links: "You don't have any links yet.",
      
      usage_usun: "Provide link ID, e.g.:\n<code>/usun 18</code>",
      usage_najnowsze: "Usage: <code>/najnowsze [ID]</code>\nWithout ID: all links\nWith ID: specific link\n\nExamples:\n<code>/najnowsze</code>\n<code>/najnowsze 18</code>",
      usage_najtansze: "Usage: <code>/najtansze [ID]</code>\nWithout ID: all links\nWith ID: specific link\n\nExamples:\n<code>/najtansze</code>\n<code>/najtansze 18</code>",
      usage_dodaj: "Usage:\n<code>/dodaj &lt;url&gt; [name]</code>\n\nExample:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      
      max_usage: "Usage: /max &lt;ID&gt; &lt;value&gt; or /max &lt;ID&gt; off\n\nExamples:\n<code>/max 18 3</code> — limit to 3 items per loop\n<code>/max 18 off</code> — remove limit",
      max_invalid_id: "❌ Invalid link ID. Use a number, e.g. /max 18 5",
      max_invalid_value: "❌ Invalid value. Must be a number between 1 and 100, or 'off'.",
      max_disabled: "✅ Per-link limit disabled for link <b>{id}</b> ({name}).",
      max_set: "✅ Per-link limit set to <b>{value}</b> items per loop for link <b>{id}</b> ({name}).",
      
      error_panel: "❌ Failed to generate panel link.\n\nrequestId: {requestId}",
      error_payment_config: "❌ Payment configuration error.\n\nrequestId: {requestId}",
      error_addon_config: "❌ Addon configuration error.\n\nrequestId: {requestId}",
      error_no_purchase: "❌ No purchase options available.",
      error_payment_create: "❌ Error creating payment.\n\nrequestId: {requestId}",
      error_lista: "❌ Error fetching link list.",
      
      lista_empty: "You don't have any active links yet.\n\nAdd your first link: /dodaj <url> [name]",
      lista_title: "📋 Your monitored links",
      lista_disable: "To disable monitoring for a link:",
      
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
      chat_line_enabled: "✅ Notifications ENABLED\nDefault mode for this chat: {mode}\nToday's notifications: {daily}/{limit}",
      chat_line_disabled: "⛔ Notifications DISABLED\nDefault mode for this chat: {mode}\nToday's notifications: {daily}/{limit}",
      quiet_on: "Quiet hours: enabled ({from}:00–{to}:00)",
      quiet_off: "Quiet hours: disabled",
      per_link_hint: "Commands: /on /off /single /batch\nPer link: /single <ID> /batch <ID> /off <ID> /on <ID>",
      no_links: "No active searches.",
      links_header: "Search list:",
      unknown: "(error)",
    },
    
    // Notification modes
    mode: {
      single: "single",
      batch: "batch",
      off: "off",
    },
    
    // Language
    lang: {
      current: "🌍 Current language: <b>{name}</b>",
      available: "Available languages:",
      unknown: "❌ Unknown language. Supported: {list}",
      confirm: "✅ Language changed to: <b>{name}</b>",
      unknown_language: "Unknown language.",
    },
    
    // Payments & plans
    payment: {
      panel_link: "🧭 <b>Panel</b>\n\nLink to panel (valid for {minutes} minutes, one-time use):\n\n{url}\n\n⚠️ <i>Link is valid only for {minutes} minutes and can be used only once.</i>",
      platinum_addon: "📋 <b>Your plan: Platinum</b>\n⏰ <b>Valid until:</b> {expiryDate}\n🔗 <b>Links limit:</b> {totalLinks}{addonText}\n\n<b>Add +10 links (addon):</b>\n\n{url}\n\n⚠️ <i>Link leads to secure Stripe payment.</i>",
      platinum_addon_packages: " (+{count} addon packages)",
      plans_list: "💳 <b>Available subscription plans</b>\n\nYour current plan: <b>{planLabel}</b>\n\n{url}",
      plans_list_keyboard: "💳 <b>Available subscription plans</b>\n\nYour current plan: <b>{planLabel}</b>\n\nChoose plan:",
      addon_checkout: "💎 <b>Addon: +10 links</b>\n\nGo to payment:\n{url}\n\n<i>requestId: {requestId}</i>",
      addon_button: "✓ Addon +10 links",
      error_config: "❌ Configuration error",
      error_payment: "❌ Payment creation error.\n\nrequestId: {requestId}",
      checkout_url: "💳 <b>Plan: {planCode}</b>\n\nGo to payment:\n{url}\n\n<i>requestId: {requestId}</i>",
    },
    
    // Callbacks
    callback: {
      no_chat_data: "No chat/user data.",
      mode_set: "Set: {mode}",
      mode_set_failed: "❌ Failed to set mode.",
      link_mode_set: "✅ Link <b>{linkId}</b> on this chat set to: <b>{mode}</b>",
    },
    
    // Admin
    admin: {
      reset_success: "✅ Admin reset done for TG {tgId}. Chats updated: {chats}. Active links reset: {links}. Since={since}",
      no_telegram_id: "Failed to determine your Telegram ID. Try again.",
    },
    
    // General
    general: {
      unknown_command: "❓ Unknown command. Use /help.",
    },
    
    // /najtansze (cheapest sent offers)
    najtansze: {
      header_per_link: "💰 Cheapest sent offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "💰 Cheapest sent offers (since {since})",
      no_history_per_link: "No sent offers with price for link <b>{id}</b> since {since}.",
      no_history_global: "No sent offers with price since {since}.",
      footer: "Full history:",
    },
    
    // Enhanced najnowsze (newest sent offers)
    najnowsze_enhanced: {
      header_per_link: "🧾 Newest sent offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "🧾 Newest sent offers (since {since})",
      no_history_per_link: "No sent offers for link <b>{id}</b> since {since}.",
      no_history_global: "No sent offers since {since}.",
      footer: "Full history:",
      no_title: "(no title)",
    },
  },
  
  pl: {
    // Polish translations (już istniejące)
    cmd: {
      help_greeting: "👋 Cześć! To bot FindYourDeal.",
      help_basic: "Podstawowe komendy:",
      help_basic_lista: "/lista – pokaż Twoje aktywne monitorowane linki",
      help_basic_usun: "/usun &lt;ID&gt; – wyłącz monitorowanie linku o ID",
      help_basic_dodaj: "/dodaj &lt;url&gt; [nazwa] – dodaj nowy link do monitorowania",
      help_basic_status: "/status – status bota, planu i powiadomień",
      help_basic_panel: "/panel – otwórz panel zarządzania",
      help_basic_nazwa: "/nazwa &lt;ID&gt; [nazwa] – zmień nazwę linku (lub /nazwa ID – aby wyczyścić)",
      help_notif: "Powiadomienia PUSH na tym czacie:",
      help_notif_on: "/on – włącz",
      help_notif_off: "/off – wyłącz",
      help_notif_single: "/pojedyncze – pojedyncze karty",
      help_notif_batch: "/zbiorcze – zbiorcza lista",
      help_perlink: "Tryb per-link (TYLKO na tym czacie):",
      help_perlink_commands: "/pojedyncze <ID>, /zbiorcze <ID>, /off <ID>, /on <ID> (np. /zbiorcze 18)",
      help_perlink_max: "/max &lt;ID&gt; &lt;wartość&gt; – limit ofert na pętlę (np. /max 18 3 or /max 18 off)",
      help_quiet: "Cisza nocna:",
      help_quiet_show: "/cisza – pokaż",
      help_quiet_set: "/cisza HH-HH – ustaw (np. /cisza 22-7)",
      help_quiet_off: "/cisza_off – wyłącz",
      help_history: "Historia wysłanych:",
      help_history_najnowsze: "/najnowsze – najnowsze wysłane na tym czacie",
      help_history_najnowsze_id: "/najnowsze &lt;ID&gt; – najnowsze wysłane dla linku",
      help_history_najtansze: "/najtansze – najtańsze wysłane na tym czacie",
      help_history_najtansze_id: "/najtansze &lt;ID&gt; – najtańsze wysłane dla linku",
      help_plans: "Plany:",
      help_plans_show: "/plany – pokaż dostępne plany i opcje zakupu",
      help_lang: "Język:",
      help_lang_set: "/lang &lt;kod&gt; – ustaw język (np. /lang en, /lang pl)",
      help_examples: "Przykłady:",
      help_examples_text: "<code>/lista</code>\n<code>/usun 18</code>\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>\n<code>/najnowsze 18</code>",
      
      // Dynamic help descriptions (PL)
      help_basic_name: "nazwa",
      help_basic_lista_desc: "– pokaż aktywne monitorowane linki",
      help_basic_usun_desc: "– wyłącz monitorowanie dla ID linku",
      help_basic_dodaj_desc: "– dodaj nowy link do monitorowania",
      help_basic_status_desc: "– status bota, plan i powiadomienia",
      help_basic_panel_desc: "– otwórz panel zarządzania",
      help_basic_nazwa_desc: "– zmień nazwę linku (lub /{nazwa} ID – aby wyczyścić)",
      help_notif_on_desc: "– włącz",
      help_notif_off_desc: "– wyłącz",
      help_notif_single_desc: "– pojedyncze karty",
      help_notif_batch_desc: "– zbiorcza lista",
      help_value: "wartość",
      help_perlink_max_desc: "– limit ofert na pętlę (np. /max 18 3 lub /max 18 off)",
      help_quiet_show_desc: "– pokaż",
      help_quiet_set_desc: "– ustaw (np. /cisza 22-7)",
      help_quiet_off_desc: "– wyłącz",
      help_history_najnowsze_desc: "– najnowsze wysłane na tym czacie",
      help_history_najnowsze_id_desc: "– najnowsze wysłane dla linku",
      help_history_najtansze_desc: "– najtańsze wysłane na tym czacie",
      help_history_najtansze_id_desc: "– najtańsze wysłane dla linku",
      help_plans_show_desc: "– pokaż dostępne plany i opcje zakupu",
      help_code: "kod",
      help_lang_set_desc: "– ustaw język (np. /lang en, /lang pl)",
      
      help_advanced_title: "🔧 <b>Zaawansowane Komendy</b>",
      help_advanced_basic_title: "Podstawowe Zarządzanie:",
      help_advanced_search_title: "Wyszukiwanie i Filtry:",
      help_advanced_notifications_title: "Kontrola Powiadomień:",
      help_advanced_settings_title: "Ustawienia i Konfiguracja:",
      help_advanced_examples_title: "Przykłady:",
      help_advanced_title: "🔧 <b>Zaawansowane Komendy</b>",
      help_advanced_basic_title: "Podstawowe Zarządzanie:",
      help_advanced_search_title: "Wyszukiwanie i Filtry:",
      help_advanced_notifications_title: "Kontrola Powiadomień:",
      help_advanced_settings_title: "Ustawienia i Konfiguracja:",
      help_advanced_examples_title: "Przykłady:",
      
      help: "Dostępne komendy:\n/start - Start bota\n/help - Pomoc\n/dodaj - Dodaj wyszukiwanie\n/usun - Usuń wyszukiwanie\n/lista - Lista wyszukiwań\n/status - Status\n/on - Włącz powiadomienia\n/off - Wyłącz powiadomienia\n/pojedyncze - Tryb pojedynczy\n/zbiorcze - Tryb zbiorczy\n/cisza - Ustaw ciszę nocną\n/cisza_off - Wyłącz ciszę nocną\n/najnowsze [ID] - Pokaż najnowsze\n/najtansze [ID] - Pokaż najtańsze\n/plany - Pokaż plany\n/panel - Link do panelu\n/lang - Zmień język",
      
      help_admin_text: "🔒 <b>FindYourDeal — Komendy administracyjne</b>\n\n<b>ADMIN</b>\n\n/pomoc_admin — pokaż tę pomoc dla adminów\n\n/technik &lt;telegram_user_id&gt; — pokaż mapowanie Telegram → user_id (diagnostyka)\n\n/debug — diagnostyka bota (build, hash, uptime, DB connect)\n\n/debug_worker_links — lista linków faktycznie skanowanych przez worker (max 50)\n\n/reset_dzienny &lt;telegram_user_id&gt; — resetuj licznik dziennych powiadomień/itemów użytkownika (globalny, od północy w strefie lokalnej)\n\n/audyt &lt;telegram_user_id&gt; [limit] — pokaż log audytu dla użytkownika (domyślnie: ostatnie 20 wpisów)\n\n<b>SUPERADMIN</b>\n\n/daj_admina &lt;telegram_user_id&gt; — nadaj rolę ADMIN użytkownikowi\n\n/usun_uzytkownika &lt;telegram_user_id&gt; — usuń użytkownika i wszystkie powiązane dane (linki, czaty, oferty) — NIEODWRACALNE",
      
      audit_usage: "Użycie: /audit &lt;telegram_user_id&gt; [limit]\n\nPrzykłady:\n<code>/audit 123456789</code> — ostatnie 20 wpisów\n<code>/audit 123456789 50</code> — ostatnie 50 wpisów\n\nLimit: 1-100 (domyślnie: 20)",
      audit_empty: "📋 Brak wpisów w logu audytu dla telegram_user_id=<code>{target_tg_id}</code>",
      audit_header: "📋 <b>Log audytu administracyjnego</b>\n\nCel: telegram_user_id=<code>{target_tg_id}</code>\nPokazano: <b>{count}</b> wpisów (limit: {limit})",
      audit_line: "🕐 <code>{timestamp}</code> UTC\n<b>{action}</b> | {status}\nWykonawca: <code>{caller_tg_id}</code> ({caller_role})\nPowód: {reason}{payload}",
      
      commands_header: "⚡️ <b>Szybkie komendy</b>",
      commands_text: "/start — uruchom bota i zarejestruj\n/help — pokaż pełną pomoc\n/lista — pokaż monitorowane linki\n/dodaj — dodaj nowy link do monitorowania\n/usun — wyłącz monitorowanie linku\n/status — status bota i informacje o planie\n/panel — otwórz panel zarządzania\n/on — włącz powiadomienia\n/off — wyłącz powiadomienia\n/pojedyncze — tryb pojedynczych kart\n/zbiorcze — tryb zbiorczej listy\n/plany — pokaż dostępne plany",
      commands_footer: "💡 Użyj <code>/help</code> dla pełnej listy komend z przykładami",
      
      unauthorized: "❌ Brak uprawnień (tylko admin).",
      provide_id: "❌ Podaj Telegram ID: /admin_reset &lt;telegram_id&gt;",
      user_not_found: "❌ Nie znaleziono użytkownika dla Telegram ID {id}",
      
      link_not_found: "Nie znalazłem linku o ID <b>{id}</b> na Twoim koncie. Użyj /lista.",
      no_links: "Nie masz jeszcze żadnych linków.",
      
      usage_usun: "Podaj ID linku, np.:\n<code>/usun 18</code>",
      usage_najnowsze: "Użycie: <code>/najnowsze [ID]</code>\nBez ID: wszystkie linki\nZ ID: konkretny link\n\nPrzykłady:\n<code>/najnowsze</code>\n<code>/najnowsze 18</code>",
      usage_najtansze: "Użycie: <code>/najtansze [ID]</code>\nBez ID: wszystkie linki\nZ ID: konkretny link\n\nPrzykłady:\n<code>/najtansze</code>\n<code>/najtansze 18</code>",
      usage_dodaj: "Użycie:\n<code>/dodaj &lt;url&gt; [nazwa]</code>\n\nPrzykład:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      
      max_usage: "Użycie: /max &lt;ID&gt; &lt;wartość&gt; lub /max &lt;ID&gt; off\n\nPrzykłady:\n<code>/max 18 3</code> — limit 3 ofert na pętlę\n<code>/max 18 off</code> — wyłącz limit",
      max_invalid_id: "❌ Nieprawidłowe ID linku. Użyj liczby, np. /max 18 5",
      max_invalid_value: "❌ Nieprawidłowa wartość. Musi być liczba 1-100 lub 'off'.",
      max_disabled: "✅ Limit per-link wyłączony dla linku <b>{id}</b> ({name}).",
      max_set: "✅ Limit per-link ustawiony na <b>{value}</b> ofert na pętlę dla linku <b>{id}</b> ({name}).",
      
      error_panel: "❌ Nie udało się wygenerować linku do panelu.\n\nrequestId: {requestId}",
      error_payment_config: "❌ Błąd konfiguracji płatności.\n\nrequestId: {requestId}",
      error_addon_config: "❌ Błąd konfiguracji dodatku.\n\nrequestId: {requestId}",
      error_no_purchase: "❌ Brak dostępnych opcji zakupu.",
      error_payment_create: "❌ Błąd tworzenia płatności.\n\nrequestId: {requestId}",
      error_lista: "❌ Błąd przy pobieraniu listy linków.",
      
      lista_empty: "Nie masz jeszcze żadnych aktywnych linków.\n\nDodaj pierwszy link: /dodaj <url> [nazwa]",
      lista_title: "📋 Twoje monitorowane linki",
      lista_disable: "Aby wyłączyć monitorowanie linku:",
      
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
      header_per_link: "💰 Najtańsze wysłane (link {id})\n<b>{name}</b>\nOd: {since}",
      header_global: "💰 Najtańsze wysłane (od {since})",
      no_history_per_link: "Brak wysłanych ofert z ceną dla linku <b>{id}</b> od {since}.",
      no_history_global: "Brak wysłanych ofert z ceną od {since}.",
      footer: "Pełna historia:",
    },
    
    // Enhanced najnowsze (najnowsze wysłane oferty)
    najnowsze_enhanced: {
      header_per_link: "🧾 Najnowsze wysłane (link {id})\n<b>{name}</b>\nOd: {since}",
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
      chat_line_enabled: "✅ Powiadomienia WŁĄCZONE\nTryb domyślny na tym czacie: {mode}\nDzisiejsze powiadomienia: {daily}/{limit}",
      chat_line_disabled: "⛔ Powiadomienia WYŁĄCZONE\nTryb domyślny na tym czacie: {mode}\nDzisiejsze powiadomienia: {daily}/{limit}",
      quiet_on: "Cisza nocna: włączona ({from}:00–{to}:00)",
      quiet_off: "Cisza nocna: wyłączona",
      per_link_hint: "Komendy: /on /off /pojedyncze /zbiorcze\nPer link: /pojedyncze <ID> /zbiorcze <ID> /off <ID> /on <ID>",
      no_links: "Brak aktywnych wyszukiwań.",
      links_header: "Lista wyszukiwań:",
      unknown: "(błąd)",
    },
    
    // Notification modes
    mode: {
      single: "pojedyncze",
      batch: "zbiorcze",
      off: "wyłączone",
    },
    
    lang: {
      current: "Obecny język: <b>{name}</b>",
      available: "Dostępne języki:",
      unknown: "❌ Nieznany kod języka: <code>{code}</code>",
      confirm: "✅ Ustawiono język: <b>{name}</b>",
    }
  },
  de: {
    // Commands
    cmd: {
      help_greeting: "👋 Hallo! Das ist FindYourDeal Bot.",
      help_basic: "Grundlegende Befehle:",
      help_basic_lista: "/lista – zeigen deine aktiven überwachten Links",
      help_basic_usun: "/usun &lt;ID&gt; – deaktivieren Überwachung für Link ID",
      help_basic_dodaj: "/dodaj &lt;url&gt; [name] – neu hinzufügen link zum Überwachen",
      help_basic_status: "/Status – Bot Status, Plan, und Benachrichtigungen",
      help_basic_panel: "/Panel – öffnen Verwaltungs Panel",
      help_notif: "PUSH Benachrichtigungen in diesem Chat:",
      help_notif_on: "/EIN – aktivieren",
      help_notif_off: "/AUS – deaktivieren",
      help_notif_single: "/pojedyncze – einzeln Karten",
      help_notif_batch: "/zbiorcze – gesammelt Liste",
      help_perlink: "Pro-Link-Modus (NUR in diesem Chat):",
      help_perlink_commands: "/pojedyncze <ID>, /zbiorcze <ID>, /off <ID>, /on <ID> (e.g. /zbiorcze 18)",
      help_perlink_max: "/max &lt;ID&gt; &lt;Wert&gt; – Limit pro Schleife (e.g. /max 18 3 or /max 18 off)",
      help_quiet: "Ruhezeiten:",
      help_quiet_show: "/cisza – zeigen",
      help_quiet_set: "/cisza HH-HH – setzen (e.g. /cisza 22-7)",
      help_quiet_off: "/cisza_off – deaktivieren",
      help_history: "Sende-Verlauf:",
      help_history_najnowsze: "/najnowsze – neueste gesendet in diesem Chat",
      help_history_najnowsze_id: "/najnowsze &lt;ID&gt; – neueste gesendet für Link",
      help_history_najtansze: "/najtansze – billigste gesendet in diesem Chat",
      help_history_najtansze_id: "/najtansze &lt;ID&gt; – billigste gesendet für Link",
      help_examples: "Beispiele:",
      help_examples_text: "<code>/liste</code>\n<code>/entfernen 18</code>\n<code>/hinzufuegen https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>\n<code>/neueste 18</code>",
      
      // Dynamic help descriptions (DE)
      help_basic_name: "Name",
      help_basic_lista_desc: "– Ihre aktiven überwachten Links anzeigen",
      help_basic_usun_desc: "– Überwachung für Link-ID deaktivieren",
      help_basic_dodaj_desc: "– neuen Link zum Überwachen hinzufügen",
      help_basic_status_desc: "– Bot-Status, Plan und Benachrichtigungen",
      help_basic_panel_desc: "– Verwaltungspanel öffnen",
      help_basic_nazwa_desc: "– Link umbenennen (oder /{nazwa} ID – zum Löschen)",
      help_notif_on_desc: "– aktivieren",
      help_notif_off_desc: "– deaktivieren",
      help_notif_single_desc: "– einzelne Karten",
      help_notif_batch_desc: "– gesammelte Liste",
      help_value: "Wert",
      help_perlink_max_desc: "– Artikel pro Schleife begrenzen (z.B. /max 18 3 oder /max 18 off)",
      help_quiet_show_desc: "– anzeigen",
      help_quiet_set_desc: "– setzen (z.B. /ruhe 22-7)",
      help_quiet_off_desc: "– deaktivieren",
      help_history_najnowsze_desc: "– neueste gesendet in diesem Chat",
      help_history_najnowsze_id_desc: "– neueste gesendet für Link",
      help_history_najtansze_desc: "– billigste gesendet in diesem Chat",
      help_history_najtansze_id_desc: "– billigste gesendet für Link",
      help_plans_show_desc: "– verfügbare Pläne und Kaufoptionen anzeigen",
      help_code: "Code",
      help_lang_set_desc: "– Sprache einstellen (z.B. /lang en, /lang de)",
      
      help: "Available commands:\n/start - Start Bot\n/help - zeigen help\n/dodaj - Add search\n/usun - Remove search\n/lista - Liste searches\n/status - zeigen Status\n/ein - aktivieren Benachrichtigungen\n/aus - deaktivieren Benachrichtigungen\n/pojedyncze - einzeln Modus\n/zbiorcze - gesammelt Modus\n/cisza - setzen Ruhezeiten\n/cisza_off - deaktivieren Ruhezeiten\n/najnowsze [ID] - zeigen newest items\n/najtansze [ID] - zeigen cheapest items\n/plany - zeigen Pläne\n/panel - Get Panel link\n/lang - Change Sprache",
      
      help_admin_text: "🔒 <b>FindYourDeal — Admin-Befehle</b>\n\n<b>ADMIN</b>\n\n/hilfe_admin — diese Admin-Hilfe anzeigen\n\n/technik &lt;telegram_user_id&gt; — Telegram → user_id Mapping anzeigen (Diagnostik)\n\n/debug — Bot-Diagnostik (Build, Hash, Uptime, DB-Verbindung)\n\n/debug_worker_links — tatsächlich gescannte Links anzeigen (max 50)\n\n/reset_tag &lt;telegram_user_id&gt; — täglichen Benachrichtigungs-/Item-Zähler zurücksetzen (global, seit Mitternacht Ortszeit)\n\n/audit &lt;telegram_user_id&gt; [limit] — Admin-Audit-Log für Benutzer anzeigen (Standard: letzte 20 Einträge)\n\n<b>SUPERADMIN</b>\n\n/admin_geben &lt;telegram_user_id&gt; — ADMIN-Rolle erteilen\n\n/benutzer_loeschen &lt;telegram_user_id&gt; — Benutzer und alle Daten löschen (Links, Chats, Angebote) — UNWIDERRUFLICH",
      
      unauthorized: "❌ Unauthorized (admin NUR).",
      provide_id: "❌ Provide Telegram ID: /admin_reset &lt;telegram_id&gt;",
      user_not_found: "❌ User not found for Telegram ID {id}",
      user_not_in_db: "Can't see you in database. Use /start oder /dodaj.",
      user_not_registered: "Can't see you in database yet.\nFirst use /dodaj (registers account), then /Status.",
      
      link_not_found: "Couldn't find link with ID <b>{id}</b> EIN deine account. Use /lista.",
      no_links: "You don't have any Links yet.",
      
      usage_usun: "Provide link ID, e.g.:\n<code>/usun 18</code>",
      usage_najnowsze: "Usage: <code>/najnowsze [ID]</code>\nWithout ID: all Links\nWith ID: specific link\n\nExamples:\n<code>/najnowsze</code>\n<code>/najnowsze 18</code>",
      usage_najtansze: "Usage: <code>/najtansze [ID]</code>\nWithout ID: all Links\nWith ID: specific link\n\nExamples:\n<code>/najtansze</code>\n<code>/najtansze 18</code>",
      usage_dodaj: "Usage:\n<code>/dodaj &lt;url&gt; [name]</code>\n\nExample:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      
      max_usage: "Usage: /max &lt;ID&gt; &lt;Wert&gt; or /max &lt;ID&gt; off\n\nBeispiele:\n<code>/max 18 3</code> — Limit 3 Artikel pro Schleife\n<code>/max 18 off</code> — Limit entfernen",
      max_invalid_id: "❌ Ungültige Link-ID. Verwenden Sie eine Zahl, z.B. /max 18 5",
      max_invalid_value: "❌ Ungültiger Wert. Muss eine Zahl zwischen 1 und 100 oder 'off' sein.",
      max_disabled: "✅ Per-Link-Limit deaktiviert für Link <b>{id}</b> ({name}).",
      max_set: "✅ Per-Link-Limit auf <b>{value}</b> Artikel pro Schleife für Link <b>{id}</b> ({name}) gesetzt.",
      
      error_panel: "❌ Failed bis generate Panel link.\n\nrequestId: {requestId}",
      error_payment_config: "❌ Payment configuration error.\n\nrequestId: {requestId}",
      error_addon_config: "❌ Addon configuration error.\n\nrequestId: {requestId}",
      error_no_purchase: "❌ No Kaufoptionen available.",
      error_payment_create: "❌ Error creating payment.\n\nrequestId: {requestId}",
      error_lista: "❌ Error fetching link Liste.",
      
      lista_empty: "Du hast noch keine aktiven Links.\n\nFüge deinen ersten Link hinzu: /dodaj <url> [name]",
      lista_title: "📋 Deine überwachten Links",
      lista_disable: "Um die Überwachung eines Links zu deaktivieren:",
      
      error_usun: "❌ Error disabling link.",
      error_dodaj: "❌ Error adding link.",
      error_status: "❌ Error fetching Status.",
      error_stripe_not_configured: "❌ Stripe not configured.\n\nrequestId: {requestId}",
      error_addon_not_configured: "❌ No configuration for addon.\n\nrequestId: {requestId}",
    },
    
    // /dodaj specific messages
    dodaj: {
      invalid_url: "First parameter must be a valid URL, e.g.:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      trial_expired: "⏰ deine Trial Plan has expired.\nMonitoring in Trial is no longer available.\n\nTo continue using the Bot, choose a paid Plan (Starter / Growth / Platinum).",
      plan_expired: "⏰ deine Plan has expired.\nTo neu hinzufügen Links und resume Überwachung, renew deine Plan in the customer Panel.",
      no_active_plan_trial_used: "You don't have an aktiven Plan with link Überwachung.\nTrial has already been used. Purchase Starter / Growth / Platinum Plan.",
      no_active_plan_trial_available: "You don't have an aktiven Plan with link Überwachung.\nYou can start a one-time Trial (3 days / 5 Links) oder choose Starter / Growth / Platinum Plan.",
      success: "✅ Added new link for Überwachung:\n\nID <b>{id}</b> — {name}\n<code>{url}</code>\n\nActive Links: {active}/{limit}\n\nCheck Links with: <code>/lista</code>",
      no_name: "(no name)",
    },
    
    // /najnowsze specific
    najnowsze: {
      header: "🧾 Newest offers\n<b>{name}</b> <i>(ID {id})</i>\n",
      no_history: "\nNo saved history for this link yet.",
      no_title: "(no title)",
      truncated: "… (truncated – message length limit)\n",
      link_not_found_detail: "Can't see link <b>{id}</b> EIN deine account. Check <code>/lista</code>.",
    },
    
    // Notifications
    notif: {
      enabled: "✅ Benachrichtigungen aktiviert für diesen Chat.",
      disabled: "⛔ Benachrichtigungen DEAKTIVIERT für diesen Chat.",
      mode_single: "📨 Modus setzen: <b>einzeln</b> (default für diesen Chat).",
      mode_batch: "📦 Modus setzen: <b>gesammelt</b> (default für diesen Chat).",
    },
    
    // Quiet hours
    quiet: {
      status_on: "🌙 Ruhezeiten: <b>aktiviert</b>, hours {from}:00–{to}:00",
      status_off: "🌙 Ruhezeiten: <b>DEAKTIVIERT</b>.\nSet: <code>/cisza 22-7</code>",
      usage: "Provide range as HH-HH, e.g. <code>/cisza 22-7</code>",
      invalid_hours: "Hours must be in range 0–23, e.g. <code>/cisza 22-7</code>",
      set: "🌙 Ruhezeiten setzen: <b>{from}:00–{to}:00</b>",
      disabled: "🌙 Ruhezeiten <b>DEAKTIVIERT</b>.",
      disabled_alt: "🌙 Ruhezeiten: <b>DEAKTIVIERT</b>",
    },
    
    // Lista
    lista: {
      header: "📋 aktiven überwachten Links:\n\n",
      footer: "deaktivieren: <code>/usun ID</code>\ne.g. <code>/usun 18</code>",
      no_name: "(no name)",
    },
    
    // Usun
    usun: {
      success: "✅ Stopped Überwachung link:\n\n",
      footer: "You can re-aktivieren it in the Panel oder add it again as a new search.",
    },
    
    // Najnowsze
    najnowsze: {
      header: "🆕 Newest items für Link ID <b>{id}</b>",
      no_history: "No saved history for this link yet.",
    },
    
    // Status
    status: {
      title: "ℹ️ Bot Status",
      plan: "Plan: {name} (bis {exp})",
      plan_with_addons: "Plan: {name} (bis {exp})\nAddons (+10 Links je): {addons}",
      links_enabled: "Aktive Suchen (aktiviert): {enabled}/{limit}",
      links_total: "Gesamtanzahl Suchen (in Datenbank): {total}/{limit}",
      daily_limit: "Tägliches Benachrichtigungslimit: {limit}",
      notif_enabled: "✅ Benachrichtigungen aktiviert",
      notif_disabled: "⛔ Benachrichtigungen DEAKTIVIERT",
      notif_mode: "Standardmodus für diesen Chat: {mode}",
      notif_daily: "Heutige Benachrichtigungen: {daily}/{limit}",
      chat_line_enabled: "✅ Benachrichtigungen aktiviert\nStandardmodus für diesen Chat: {mode}\nHeutige Benachrichtigungen: {daily}/{limit}",
      chat_line_disabled: "⛔ Benachrichtigungen DEAKTIVIERT\nStandardmodus für diesen Chat: {mode}\nHeutige Benachrichtigungen: {daily}/{limit}",
      quiet_on: "Ruhezeiten: aktiviert ({from}:00–{to}:00)",
      quiet_off: "Ruhezeiten: deaktiviert",
      per_link_hint: "Befehle: /ein /aus /einzeln /gesammelt\nPro Link: /einzeln <ID> /gesammelt <ID> /aus <ID> /ein <ID>",
      no_links: "Keine aktiven Suchen.",
      links_header: "Suchliste:",
      unknown: "(Fehler)",
    },
    
    // Notification modes
    mode: {
      single: "einzeln",
      batch: "gesammelt",
      off: "aus",
    },
    
    // Language
    lang: {
      current: "🌍 Current Sprache: <b>{name}</b>",
      available: "Available languages:",
      unknown: "❌ unbekannt Sprache. unterstützt: {list}",
      confirm: "✅ Sprache changed bis: <b>{name}</b>",
      unknown_language: "unbekannt Sprache.",
    },
    
    // Payments & plans
    payment: {
      panel_link: "🧭 <b>Panel</b>\n\nLink bis Panel (valid for {minutes} minutes, one-time use):\n\n{url}\n\n⚠️ <i>Link is valid NUR for {minutes} minutes und can be used NUR once.</i>",
      platinum_addon: "📋 <b>deine Plan: Platinum</b>\n⏰ <b>Valid until:</b> {expiryDate}\n🔗 <b>Links limit:</b> {totalLinks}{addonText}\n\n<b>Add +10 Links (addon):</b>\n\n{url}\n\n⚠️ <i>Link leads bis secure Stripe payment.</i>",
      platinum_addon_packages: " (+{count} addon packages)",
      plans_list: "💳 <b>Available subscription Pläne</b>\n\nYour current Plan: <b>{planLabel}</b>\n\n{url}",
      plans_list_keyboard: "💳 <b>Available subscription Pläne</b>\n\nYour current Plan: <b>{planLabel}</b>\n\nChoose Plan:",
      addon_checkout: "💎 <b>Addon: +10 Links</b>\n\nGo bis payment:\n{url}\n\n<i>requestId: {requestId}</i>",
      addon_button: "✓ Addon +10 Links",
      error_config: "❌ Configuration error",
      error_payment: "❌ Payment creation error.\n\nrequestId: {requestId}",
      checkout_url: "💳 <b>Plan: {planCode}</b>\n\nGo bis payment:\n{url}\n\n<i>requestId: {requestId}</i>",
    },
    
    // Callbacks
    callback: {
      no_chat_data: "No chat/user data.",
      mode_set: "setzen: {mode}",
      mode_set_failed: "❌ Failed bis setzen Modus.",
      link_mode_set: "✅ Link <b>{linkId}</b> in diesem Chat setzen bis: <b>{mode}</b>",
    },
    
    // Admin
    admin: {
      reset_success: "✅ Admin reset done for TG {tgId}. Chats updated: {chats}. aktiven Links reset: {links}. Since={since}",
      no_telegram_id: "Failed bis determine deine Telegram ID. Try again.",
    },
    
    // General
    general: {
      unknown_command: "❓ unbekannt command. Use /help.",
    },
    
    // /najtansze (cheapest sent offers)
    najtansze: {
      header_per_link: "💰 billigste gesendet offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "💰 billigste gesendet offers (since {since})",
      no_history_per_link: "No sent offers with price für Link <b>{id}</b> since {since}.",
      no_history_global: "No sent offers with price since {since}.",
      footer: "Full history:",
    },
    
    // Enhanced najnowsze (newest sent offers)
    najnowsze_enhanced: {
      header_per_link: "🧾 neueste gesendet offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "🧾 neueste gesendet offers (since {since})",
      no_history_per_link: "No sent offers für Link <b>{id}</b> since {since}.",
      no_history_global: "No sent offers since {since}.",
      footer: "Full history:",
      no_title: "(no title)",
    },
  },

  fr: {
    // Commands
    cmd: {
      help_greeting: "👋 Bonjour! Ceci est FindYourDeal bot.",
      help_basic: "Commandes de base:",
      help_basic_lista: "/lista – afficher tes actifs surveillés liens",
      help_basic_usun: "/usun &lt;ID&gt; – désactiver surveillance pour le lien ID",
      help_basic_dodaj: "/dodaj &lt;url&gt; [name] – ajouter nouveau link à surveiller",
      help_basic_status: "/statut – bot statut, Plan, et Notifications",
      help_basic_panel: "/panneau – ouvrir gestion panneau",
      help_notif: "PUSH Notifications sur ce chat:",
      help_notif_on: "/ACTIVÉ – activer",
      help_notif_off: "/DÉSACTIVÉ – désactiver",
      help_notif_single: "/pojedyncze – unique cartes",
      help_notif_batch: "/zbiorcze – groupe liste",
      help_perlink: "Mode par lien (UNIQUEMENT sur ce chat):",
      help_perlink_commands: "/pojedyncze <ID>, /zbiorcze <ID>, /off <ID>, /on <ID> (e.g. /zbiorcze 18)",
      help_perlink_max: "/max &lt;ID&gt; &lt;valeur&gt; – limite par boucle (e.g. /max 18 3 or /max 18 off)",
      help_quiet: "Heures de silence:",
      help_quiet_show: "/cisza – afficher",
      help_quiet_set: "/cisza HH-HH – définir (e.g. /cisza 22-7)",
      help_quiet_off: "/cisza_off – désactiver",
      help_history: "Historique envoyé:",
      help_history_najnowsze: "/najnowsze – plus récent envoyé sur ce chat",
      help_history_najnowsze_id: "/najnowsze &lt;ID&gt; – plus récent envoyé pour le lien",
      help_history_najtansze: "/najtansze – moins cher envoyé sur ce chat",
      help_history_najtansze_id: "/najtansze &lt;ID&gt; – moins cher envoyé pour le lien",
      help_examples: "Exemples:",
      help_examples_text: "<code>/liste</code>\n<code>/supprimer 18</code>\n<code>/ajouter https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>\n<code>/recents 18</code>",
      
      // Dynamic help descriptions (FR)
      help_basic_name: "nom",
      help_basic_lista_desc: "– afficher vos liens surveillés actifs",
      help_basic_usun_desc: "– désactiver la surveillance pour l'ID du lien",
      help_basic_dodaj_desc: "– ajouter un nouveau lien à surveiller",
      help_basic_status_desc: "– statut du bot, plan et notifications",
      help_basic_panel_desc: "– ouvrir le panneau de gestion",
      help_basic_nazwa_desc: "– renommer le lien (ou /{nazwa} ID – pour effacer)",
      help_notif_on_desc: "– activer",
      help_notif_off_desc: "– désactiver",
      help_notif_single_desc: "– cartes uniques",
      help_notif_batch_desc: "– liste groupée",
      help_value: "valeur",
      help_perlink_max_desc: "– limiter les articles par boucle (par ex. /max 18 3 ou /max 18 off)",
      help_quiet_show_desc: "– afficher",
      help_quiet_set_desc: "– définir (par ex. /silence 22-7)",
      help_quiet_off_desc: "– désactiver",
      help_history_najnowsze_desc: "– plus récents envoyés sur ce chat",
      help_history_najnowsze_id_desc: "– plus récents envoyés pour le lien",
      help_history_najtansze_desc: "– moins chers envoyés sur ce chat",
      help_history_najtansze_id_desc: "– moins chers envoyés pour le lien",
      help_plans_show_desc: "– afficher les plans disponibles et options d'achat",
      help_code: "code",
      help_lang_set_desc: "– définir la langue (par ex. /lang en, /lang fr)",
      
      help: "Available commands:\n/start - Start bot\n/help - afficher help\n/dodaj - Add search\n/usun - Remove search\n/lista - liste searches\n/statut - afficher statut\n/active - activer Notifications\n/desactive - désactiver Notifications\n/pojedyncze - unique Mode\n/zbiorcze - groupe Mode\n/cisza - définir Heures de silence\n/cisza_off - désactiver Heures de silence\n/najnowsze [ID] - afficher newest items\n/najtansze [ID] - afficher cheapest items\n/plany - afficher Plans\n/panneau - Get panneau link\n/lang - Change Langue",
      
      help_admin_text: "🔒 <b>FindYourDeal — Commandes Admin</b>\n\n<b>ADMIN</b>\n\n/aide_admin — afficher cette aide admin\n\n/tech &lt;telegram_user_id&gt; — afficher mappage Telegram → user_id (diagnostics)\n\n/debug — diagnostics bot (build, hash, uptime, connexion DB)\n\n/debug_worker_links — lister liens réellement scannés par le worker (max 50)\n\n/reset_jour &lt;telegram_user_id&gt; — réinitialiser compteur quotidien notifications/items (global, depuis minuit heure locale)\n\n/audit &lt;telegram_user_id&gt; [limit] — afficher journal d'audit admin pour utilisateur (défaut: 20 dernières entrées)\n\n<b>SUPERADMIN</b>\n\n/donner_admin &lt;telegram_user_id&gt; — accorder rôle ADMIN\n\n/supprimer_utilisateur &lt;telegram_user_id&gt; — supprimer utilisateur et toutes données (liens, chats, offres) — IRRÉVERSIBLE",
      
      unauthorized: "❌ Unauthorized (admin UNIQUEMENT).",
      provide_id: "❌ Provide Telegram ID: /admin_reset &lt;telegram_id&gt;",
      user_not_found: "❌ User not found for Telegram ID {id}",
      user_not_in_db: "Can't see you in database. Use /start ou /dodaj.",
      user_not_registered: "Can't see you in database yet.\nFirst use /dodaj (registers account), then /statut.",
      
      link_not_found: "Couldn't find link with ID <b>{id}</b> ACTIVÉ tes account. Use /lista.",
      no_links: "You don't have any liens yet.",
      
      usage_usun: "Provide link ID, e.g.:\n<code>/usun 18</code>",
      usage_najnowsze: "Usage: <code>/najnowsze [ID]</code>\nWithout ID: all liens\nWith ID: specific link\n\nExamples:\n<code>/najnowsze</code>\n<code>/najnowsze 18</code>",
      usage_najtansze: "Usage: <code>/najtansze [ID]</code>\nWithout ID: all liens\nWith ID: specific link\n\nExamples:\n<code>/najtansze</code>\n<code>/najtansze 18</code>",
      usage_dodaj: "Usage:\n<code>/dodaj &lt;url&gt; [name]</code>\n\nExample:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      
      max_usage: "Usage: /max &lt;ID&gt; &lt;valeur&gt; ou /max &lt;ID&gt; off\n\nExemples:\n<code>/max 18 3</code> — limite à 3 articles par boucle\n<code>/max 18 off</code> — supprimer la limite",
      max_invalid_id: "❌ ID de lien invalide. Utilisez un nombre, par exemple /max 18 5",
      max_invalid_value: "❌ Valeur invalide. Doit être un nombre entre 1 et 100 ou 'off'.",
      max_disabled: "✅ Limite par lien désactivée pour le lien <b>{id}</b> ({name}).",
      max_set: "✅ Limite par lien définie à <b>{value}</b> articles par boucle pour le lien <b>{id}</b> ({name}).",
      
      error_panel: "❌ Failed à generate panneau link.\n\nrequestId: {requestId}",
      error_payment_config: "❌ Payment configuration error.\n\nrequestId: {requestId}",
      error_addon_config: "❌ Addon configuration error.\n\nrequestId: {requestId}",
      error_no_purchase: "❌ No options d'achat available.",
      error_payment_create: "❌ Error creating payment.\n\nrequestId: {requestId}",
      error_lista: "❌ Error fetching link liste.",
      
      lista_empty: "Vous n'avez pas encore de liens actifs.\n\nAjoutez votre premier lien: /dodaj <url> [nom]",
      lista_title: "📋 Vos liens surveillés",
      lista_disable: "Pour désactiver la surveillance d'un lien:",
      
      error_usun: "❌ Error disabling link.",
      error_dodaj: "❌ Error adding link.",
      error_status: "❌ Error fetching statut.",
      error_stripe_not_configured: "❌ Stripe not configured.\n\nrequestId: {requestId}",
      error_addon_not_configured: "❌ No configuration for addon.\n\nrequestId: {requestId}",
    },
    
    // /dodaj specific messages
    dodaj: {
      invalid_url: "First parameter must be a valid URL, e.g.:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      trial_expired: "⏰ tes Trial Plan has expired.\nMonitoring in Trial is no longer available.\n\nTo continue using the bot, choose a paid Plan (Starter / Growth / Platinum).",
      plan_expired: "⏰ tes Plan has expired.\nTo ajouter nouveau liens et resume surveillance, renew tes Plan in the customer panneau.",
      no_active_plan_trial_used: "You don't have an actifs Plan with link surveillance.\nTrial has already been used. Purchase Starter / Growth / Platinum Plan.",
      no_active_plan_trial_available: "You don't have an actifs Plan with link surveillance.\nYou can start a one-time Trial (3 days / 5 liens) ou choose Starter / Growth / Platinum Plan.",
      success: "✅ Added new link for surveillance:\n\nID <b>{id}</b> — {name}\n<code>{url}</code>\n\nActive liens: {active}/{limit}\n\nCheck liens with: <code>/lista</code>",
      no_name: "(no name)",
    },
    
    // /najnowsze specific
    najnowsze: {
      header: "🧾 Newest offers\n<b>{name}</b> <i>(ID {id})</i>\n",
      no_history: "\nNo saved history for this link yet.",
      no_title: "(no title)",
      truncated: "… (truncated – message length limit)\n",
      link_not_found_detail: "Can't see link <b>{id}</b> ACTIVÉ tes account. Check <code>/lista</code>.",
    },
    
    // Notifications
    notif: {
      enabled: "✅ Notifications activé pour ce chat.",
      disabled: "⛔ Notifications DÉSACTIVÉ pour ce chat.",
      mode_single: "📨 Mode définir: <b>unique</b> (default pour ce chat).",
      mode_batch: "📦 Mode définir: <b>groupe</b> (default pour ce chat).",
    },
    
    // Quiet hours
    quiet: {
      status_on: "🌙 Heures de silence: <b>activé</b>, hours {from}:00–{to}:00",
      status_off: "🌙 Heures de silence: <b>DÉSACTIVÉ</b>.\nSet: <code>/cisza 22-7</code>",
      usage: "Provide range as HH-HH, e.g. <code>/cisza 22-7</code>",
      invalid_hours: "Hours must be in range 0–23, e.g. <code>/cisza 22-7</code>",
      set: "🌙 Heures de silence définir: <b>{from}:00–{to}:00</b>",
      disabled: "🌙 Heures de silence <b>DÉSACTIVÉ</b>.",
      disabled_alt: "🌙 Heures de silence: <b>DÉSACTIVÉ</b>",
    },
    
    // Lista
    lista: {
      header: "📋 actifs surveillés liens:\n\n",
      footer: "désactiver: <code>/usun ID</code>\ne.g. <code>/usun 18</code>",
      no_name: "(no name)",
    },
    
    // Usun
    usun: {
      success: "✅ Stopped surveillance link:\n\n",
      footer: "You can re-activer it in the panneau ou add it again as a new search.",
    },
    
    // Najnowsze
    najnowsze: {
      header: "🆕 Newest items pour le lien ID <b>{id}</b>",
      no_history: "No saved history for this link yet.",
    },
    
    // Status
    status: {
      title: "ℹ️ bot statut",
      plan: "Plan: {name} (jusqu'au {exp})",
      plan_with_addons: "Plan: {name} (jusqu'au {exp})\nModules (+10 liens chacun): {addons}",
      links_enabled: "Recherches actives (activées): {enabled}/{limit}",
      links_total: "Total de recherches (dans la base): {total}/{limit}",
      daily_limit: "Limite de notifications quotidienne: {limit}",
      notif_enabled: "✅ Notifications activées",
      notif_disabled: "⛔ Notifications DÉSACTIVÉES",
      notif_mode: "Mode par défaut pour ce chat: {mode}",
      notif_daily: "Notifications d'aujourd'hui: {daily}/{limit}",
      chat_line_enabled: "✅ Notifications activées\nMode par défaut pour ce chat: {mode}\nNotifications d'aujourd'hui: {daily}/{limit}",
      chat_line_disabled: "⛔ Notifications DÉSACTIVÉES\nMode par défaut pour ce chat: {mode}\nNotifications d'aujourd'hui: {daily}/{limit}",
      quiet_on: "Heures de silence: activé ({from}:00–{to}:00)",
      quiet_off: "Heures de silence: DÉSACTIVÉ",
      per_link_hint: "Commandes: /ACTIVÉ /DÉSACTIVÉ /unique /groupe\nPar lien: /unique <ID> /groupe <ID> /off <ID> /on <ID>",
      no_links: "Aucune recherche active.",
      links_header: "Liste de recherches:",
      unknown: "(erreur)",
    },
    
    // Notification modes
    mode: {
      single: "unique",
      batch: "groupé",
      off: "désactivé",
    },
    
    // Language
    lang: {
      current: "🌍 Current Langue: <b>{name}</b>",
      available: "Available languages:",
      unknown: "❌ inconnu Langue. supporté: {list}",
      confirm: "✅ Langue changed à: <b>{name}</b>",
      unknown_language: "inconnu Langue.",
    },
    
    // Payments & plans
    payment: {
      panel_link: "🧭 <b>panneau</b>\n\nLink à panneau (valid for {minutes} minutes, one-time use):\n\n{url}\n\n⚠️ <i>Link is valid UNIQUEMENT for {minutes} minutes et can be used UNIQUEMENT once.</i>",
      platinum_addon: "📋 <b>tes Plan: Platinum</b>\n⏰ <b>Valid until:</b> {expiryDate}\n🔗 <b>liens limit:</b> {totalLinks}{addonText}\n\n<b>Add +10 liens (addon):</b>\n\n{url}\n\n⚠️ <i>Link leads à secure Stripe payment.</i>",
      platinum_addon_packages: " (+{count} addon packages)",
      plans_list: "💳 <b>Available subscription Plans</b>\n\nYour current Plan: <b>{planLabel}</b>\n\n{url}",
      plans_list_keyboard: "💳 <b>Available subscription Plans</b>\n\nYour current Plan: <b>{planLabel}</b>\n\nChoose Plan:",
      addon_checkout: "💎 <b>Addon: +10 liens</b>\n\nGo à payment:\n{url}\n\n<i>requestId: {requestId}</i>",
      addon_button: "✓ Addon +10 liens",
      error_config: "❌ Configuration error",
      error_payment: "❌ Payment creation error.\n\nrequestId: {requestId}",
      checkout_url: "💳 <b>Plan: {planCode}</b>\n\nGo à payment:\n{url}\n\n<i>requestId: {requestId}</i>",
    },
    
    // Callbacks
    callback: {
      no_chat_data: "No chat/user data.",
      mode_set: "définir: {mode}",
      mode_set_failed: "❌ Failed à définir Mode.",
      link_mode_set: "✅ Link <b>{linkId}</b> sur ce chat définir à: <b>{mode}</b>",
    },
    
    // Admin
    admin: {
      reset_success: "✅ Admin reset done for TG {tgId}. Chats updated: {chats}. actifs liens reset: {links}. Since={since}",
      no_telegram_id: "Failed à determine tes Telegram ID. Try again.",
    },
    
    // General
    general: {
      unknown_command: "❓ inconnu command. Use /help.",
    },
    
    // /najtansze (cheapest sent offers)
    najtansze: {
      header_per_link: "💰 moins cher envoyé offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "💰 moins cher envoyé offers (since {since})",
      no_history_per_link: "No sent offers with price pour le lien <b>{id}</b> since {since}.",
      no_history_global: "No sent offers with price since {since}.",
      footer: "Full history:",
    },
    
    // Enhanced najnowsze (newest sent offers)
    najnowsze_enhanced: {
      header_per_link: "🧾 plus récent envoyé offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "🧾 plus récent envoyé offers (since {since})",
      no_history_per_link: "No sent offers pour le lien <b>{id}</b> since {since}.",
      no_history_global: "No sent offers since {since}.",
      footer: "Full history:",
      no_title: "(no title)",
    },
  },

  it: {
    // Commands
    cmd: {
      help_greeting: "👋 Ciao! Questo è FindYourDeal bot.",
      help_basic: "Comandi base:",
      help_basic_lista: "/lista – mostrare tuoi attivi monitorati link",
      help_basic_usun: "/usun &lt;ID&gt; – disattivare monitoraggio per il link ID",
      help_basic_dodaj: "/dodaj &lt;url&gt; [name] – aggiungi nuovo link da monitorare",
      help_basic_status: "/stato – bot stato, piano, e notifiche",
      help_basic_panel: "/pannello – aprire gestione pannello",
      help_notif: "PUSH notifiche su questa chat:",
      help_notif_on: "/ATTIVATO – attivare",
      help_notif_off: "/DISATTIVATO – disattivare",
      help_notif_single: "/pojedyncze – singola schede",
      help_notif_batch: "/zbiorcze – gruppo lista",
      help_perlink: "Modalità per link (SOLO su questa chat):",
      help_perlink_commands: "/pojedyncze <ID>, /zbiorcze <ID>, /off <ID>, /on <ID> (e.g. /zbiorcze 18)",
      help_perlink_max: "/max &lt;ID&gt; &lt;valore&gt; – limite per ciclo (e.g. /max 18 3 or /max 18 off)",
      help_quiet: "Ore silenziose:",
      help_quiet_show: "/cisza – mostrare",
      help_quiet_set: "/cisza HH-HH – impostare (e.g. /cisza 22-7)",
      help_quiet_off: "/cisza_off – disattivare",
      help_history: "Cronologia inviati:",
      help_history_najnowsze: "/najnowsze – più recente inviato su questa chat",
      help_history_najnowsze_id: "/najnowsze &lt;ID&gt; – più recente inviato per il link",
      help_history_najtansze: "/najtansze – più economico inviato su questa chat",
      help_history_najtansze_id: "/najtansze &lt;ID&gt; – più economico inviato per il link",
      help_examples: "Esempi:",
      help_examples_text: "<code>/elenco</code>\n<code>/rimuovere 18</code>\n<code>/aggiungere https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>\n<code>/recenti 18</code>",
      
      // Dynamic help descriptions (IT)
      help_basic_name: "nome",
      help_basic_lista_desc: "– mostrare i tuoi link monitorati attivi",
      help_basic_usun_desc: "– disattivare il monitoraggio per l'ID del link",
      help_basic_dodaj_desc: "– aggiungere un nuovo link da monitorare",
      help_basic_status_desc: "– stato del bot, piano e notifiche",
      help_basic_panel_desc: "– aprire il pannello di gestione",
      help_basic_nazwa_desc: "– rinominare il link (o /{nazwa} ID – per cancellare)",
      help_notif_on_desc: "– attivare",
      help_notif_off_desc: "– disattivare",
      help_notif_single_desc: "– carte singole",
      help_notif_batch_desc: "– lista di gruppo",
      help_value: "valore",
      help_perlink_max_desc: "– limitare gli articoli per ciclo (es. /max 18 3 o /max 18 off)",
      help_quiet_show_desc: "– mostrare",
      help_quiet_set_desc: "– impostare (es. /silenzio 22-7)",
      help_quiet_off_desc: "– disattivare",
      help_history_najnowsze_desc: "– più recenti inviati su questa chat",
      help_history_najnowsze_id_desc: "– più recenti inviati per il link",
      help_history_najtansze_desc: "– più economici inviati su questa chat",
      help_history_najtansze_id_desc: "– più economici inviati per il link",
      help_plans_show_desc: "– mostrare i piani disponibili e le opzioni di acquisto",
      help_code: "codice",
      help_lang_set_desc: "– impostare la lingua (es. /lang en, /lang it)",
      
      help: "Available commands:\n/start - Start bot\n/help - mostrare help\n/dodaj - Add search\n/usun - Remove search\n/lista - lista searches\n/stato - mostrare stato\n/attiva - attivare notifiche\n/disattiva - disattivare notifiche\n/pojedyncze - singola Modalità\n/zbiorcze - gruppo Modalità\n/cisza - impostare Ore silenziose\n/cisza_off - disattivare Ore silenziose\n/najnowsze [ID] - mostrare newest items\n/najtansze [ID] - mostrare cheapest items\n/plany - mostrare Piani\n/pannello - Get pannello link\n/lang - Change Lingua",
      
      help_admin_text: "🔒 <b>FindYourDeal — Comandi Admin</b>\n\n<b>ADMIN</b>\n\n/aiuto_admin — mostrare questo aiuto admin\n\n/tech &lt;telegram_user_id&gt; — mostrare mappatura Telegram → user_id (diagnostica)\n\n/debug — diagnostica bot (build, hash, uptime, connessione DB)\n\n/debug_worker_links — elencare link effettivamente scansionati dal worker (max 50)\n\n/reset_giorno &lt;telegram_user_id&gt; — resettare contatore giornaliero notifiche/articoli (globale, da mezzanotte ora locale)\n\n/audit &lt;telegram_user_id&gt; [limit] — mostrare log audit admin per utente (predefinito: ultime 20 voci)\n\n<b>SUPERADMIN</b>\n\n/dai_admin &lt;telegram_user_id&gt; — concedere ruolo ADMIN\n\n/elimina_utente &lt;telegram_user_id&gt; — eliminare utente e tutti i dati (link, chat, offerte) — IRREVERSIBILE",
      
      unauthorized: "❌ Unauthorized (admin SOLO).",
      provide_id: "❌ Provide Telegram ID: /admin_reset &lt;telegram_id&gt;",
      user_not_found: "❌ User not found for Telegram ID {id}",
      user_not_in_db: "Can't see you in database. Use /start o /dodaj.",
      user_not_registered: "Can't see you in database yet.\nFirst use /dodaj (registers account), then /stato.",
      
      link_not_found: "Couldn't find link with ID <b>{id}</b> ATTIVATO tuoi account. Use /lista.",
      no_links: "You don't have any link yet.",
      
      usage_usun: "Provide link ID, e.g.:\n<code>/usun 18</code>",
      usage_najnowsze: "Usage: <code>/najnowsze [ID]</code>\nWithout ID: all link\nWith ID: specific link\n\nExamples:\n<code>/najnowsze</code>\n<code>/najnowsze 18</code>",
      usage_najtansze: "Usage: <code>/najtansze [ID]</code>\nWithout ID: all link\nWith ID: specific link\n\nExamples:\n<code>/najtansze</code>\n<code>/najtansze 18</code>",
      usage_dodaj: "Usage:\n<code>/dodaj &lt;url&gt; [name]</code>\n\nExample:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      
      max_usage: "Usage: /max &lt;ID&gt; &lt;valore&gt; o /max &lt;ID&gt; off\n\nEsempi:\n<code>/max 18 3</code> — limite 3 articoli per ciclo\n<code>/max 18 off</code> — rimuovi limite",
      max_invalid_id: "❌ ID link non valido. Usa un numero, ad esempio /max 18 5",
      max_invalid_value: "❌ Valore non valido. Deve essere un numero tra 1 e 100 o 'off'.",
      max_disabled: "✅ Limite per link disattivato per link <b>{id}</b> ({name}).",
      max_set: "✅ Limite per link impostato a <b>{value}</b> articoli per ciclo per link <b>{id}</b> ({name}).",
      
      error_panel: "❌ Failed a generate pannello link.\n\nrequestId: {requestId}",
      error_payment_config: "❌ Payment configuration error.\n\nrequestId: {requestId}",
      error_addon_config: "❌ Addon configuration error.\n\nrequestId: {requestId}",
      error_no_purchase: "❌ No opzioni di acquisto available.",
      error_payment_create: "❌ Error creating payment.\n\nrequestId: {requestId}",
      error_lista: "❌ Error fetching link lista.",
      
      lista_empty: "Non hai ancora link attivi.\n\nAggiungi il tuo primo link: /dodaj <url> [nome]",
      lista_title: "📋 I tuoi link monitorati",
      lista_disable: "Per disattivare il monitoraggio di un link:",
      
      error_usun: "❌ Error disabling link.",
      error_dodaj: "❌ Error adding link.",
      error_status: "❌ Error fetching stato.",
      error_stripe_not_configured: "❌ Stripe not configured.\n\nrequestId: {requestId}",
      error_addon_not_configured: "❌ No configuration for addon.\n\nrequestId: {requestId}",
    },
    
    // /dodaj specific messages
    dodaj: {
      invalid_url: "First parameter must be a valid URL, e.g.:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      trial_expired: "⏰ tuoi Trial piano has expired.\nMonitoring in Trial is no longer available.\n\nTo continue using the bot, choose a paid piano (Starter / Growth / Platinum).",
      plan_expired: "⏰ tuoi piano has expired.\nTo aggiungi nuovo link e resume monitoraggio, renew tuoi piano in the customer pannello.",
      no_active_plan_trial_used: "You don't have an attivi piano with link monitoraggio.\nTrial has already been used. Purchase Starter / Growth / Platinum piano.",
      no_active_plan_trial_available: "You don't have an attivi piano with link monitoraggio.\nYou can start a one-time Trial (3 days / 5 link) o choose Starter / Growth / Platinum piano.",
      success: "✅ Added new link for monitoraggio:\n\nID <b>{id}</b> — {name}\n<code>{url}</code>\n\nActive link: {active}/{limit}\n\nCheck link with: <code>/lista</code>",
      no_name: "(no name)",
    },
    
    // /najnowsze specific
    najnowsze: {
      header: "🧾 Newest offers\n<b>{name}</b> <i>(ID {id})</i>\n",
      no_history: "\nNo saved history for this link yet.",
      no_title: "(no title)",
      truncated: "… (truncated – message length limit)\n",
      link_not_found_detail: "Can't see link <b>{id}</b> ATTIVATO tuoi account. Check <code>/lista</code>.",
    },
    
    // Notifications
    notif: {
      enabled: "✅ notifiche attivato per questa chat.",
      disabled: "⛔ notifiche DISATTIVATO per questa chat.",
      mode_single: "📨 Modalità impostare: <b>singola</b> (default per questa chat).",
      mode_batch: "📦 Modalità impostare: <b>gruppo</b> (default per questa chat).",
    },
    
    // Quiet hours
    quiet: {
      status_on: "🌙 Ore silenziose: <b>attivato</b>, hours {from}:00–{to}:00",
      status_off: "🌙 Ore silenziose: <b>DISATTIVATO</b>.\nSet: <code>/cisza 22-7</code>",
      usage: "Provide range as HH-HH, e.g. <code>/cisza 22-7</code>",
      invalid_hours: "Hours must be in range 0–23, e.g. <code>/cisza 22-7</code>",
      set: "🌙 Ore silenziose impostare: <b>{from}:00–{to}:00</b>",
      disabled: "🌙 Ore silenziose <b>DISATTIVATO</b>.",
      disabled_alt: "🌙 Ore silenziose: <b>DISATTIVATO</b>",
    },
    
    // Lista
    lista: {
      header: "📋 attivi monitorati link:\n\n",
      footer: "disattivare: <code>/usun ID</code>\ne.g. <code>/usun 18</code>",
      no_name: "(no name)",
    },
    
    // Usun
    usun: {
      success: "✅ Stopped monitoraggio link:\n\n",
      footer: "You can re-attivare it in the pannello o add it again as a new search.",
    },
    
    // Najnowsze
    najnowsze: {
      header: "🆕 Newest items per il link ID <b>{id}</b>",
      no_history: "No saved history for this link yet.",
    },
    
    // Status
    status: {
      title: "ℹ️ bot stato",
      plan: "Piano: {name} (fino al {exp})",
      plan_with_addons: "Piano: {name} (fino al {exp})\nModuli (+10 link ciascuno): {addons}",
      links_enabled: "Ricerche attive (attivate): {enabled}/{limit}",
      links_total: "Ricerche totali (nel database): {total}/{limit}",
      daily_limit: "Limite notifiche giornaliere: {limit}",
      notif_enabled: "✅ Notifiche attivate",
      notif_disabled: "⛔ Notifiche DISATTIVATE",
      notif_mode: "Modalità predefinita per questa chat: {mode}",
      notif_daily: "Notifiche di oggi: {daily}/{limit}",
      chat_line_enabled: "✅ Notifiche attivate\nModalità predefinita per questa chat: {mode}\nNotifiche di oggi: {daily}/{limit}",
      chat_line_disabled: "⛔ Notifiche DISATTIVATE\nModalità predefinita per questa chat: {mode}\nNotifiche di oggi: {daily}/{limit}",
      quiet_on: "Ore silenziose: attivato ({from}:00–{to}:00)",
      quiet_off: "Ore silenziose: DISATTIVATO",
      per_link_hint: "Comandi: /ATTIVATO /DISATTIVATO /singola /gruppo\nPer link: /singola <ID> /gruppo <ID> /off <ID> /on <ID>",
      no_links: "Nessuna ricerca attiva.",
      links_header: "Lista ricerche:",
      unknown: "(errore)",
    },
    
    // Notification modes
    mode: {
      single: "singolo",
      batch: "raggruppato",
      off: "disattivato",
    },
    
    // Language
    lang: {
      current: "🌍 Current Lingua: <b>{name}</b>",
      available: "Available languages:",
      unknown: "❌ sconosciuto Lingua. supportato: {list}",
      confirm: "✅ Lingua changed a: <b>{name}</b>",
      unknown_language: "sconosciuto Lingua.",
    },
    
    // Payments & plans
    payment: {
      panel_link: "🧭 <b>pannello</b>\n\nLink a pannello (valid for {minutes} minutes, one-time use):\n\n{url}\n\n⚠️ <i>Link is valid SOLO for {minutes} minutes e can be used SOLO once.</i>",
      platinum_addon: "📋 <b>tuoi piano: Platinum</b>\n⏰ <b>Valid until:</b> {expiryDate}\n🔗 <b>link limit:</b> {totalLinks}{addonText}\n\n<b>Add +10 link (addon):</b>\n\n{url}\n\n⚠️ <i>Link leads a secure Stripe payment.</i>",
      platinum_addon_packages: " (+{count} addon packages)",
      plans_list: "💳 <b>Available subscription Piani</b>\n\nYour current piano: <b>{planLabel}</b>\n\n{url}",
      plans_list_keyboard: "💳 <b>Available subscription Piani</b>\n\nYour current piano: <b>{planLabel}</b>\n\nChoose piano:",
      addon_checkout: "💎 <b>Addon: +10 link</b>\n\nGo a payment:\n{url}\n\n<i>requestId: {requestId}</i>",
      addon_button: "✓ Addon +10 link",
      error_config: "❌ Configuration error",
      error_payment: "❌ Payment creation error.\n\nrequestId: {requestId}",
      checkout_url: "💳 <b>piano: {planCode}</b>\n\nGo a payment:\n{url}\n\n<i>requestId: {requestId}</i>",
    },
    
    // Callbacks
    callback: {
      no_chat_data: "No chat/user data.",
      mode_set: "impostare: {mode}",
      mode_set_failed: "❌ Failed a impostare Modalità.",
      link_mode_set: "✅ Link <b>{linkId}</b> su questa chat impostare a: <b>{mode}</b>",
    },
    
    // Admin
    admin: {
      reset_success: "✅ Admin reset done for TG {tgId}. Chats updated: {chats}. attivi link reset: {links}. Since={since}",
      no_telegram_id: "Failed a determine tuoi Telegram ID. Try again.",
    },
    
    // General
    general: {
      unknown_command: "❓ sconosciuto command. Use /help.",
    },
    
    // /najtansze (cheapest sent offers)
    najtansze: {
      header_per_link: "💰 più economico inviato offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "💰 più economico inviato offers (since {since})",
      no_history_per_link: "No sent offers with price per il link <b>{id}</b> since {since}.",
      no_history_global: "No sent offers with price since {since}.",
      footer: "Full history:",
    },
    
    // Enhanced najnowsze (newest sent offers)
    najnowsze_enhanced: {
      header_per_link: "🧾 più recente inviato offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "🧾 più recente inviato offers (since {since})",
      no_history_per_link: "No sent offers per il link <b>{id}</b> since {since}.",
      no_history_global: "No sent offers since {since}.",
      footer: "Full history:",
      no_title: "(no title)",
    },
  },

  es: {
    // Commands
    cmd: {
      help_greeting: "👋 Hola! Este es FindYourDeal bot.",
      help_basic: "Comandos básicos:",
      help_basic_lista: "/lista – mostrar tus activos monitoreados enlaces",
      help_basic_usun: "/usun &lt;ID&gt; – desactivar monitoreo para el enlace ID",
      help_basic_dodaj: "/dodaj &lt;url&gt; [name] – agregar nuevo link para monitorear",
      help_basic_status: "/estado – bot estado, Plan, y notificaciones",
      help_basic_panel: "/panel – abrir gestión panel",
      help_notif: "PUSH notificaciones en este chat:",
      help_notif_on: "/ACTIVADO – activar",
      help_notif_off: "/DESACTIVADO – desactivar",
      help_notif_single: "/pojedyncze – individual tarjetas",
      help_notif_batch: "/zbiorcze – lote lista",
      help_perlink: "Modo por enlace (SOLO en este chat):",
      help_perlink_commands: "/pojedyncze <ID>, /zbiorcze <ID>, /off <ID>, /on <ID> (e.g. /zbiorcze 18)",
      help_perlink_max: "/max &lt;ID&gt; &lt;valor&gt; – límite por ciclo (e.g. /max 18 3 or /max 18 off)",
      help_quiet: "Horas silenciosas:",
      help_quiet_show: "/cisza – mostrar",
      help_quiet_set: "/cisza HH-HH – establecer (e.g. /cisza 22-7)",
      help_quiet_off: "/cisza_off – desactivar",
      help_history: "Historial enviado:",
      help_history_najnowsze: "/najnowsze – más reciente enviado en este chat",
      help_history_najnowsze_id: "/najnowsze &lt;ID&gt; – más reciente enviado para el enlace",
      help_history_najtansze: "/najtansze – más barato enviado en este chat",
      help_history_najtansze_id: "/najtansze &lt;ID&gt; – más barato enviado para el enlace",
      help_examples: "Ejemplos:",
      help_examples_text: "<code>/lista</code>\n<code>/eliminar 18</code>\n<code>/agregar https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>\n<code>/recientes 18</code>",
      
      // Dynamic help descriptions (ES)
      help_basic_name: "nombre",
      help_basic_lista_desc: "– mostrar tus enlaces monitoreados activos",
      help_basic_usun_desc: "– desactivar el monitoreo para el ID del enlace",
      help_basic_dodaj_desc: "– agregar un nuevo enlace para monitorear",
      help_basic_status_desc: "– estado del bot, plan y notificaciones",
      help_basic_panel_desc: "– abrir el panel de gestión",
      help_basic_nazwa_desc: "– renombrar el enlace (o /{nazwa} ID – para borrar)",
      help_notif_on_desc: "– activar",
      help_notif_off_desc: "– desactivar",
      help_notif_single_desc: "– tarjetas individuales",
      help_notif_batch_desc: "– lista por lotes",
      help_value: "valor",
      help_perlink_max_desc: "– limitar artículos por ciclo (ej. /max 18 3 o /max 18 off)",
      help_quiet_show_desc: "– mostrar",
      help_quiet_set_desc: "– establecer (ej. /silencio 22-7)",
      help_quiet_off_desc: "– desactivar",
      help_history_najnowsze_desc: "– más recientes enviados en este chat",
      help_history_najnowsze_id_desc: "– más recientes enviados para el enlace",
      help_history_najtansze_desc: "– más baratos enviados en este chat",
      help_history_najtansze_id_desc: "– más baratos enviados para el enlace",
      help_plans_show_desc: "– mostrar planes disponibles y opciones de compra",
      help_code: "código",
      help_lang_set_desc: "– establecer idioma (ej. /lang en, /lang es)",
      
      help: "Available commands:\n/start - Start bot\n/help - mostrar help\n/dodaj - Add search\n/usun - Remove search\n/lista - lista searches\n/estado - mostrar estado\n/activar - activar notificaciones\n/desactivar - desactivar notificaciones\n/pojedyncze - individual Modo\n/zbiorcze - lote Modo\n/cisza - establecer Horas silenciosas\n/cisza_off - desactivar Horas silenciosas\n/najnowsze [ID] - mostrar newest items\n/najtansze [ID] - mostrar cheapest items\n/plany - mostrar Planes\n/panel - Get panel link\n/lang - Change Idioma",
      
      help_admin_text: "🔒 <b>FindYourDeal — Comandos Admin</b>\n\n<b>ADMIN</b>\n\n/ayuda_admin — mostrar esta ayuda admin\n\n/tech &lt;telegram_user_id&gt; — mostrar mapeo Telegram → user_id (diagnósticos)\n\n/debug — diagnósticos bot (build, hash, uptime, conexión DB)\n\n/debug_worker_links — listar enlaces realmente escaneados por el worker (max 50)\n\n/reset_dia &lt;telegram_user_id&gt; — resetear contador diario notificaciones/artículos (global, desde medianoche hora local)\n\n/auditoria &lt;telegram_user_id&gt; [limit] — mostrar registro auditoría admin para usuario (predeterminado: últimas 20 entradas)\n\n<b>SUPERADMIN</b>\n\n/dar_admin &lt;telegram_user_id&gt; — conceder rol ADMIN\n\n/borrar_usuario &lt;telegram_user_id&gt; — eliminar usuario y todos los datos (enlaces, chats, ofertas) — IRREVERSIBLE",
      
      unauthorized: "❌ Unauthorized (admin SOLO).",
      provide_id: "❌ Provide Telegram ID: /admin_reset &lt;telegram_id&gt;",
      user_not_found: "❌ User not found for Telegram ID {id}",
      user_not_in_db: "Can't see you in database. Use /start o /dodaj.",
      user_not_registered: "Can't see you in database yet.\nFirst use /dodaj (registers account), then /estado.",
      
      link_not_found: "Couldn't find link with ID <b>{id}</b> ACTIVADO tus account. Use /lista.",
      no_links: "You don't have any enlaces yet.",
      
      usage_usun: "Provide link ID, e.g.:\n<code>/usun 18</code>",
      usage_najnowsze: "Usage: <code>/najnowsze [ID]</code>\nWithout ID: all enlaces\nWith ID: specific link\n\nExamples:\n<code>/najnowsze</code>\n<code>/najnowsze 18</code>",
      usage_najtansze: "Usage: <code>/najtansze [ID]</code>\nWithout ID: all enlaces\nWith ID: specific link\n\nExamples:\n<code>/najtansze</code>\n<code>/najtansze 18</code>",
      usage_dodaj: "Usage:\n<code>/dodaj &lt;url&gt; [name]</code>\n\nExample:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      
      max_usage: "Usage: /max &lt;ID&gt; &lt;valor&gt; o /max &lt;ID&gt; off\n\nEjemplos:\n<code>/max 18 3</code> — límite de 3 artículos por ciclo\n<code>/max 18 off</code> — eliminar límite",
      max_invalid_id: "❌ ID de enlace inválido. Usa un número, por ejemplo /max 18 5",
      max_invalid_value: "❌ Valor inválido. Debe ser un número entre 1 y 100 o 'off'.",
      max_disabled: "✅ Límite por enlace desactivado para enlace <b>{id}</b> ({name}).",
      max_set: "✅ Límite por enlace establecido en <b>{value}</b> artículos por ciclo para enlace <b>{id}</b> ({name}).",
      
      error_panel: "❌ Failed hasta generate panel link.\n\nrequestId: {requestId}",
      error_payment_config: "❌ Payment configuration error.\n\nrequestId: {requestId}",
      error_addon_config: "❌ Addon configuration error.\n\nrequestId: {requestId}",
      error_no_purchase: "❌ No opciones de compra available.",
      error_payment_create: "❌ Error creating payment.\n\nrequestId: {requestId}",
      error_lista: "❌ Error fetching link lista.",
      
      lista_empty: "Aún no tienes enlaces activos.\n\nAñade tu primer enlace: /dodaj <url> [nombre]",
      lista_title: "📋 Tus enlaces monitoreados",
      lista_disable: "Para desactivar el monitoreo de un enlace:",
      
      error_usun: "❌ Error disabling link.",
      error_dodaj: "❌ Error adding link.",
      error_status: "❌ Error fetching estado.",
      error_stripe_not_configured: "❌ Stripe not configured.\n\nrequestId: {requestId}",
      error_addon_not_configured: "❌ No configuration for addon.\n\nrequestId: {requestId}",
    },
    
    // /dodaj specific messages
    dodaj: {
      invalid_url: "First parameter must be a valid URL, e.g.:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      trial_expired: "⏰ tus Trial Plan has expired.\nMonitoring in Trial is no longer available.\n\nTo continue using the bot, choose a paid Plan (Starter / Growth / Platinum).",
      plan_expired: "⏰ tus Plan has expired.\nTo agregar nuevo enlaces y resume monitoreo, renew tus Plan in the customer panel.",
      no_active_plan_trial_used: "You don't have an activos Plan with link monitoreo.\nTrial has already been used. Purchase Starter / Growth / Platinum Plan.",
      no_active_plan_trial_available: "You don't have an activos Plan with link monitoreo.\nYou can start a one-time Trial (3 days / 5 enlaces) o choose Starter / Growth / Platinum Plan.",
      success: "✅ Added new link for monitoreo:\n\nID <b>{id}</b> — {name}\n<code>{url}</code>\n\nActive enlaces: {active}/{limit}\n\nCheck enlaces with: <code>/lista</code>",
      no_name: "(no name)",
    },
    
    // /najnowsze specific
    najnowsze: {
      header: "🧾 Newest offers\n<b>{name}</b> <i>(ID {id})</i>\n",
      no_history: "\nNo saved history for this link yet.",
      no_title: "(no title)",
      truncated: "… (truncated – message length limit)\n",
      link_not_found_detail: "Can't see link <b>{id}</b> ACTIVADO tus account. Check <code>/lista</code>.",
    },
    
    // Notifications
    notif: {
      enabled: "✅ notificaciones activado para este chat.",
      disabled: "⛔ notificaciones DESACTIVADO para este chat.",
      mode_single: "📨 Modo establecer: <b>individual</b> (default para este chat).",
      mode_batch: "📦 Modo establecer: <b>lote</b> (default para este chat).",
    },
    
    // Quiet hours
    quiet: {
      status_on: "🌙 Horas silenciosas: <b>activado</b>, hours {from}:00–{to}:00",
      status_off: "🌙 Horas silenciosas: <b>DESACTIVADO</b>.\nSet: <code>/cisza 22-7</code>",
      usage: "Provide range as HH-HH, e.g. <code>/cisza 22-7</code>",
      invalid_hours: "Hours must be in range 0–23, e.g. <code>/cisza 22-7</code>",
      set: "🌙 Horas silenciosas establecer: <b>{from}:00–{to}:00</b>",
      disabled: "🌙 Horas silenciosas <b>DESACTIVADO</b>.",
      disabled_alt: "🌙 Horas silenciosas: <b>DESACTIVADO</b>",
    },
    
    // Lista
    lista: {
      header: "📋 activos monitoreados enlaces:\n\n",
      footer: "desactivar: <code>/usun ID</code>\ne.g. <code>/usun 18</code>",
      no_name: "(no name)",
    },
    
    // Usun
    usun: {
      success: "✅ Stopped monitoreo link:\n\n",
      footer: "You can re-activar it in the panel o add it again as a new search.",
    },
    
    // Najnowsze
    najnowsze: {
      header: "🆕 Newest items para el enlace ID <b>{id}</b>",
      no_history: "No saved history for this link yet.",
    },
    
    // Status
    status: {
      title: "ℹ️ bot estado",
      plan: "Plan: {name} (hasta {exp})",
      plan_with_addons: "Plan: {name} (hasta {exp})\nMódulos (+10 enlaces cada uno): {addons}",
      links_enabled: "Búsquedas activas (activadas): {enabled}/{limit}",
      links_total: "Búsquedas totales (en la base): {total}/{limit}",
      daily_limit: "Límite diario de notificaciones: {limit}",
      notif_enabled: "✅ Notificaciones activadas",
      notif_disabled: "⛔ Notificaciones DESACTIVADAS",
      notif_mode: "Modo predeterminado para este chat: {mode}",
      notif_daily: "Notificaciones de hoy: {daily}/{limit}",
      chat_line_enabled: "✅ Notificaciones activadas\nModo predeterminado para este chat: {mode}\nNotificaciones de hoy: {daily}/{limit}",
      chat_line_disabled: "⛔ Notificaciones DESACTIVADAS\nModo predeterminado para este chat: {mode}\nNotificaciones de hoy: {daily}/{limit}",
      quiet_on: "Horas silenciosas: activado ({from}:00–{to}:00)",
      quiet_off: "Horas silenciosas: DESACTIVADO",
      per_link_hint: "Comandos: /ACTIVADO /DESACTIVADO /individual /lote\nPor enlace: /individual <ID> /lote <ID> /off <ID> /on <ID>",
      no_links: "No hay búsquedas activas.",
      links_header: "Lista de búsquedas:",
      unknown: "(error)",
    },
    
    // Notification modes
    mode: {
      single: "individual",
      batch: "agrupado",
      off: "desactivado",
    },
    
    // Language
    lang: {
      current: "🌍 Current Idioma: <b>{name}</b>",
      available: "Available languages:",
      unknown: "❌ desconocido Idioma. compatible: {list}",
      confirm: "✅ Idioma changed hasta: <b>{name}</b>",
      unknown_language: "desconocido Idioma.",
    },
    
    // Payments & plans
    payment: {
      panel_link: "🧭 <b>panel</b>\n\nLink hasta panel (valid for {minutes} minutes, one-time use):\n\n{url}\n\n⚠️ <i>Link is valid SOLO for {minutes} minutes y can be used SOLO once.</i>",
      platinum_addon: "📋 <b>tus Plan: Platinum</b>\n⏰ <b>Valid until:</b> {expiryDate}\n🔗 <b>enlaces limit:</b> {totalLinks}{addonText}\n\n<b>Add +10 enlaces (addon):</b>\n\n{url}\n\n⚠️ <i>Link leads hasta secure Stripe payment.</i>",
      platinum_addon_packages: " (+{count} addon packages)",
      plans_list: "💳 <b>Available subscription Planes</b>\n\nYour current Plan: <b>{planLabel}</b>\n\n{url}",
      plans_list_keyboard: "💳 <b>Available subscription Planes</b>\n\nYour current Plan: <b>{planLabel}</b>\n\nChoose Plan:",
      addon_checkout: "💎 <b>Addon: +10 enlaces</b>\n\nGo hasta payment:\n{url}\n\n<i>requestId: {requestId}</i>",
      addon_button: "✓ Addon +10 enlaces",
      error_config: "❌ Configuration error",
      error_payment: "❌ Payment creation error.\n\nrequestId: {requestId}",
      checkout_url: "💳 <b>Plan: {planCode}</b>\n\nGo hasta payment:\n{url}\n\n<i>requestId: {requestId}</i>",
    },
    
    // Callbacks
    callback: {
      no_chat_data: "No chat/user data.",
      mode_set: "establecer: {mode}",
      mode_set_failed: "❌ Failed hasta establecer Modo.",
      link_mode_set: "✅ Link <b>{linkId}</b> en este chat establecer hasta: <b>{mode}</b>",
    },
    
    // Admin
    admin: {
      reset_success: "✅ Admin reset done for TG {tgId}. Chats updated: {chats}. activos enlaces reset: {links}. Since={since}",
      no_telegram_id: "Failed hasta determine tus Telegram ID. Try again.",
    },
    
    // General
    general: {
      unknown_command: "❓ desconocido command. Use /help.",
    },
    
    // /najtansze (cheapest sent offers)
    najtansze: {
      header_per_link: "💰 más barato enviado offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "💰 más barato enviado offers (since {since})",
      no_history_per_link: "No sent offers with price para el enlace <b>{id}</b> since {since}.",
      no_history_global: "No sent offers with price since {since}.",
      footer: "Full history:",
    },
    
    // Enhanced najnowsze (newest sent offers)
    najnowsze_enhanced: {
      header_per_link: "🧾 más reciente enviado offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "🧾 más reciente enviado offers (since {since})",
      no_history_per_link: "No sent offers para el enlace <b>{id}</b> since {since}.",
      no_history_global: "No sent offers since {since}.",
      footer: "Full history:",
      no_title: "(no title)",
    },
  },

  pt: {
    // Commands
    cmd: {
      help_greeting: "👋 Olá! Este é FindYourDeal bot.",
      help_basic: "Comandos básicos:",
      help_basic_lista: "/lista – mostrar seus ativos monitorados Links",
      help_basic_usun: "/usun &lt;ID&gt; – desativar monitoramento para o link ID",
      help_basic_dodaj: "/dodaj &lt;url&gt; [name] – adicionar novo link para monitorar",
      help_basic_status: "/status – bot status, plano, e notificações",
      help_basic_panel: "/painel – abrir gerenciamento painel",
      help_notif: "PUSH notificações neste chat:",
      help_notif_on: "/ATIVADO – ativar",
      help_notif_off: "/DESATIVADO – desativar",
      help_notif_single: "/pojedyncze – individual cartões",
      help_notif_batch: "/zbiorcze – lote lista",
      help_perlink: "Modo por link (APENAS neste chat):",
      help_perlink_commands: "/pojedyncze <ID>, /zbiorcze <ID>, /off <ID>, /on <ID> (e.g. /zbiorcze 18)",
      help_perlink_max: "/max &lt;ID&gt; &lt;valor&gt; – limite por ciclo (e.g. /max 18 3 or /max 18 off)",
      help_quiet: "Silêncio hours:",
      help_quiet_show: "/cisza – mostrar",
      help_quiet_set: "/cisza HH-HH – definir (e.g. /cisza 22-7)",
      help_quiet_off: "/cisza_off – desativar",
      help_history: "Histórico enviado:",
      help_history_najnowsze: "/najnowsze – mais recente enviado neste chat",
      help_history_najnowsze_id: "/najnowsze &lt;ID&gt; – mais recente enviado para o link",
      help_history_najtansze: "/najtansze – mais barato enviado neste chat",
      help_history_najtansze_id: "/najtansze &lt;ID&gt; – mais barato enviado para o link",
      help_examples: "Exemplos:",
      help_examples_text: "<code>/lista</code>\n<code>/remover 18</code>\n<code>/adicionar https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>\n<code>/recentes 18</code>",
      
      // Dynamic help descriptions (PT)
      help_basic_name: "nome",
      help_basic_lista_desc: "– mostrar seus links monitorados ativos",
      help_basic_usun_desc: "– desativar o monitoramento para o ID do link",
      help_basic_dodaj_desc: "– adicionar um novo link para monitorar",
      help_basic_status_desc: "– status do bot, plano e notificações",
      help_basic_panel_desc: "– abrir o painel de gerenciamento",
      help_basic_nazwa_desc: "– renomear o link (ou /{nazwa} ID – para limpar)",
      help_notif_on_desc: "– ativar",
      help_notif_off_desc: "– desativar",
      help_notif_single_desc: "– cartões individuais",
      help_notif_batch_desc: "– lista em lote",
      help_value: "valor",
      help_perlink_max_desc: "– limitar itens por ciclo (ex. /max 18 3 ou /max 18 off)",
      help_quiet_show_desc: "– mostrar",
      help_quiet_set_desc: "– definir (ex. /silencio 22-7)",
      help_quiet_off_desc: "– desativar",
      help_history_najnowsze_desc: "– mais recentes enviados neste chat",
      help_history_najnowsze_id_desc: "– mais recentes enviados para o link",
      help_history_najtansze_desc: "– mais baratos enviados neste chat",
      help_history_najtansze_id_desc: "– mais baratos enviados para o link",
      help_plans_show_desc: "– mostrar planos disponíveis e opções de compra",
      help_code: "código",
      help_lang_set_desc: "– definir idioma (ex. /lang en, /lang pt)",
      
      help: "Available commands:\n/start - Start bot\n/help - mostrar help\n/dodaj - Add search\n/usun - Remove search\n/lista - lista searches\n/status - mostrar status\n/ativar - ativar notificações\n/desativar - desativar notificações\n/pojedyncze - individual Modo\n/zbiorcze - lote Modo\n/cisza - definir Silêncio hours\n/cisza_off - desativar Silêncio hours\n/najnowsze [ID] - mostrar newest items\n/najtansze [ID] - mostrar cheapest items\n/plany - mostrar Planos\n/painel - Get painel link\n/lang - Change Idioma",
      
      help_admin_text: "🔒 <b>FindYourDeal — Comandos Admin</b>\n\n<b>ADMIN</b>\n\n/ajuda_admin — mostrar esta ajuda admin\n\n/tech &lt;telegram_user_id&gt; — mostrar mapeamento Telegram → user_id (diagnósticos)\n\n/debug — diagnósticos bot (build, hash, uptime, conexão DB)\n\n/debug_worker_links — listar links realmente digitalizados pelo worker (max 50)\n\n/reset_dia &lt;telegram_user_id&gt; — resetar contador diário notificações/itens (global, desde meia-noite hora local)\n\n/auditoria &lt;telegram_user_id&gt; [limit] — mostrar registro auditoria admin para usuário (padrão: últimas 20 entradas)\n\n<b>SUPERADMIN</b>\n\n/dar_admin &lt;telegram_user_id&gt; — conceder função ADMIN\n\n/apagar_usuario &lt;telegram_user_id&gt; — apagar usuário e todos os dados (links, chats, ofertas) — IRREVERSÍVEL",
      
      unauthorized: "❌ Unauthorized (admin APENAS).",
      provide_id: "❌ Provide Telegram ID: /admin_reset &lt;telegram_id&gt;",
      user_not_found: "❌ User not found for Telegram ID {id}",
      user_not_in_db: "Can't see you in database. Use /start ou /dodaj.",
      user_not_registered: "Can't see you in database yet.\nFirst use /dodaj (registers account), then /status.",
      
      link_not_found: "Couldn't find link with ID <b>{id}</b> ATIVADO seus account. Use /lista.",
      no_links: "You don't have any Links yet.",
      
      usage_usun: "Provide link ID, e.g.:\n<code>/usun 18</code>",
      usage_najnowsze: "Usage: <code>/najnowsze [ID]</code>\nWithout ID: all Links\nWith ID: specific link\n\nExamples:\n<code>/najnowsze</code>\n<code>/najnowsze 18</code>",
      usage_najtansze: "Usage: <code>/najtansze [ID]</code>\nWithout ID: all Links\nWith ID: specific link\n\nExamples:\n<code>/najtansze</code>\n<code>/najtansze 18</code>",
      usage_dodaj: "Usage:\n<code>/dodaj &lt;url&gt; [name]</code>\n\nExample:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      
      max_usage: "Usage: /max &lt;ID&gt; &lt;valor&gt; ou /max &lt;ID&gt; off\n\nExemplos:\n<code>/max 18 3</code> — limite de 3 itens por ciclo\n<code>/max 18 off</code> — remover limite",
      max_invalid_id: "❌ ID de link inválido. Use um número, por exemplo /max 18 5",
      max_invalid_value: "❌ Valor inválido. Deve ser um número entre 1 e 100 ou 'off'.",
      max_disabled: "✅ Limite por link desativado para link <b>{id}</b> ({name}).",
      max_set: "✅ Limite por link definido para <b>{value}</b> itens por ciclo para link <b>{id}</b> ({name}).",
      
      error_panel: "❌ Failed até generate painel link.\n\nrequestId: {requestId}",
      error_payment_config: "❌ Payment configuration error.\n\nrequestId: {requestId}",
      error_addon_config: "❌ Addon configuration error.\n\nrequestId: {requestId}",
      error_no_purchase: "❌ No opções de compra available.",
      error_payment_create: "❌ Error creating payment.\n\nrequestId: {requestId}",
      error_lista: "❌ Error fetching link lista.",
      
      lista_empty: "Você ainda não tem links ativos.\n\nAdicione seu primeiro link: /dodaj <url> [nome]",
      lista_title: "📋 Seus links monitorados",
      lista_disable: "Para desativar o monitoramento de um link:",
      
      error_usun: "❌ Error disabling link.",
      error_dodaj: "❌ Error adding link.",
      error_status: "❌ Error fetching status.",
      error_stripe_not_configured: "❌ Stripe not configured.\n\nrequestId: {requestId}",
      error_addon_not_configured: "❌ No configuration for addon.\n\nrequestId: {requestId}",
    },
    
    // /dodaj specific messages
    dodaj: {
      invalid_url: "First parameter must be a valid URL, e.g.:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      trial_expired: "⏰ seus Trial plano has expired.\nMonitoring in Trial is no longer available.\n\nTo continue using the bot, choose a paid plano (Starter / Growth / Platinum).",
      plan_expired: "⏰ seus plano has expired.\nTo adicionar novo Links e resume monitoramento, renew seus plano in the customer painel.",
      no_active_plan_trial_used: "You don't have an ativos plano with link monitoramento.\nTrial has already been used. Purchase Starter / Growth / Platinum plano.",
      no_active_plan_trial_available: "You don't have an ativos plano with link monitoramento.\nYou can start a one-time Trial (3 days / 5 Links) ou choose Starter / Growth / Platinum plano.",
      success: "✅ Added new link for monitoramento:\n\nID <b>{id}</b> — {name}\n<code>{url}</code>\n\nActive Links: {active}/{limit}\n\nCheck Links with: <code>/lista</code>",
      no_name: "(no name)",
    },
    
    // /najnowsze specific
    najnowsze: {
      header: "🧾 Newest offers\n<b>{name}</b> <i>(ID {id})</i>\n",
      no_history: "\nNo saved history for this link yet.",
      no_title: "(no title)",
      truncated: "… (truncated – message length limit)\n",
      link_not_found_detail: "Can't see link <b>{id}</b> ATIVADO seus account. Check <code>/lista</code>.",
    },
    
    // Notifications
    notif: {
      enabled: "✅ notificações ativado para este chat.",
      disabled: "⛔ notificações DESATIVADO para este chat.",
      mode_single: "📨 Modo definir: <b>individual</b> (default para este chat).",
      mode_batch: "📦 Modo definir: <b>lote</b> (default para este chat).",
    },
    
    // Quiet hours
    quiet: {
      status_on: "🌙 Silêncio hours: <b>ativado</b>, hours {from}:00–{to}:00",
      status_off: "🌙 Silêncio hours: <b>DESATIVADO</b>.\nSet: <code>/cisza 22-7</code>",
      usage: "Provide range as HH-HH, e.g. <code>/cisza 22-7</code>",
      invalid_hours: "Hours must be in range 0–23, e.g. <code>/cisza 22-7</code>",
      set: "🌙 Silêncio hours definir: <b>{from}:00–{to}:00</b>",
      disabled: "🌙 Silêncio hours <b>DESATIVADO</b>.",
      disabled_alt: "🌙 Silêncio hours: <b>DESATIVADO</b>",
    },
    
    // Lista
    lista: {
      header: "📋 ativos monitorados Links:\n\n",
      footer: "desativar: <code>/usun ID</code>\ne.g. <code>/usun 18</code>",
      no_name: "(no name)",
    },
    
    // Usun
    usun: {
      success: "✅ Stopped monitoramento link:\n\n",
      footer: "You can re-ativar it in the painel ou add it again as a new search.",
    },
    
    // Najnowsze
    najnowsze: {
      header: "🆕 Newest items para o link ID <b>{id}</b>",
      no_history: "No saved history for this link yet.",
    },
    
    // Status
    status: {
      title: "ℹ️ bot status",
      plan: "Plano: {name} (até {exp})",
      plan_with_addons: "Plano: {name} (até {exp})\nMódulos (+10 links cada): {addons}",
      links_enabled: "Pesquisas ativas (ativadas): {enabled}/{limit}",
      links_total: "Pesquisas totais (no banco): {total}/{limit}",
      daily_limit: "Limite diário de notificações: {limit}",
      notif_enabled: "✅ Notificações ativadas",
      notif_disabled: "⛔ Notificações DESATIVADAS",
      notif_mode: "Modo padrão para este chat: {mode}",
      notif_daily: "Notificações de hoje: {daily}/{limit}",
      chat_line_enabled: "✅ Notificações ativadas\nModo padrão para este chat: {mode}\nNotificações de hoje: {daily}/{limit}",
      chat_line_disabled: "⛔ Notificações DESATIVADAS\nModo padrão para este chat: {mode}\nNotificações de hoje: {daily}/{limit}",
      quiet_on: "Horário de silêncio: ativado ({from}:00–{to}:00)",
      quiet_off: "Horário de silêncio: DESATIVADO",
      per_link_hint: "Comandos: /ATIVADO /DESATIVADO /individual /lote\nPor link: /individual <ID> /lote <ID> /off <ID> /on <ID>",
      no_links: "Nenhuma pesquisa ativa.",
      links_header: "Lista de pesquisas:",
      unknown: "(erro)",
    },
    
    // Notification modes
    mode: {
      single: "individual",
      batch: "agrupado",
      off: "desactivado",
    },
    
    // Language
    lang: {
      current: "🌍 Current Idioma: <b>{name}</b>",
      available: "Available languages:",
      unknown: "❌ desconhecido Idioma. suportado: {list}",
      confirm: "✅ Idioma changed até: <b>{name}</b>",
      unknown_language: "desconhecido Idioma.",
    },
    
    // Payments & plans
    payment: {
      panel_link: "🧭 <b>painel</b>\n\nLink até painel (valid for {minutes} minutes, one-time use):\n\n{url}\n\n⚠️ <i>Link is valid APENAS for {minutes} minutes e can be used APENAS once.</i>",
      platinum_addon: "📋 <b>seus plano: Platinum</b>\n⏰ <b>Valid until:</b> {expiryDate}\n🔗 <b>Links limit:</b> {totalLinks}{addonText}\n\n<b>Add +10 Links (addon):</b>\n\n{url}\n\n⚠️ <i>Link leads até secure Stripe payment.</i>",
      platinum_addon_packages: " (+{count} addon packages)",
      plans_list: "💳 <b>Available subscription Planos</b>\n\nYour current plano: <b>{planLabel}</b>\n\n{url}",
      plans_list_keyboard: "💳 <b>Available subscription Planos</b>\n\nYour current plano: <b>{planLabel}</b>\n\nChoose plano:",
      addon_checkout: "💎 <b>Addon: +10 Links</b>\n\nGo até payment:\n{url}\n\n<i>requestId: {requestId}</i>",
      addon_button: "✓ Addon +10 Links",
      error_config: "❌ Configuration error",
      error_payment: "❌ Payment creation error.\n\nrequestId: {requestId}",
      checkout_url: "💳 <b>plano: {planCode}</b>\n\nGo até payment:\n{url}\n\n<i>requestId: {requestId}</i>",
    },
    
    // Callbacks
    callback: {
      no_chat_data: "No chat/user data.",
      mode_set: "definir: {mode}",
      mode_set_failed: "❌ Failed até definir Modo.",
      link_mode_set: "✅ Link <b>{linkId}</b> neste chat definir até: <b>{mode}</b>",
    },
    
    // Admin
    admin: {
      reset_success: "✅ Admin reset done for TG {tgId}. Chats updated: {chats}. ativos Links reset: {links}. Since={since}",
      no_telegram_id: "Failed até determine seus Telegram ID. Try again.",
    },
    
    // General
    general: {
      unknown_command: "❓ desconhecido command. Use /help.",
    },
    
    // /najtansze (cheapest sent offers)
    najtansze: {
      header_per_link: "💰 mais barato enviado offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "💰 mais barato enviado offers (since {since})",
      no_history_per_link: "No sent offers with price para o link <b>{id}</b> since {since}.",
      no_history_global: "No sent offers with price since {since}.",
      footer: "Full history:",
    },
    
    // Enhanced najnowsze (newest sent offers)
    najnowsze_enhanced: {
      header_per_link: "🧾 mais recente enviado offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "🧾 mais recente enviado offers (since {since})",
      no_history_per_link: "No sent offers para o link <b>{id}</b> since {since}.",
      no_history_global: "No sent offers since {since}.",
      footer: "Full history:",
      no_title: "(no title)",
    },
  },

  cs: {
    // Commands
    cmd: {
      help_greeting: "👋 Ahoj! Toto je FindYourDeal bot.",
      help_basic: "Základní příkazy:",
      help_basic_lista: "/lista – zobrazit tvoje aktivní monitorované odkazy",
      help_basic_usun: "/usun &lt;ID&gt; – deaktivovat monitorování pro odkaz ID",
      help_basic_dodaj: "/dodaj &lt;url&gt; [name] – přidat nový link k monitorování",
      help_basic_status: "/stav – bot stav, plán, a oznámení",
      help_basic_panel: "/panel – otevřít správa panel",
      help_notif: "PUSH oznámení na tomto chatu:",
      help_notif_on: "/ZAPNUTO – aktivovat",
      help_notif_off: "/VYPNUTO – deaktivovat",
      help_notif_single: "/pojedyncze – jednotlivé karty",
      help_notif_batch: "/zbiorcze – dávkové seznam",
      help_perlink: "Režim pro odkaz (POUZE na tomto chatu):",
      help_perlink_commands: "/pojedyncze <ID>, /zbiorcze <ID>, /off <ID>, /on <ID> (e.g. /zbiorcze 18)",
      help_perlink_max: "/max &lt;ID&gt; &lt;hodnota&gt; – limit na cyklus (e.g. /max 18 3 or /max 18 off)",
      help_quiet: "Tichý režim:",
      help_quiet_show: "/cisza – zobrazit",
      help_quiet_set: "/cisza HH-HH – nastavit (e.g. /cisza 22-7)",
      help_quiet_off: "/cisza_off – deaktivovat",
      help_history: "Historie odeslaných:",
      help_history_najnowsze: "/najnowsze – nejnovější odeslané na tomto chatu",
      help_history_najnowsze_id: "/najnowsze &lt;ID&gt; – nejnovější odeslané pro odkaz",
      help_history_najtansze: "/najtansze – nejlevnější odeslané na tomto chatu",
      help_history_najtansze_id: "/najtansze &lt;ID&gt; – nejlevnější odeslané pro odkaz",
      help_examples: "Příklady:",
      help_examples_text: "<code>/seznam</code>\n<code>/odstranit 18</code>\n<code>/pridat https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>\n<code>/nejnovejsi 18</code>",
      
      // Dynamic help descriptions (CS)
      help_basic_name: "název",
      help_basic_lista_desc: "– zobrazit vaše aktivní monitorované odkazy",
      help_basic_usun_desc: "– deaktivovat monitorování pro ID odkazu",
      help_basic_dodaj_desc: "– přidat nový odkaz k monitorování",
      help_basic_status_desc: "– stav bota, plán a oznámení",
      help_basic_panel_desc: "– otevřít panel správy",
      help_basic_nazwa_desc: "– přejmenovat odkaz (nebo /{nazwa} ID – pro vymazání)",
      help_notif_on_desc: "– aktivovat",
      help_notif_off_desc: "– deaktivovat",
      help_notif_single_desc: "– jednotlivé karty",
      help_notif_batch_desc: "– dávkový seznam",
      help_value: "hodnota",
      help_perlink_max_desc: "– omezit položky na cyklus (např. /max 18 3 nebo /max 18 off)",
      help_quiet_show_desc: "– zobrazit",
      help_quiet_set_desc: "– nastavit (např. /ticho 22-7)",
      help_quiet_off_desc: "– deaktivovat",
      help_history_najnowsze_desc: "– nejnovější odeslané na tomto chatu",
      help_history_najnowsze_id_desc: "– nejnovější odeslané pro odkaz",
      help_history_najtansze_desc: "– nejlevnější odeslané na tomto chatu",
      help_history_najtansze_id_desc: "– nejlevnější odeslané pro odkaz",
      help_plans_show_desc: "– zobrazit dostupné plány a možnosti nákupu",
      help_code: "kód",
      help_lang_set_desc: "– nastavit jazyk (např. /lang en, /lang cs)",
      
      help: "Available commands:\n/start - Start bot\n/help - zobrazit help\n/dodaj - Add search\n/usun - Remove search\n/lista - seznam searches\n/stav - zobrazit stav\n/zapnout - aktivovat oznámení\n/vypnout - deaktivovat oznámení\n/pojedyncze - jednotlivé Režim\n/zbiorcze - dávkové Režim\n/cisza - nastavit Tichý režim\n/cisza_off - deaktivovat Tichý režim\n/najnowsze [ID] - zobrazit newest items\n/najtansze [ID] - zobrazit cheapest items\n/plany - zobrazit Plány\n/panel - Get panel link\n/lang - Change Jazyk",
      
      help_admin_text: "🔒 <b>FindYourDeal — Příkazy Admin</b>\n\n<b>ADMIN</b>\n\n/napoveda_admin — zobrazit tuto admin nápovědu\n\n/technik &lt;telegram_user_id&gt; — zobrazit mapování Telegram → user_id (diagnostika)\n\n/debug — diagnostika bota (build, hash, uptime, připojení DB)\n\n/debug_worker_links — vypsat odkazy skutečně skenované workerem (max 50)\n\n/reset_den &lt;telegram_user_id&gt; — resetovat denní počítadlo oznámení/položek (globální, od půlnoci místní čas)\n\n/audit &lt;telegram_user_id&gt; [limit] — zobrazit záznam auditu admin pro uživatele (výchozí: posledních 20 záznamů)\n\n<b>SUPERADMIN</b>\n\n/dej_admina &lt;telegram_user_id&gt; — udělit roli ADMIN\n\n/smazat_uzivatele &lt;telegram_user_id&gt; — smazat uživatele a všechna data (odkazy, chaty, nabídky) — NEVRATNÉ",
      
      unauthorized: "❌ Unauthorized (admin POUZE).",
      provide_id: "❌ Provide Telegram ID: /admin_reset &lt;telegram_id&gt;",
      user_not_found: "❌ User not found for Telegram ID {id}",
      user_not_in_db: "Can't see you in database. Use /start nebo /dodaj.",
      user_not_registered: "Can't see you in database yet.\nFirst use /dodaj (registers account), then /stav.",
      
      link_not_found: "Couldn't find link with ID <b>{id}</b> ZAPNUTO tvoje account. Use /lista.",
      no_links: "You don't have any odkazy yet.",
      
      usage_usun: "Provide link ID, e.g.:\n<code>/usun 18</code>",
      usage_najnowsze: "Usage: <code>/najnowsze [ID]</code>\nWithout ID: all odkazy\nWith ID: specific link\n\nExamples:\n<code>/najnowsze</code>\n<code>/najnowsze 18</code>",
      usage_najtansze: "Usage: <code>/najtansze [ID]</code>\nWithout ID: all odkazy\nWith ID: specific link\n\nExamples:\n<code>/najtansze</code>\n<code>/najtansze 18</code>",
      usage_dodaj: "Usage:\n<code>/dodaj &lt;url&gt; [name]</code>\n\nExample:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      
      max_usage: "Použití: /max &lt;ID&gt; &lt;hodnota&gt; nebo /max &lt;ID&gt; off\n\nPříklady:\n<code>/max 18 3</code> — limit 3 položky na cyklus\n<code>/max 18 off</code> — odebrat limit",
      max_invalid_id: "❌ Neplatné ID odkazu. Použijte číslo, např. /max 18 5",
      max_invalid_value: "❌ Neplatná hodnota. Musí být číslo mezi 1 a 100 nebo 'off'.",
      max_disabled: "✅ Limit per odkaz vypnut pro odkaz <b>{id}</b> ({name}).",
      max_set: "✅ Limit per odkaz nastaven na <b>{value}</b> položek na cyklus pro odkaz <b>{id}</b> ({name}).",
      
      error_panel: "❌ Failed do generate panel link.\n\nrequestId: {requestId}",
      error_payment_config: "❌ Payment configuration error.\n\nrequestId: {requestId}",
      error_addon_config: "❌ Addon configuration error.\n\nrequestId: {requestId}",
      error_no_purchase: "❌ No možnosti nákupu available.",
      error_payment_create: "❌ Error creating payment.\n\nrequestId: {requestId}",
      error_lista: "❌ Error fetching link seznam.",
      
      lista_empty: "Ještě nemáte žádné aktivní odkazy.\n\nPřidejte svůj první odkaz: /dodaj <url> [název]",
      lista_title: "📋 Vaše monitorované odkazy",
      lista_disable: "Pro deaktivaci monitorování odkazu:",
      
      error_usun: "❌ Error disabling link.",
      error_dodaj: "❌ Error adding link.",
      error_status: "❌ Error fetching stav.",
      error_stripe_not_configured: "❌ Stripe not configured.\n\nrequestId: {requestId}",
      error_addon_not_configured: "❌ No configuration for addon.\n\nrequestId: {requestId}",
    },
    
    // /dodaj specific messages
    dodaj: {
      invalid_url: "First parameter must be a valid URL, e.g.:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      trial_expired: "⏰ tvoje Trial plán has expired.\nMonitoring in Trial is no longer available.\n\nTo continue using the bot, choose a paid plán (Starter / Growth / Platinum).",
      plan_expired: "⏰ tvoje plán has expired.\nTo přidat nový odkazy a resume monitorování, renew tvoje plán in the customer panel.",
      no_active_plan_trial_used: "You don't have an aktivní plán with link monitorování.\nTrial has already been used. Purchase Starter / Growth / Platinum plán.",
      no_active_plan_trial_available: "You don't have an aktivní plán with link monitorování.\nYou can start a one-time Trial (3 days / 5 odkazy) nebo choose Starter / Growth / Platinum plán.",
      success: "✅ Added new link for monitorování:\n\nID <b>{id}</b> — {name}\n<code>{url}</code>\n\nActive odkazy: {active}/{limit}\n\nCheck odkazy with: <code>/lista</code>",
      no_name: "(no name)",
    },
    
    // /najnowsze specific
    najnowsze: {
      header: "🧾 Newest offers\n<b>{name}</b> <i>(ID {id})</i>\n",
      no_history: "\nNo saved history for this link yet.",
      no_title: "(no title)",
      truncated: "… (truncated – message length limit)\n",
      link_not_found_detail: "Can't see link <b>{id}</b> ZAPNUTO tvoje account. Check <code>/lista</code>.",
    },
    
    // Notifications
    notif: {
      enabled: "✅ oznámení aktivováno pro tento chat.",
      disabled: "⛔ oznámení DEAKTIVOVÁNO pro tento chat.",
      mode_single: "📨 Režim nastavit: <b>jednotlivé</b> (default pro tento chat).",
      mode_batch: "📦 Režim nastavit: <b>dávkové</b> (default pro tento chat).",
    },
    
    // Quiet hours
    quiet: {
      status_on: "🌙 Tichý režim: <b>aktivováno</b>, hours {from}:00–{to}:00",
      status_off: "🌙 Tichý režim: <b>DEAKTIVOVÁNO</b>.\nSet: <code>/cisza 22-7</code>",
      usage: "Provide range as HH-HH, e.g. <code>/cisza 22-7</code>",
      invalid_hours: "Hours must be in range 0–23, e.g. <code>/cisza 22-7</code>",
      set: "🌙 Tichý režim nastavit: <b>{from}:00–{to}:00</b>",
      disabled: "🌙 Tichý režim <b>DEAKTIVOVÁNO</b>.",
      disabled_alt: "🌙 Tichý režim: <b>DEAKTIVOVÁNO</b>",
    },
    
    // Lista
    lista: {
      header: "📋 aktivní monitorované odkazy:\n\n",
      footer: "deaktivovat: <code>/usun ID</code>\ne.g. <code>/usun 18</code>",
      no_name: "(no name)",
    },
    
    // Usun
    usun: {
      success: "✅ Stopped monitorování link:\n\n",
      footer: "You can re-aktivovat it in the panel nebo add it again as a new search.",
    },
    
    // Najnowsze
    najnowsze: {
      header: "🆕 Newest items pro odkaz ID <b>{id}</b>",
      no_history: "No saved history for this link yet.",
    },
    
    // Status
    status: {
      title: "ℹ️ bot stav",
      plan: "Plán: {name} (do {exp})",
      plan_with_addons: "Plán: {name} (do {exp})\nModuly (+10 odkazů každý): {addons}",
      links_enabled: "Aktivní vyhledávání (aktivováno): {enabled}/{limit}",
      links_total: "Celkem vyhledávání (v databázi): {total}/{limit}",
      daily_limit: "Denní limit oznámení: {limit}",
      notif_enabled: "✅ Oznámení aktivována",
      notif_disabled: "⛔ Oznámení DEAKTIVOVÁNA",
      notif_mode: "Výchozí režim pro tento chat: {mode}",
      notif_daily: "Dnešní oznámení: {daily}/{limit}",
      chat_line_enabled: "✅ Oznámení aktivována\nVýchozí režim pro tento chat: {mode}\nDnešní oznámení: {daily}/{limit}",
      chat_line_disabled: "⛔ Oznámení DEAKTIVOVÁNA\nVýchozí režim pro tento chat: {mode}\nDnešní oznámení: {daily}/{limit}",
      quiet_on: "Tichý režim: aktivováno ({from}:00–{to}:00)",
      quiet_off: "Tichý režim: DEAKTIVOVÁNO",
      per_link_hint: "Příkazy: /ZAPNUTO /VYPNUTO /jednotlivé /dávkové\nNa odkaz: /jednotlive <ID> /davkove <ID> /off <ID> /on <ID>",
      no_links: "Žádné aktivní vyhledávání.",
      links_header: "Seznam vyhledávání:",
      unknown: "(chyba)",
    },
    
    // Notification modes
    mode: {
      single: "jednotlivé",
      batch: "dávka",
      off: "vypnuto",
    },
    
    // Language
    lang: {
      current: "🌍 Current Jazyk: <b>{name}</b>",
      available: "Available languages:",
      unknown: "❌ neznámý Jazyk. podporovaný: {list}",
      confirm: "✅ Jazyk changed do: <b>{name}</b>",
      unknown_language: "neznámý Jazyk.",
    },
    
    // Payments & plans
    payment: {
      panel_link: "🧭 <b>panel</b>\n\nLink do panel (valid for {minutes} minutes, one-time use):\n\n{url}\n\n⚠️ <i>Link is valid POUZE for {minutes} minutes a can be used POUZE once.</i>",
      platinum_addon: "📋 <b>tvoje plán: Platinum</b>\n⏰ <b>Valid until:</b> {expiryDate}\n🔗 <b>odkazy limit:</b> {totalLinks}{addonText}\n\n<b>Add +10 odkazy (addon):</b>\n\n{url}\n\n⚠️ <i>Link leads do secure Stripe payment.</i>",
      platinum_addon_packages: " (+{count} addon packages)",
      plans_list: "💳 <b>Available subscription Plány</b>\n\nYour current plán: <b>{planLabel}</b>\n\n{url}",
      plans_list_keyboard: "💳 <b>Available subscription Plány</b>\n\nYour current plán: <b>{planLabel}</b>\n\nChoose plán:",
      addon_checkout: "💎 <b>Addon: +10 odkazy</b>\n\nGo do payment:\n{url}\n\n<i>requestId: {requestId}</i>",
      addon_button: "✓ Addon +10 odkazy",
      error_config: "❌ Configuration error",
      error_payment: "❌ Payment creation error.\n\nrequestId: {requestId}",
      checkout_url: "💳 <b>plán: {planCode}</b>\n\nGo do payment:\n{url}\n\n<i>requestId: {requestId}</i>",
    },
    
    // Callbacks
    callback: {
      no_chat_data: "No chat/user data.",
      mode_set: "nastavit: {mode}",
      mode_set_failed: "❌ Failed do nastavit Režim.",
      link_mode_set: "✅ Link <b>{linkId}</b> na tomto chatu nastavit do: <b>{mode}</b>",
    },
    
    // Admin
    admin: {
      reset_success: "✅ Admin reset done for TG {tgId}. Chats updated: {chats}. aktivní odkazy reset: {links}. Since={since}",
      no_telegram_id: "Failed do determine tvoje Telegram ID. Try again.",
    },
    
    // General
    general: {
      unknown_command: "❓ neznámý command. Use /help.",
    },
    
    // /najtansze (cheapest sent offers)
    najtansze: {
      header_per_link: "💰 nejlevnější odeslané offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "💰 nejlevnější odeslané offers (since {since})",
      no_history_per_link: "No sent offers with price pro odkaz <b>{id}</b> since {since}.",
      no_history_global: "No sent offers with price since {since}.",
      footer: "Full history:",
    },
    
    // Enhanced najnowsze (newest sent offers)
    najnowsze_enhanced: {
      header_per_link: "🧾 nejnovější odeslané offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "🧾 nejnovější odeslané offers (since {since})",
      no_history_per_link: "No sent offers pro odkaz <b>{id}</b> since {since}.",
      no_history_global: "No sent offers since {since}.",
      footer: "Full history:",
      no_title: "(no title)",
    },
  },

  sk: {
    // Commands
    cmd: {
      help_greeting: "👋 Ahoj! Toto je FindYourDeal bot.",
      help_basic: "Základné príkazy:",
      help_basic_lista: "/lista – zobraziť tvoje aktívne monitorované odkazy",
      help_basic_usun: "/usun &lt;ID&gt; – deaktivovať monitorovanie pre odkaz ID",
      help_basic_dodaj: "/dodaj &lt;url&gt; [name] – pridať nový link na monitorovanie",
      help_basic_status: "/stav – bot stav, plán, a upozornenia",
      help_basic_panel: "/panel – otvoriť správa panel",
      help_notif: "PUSH upozornenia na tomto chate:",
      help_notif_on: "/ZAPNUTÉ – aktivovať",
      help_notif_off: "/VYPNUTÉ – deaktivovať",
      help_notif_single: "/pojedyncze – jednotlivé karty",
      help_notif_batch: "/zbiorcze – dávkové zoznam",
      help_perlink: "Režim pre odkaz (IBA na tomto chate):",
      help_perlink_commands: "/pojedyncze <ID>, /zbiorcze <ID>, /off <ID>, /on <ID> (e.g. /zbiorcze 18)",
      help_perlink_max: "/max &lt;ID&gt; &lt;hodnota&gt; – limit na cyklus (e.g. /max 18 3 or /max 18 off)",
      help_quiet: "Tichý režim:",
      help_quiet_show: "/cisza – zobraziť",
      help_quiet_set: "/cisza HH-HH – nastaviť (e.g. /cisza 22-7)",
      help_quiet_off: "/cisza_off – deaktivovať",
      help_history: "História odoslaných:",
      help_history_najnowsze: "/najnowsze – najnovšie odoslané na tomto chate",
      help_history_najnowsze_id: "/najnowsze &lt;ID&gt; – najnovšie odoslané pre odkaz",
      help_history_najtansze: "/najtansze – najlacnejšie odoslané na tomto chate",
      help_history_najtansze_id: "/najtansze &lt;ID&gt; – najlacnejšie odoslané pre odkaz",
      help_examples: "Príklady:",
      help_examples_text: "<code>/zoznam</code>\n<code>/odstranit 18</code>\n<code>/pridat https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>\n<code>/najnovsie 18</code>",
      
      // Dynamic help descriptions (SK)
      help_basic_name: "názov",
      help_basic_lista_desc: "– zobraziť vaše aktívne monitorované odkazy",
      help_basic_usun_desc: "– deaktivovať monitorovanie pre ID odkazu",
      help_basic_dodaj_desc: "– pridať nový odkaz na monitorovanie",
      help_basic_status_desc: "– stav bota, plán a upozornenia",
      help_basic_panel_desc: "– otvoriť panel správy",
      help_basic_nazwa_desc: "– premenovať odkaz (alebo /{nazwa} ID – pre vymazanie)",
      help_notif_on_desc: "– aktivovať",
      help_notif_off_desc: "– deaktivovať",
      help_notif_single_desc: "– jednotlivé karty",
      help_notif_batch_desc: "– dávkový zoznam",
      help_value: "hodnota",
      help_perlink_max_desc: "– obmedziť položky na cyklus (napr. /max 18 3 alebo /max 18 off)",
      help_quiet_show_desc: "– zobraziť",
      help_quiet_set_desc: "– nastaviť (napr. /ticho 22-7)",
      help_quiet_off_desc: "– deaktivovať",
      help_history_najnowsze_desc: "– najnovšie odoslané na tomto chate",
      help_history_najnowsze_id_desc: "– najnovšie odoslané pre odkaz",
      help_history_najtansze_desc: "– najlacnejšie odoslané na tomto chate",
      help_history_najtansze_id_desc: "– najlacnejšie odoslané pre odkaz",
      help_plans_show_desc: "– zobraziť dostupné plány a možnosti nákupu",
      help_code: "kód",
      help_lang_set_desc: "– nastaviť jazyk (napr. /lang en, /lang sk)",
      
      help: "Available commands:\n/start - Start bot\n/help - zobraziť help\n/dodaj - Add search\n/usun - Remove search\n/lista - zoznam searches\n/stav - zobraziť stav\n/zapnut - aktivovať upozornenia\n/vypnut - deaktivovať upozornenia\n/pojedyncze - jednotlivé Režim\n/zbiorcze - dávkové Režim\n/cisza - nastaviť Tichý režim\n/cisza_off - deaktivovať Tichý režim\n/najnowsze [ID] - zobraziť newest items\n/najtansze [ID] - zobraziť cheapest items\n/plany - zobraziť Plány\n/panel - Get panel link\n/lang - Change Jazyk",
      
      help_admin_text: "🔒 <b>FindYourDeal — Príkazy Admin</b>\n\n<b>ADMIN</b>\n\n/pomoc_admin — zobraziť túto admin pomoc\n\n/technik &lt;telegram_user_id&gt; — zobraziť mapovanie Telegram → user_id (diagnostika)\n\n/debug — diagnostika bota (build, hash, uptime, pripojenie DB)\n\n/debug_worker_links — vypísať odkazy skutočne skenované workerom (max 50)\n\n/reset_den &lt;telegram_user_id&gt; — resetovať denný počítadlo upozornení/položiek (globálny, od polnoci miestny čas)\n\n/audit &lt;telegram_user_id&gt; [limit] — zobraziť záznam auditu admin pre používateľa (predvolený: posledných 20 záznamov)\n\n<b>SUPERADMIN</b>\n\n/daj_admina &lt;telegram_user_id&gt; — udeliť rolu ADMIN\n\n/zmazat_uzivatela &lt;telegram_user_id&gt; — zmazať používateľa a všetky dáta (odkazy, chaty, ponuky) — NEVRATNÉ",
      
      unauthorized: "❌ Unauthorized (admin IBA).",
      provide_id: "❌ Provide Telegram ID: /admin_reset &lt;telegram_id&gt;",
      user_not_found: "❌ User not found for Telegram ID {id}",
      user_not_in_db: "Can't see you in database. Use /start alebo /dodaj.",
      user_not_registered: "Can't see you in database yet.\nFirst use /dodaj (registers account), then /stav.",
      
      link_not_found: "Couldn't find link with ID <b>{id}</b> ZAPNUTÉ tvoje account. Use /lista.",
      no_links: "You don't have any odkazy yet.",
      
      usage_usun: "Provide link ID, e.g.:\n<code>/usun 18</code>",
      usage_najnowsze: "Usage: <code>/najnowsze [ID]</code>\nWithout ID: all odkazy\nWith ID: specific link\n\nExamples:\n<code>/najnowsze</code>\n<code>/najnowsze 18</code>",
      usage_najtansze: "Usage: <code>/najtansze [ID]</code>\nWithout ID: all odkazy\nWith ID: specific link\n\nExamples:\n<code>/najtansze</code>\n<code>/najtansze 18</code>",
      usage_dodaj: "Usage:\n<code>/dodaj &lt;url&gt; [name]</code>\n\nExample:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      
      max_usage: "Použitie: /max &lt;ID&gt; &lt;hodnota&gt; alebo /max &lt;ID&gt; off\n\nPríklady:\n<code>/max 18 3</code> — limit 3 položky na cyklus\n<code>/max 18 off</code> — odstrániť limit",
      max_invalid_id: "❌ Neplatné ID linku. Použite číslo, napr. /max 18 5",
      max_invalid_value: "❌ Neplatná hodnota. Musí byť číslo medzi 1 a 100 alebo 'off'.",
      max_disabled: "✅ Limit per link vypnutý pre link <b>{id}</b> ({name}).",
      max_set: "✅ Limit per link nastavený na <b>{value}</b> položiek na cyklus pre link <b>{id}</b> ({name}).",
      
      error_panel: "❌ Failed do generate panel link.\n\nrequestId: {requestId}",
      error_payment_config: "❌ Payment configuration error.\n\nrequestId: {requestId}",
      error_addon_config: "❌ Addon configuration error.\n\nrequestId: {requestId}",
      error_no_purchase: "❌ No možnosti nákupu available.",
      error_payment_create: "❌ Error creating payment.\n\nrequestId: {requestId}",
      error_lista: "❌ Error fetching link zoznam.",
      
      lista_empty: "Ešte nemáte žiadne aktívne linky.\n\nPridajte svoj prvý link: /dodaj <url> [názov]",
      lista_title: "📋 Vaše monitorované linky",
      lista_disable: "Na deaktiváciu monitorovania linku:",
      
      error_usun: "❌ Error disabling link.",
      error_dodaj: "❌ Error adding link.",
      error_status: "❌ Error fetching stav.",
      error_stripe_not_configured: "❌ Stripe not configured.\n\nrequestId: {requestId}",
      error_addon_not_configured: "❌ No configuration for addon.\n\nrequestId: {requestId}",
    },
    
    // /dodaj specific messages
    dodaj: {
      invalid_url: "First parameter must be a valid URL, e.g.:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      trial_expired: "⏰ tvoje Trial plán has expired.\nMonitoring in Trial is no longer available.\n\nTo continue using the bot, choose a paid plán (Starter / Growth / Platinum).",
      plan_expired: "⏰ tvoje plán has expired.\nTo pridať nový odkazy a resume monitorovanie, renew tvoje plán in the customer panel.",
      no_active_plan_trial_used: "You don't have an aktívne plán with link monitorovanie.\nTrial has already been used. Purchase Starter / Growth / Platinum plán.",
      no_active_plan_trial_available: "You don't have an aktívne plán with link monitorovanie.\nYou can start a one-time Trial (3 days / 5 odkazy) alebo choose Starter / Growth / Platinum plán.",
      success: "✅ Added new link for monitorovanie:\n\nID <b>{id}</b> — {name}\n<code>{url}</code>\n\nActive odkazy: {active}/{limit}\n\nCheck odkazy with: <code>/lista</code>",
      no_name: "(no name)",
    },
    
    // /najnowsze specific
    najnowsze: {
      header: "🧾 Newest offers\n<b>{name}</b> <i>(ID {id})</i>\n",
      no_history: "\nNo saved history for this link yet.",
      no_title: "(no title)",
      truncated: "… (truncated – message length limit)\n",
      link_not_found_detail: "Can't see link <b>{id}</b> ZAPNUTÉ tvoje account. Check <code>/lista</code>.",
    },
    
    // Notifications
    notif: {
      enabled: "✅ upozornenia aktivované pre tento chat.",
      disabled: "⛔ upozornenia DEAKTIVOVANÉ pre tento chat.",
      mode_single: "📨 Režim nastaviť: <b>jednotlivé</b> (default pre tento chat).",
      mode_batch: "📦 Režim nastaviť: <b>dávkové</b> (default pre tento chat).",
    },
    
    // Quiet hours
    quiet: {
      status_on: "🌙 Tichý režim: <b>aktivované</b>, hours {from}:00–{to}:00",
      status_off: "🌙 Tichý režim: <b>DEAKTIVOVANÉ</b>.\nSet: <code>/cisza 22-7</code>",
      usage: "Provide range as HH-HH, e.g. <code>/cisza 22-7</code>",
      invalid_hours: "Hours must be in range 0–23, e.g. <code>/cisza 22-7</code>",
      set: "🌙 Tichý režim nastaviť: <b>{from}:00–{to}:00</b>",
      disabled: "🌙 Tichý režim <b>DEAKTIVOVANÉ</b>.",
      disabled_alt: "🌙 Tichý režim: <b>DEAKTIVOVANÉ</b>",
    },
    
    // Lista
    lista: {
      header: "📋 aktívne monitorované odkazy:\n\n",
      footer: "deaktivovať: <code>/usun ID</code>\ne.g. <code>/usun 18</code>",
      no_name: "(no name)",
    },
    
    // Usun
    usun: {
      success: "✅ Stopped monitorovanie link:\n\n",
      footer: "You can re-aktivovať it in the panel alebo add it again as a new search.",
    },
    
    // Najnowsze
    najnowsze: {
      header: "🆕 Newest items pre odkaz ID <b>{id}</b>",
      no_history: "No saved history for this link yet.",
    },
    
    // Status
    status: {
      title: "ℹ️ bot stav",
      plan: "Plán: {name} (do {exp})",
      plan_with_addons: "Plán: {name} (do {exp})\nModuly (+10 odkazov každý): {addons}",
      links_enabled: "Aktívne vyhľadávanie (aktivované): {enabled}/{limit}",
      links_total: "Celkom vyhľadávanie (v databáze): {total}/{limit}",
      daily_limit: "Denný limit upozornení: {limit}",
      notif_enabled: "✅ Upozornenia aktivované",
      notif_disabled: "⛔ Upozornenia DEAKTIVOVANÉ",
      notif_mode: "Predvolený režim pre tento chat: {mode}",
      notif_daily: "Dnešné upozornenia: {daily}/{limit}",
      chat_line_enabled: "✅ Upozornenia aktivované\nPredvolený režim pre tento chat: {mode}\nDnešné upozornenia: {daily}/{limit}",
      chat_line_disabled: "⛔ Upozornenia DEAKTIVOVANÉ\nPredvolený režim pre tento chat: {mode}\nDnešné upozornenia: {daily}/{limit}",
      quiet_on: "Tichý režim: aktivované ({from}:00–{to}:00)",
      quiet_off: "Tichý režim: DEAKTIVOVANÉ",
      per_link_hint: "Príkazy: /ZAPNUTÉ /VYPNUTÉ /jednotlivé /dávkové\nNa odkaz: /jednotlive <ID> /davkove <ID> /off <ID> /on <ID>",
      no_links: "Žiadne aktívne vyhľadávanie.",
      links_header: "Zoznam vyhľadávania:",
      unknown: "(chyba)",
    },
    
    // Notification modes
    mode: {
      single: "jednotlivé",
      batch: "dávka",
      off: "vypnuté",
    },
    
    // Language
    lang: {
      current: "🌍 Current Jazyk: <b>{name}</b>",
      available: "Available languages:",
      unknown: "❌ neznámy Jazyk. podporovaný: {list}",
      confirm: "✅ Jazyk changed do: <b>{name}</b>",
      unknown_language: "neznámy Jazyk.",
    },
    
    // Payments & plans
    payment: {
      panel_link: "🧭 <b>panel</b>\n\nLink do panel (valid for {minutes} minutes, one-time use):\n\n{url}\n\n⚠️ <i>Link is valid IBA for {minutes} minutes a can be used IBA once.</i>",
      platinum_addon: "📋 <b>tvoje plán: Platinum</b>\n⏰ <b>Valid until:</b> {expiryDate}\n🔗 <b>odkazy limit:</b> {totalLinks}{addonText}\n\n<b>Add +10 odkazy (addon):</b>\n\n{url}\n\n⚠️ <i>Link leads do secure Stripe payment.</i>",
      platinum_addon_packages: " (+{count} addon packages)",
      plans_list: "💳 <b>Available subscription Plány</b>\n\nYour current plán: <b>{planLabel}</b>\n\n{url}",
      plans_list_keyboard: "💳 <b>Available subscription Plány</b>\n\nYour current plán: <b>{planLabel}</b>\n\nChoose plán:",
      addon_checkout: "💎 <b>Addon: +10 odkazy</b>\n\nGo do payment:\n{url}\n\n<i>requestId: {requestId}</i>",
      addon_button: "✓ Addon +10 odkazy",
      error_config: "❌ Configuration error",
      error_payment: "❌ Payment creation error.\n\nrequestId: {requestId}",
      checkout_url: "💳 <b>plán: {planCode}</b>\n\nGo do payment:\n{url}\n\n<i>requestId: {requestId}</i>",
    },
    
    // Callbacks
    callback: {
      no_chat_data: "No chat/user data.",
      mode_set: "nastaviť: {mode}",
      mode_set_failed: "❌ Failed do nastaviť Režim.",
      link_mode_set: "✅ Link <b>{linkId}</b> na tomto chate nastaviť do: <b>{mode}</b>",
    },
    
    // Admin
    admin: {
      reset_success: "✅ Admin reset done for TG {tgId}. Chats updated: {chats}. aktívne odkazy reset: {links}. Since={since}",
      no_telegram_id: "Failed do determine tvoje Telegram ID. Try again.",
    },
    
    // General
    general: {
      unknown_command: "❓ neznámy command. Use /help.",
    },
    
    // /najtansze (cheapest sent offers)
    najtansze: {
      header_per_link: "💰 najlacnejšie odoslané offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "💰 najlacnejšie odoslané offers (since {since})",
      no_history_per_link: "No sent offers with price pre odkaz <b>{id}</b> since {since}.",
      no_history_global: "No sent offers with price since {since}.",
      footer: "Full history:",
    },
    
    // Enhanced najnowsze (newest sent offers)
    najnowsze_enhanced: {
      header_per_link: "🧾 najnovšie odoslané offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "🧾 najnovšie odoslané offers (since {since})",
      no_history_per_link: "No sent offers pre odkaz <b>{id}</b> since {since}.",
      no_history_global: "No sent offers since {since}.",
      footer: "Full history:",
      no_title: "(no title)",
    },
  },

  ro: {
    // Commands
    cmd: {
      help_greeting: "👋 Bună! Acesta este FindYourDeal bot.",
      help_basic: "Comenzi de bază:",
      help_basic_lista: "/lista – arată tale Active monitorizate link-uri",
      help_basic_usun: "/usun &lt;ID&gt; – dezactivează monitorizare pentru link ID",
      help_basic_dodaj: "/dodaj &lt;url&gt; [name] – adaugă nou link de monitorizat",
      help_basic_status: "/stare – bot stare, Plan, și notificări",
      help_basic_panel: "/panou – deschide gestionare panou",
      help_notif: "PUSH notificări pe acest chat:",
      help_notif_on: "/PORNIT – activează",
      help_notif_off: "/OPRIT – dezactivează",
      help_notif_single: "/pojedyncze – individual carduri",
      help_notif_batch: "/zbiorcze – lot listă",
      help_perlink: "Mod pe link (DOAR pe acest chat):",
      help_perlink_commands: "/pojedyncze <ID>, /zbiorcze <ID>, /off <ID>, /on <ID> (e.g. /zbiorcze 18)",
      help_perlink_max: "/max &lt;ID&gt; &lt;valoare&gt; – limită pe ciclu (e.g. /max 18 3 or /max 18 off)",
      help_quiet: "Ore liniștite:",
      help_quiet_show: "/cisza – arată",
      help_quiet_set: "/cisza HH-HH – setează (e.g. /cisza 22-7)",
      help_quiet_off: "/cisza_off – dezactivează",
      help_history: "Istoric trimis:",
      help_history_najnowsze: "/najnowsze – cel mai recent trimis pe acest chat",
      help_history_najnowsze_id: "/najnowsze &lt;ID&gt; – cel mai recent trimis pentru link",
      help_history_najtansze: "/najtansze – cel mai ieftin trimis pe acest chat",
      help_history_najtansze_id: "/najtansze &lt;ID&gt; – cel mai ieftin trimis pentru link",
      help_examples: "Exemple:",
      help_examples_text: "<code>/lista</code>\n<code>/elimina 18</code>\n<code>/adauga https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>\n<code>/recente 18</code>",
      
      // Dynamic help descriptions (RO)
      help_basic_name: "nume",
      help_basic_lista_desc: "– arată linkurile tale monitorizate active",
      help_basic_usun_desc: "– dezactivează monitorizarea pentru ID-ul linkului",
      help_basic_dodaj_desc: "– adaugă un nou link pentru monitorizare",
      help_basic_status_desc: "– starea botului, planul și notificările",
      help_basic_panel_desc: "– deschide panoul de gestionare",
      help_basic_nazwa_desc: "– redenumește linkul (sau /{nazwa} ID – pentru a șterge)",
      help_notif_on_desc: "– activează",
      help_notif_off_desc: "– dezactivează",
      help_notif_single_desc: "– carduri individuale",
      help_notif_batch_desc: "– listă în lot",
      help_value: "valoare",
      help_perlink_max_desc: "– limitează articolele pe ciclu (ex. /max 18 3 sau /max 18 off)",
      help_quiet_show_desc: "– arată",
      help_quiet_set_desc: "– setează (ex. /liniște 22-7)",
      help_quiet_off_desc: "– dezactivează",
      help_history_najnowsze_desc: "– cele mai recente trimise pe acest chat",
      help_history_najnowsze_id_desc: "– cele mai recente trimise pentru link",
      help_history_najtansze_desc: "– cele mai ieftine trimise pe acest chat",
      help_history_najtansze_id_desc: "– cele mai ieftine trimise pentru link",
      help_plans_show_desc: "– arată planurile disponibile și opțiunile de cumpărare",
      help_code: "cod",
      help_lang_set_desc: "– setează limba (ex. /lang en, /lang ro)",
      
      help: "Available commands:\n/start - Start bot\n/help - arată help\n/dodaj - Add search\n/usun - Remove search\n/lista - listă searches\n/stare - arată stare\n/porneste - activează notificări\n/opreste - dezactivează notificări\n/pojedyncze - individual Mod\n/zbiorcze - lot Mod\n/cisza - setează Ore liniștite\n/cisza_off - dezactivează Ore liniștite\n/najnowsze [ID] - arată newest items\n/najtansze [ID] - arată cheapest items\n/plany - arată Planuri\n/panou - Get panou link\n/lang - Change Limbă",
      
      help_admin_text: "🔒 <b>FindYourDeal — Comenzi Admin</b>\n\n<b>ADMIN</b>\n\n/ajutor_admin — arată acest ajutor admin\n\n/tech &lt;telegram_user_id&gt; — arată mapare Telegram → user_id (diagnosticare)\n\n/debug — diagnosticare bot (build, hash, uptime, conexiune DB)\n\n/debug_worker_links — listează linkuri efectiv scanate de worker (max 50)\n\n/reset_zi &lt;telegram_user_id&gt; — resetează numărător zilnic notificări/articole (global, de la miezul nopții ora locală)\n\n/audit &lt;telegram_user_id&gt; [limit] — arată jurnal audit admin pentru utilizator (implicit: ultimele 20 înregistrări)\n\n<b>SUPERADMIN</b>\n\n/da_admin &lt;telegram_user_id&gt; — acordă rol ADMIN\n\n/sterge_utilizator &lt;telegram_user_id&gt; — șterge utilizator și toate datele (linkuri, chat-uri, oferte) — IREVERSIBIL",
      
      unauthorized: "❌ Unauthorized (admin DOAR).",
      provide_id: "❌ Provide Telegram ID: /admin_reset &lt;telegram_id&gt;",
      user_not_found: "❌ User not found for Telegram ID {id}",
      user_not_in_db: "Can't see you in database. Use /start sau /dodaj.",
      user_not_registered: "Can't see you in database yet.\nFirst use /dodaj (registers account), then /stare.",
      
      link_not_found: "Couldn't find link with ID <b>{id}</b> PORNIT tale account. Use /lista.",
      no_links: "You don't have any link-uri yet.",
      
      usage_usun: "Provide link ID, e.g.:\n<code>/usun 18</code>",
      usage_najnowsze: "Usage: <code>/najnowsze [ID]</code>\nWithout ID: all link-uri\nWith ID: specific link\n\nExamples:\n<code>/najnowsze</code>\n<code>/najnowsze 18</code>",
      usage_najtansze: "Usage: <code>/najtansze [ID]</code>\nWithout ID: all link-uri\nWith ID: specific link\n\nExamples:\n<code>/najtansze</code>\n<code>/najtansze 18</code>",
      usage_dodaj: "Usage:\n<code>/dodaj &lt;url&gt; [name]</code>\n\nExample:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      
      max_usage: "Utilizare: /max &lt;ID&gt; &lt;valoare&gt; sau /max &lt;ID&gt; off\n\nExemple:\n<code>/max 18 3</code> — limită de 3 articole per ciclu\n<code>/max 18 off</code> — elimină limita",
      max_invalid_id: "❌ ID link invalid. Utilizați un număr, de exemplu /max 18 5",
      max_invalid_value: "❌ Valoare invalidă. Trebuie să fie un număr între 1 și 100 sau 'off'.",
      max_disabled: "✅ Limită per link dezactivată pentru link <b>{id}</b> ({name}).",
      max_set: "✅ Limită per link setată la <b>{value}</b> articole per ciclu pentru link <b>{id}</b> ({name}).",
      
      error_panel: "❌ Failed la generate panou link.\n\nrequestId: {requestId}",
      error_payment_config: "❌ Payment configuration error.\n\nrequestId: {requestId}",
      error_addon_config: "❌ Addon configuration error.\n\nrequestId: {requestId}",
      error_no_purchase: "❌ No opțiuni de achiziție available.",
      error_payment_create: "❌ Error creating payment.\n\nrequestId: {requestId}",
      error_lista: "❌ Error fetching link listă.",
      
      lista_empty: "Nu aveți niciun link activ încă.\n\nAdaugă primul tău link: /dodaj <url> [nume]",
      lista_title: "📋 Link-urile tale monitorizate",
      lista_disable: "Pentru a dezactiva monitorizarea unui link:",
      
      error_usun: "❌ Error disabling link.",
      error_dodaj: "❌ Error adding link.",
      error_status: "❌ Error fetching stare.",
      error_stripe_not_configured: "❌ Stripe not configured.\n\nrequestId: {requestId}",
      error_addon_not_configured: "❌ No configuration for addon.\n\nrequestId: {requestId}",
    },
    
    // /dodaj specific messages
    dodaj: {
      invalid_url: "First parameter must be a valid URL, e.g.:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      trial_expired: "⏰ tale Trial Plan has expired.\nMonitoring in Trial is no longer available.\n\nTo continue using the bot, choose a paid Plan (Starter / Growth / Platinum).",
      plan_expired: "⏰ tale Plan has expired.\nTo adaugă nou link-uri și resume monitorizare, renew tale Plan in the customer panou.",
      no_active_plan_trial_used: "You don't have an Active Plan with link monitorizare.\nTrial has already been used. Purchase Starter / Growth / Platinum Plan.",
      no_active_plan_trial_available: "You don't have an Active Plan with link monitorizare.\nYou can start a one-time Trial (3 days / 5 link-uri) sau choose Starter / Growth / Platinum Plan.",
      success: "✅ Added new link for monitorizare:\n\nID <b>{id}</b> — {name}\n<code>{url}</code>\n\nActive link-uri: {active}/{limit}\n\nCheck link-uri with: <code>/lista</code>",
      no_name: "(no name)",
    },
    
    // /najnowsze specific
    najnowsze: {
      header: "🧾 Newest offers\n<b>{name}</b> <i>(ID {id})</i>\n",
      no_history: "\nNo saved history for this link yet.",
      no_title: "(no title)",
      truncated: "… (truncated – message length limit)\n",
      link_not_found_detail: "Can't see link <b>{id}</b> PORNIT tale account. Check <code>/lista</code>.",
    },
    
    // Notifications
    notif: {
      enabled: "✅ notificări activat pentru acest chat.",
      disabled: "⛔ notificări DEZACTIVAT pentru acest chat.",
      mode_single: "📨 Mod setează: <b>individual</b> (default pentru acest chat).",
      mode_batch: "📦 Mod setează: <b>lot</b> (default pentru acest chat).",
    },
    
    // Quiet hours
    quiet: {
      status_on: "🌙 Ore liniștite: <b>activat</b>, hours {from}:00–{to}:00",
      status_off: "🌙 Ore liniștite: <b>DEZACTIVAT</b>.\nSet: <code>/cisza 22-7</code>",
      usage: "Provide range as HH-HH, e.g. <code>/cisza 22-7</code>",
      invalid_hours: "Hours must be in range 0–23, e.g. <code>/cisza 22-7</code>",
      set: "🌙 Ore liniștite setează: <b>{from}:00–{to}:00</b>",
      disabled: "🌙 Ore liniștite <b>DEZACTIVAT</b>.",
      disabled_alt: "🌙 Ore liniștite: <b>DEZACTIVAT</b>",
    },
    
    // Lista
    lista: {
      header: "📋 Active monitorizate link-uri:\n\n",
      footer: "dezactivează: <code>/usun ID</code>\ne.g. <code>/usun 18</code>",
      no_name: "(no name)",
    },
    
    // Usun
    usun: {
      success: "✅ Stopped monitorizare link:\n\n",
      footer: "You can re-activează it in the panou sau add it again as a new search.",
    },
    
    // Najnowsze
    najnowsze: {
      header: "🆕 Newest items pentru link ID <b>{id}</b>",
      no_history: "No saved history for this link yet.",
    },
    
    // Status
    status: {
      title: "ℹ️ bot stare",
      plan: "Plan: {name} (până la {exp})",
      plan_with_addons: "Plan: {name} (până la {exp})\nModuluri (+10 linkuri fiecare): {addons}",
      links_enabled: "Căutări active (activate): {enabled}/{limit}",
      links_total: "Căutări totale (în baza de date): {total}/{limit}",
      daily_limit: "Limită zilnică notificări: {limit}",
      notif_enabled: "✅ Notificări activate",
      notif_disabled: "⛔ Notificări DEZACTIVATE",
      notif_mode: "Mod implicit pentru acest chat: {mode}",
      notif_daily: "Notificări de astăzi: {daily}/{limit}",
      chat_line_enabled: "✅ Notificări activate\nMod implicit pentru acest chat: {mode}\nNotificări de astăzi: {daily}/{limit}",
      chat_line_disabled: "⛔ Notificări DEZACTIVATE\nMod implicit pentru acest chat: {mode}\nNotificări de astăzi: {daily}/{limit}",
      quiet_on: "Ore liniștite: activat ({from}:00–{to}:00)",
      quiet_off: "Ore liniștite: DEZACTIVAT",
      per_link_hint: "Comenzi: /PORNIT /OPRIT /individual /lot\nPe link: /individual <ID> /lot <ID> /off <ID> /on <ID>",
      no_links: "Fără căutări active.",
      links_header: "Listă căutări:",
      unknown: "(eroare)",
    },
    
    // Notification modes
    mode: {
      single: "individual",
      batch: "grupat",
      off: "dezactivat",
    },
    
    // Language
    lang: {
      current: "🌍 Current Limbă: <b>{name}</b>",
      available: "Available languages:",
      unknown: "❌ necunoscut Limbă. suportat: {list}",
      confirm: "✅ Limbă changed la: <b>{name}</b>",
      unknown_language: "necunoscut Limbă.",
    },
    
    // Payments & plans
    payment: {
      panel_link: "🧭 <b>panou</b>\n\nLink la panou (valid for {minutes} minutes, one-time use):\n\n{url}\n\n⚠️ <i>Link is valid DOAR for {minutes} minutes și can be used DOAR once.</i>",
      platinum_addon: "📋 <b>tale Plan: Platinum</b>\n⏰ <b>Valid until:</b> {expiryDate}\n🔗 <b>link-uri limit:</b> {totalLinks}{addonText}\n\n<b>Add +10 link-uri (addon):</b>\n\n{url}\n\n⚠️ <i>Link leads la secure Stripe payment.</i>",
      platinum_addon_packages: " (+{count} addon packages)",
      plans_list: "💳 <b>Available subscription Planuri</b>\n\nYour current Plan: <b>{planLabel}</b>\n\n{url}",
      plans_list_keyboard: "💳 <b>Available subscription Planuri</b>\n\nYour current Plan: <b>{planLabel}</b>\n\nChoose Plan:",
      addon_checkout: "💎 <b>Addon: +10 link-uri</b>\n\nGo la payment:\n{url}\n\n<i>requestId: {requestId}</i>",
      addon_button: "✓ Addon +10 link-uri",
      error_config: "❌ Configuration error",
      error_payment: "❌ Payment creation error.\n\nrequestId: {requestId}",
      checkout_url: "💳 <b>Plan: {planCode}</b>\n\nGo la payment:\n{url}\n\n<i>requestId: {requestId}</i>",
    },
    
    // Callbacks
    callback: {
      no_chat_data: "No chat/user data.",
      mode_set: "setează: {mode}",
      mode_set_failed: "❌ Failed la setează Mod.",
      link_mode_set: "✅ Link <b>{linkId}</b> pe acest chat setează la: <b>{mode}</b>",
    },
    
    // Admin
    admin: {
      reset_success: "✅ Admin reset done for TG {tgId}. Chats updated: {chats}. Active link-uri reset: {links}. Since={since}",
      no_telegram_id: "Failed la determine tale Telegram ID. Try again.",
    },
    
    // General
    general: {
      unknown_command: "❓ necunoscut command. Use /help.",
    },
    
    // /najtansze (cheapest sent offers)
    najtansze: {
      header_per_link: "💰 cel mai ieftin trimis offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "💰 cel mai ieftin trimis offers (since {since})",
      no_history_per_link: "No sent offers with price pentru link <b>{id}</b> since {since}.",
      no_history_global: "No sent offers with price since {since}.",
      footer: "Full history:",
    },
    
    // Enhanced najnowsze (newest sent offers)
    najnowsze_enhanced: {
      header_per_link: "🧾 cel mai recent trimis offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "🧾 cel mai recent trimis offers (since {since})",
      no_history_per_link: "No sent offers pentru link <b>{id}</b> since {since}.",
      no_history_global: "No sent offers since {since}.",
      footer: "Full history:",
      no_title: "(no title)",
    },
  },

  nl: {
    // Commands
    cmd: {
      help_greeting: "👋 Hallo! Dit is FindYourDeal bot.",
      help_basic: "Basiscommando's:",
      help_basic_lista: "/lista – toon jouw actieve gemonitorde Links",
      help_basic_usun: "/usun &lt;ID&gt; – deactiveren monitoring voor link ID",
      help_basic_dodaj: "/dodaj &lt;url&gt; [name] – voeg nieuw toe link om te monitoren",
      help_basic_status: "/status – bot status, Plan, en meldingen",
      help_basic_panel: "/paneel – open beheer paneel",
      help_notif: "PUSH meldingen in deze chat:",
      help_notif_on: "/AAN – activeren",
      help_notif_off: "/UIT – deactiveren",
      help_notif_single: "/pojedyncze – enkel kaarten",
      help_notif_batch: "/zbiorcze – batch lijst",
      help_perlink: "Per-link modus (ALLEEN in deze chat):",
      help_perlink_commands: "/pojedyncze <ID>, /zbiorcze <ID>, /off <ID>, /on <ID> (e.g. /zbiorcze 18)",
      help_perlink_max: "/max &lt;ID&gt; &lt;waarde&gt; – limiet per cyclus (e.g. /max 18 3 or /max 18 off)",
      help_quiet: "Stille uren:",
      help_quiet_show: "/cisza – toon",
      help_quiet_set: "/cisza HH-HH – instellen (e.g. /cisza 22-7)",
      help_quiet_off: "/cisza_off – deactiveren",
      help_history: "Verzonden geschiedenis:",
      help_history_najnowsze: "/najnowsze – nieuwste verzonden in deze chat",
      help_history_najnowsze_id: "/najnowsze &lt;ID&gt; – nieuwste verzonden voor link",
      help_history_najtansze: "/najtansze – goedkoopste verzonden in deze chat",
      help_history_najtansze_id: "/najtansze &lt;ID&gt; – goedkoopste verzonden voor link",
      help_examples: "Voorbeelden:",
      help_examples_text: "<code>/lijst</code>\n<code>/verwijderen 18</code>\n<code>/toevoegen https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>\n<code>/nieuwste 18</code>",
      
      // Dynamic help descriptions (NL)
      help_basic_name: "naam",
      help_basic_lista_desc: "– toon uw actieve gemonitorde links",
      help_basic_usun_desc: "– deactiveer monitoring voor link ID",
      help_basic_dodaj_desc: "– voeg nieuwe link toe om te monitoren",
      help_basic_status_desc: "– bot status, plan en meldingen",
      help_basic_panel_desc: "– open beheerpaneel",
      help_basic_nazwa_desc: "– hernoem link (of /{nazwa} ID – om te wissen)",
      help_notif_on_desc: "– activeren",
      help_notif_off_desc: "– deactiveren",
      help_notif_single_desc: "– enkele kaarten",
      help_notif_batch_desc: "– batch lijst",
      help_value: "waarde",
      help_perlink_max_desc: "– beperk items per cyclus (bijv. /max 18 3 of /max 18 off)",
      help_quiet_show_desc: "– toon",
      help_quiet_set_desc: "– instellen (bijv. /stil 22-7)",
      help_quiet_off_desc: "– deactiveren",
      help_history_najnowsze_desc: "– nieuwste verzonden in deze chat",
      help_history_najnowsze_id_desc: "– nieuwste verzonden voor link",
      help_history_najtansze_desc: "– goedkoopste verzonden in deze chat",
      help_history_najtansze_id_desc: "– goedkoopste verzonden voor link",
      help_plans_show_desc: "– toon beschikbare plannen en aankoopopties",
      help_code: "code",
      help_lang_set_desc: "– stel taal in (bijv. /lang en, /lang nl)",
      
      help: "Available commands:\n/start - Start bot\n/help - toon help\n/dodaj - Add search\n/usun - Remove search\n/lista - lijst searches\n/status - toon status\n/aanzetten - activeren meldingen\n/uitzetten - deactiveren meldingen\n/pojedyncze - enkel Modus\n/zbiorcze - batch Modus\n/cisza - instellen Stille uren\n/cisza_off - deactiveren Stille uren\n/najnowsze [ID] - toon newest items\n/najtansze [ID] - toon cheapest items\n/plany - toon Plannen\n/paneel - Get paneel link\n/lang - Change Taal",
      
      help_admin_text: "🔒 <b>FindYourDeal — Admin Commando's</b>\n\n<b>ADMIN</b>\n\n/hulp_admin — toon deze admin hulp\n\n/tech &lt;telegram_user_id&gt; — toon Telegram → user_id mapping (diagnostiek)\n\n/debug — bot diagnostiek (build, hash, uptime, DB-verbinding)\n\n/debug_worker_links — lijst links daadwerkelijk gescand door worker (max 50)\n\n/reset_dag &lt;telegram_user_id&gt; — reset dagelijkse teller meldingen/items (globaal, sinds middernacht lokale tijd)\n\n/audit &lt;telegram_user_id&gt; [limit] — toon admin audit log voor gebruiker (standaard: laatste 20 vermeldingen)\n\n<b>SUPERADMIN</b>\n\n/geef_admin &lt;telegram_user_id&gt; — verleen ADMIN rol\n\n/verwijder_gebruiker &lt;telegram_user_id&gt; — verwijder gebruiker en alle gegevens (links, chats, aanbiedingen) — ONOMKEERBAAR",
      
      unauthorized: "❌ Unauthorized (admin ALLEEN).",
      provide_id: "❌ Provide Telegram ID: /admin_reset &lt;telegram_id&gt;",
      user_not_found: "❌ User not found for Telegram ID {id}",
      user_not_in_db: "Can't see you in database. Use /start of /dodaj.",
      user_not_registered: "Can't see you in database yet.\nFirst use /dodaj (registers account), then /status.",
      
      link_not_found: "Couldn't find link with ID <b>{id}</b> AAN jouw account. Use /lista.",
      no_links: "You don't have any Links yet.",
      
      usage_usun: "Provide link ID, e.g.:\n<code>/usun 18</code>",
      usage_najnowsze: "Usage: <code>/najnowsze [ID]</code>\nWithout ID: all Links\nWith ID: specific link\n\nExamples:\n<code>/najnowsze</code>\n<code>/najnowsze 18</code>",
      usage_najtansze: "Usage: <code>/najtansze [ID]</code>\nWithout ID: all Links\nWith ID: specific link\n\nExamples:\n<code>/najtansze</code>\n<code>/najtansze 18</code>",
      usage_dodaj: "Usage:\n<code>/dodaj &lt;url&gt; [name]</code>\n\nExample:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      
      max_usage: "Gebruik: /max &lt;ID&gt; &lt;waarde&gt; of /max &lt;ID&gt; off\n\nVoorbeelden:\n<code>/max 18 3</code> — limiet van 3 items per cyclus\n<code>/max 18 off</code> — limiet verwijderen",
      max_invalid_id: "❌ Ongeldige link-ID. Gebruik een getal, bijv. /max 18 5",
      max_invalid_value: "❌ Ongeldige waarde. Moet een getal tussen 1 en 100 zijn of 'off'.",
      max_disabled: "✅ Per-link limiet uitgeschakeld voor link <b>{id}</b> ({name}).",
      max_set: "✅ Per-link limiet ingesteld op <b>{value}</b> items per cyclus voor link <b>{id}</b> ({name}).",
      
      error_panel: "❌ Failed tot generate paneel link.\n\nrequestId: {requestId}",
      error_payment_config: "❌ Payment configuration error.\n\nrequestId: {requestId}",
      error_addon_config: "❌ Addon configuration error.\n\nrequestId: {requestId}",
      error_no_purchase: "❌ No aankoopopties available.",
      error_payment_create: "❌ Error creating payment.\n\nrequestId: {requestId}",
      error_lista: "❌ Error fetching link lijst.",
      
      lista_empty: "Je hebt nog geen actieve links.\n\nVoeg je eerste link toe: /dodaj <url> [naam]",
      lista_title: "📋 Je gemonitorde links",
      lista_disable: "Om monitoring voor een link uit te schakelen:",
      
      error_usun: "❌ Error disabling link.",
      error_dodaj: "❌ Error adding link.",
      error_status: "❌ Error fetching status.",
      error_stripe_not_configured: "❌ Stripe not configured.\n\nrequestId: {requestId}",
      error_addon_not_configured: "❌ No configuration for addon.\n\nrequestId: {requestId}",
    },
    
    // /dodaj specific messages
    dodaj: {
      invalid_url: "First parameter must be a valid URL, e.g.:\n<code>/dodaj https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
      trial_expired: "⏰ jouw Trial Plan has expired.\nMonitoring in Trial is no longer available.\n\nTo continue using the bot, choose a paid Plan (Starter / Growth / Platinum).",
      plan_expired: "⏰ jouw Plan has expired.\nTo voeg nieuw toe Links en resume monitoring, renew jouw Plan in the customer paneel.",
      no_active_plan_trial_used: "You don't have an actieve Plan with link monitoring.\nTrial has already been used. Purchase Starter / Growth / Platinum Plan.",
      no_active_plan_trial_available: "You don't have an actieve Plan with link monitoring.\nYou can start a one-time Trial (3 days / 5 Links) of choose Starter / Growth / Platinum Plan.",
      success: "✅ Added new link for monitoring:\n\nID <b>{id}</b> — {name}\n<code>{url}</code>\n\nActive Links: {active}/{limit}\n\nCheck Links with: <code>/lista</code>",
      no_name: "(no name)",
    },
    
    // /najnowsze specific
    najnowsze: {
      header: "🧾 Newest offers\n<b>{name}</b> <i>(ID {id})</i>\n",
      no_history: "\nNo saved history for this link yet.",
      no_title: "(no title)",
      truncated: "… (truncated – message length limit)\n",
      link_not_found_detail: "Can't see link <b>{id}</b> AAN jouw account. Check <code>/lista</code>.",
    },
    
    // Notifications
    notif: {
      enabled: "✅ meldingen geactiveerd voor deze chat.",
      disabled: "⛔ meldingen GEDEACTIVEERD voor deze chat.",
      mode_single: "📨 Modus instellen: <b>enkel</b> (default voor deze chat).",
      mode_batch: "📦 Modus instellen: <b>batch</b> (default voor deze chat).",
    },
    
    // Quiet hours
    quiet: {
      status_on: "🌙 Stille uren: <b>geactiveerd</b>, hours {from}:00–{to}:00",
      status_off: "🌙 Stille uren: <b>GEDEACTIVEERD</b>.\nSet: <code>/cisza 22-7</code>",
      usage: "Provide range as HH-HH, e.g. <code>/cisza 22-7</code>",
      invalid_hours: "Hours must be in range 0–23, e.g. <code>/cisza 22-7</code>",
      set: "🌙 Stille uren instellen: <b>{from}:00–{to}:00</b>",
      disabled: "🌙 Stille uren <b>GEDEACTIVEERD</b>.",
      disabled_alt: "🌙 Stille uren: <b>GEDEACTIVEERD</b>",
    },
    
    // Lista
    lista: {
      header: "📋 actieve gemonitorde Links:\n\n",
      footer: "deactiveren: <code>/usun ID</code>\ne.g. <code>/usun 18</code>",
      no_name: "(no name)",
    },
    
    // Usun
    usun: {
      success: "✅ Stopped monitoring link:\n\n",
      footer: "You can re-activeren it in the paneel of add it again as a new search.",
    },
    
    // Najnowsze
    najnowsze: {
      header: "🆕 Newest items voor link ID <b>{id}</b>",
      no_history: "No saved history for this link yet.",
    },
    
    // Status
    status: {
      title: "ℹ️ bot status",
      plan: "Plan: {name} (tot {exp})",
      plan_with_addons: "Plan: {name} (tot {exp})\nModules (+10 links elk): {addons}",
      links_enabled: "Actieve zoekopdrachten (geactiveerd): {enabled}/{limit}",
      links_total: "Totaal zoekopdrachten (in de database): {total}/{limit}",
      daily_limit: "Dagelijkse notificatielimiet: {limit}",
      notif_enabled: "✅ Meldingen geactiveerd",
      notif_disabled: "⛔ Meldingen GEDEACTIVEERD",
      notif_mode: "Standaardmodus voor deze chat: {mode}",
      notif_daily: "Meldingen van vandaag: {daily}/{limit}",
      chat_line_enabled: "✅ Meldingen geactiveerd\nStandaardmodus voor deze chat: {mode}\nMeldingen van vandaag: {daily}/{limit}",
      chat_line_disabled: "⛔ Meldingen GEDEACTIVEERD\nStandaardmodus voor deze chat: {mode}\nMeldingen van vandaag: {daily}/{limit}",
      quiet_on: "Stille uren: geactiveerd ({from}:00–{to}:00)",
      quiet_off: "Stille uren: GEDEACTIVEERD",
      per_link_hint: "Commando's: /AAN /UIT /enkel /batch\nPer link: /enkel <ID> /batch <ID> /off <ID> /on <ID>",
      no_links: "Geen actieve zoekopdrachten.",
      links_header: "Zoeklijst:",
      unknown: "(fout)",
    },
    
    // Notification modes
    mode: {
      single: "enkel",
      batch: "gegroepeerd",
      off: "uit",
    },
    
    // Language
    lang: {
      current: "🌍 Current Taal: <b>{name}</b>",
      available: "Available languages:",
      unknown: "❌ onbekend Taal. ondersteund: {list}",
      confirm: "✅ Taal changed tot: <b>{name}</b>",
      unknown_language: "onbekend Taal.",
    },
    
    // Payments & plans
    payment: {
      panel_link: "🧭 <b>paneel</b>\n\nLink tot paneel (valid for {minutes} minutes, one-time use):\n\n{url}\n\n⚠️ <i>Link is valid ALLEEN for {minutes} minutes en can be used ALLEEN once.</i>",
      platinum_addon: "📋 <b>jouw Plan: Platinum</b>\n⏰ <b>Valid until:</b> {expiryDate}\n🔗 <b>Links limit:</b> {totalLinks}{addonText}\n\n<b>Add +10 Links (addon):</b>\n\n{url}\n\n⚠️ <i>Link leads tot secure Stripe payment.</i>",
      platinum_addon_packages: " (+{count} addon packages)",
      plans_list: "💳 <b>Available subscription Plannen</b>\n\nYour current Plan: <b>{planLabel}</b>\n\n{url}",
      plans_list_keyboard: "💳 <b>Available subscription Plannen</b>\n\nYour current Plan: <b>{planLabel}</b>\n\nChoose Plan:",
      addon_checkout: "💎 <b>Addon: +10 Links</b>\n\nGo tot payment:\n{url}\n\n<i>requestId: {requestId}</i>",
      addon_button: "✓ Addon +10 Links",
      error_config: "❌ Configuration error",
      error_payment: "❌ Payment creation error.\n\nrequestId: {requestId}",
      checkout_url: "💳 <b>Plan: {planCode}</b>\n\nGo tot payment:\n{url}\n\n<i>requestId: {requestId}</i>",
    },
    
    // Callbacks
    callback: {
      no_chat_data: "No chat/user data.",
      mode_set: "instellen: {mode}",
      mode_set_failed: "❌ Failed tot instellen Modus.",
      link_mode_set: "✅ Link <b>{linkId}</b> in deze chat instellen tot: <b>{mode}</b>",
    },
    
    // Admin
    admin: {
      reset_success: "✅ Admin reset done for TG {tgId}. Chats updated: {chats}. actieve Links reset: {links}. Since={since}",
      no_telegram_id: "Failed tot determine jouw Telegram ID. Try again.",
    },
    
    // General
    general: {
      unknown_command: "❓ onbekend command. Use /help.",
    },
    
    // /najtansze (cheapest sent offers)
    najtansze: {
      header_per_link: "💰 goedkoopste verzonden offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "💰 goedkoopste verzonden offers (since {since})",
      no_history_per_link: "No sent offers with price voor link <b>{id}</b> since {since}.",
      no_history_global: "No sent offers with price since {since}.",
      footer: "Full history:",
    },
    
    // Enhanced najnowsze (newest sent offers)
    najnowsze_enhanced: {
      header_per_link: "🧾 nieuwste verzonden offers (link {id})\n<b>{name}</b>\nSince: {since}",
      header_global: "🧾 nieuwste verzonden offers (since {since})",
      no_history_per_link: "No sent offers voor link <b>{id}</b> since {since}.",
      no_history_global: "No sent offers since {since}.",
      footer: "Full history:",
      no_title: "(no title)",
    },
  },

  
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

// Normalize language code: "pl-PL" → "pl", validate against supported languages
function normalizeLangCode(code) {
  if (!code) return "en";
  
  const lc = String(code).toLowerCase().split("-")[0]; // "pl-PL" → "pl"
  const supported = ["pl", "de", "fr", "it", "es", "pt", "cs", "sk", "ro", "nl"];
  
  return supported.includes(lc) ? lc : "en";
}

// Get user language with CORRECT priority order (explicit DB choice wins over Telegram hint)
// Priority: user.language (explicit /lang choice) > user.lang (legacy) > user.language_code (Telegram hint) > "en"
export function getUserLang(user) {
  if (!user) return "en";
  
  // 1. Explicit user choice from /lang command (HIGHEST priority - user's explicit setting)
  const explicit = user.language || user.lang;
  if (explicit) return normalizeLangCode(explicit);
  
  // 2. Telegram's language hint (LOWEST priority - just a hint, not user's choice)
  const hint = user.language_code;
  if (hint) return normalizeLangCode(hint);
  
  // 3. Fallback to EN
  return "en";
}

export default { t, getUserLang, TRANSLATIONS };
