export type Lang =
  | "en"
  | "pl"
  | "de"
  | "fr"
  | "es"
  | "it"
  | "pt"
  | "ro"
  | "nl"
  | "cs"
  | "sk";

export const LANGS = [
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
] as const;

export const LANG_LIST = LANGS; // alias (żeby nie wywalało builda jak ktoś importuje LANG_LIST)

const LANG_SET = new Set<Lang>(LANGS.map((l) => l.code));

export function normLang(v?: string | null): Lang {
  const x = String(v || "")
    .trim()
    .toLowerCase();
  if (x === "pt-br") return "pt";
  if (LANG_SET.has(x as Lang)) return x as Lang;
  return "en";
}
export const normalizeLang = normLang; // alias (żeby nie wywalało builda jak ktoś importuje normalizeLang)

type Vars = Record<string, string | number>;

function fmt(s: string, vars?: Vars) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] === undefined ? `{${k}}` : String(vars[k])
  );
}

const DICT: Record<Lang, Record<string, string>> = {
  en: {
    // NAV / TOP
    nav_links: "Searches",
    nav_billing: "Billing",
    links_title: "Searches",
    billing_title: "Billing",

    // SETTINGS
    settings_link: "Settings",
    settings_title: "Settings",
    settings_desc: "Configure your language and timezone.",
    settings_language_label: "Language",
    settings_timezone_label: "Timezone",
    settings_timezone_hint: "Used for notifications and history times.",
    settings_saved_lang: "✅ Language updated to {lang}",
    settings_saved_tz: "✅ Timezone updated to {tz}",
    settings_error: "Something went wrong",
    settings_current_time: "Current time:",
    settings_back_links: "Back to links",
    settings_quiet_title: "🌙 Quiet hours (no notifications)",
    settings_quiet_desc: "Don't send notifications during selected hours (in your timezone)",
    settings_quiet_enable: "Enable quiet hours",
    settings_quiet_from: "From hour:",
    settings_quiet_to: "To hour:",
    settings_quiet_save: "Save quiet hours settings",
    settings_quiet_saving: "Saving...",
    settings_notif_title: "Notifications",
    settings_notif_enabled: "Notifications enabled",
    settings_notif_default_mode: "Default notification mode",
    settings_notif_mode_single: "Single (immediate)",
    settings_notif_mode_batch: "Batch",
    settings_notif_save: "Save notification settings",
    settings_notif_saving: "Saving...",
    settings_back_to_search: "BACK TO SEARCH",

    plan_lower: "plan:",
    active_lower: "active:",
    until_prefix: "until",

    // LINKS: Telegram commands box
    tg_commands_title: "Telegram commands",
    tg_commands_desc:
      "You can do the same actions from your Telegram chat. Most used:",
    tg_cmd_status: "/status — plan, limits and notification settings",
    tg_cmd_add: "/dodaj — add a new search (link)",
    tg_cmd_list: "/lista — list your searches",
    tg_cmd_remove: "/usun ID — remove a search by ID",
    tg_cmd_onoff: "/on / /off — enable/disable notifications in this chat",
    tg_cmd_mode: "/pojedyncze / /zbiorcze — notification mode in this chat",
    tg_cmd_mode_id:
      "/pojedyncze ID / /zbiorcze ID / /off ID / /on ID — settings for a specific link",

    chat_status_prefix: "Chat status:",
    chat_mode_prefix: "chat mode:",
    notif_hint_off: "Notifications are OFF — use /on.",
    notif_hint_on: "Notifications are ON — use /off.",
    notif_off: "notifications OFF",
    notif_on: "notifications ON",

    // LINKS: list + filters
    links_list_desc: "List of your links monitored by the bot and quick actions.",
    search_label: "Search (name / URL)",
    only_enabled: "only enabled",
    filter_btn: "Filter",
    clear_btn: "Clear",

    // LINKS: table headers
    col_id: "ID",
    col_status: "Status",
    col_notifications: "Notifications",
    col_name: "Name",
    col_source: "Source",
    col_offers: "Offers",
    col_link: "Link",
    col_last_key: "Last key",
    col_actions: "Actions",

    // LINKS: buttons/labels
    open_btn: "Open",
    reset_btn: "Clear offers history",
    status_on_short: "ON",
    status_off_short: "OFF",
    mode_off: "OFF",
    mode_single: "single",
    mode_batch: "batch",
    mode_inherit: "inherit",

    // BILLING
    billing_plan_title: "Your plan",
    billing_plan_prefix: "Plan:",
    billing_valid_until: "Valid until:",
    billing_link_limit: "Link limit:",
    billing_base: "base:",
    billing_addons: "add-ons:",
    billing_packs: "packs +10:",
    billing_enabled_links: "Enabled links",
    billing_remaining: "Remaining",
    billing_usage: "Usage",
    billing_note_active:
      "This is the number of active links (active=true) vs your plan limit.",

    billing_addons_title: "Add-ons (+10 links)",
    billing_addons_desc:
      "You have an active {plan} plan. You can buy an add-on +10 links.",
    billing_buy_addon_btn: "Buy +10 links (1 click)",
    billing_after_payment: "After payment you will return to /billing/success.",
    
    // Addon pack section (Platinum users)
    billing_addon_pack_title: "Add-on packs (+10 links)",
    billing_addon_pack_desc: "You have the Platinum plan. Expand your link capacity with add-on packs.",
    billing_addon_pack_b1: "Each pack adds +10 links to your account",
    billing_addon_pack_b2: "Immediate activation after payment",
    billing_addon_pack_b3: "Valid for the duration of your plan",
    billing_addon_pack_note: "After payment you will return to /billing/success.",
    billing_buy_addon: "Buy +10 links pack",
    
    // Upgrade section
    billing_upgrade_title: "Upgrade your plan",
    billing_upgrade_label: "Upgrade plan",
    billing_current_plan_label: "Current plan:",
    billing_after_click: "After clicking, you'll be redirected to Stripe checkout.",
    
    // Error messages
    billing_error: "Error:",
    billing_no_url: "No checkout URL received. Please try again.",
    billing_loading: "Loading...",
    
    notif_mode_label: "Mode:",
    notif_set_for_link: "(set for this link)",
    notif_inherit_from_chat: "(inherited from chat)",
    chat_no_connection: "no connection",
    chat_connect_hint: "open the bot and use /start",
    billing_change_plan_title: "Change plan",
    billing_change_plan_desc: "Current plan: {plan}. Available upgrades: {upgrades}.",
    billing_select_plan_label: "Select plan",
    billing_checkout_btn: "Go to checkout (Stripe)",
    billing_no_changes: "No plan changes available for this account.",
  },

  pl: {
    nav_links: "Wyszukiwania",
    nav_billing: "Billing",
    links_title: "Wyszukiwania",
    billing_title: "Billing",

    // SETTINGS
    settings_link: "Ustawienia",
    settings_title: "Ustawienia",
    settings_desc: "Skonfiguruj język i strefę czasową.",
    settings_language_label: "Język",
    settings_timezone_label: "Strefa czasowa",
    settings_timezone_hint: "Używana w powiadomieniach i historii.",
    settings_saved_lang: "✅ Zaktualizowano język: {lang}",
    settings_saved_tz: "✅ Zaktualizowano strefę: {tz}",
    settings_error: "Coś poszło nie tak",
    settings_current_time: "Czas lokalny:",
    settings_back_links: "Powrót do listy",

    plan_lower: "plan:",
    active_lower: "aktywne:",
    until_prefix: "do",

    tg_commands_title: "Komendy w Telegramie",
    tg_commands_desc:
      "Te same akcje możesz robić z czatu Telegrama. Najczęściej używane:",
    tg_cmd_status: "/status — plan, limity i ustawienia powiadomień",
    tg_cmd_add: "/dodaj — dodaj nowe wyszukiwanie (link)",
    tg_cmd_list: "/lista — lista Twoich wyszukiwań",
    tg_cmd_remove: "/usun ID — usuń wyszukiwanie o podanym ID",
    tg_cmd_onoff: "/on / /off — włącz/wyłącz powiadomienia na czacie",
    tg_cmd_mode: "/pojedyncze / /zbiorcze — tryb powiadomień na czacie",
    tg_cmd_mode_id:
      "/pojedyncze ID / /zbiorcze ID / /off ID / /on ID — ustawienia dla konkretnego linku",

    chat_status_prefix: "Status czatu:",
    chat_mode_prefix: "tryb czatu:",
    notif_hint_off: "Powiadomienia wyłączone — użyj /on.",
    notif_hint_on: "Powiadomienia włączone — użyj /off.",
    notif_off: "powiadomienia WYŁ.",
    notif_on: "powiadomienia WŁ.",

    settings_quiet_title: "🌙 Cisza nocna (brak powiadomień)",
    settings_quiet_desc: "Nie wysyłaj powiadomień w wybranych godzinach (w Twojej strefie czasowej)",
    settings_quiet_enable: "Włącz ciszę nocną",
    settings_quiet_from: "Od godziny:",
    settings_quiet_to: "Do godziny:",
    settings_quiet_save: "Zapisz ustawienia ciszy nocnej",
    settings_quiet_saving: "Zapisywanie...",
    settings_notif_title: "Powiadomienia",
    settings_notif_enabled: "Powiadomienia włączone",
    settings_notif_default_mode: "Domyślny tryb powiadomień",
    settings_notif_mode_single: "Pojedyncze (natychmiastowe)",
    settings_notif_mode_batch: "Zbiorcze",
    settings_notif_save: "Zapisz ustawienia powiadomień",
    settings_notif_saving: "Zapisywanie...",
    settings_back_to_search: "POWRÓT DO WYSZUKIWANIA",
    search_label: "Szukaj (nazwa / URL)",
    only_enabled: "tylko włączone",
    filter_btn: "Filtruj",
    clear_btn: "Wyczyść",

    col_id: "ID",
    col_status: "Status",
    col_notifications: "Powiadomienia",
    col_name: "Nazwa",
    col_source: "Źródło",
    col_offers: "Oferty",
    col_link: "Link",
    col_last_key: "Ostatni klucz",
    col_actions: "Akcje",

    open_btn: "Otwórz",
    reset_btn: "Usuń historię ofert",
    status_on_short: "Wł.",
    status_off_short: "Wył.",
    mode_off: "OFF",
    mode_single: "pojedynczo",
    mode_batch: "zbiorczo",
    mode_inherit: "dziedzicz",

    billing_plan_title: "Twój plan",
    billing_plan_prefix: "Plan:",
    billing_valid_until: "Ważny do:",
    billing_link_limit: "Limit linków:",
    billing_base: "baza:",
    billing_addons: "dodatki:",
    billing_packs: "paczki +10:",
    billing_enabled_links: "Włączone linki",
    billing_remaining: "Pozostało",
    billing_usage: "Wykorzystanie",
    billing_note_active:
      "To jest liczba aktywnych linków (active=true) vs limit planu.",

    billing_addons_title: "Dodatki (+10 linków)",
    billing_addons_desc:
      "Masz aktywny plan {plan}. Możesz dokupić addon +10 linków.",
    billing_buy_addon_btn: "Dokup +10 linków (1 klik)",
    billing_after_payment: "Po płatności wrócisz na /billing/success.",
    
    // Addon pack section (użytkownicy Platinum)
    billing_addon_pack_title: "Paczki dodatków (+10 linków)",
    billing_addon_pack_desc: "Masz plan Platinum. Zwiększ liczbę linków dokupując paczki dodatków.",
    billing_addon_pack_b1: "Każda paczka dodaje +10 linków do Twojego konta",
    billing_addon_pack_b2: "Natychmiastowa aktywacja po płatności",
    billing_addon_pack_b3: "Ważne przez cały okres Twojego planu",
    billing_addon_pack_note: "Po płatności wrócisz na /billing/success.",
    billing_buy_addon: "Kup paczkę +10 linków",
    
    // Sekcja upgrade
    billing_upgrade_title: "Ulepsz swój plan",
    billing_upgrade_label: "Zmień plan",
    billing_current_plan_label: "Obecny plan:",
    billing_after_click: "Po kliknięciu zostaniesz przekierowany do płatności Stripe.",
    
    // Komunikaty błędów
    billing_error: "Błąd:",
    billing_no_url: "Nie otrzymano adresu płatności. Spróbuj ponownie.",
    billing_loading: "Ładowanie...",
    
    notif_mode_label: "Tryb:",
    notif_set_for_link: "(ustawione dla linku)",
    notif_inherit_from_chat: "(dziedziczy z czatu)",
    chat_no_connection: "brak połączenia",
    chat_connect_hint: "wejdź do bota i użyj /start",
    billing_change_plan_title: "Zmień plan",
    billing_change_plan_desc: "Aktualny plan: {plan}. Dostępne zmiany: {upgrades}.",
    billing_select_plan_label: "Wybierz plan",
    billing_checkout_btn: "Przejdź do płatności (Stripe)",
    billing_no_changes: "Brak dostępnych zmian planu dla tego konta.",
  },

  de: {
    nav_links: "Suchen",
    settings_link: "Einstellungen",
    settings_title: "Einstellungen",
    settings_desc: "Konfigurieren Sie Ihre Sprache und Zeitzone.",
    settings_language_label: "Sprache",
    settings_timezone_label: "Zeitzone",
    settings_timezone_hint: "Wird für Benachrichtigungen und Verlauf verwendet.",
    settings_saved_lang: "✅ Sprache aktualisiert auf {lang}",
    settings_saved_tz: "✅ Zeitzone aktualisiert auf {tz}",
    settings_error: "Etwas ist schief gelaufen",
    settings_current_time: "Aktuelle Zeit:",
    settings_back_links: "Zurück zur Suchliste",
    nav_billing: "Abrechnung",
    links_title: "Suchen",
    billing_title: "Abrechnung",

    plan_lower: "plan:",
    active_lower: "aktiv:",
    until_prefix: "bis",

    tg_commands_title: "Telegram-Befehle",
    tg_commands_desc:
      "Du kannst die gleichen Aktionen auch im Telegram-Chat ausführen. Häufig verwendet:",
    tg_cmd_status: "/status — Tarif, Limits und Benachrichtigungseinstellungen",
    tg_cmd_add: "/dodaj — neue Suche hinzufügen (Link)",
    tg_cmd_list: "/lista — deine Suchen anzeigen",
    tg_cmd_remove: "/usun ID — Suche per ID löschen",
    tg_cmd_onoff: "/on / /off — Benachrichtigungen im Chat an/aus",
    tg_cmd_mode: "/pojedyncze / /zbiorcze — Benachrichtigungsmodus im Chat",
    tg_cmd_mode_id:
      "/pojedyncze ID / /zbiorcze ID / /off ID / /on ID — Einstellungen für einen Link",

    chat_status_prefix: "Chat-Status:",
    chat_mode_prefix: "Chat-Modus:",
    notif_hint_off: "Benachrichtigungen sind AUS — nutze /on.",
    notif_hint_on: "Benachrichtigungen sind AN — nutze /off.",
    notif_off: "Benachrichtigungen AUS",
    notif_on: "Benachrichtigungen AN",

    links_list_desc: "Liste deiner überwachten Links und Schnellaktionen.",
    search_label: "Suche (Name / URL)",
    only_enabled: "nur aktiv",
    filter_btn: "Filtern",
    clear_btn: "Leeren",

    col_id: "ID",
    col_status: "Status",
    col_notifications: "Benachrichtigungen",
    col_name: "Name",
    col_source: "Quelle",
    col_offers: "Angebote",
    col_link: "Link",
    col_last_key: "Letzter Schlüssel",
    col_actions: "Aktionen",

    open_btn: "Öffnen",
    reset_btn: "Angebotshistorie löschen",
    status_on_short: "AN",
    status_off_short: "AUS",
    mode_off: "OFF",
    mode_single: "einzeln",
    mode_batch: "gebündelt",
    settings_quiet_title: "🌙 Ruhezeiten (keine Benachrichtigungen)",
    settings_quiet_desc: "Keine Benachrichtigungen während der ausgewählten Stunden senden (in Ihrer Zeitzone)",
    settings_quiet_enable: "Ruhezeiten aktivieren",
    settings_quiet_from: "Von Stunde:",
    settings_quiet_to: "Bis Stunde:",
    settings_quiet_save: "Ruhezeiten-Einstellungen speichern",
    settings_quiet_saving: "Speichern...",
    settings_notif_title: "Benachrichtigungen",
    settings_notif_enabled: "Benachrichtigungen aktiviert",
    settings_notif_default_mode: "Standard-Benachrichtigungsmodus",
    settings_notif_mode_single: "Einzeln (sofort)",
    settings_notif_mode_batch: "Gesammelt",
    settings_notif_save: "Benachrichtigungseinstellungen speichern",
    settings_notif_saving: "Speichern...",
    settings_back_to_search: "ZURÜCK ZUR SUCHE",
    mode_inherit: "erben",

    billing_plan_title: "Dein Tarif",
    billing_plan_prefix: "Tarif:",
    billing_valid_until: "Gültig bis:",
    billing_link_limit: "Link-Limit:",
    billing_base: "Basis:",
    billing_addons: "Add-ons:",
    billing_packs: "Pakete +10:",
    billing_enabled_links: "Aktive Links",
    billing_remaining: "Verbleibend",
    billing_usage: "Auslastung",
    billing_note_active:
      "Das ist die Anzahl aktiver Links (active=true) im Verhältnis zum Tarif-Limit.",

    billing_addons_title: "Add-ons (+10 Links)",
    billing_addons_desc:
      "Du hast einen aktiven {plan}-Tarif. Du kannst ein Add-on +10 Links kaufen.",
    billing_buy_addon_btn: "+10 Links kaufen (1 Klick)",
    billing_after_payment: "Nach der Zahlung wirst du zu /billing/success zurückgeleitet.",
    
    // Addon pack section (Platinum users)
    billing_addon_pack_title: "Add-on-Pakete (+10 Links)",
    billing_addon_pack_desc: "Du hast den Platinum-Tarif. Erweitere deine Link-Kapazität mit Add-on-Paketen.",
    billing_addon_pack_b1: "Jedes Paket fügt +10 Links zu deinem Konto hinzu",
    billing_addon_pack_b2: "Sofortige Aktivierung nach Zahlung",
    billing_addon_pack_b3: "Gültig für die Dauer deines Tarifs",
    billing_addon_pack_note: "Nach der Zahlung wirst du zu /billing/success zurückgeleitet.",
    billing_buy_addon: "+10 Links Paket kaufen",
    
    // Upgrade section
    billing_upgrade_title: "Tarif upgraden",
    billing_upgrade_label: "Tarif wechseln",
    billing_current_plan_label: "Aktueller Tarif:",
    billing_after_click: "Nach dem Klicken wirst du zum Stripe-Checkout weitergeleitet.",
    
    // Error messages
    billing_error: "Fehler:",
    billing_no_url: "Keine Checkout-URL erhalten. Bitte versuche es erneut.",
    billing_loading: "Lädt...",
    
    notif_mode_label: "Modus:",
    notif_set_for_link: "(für diesen Link gesetzt)",
    notif_inherit_from_chat: "(vom Chat geerbt)",
    chat_no_connection: "keine Verbindung",
    chat_connect_hint: "öffne den Bot und nutze /start",
    billing_change_plan_title: "Plan ändern",
    billing_change_plan_desc: "Aktueller Plan: {plan}. Verfügbare Upgrades: {upgrades}.",
    billing_select_plan_label: "Plan auswählen",
    billing_checkout_btn: "Zur Kasse (Stripe)",
    billing_no_changes: "Keine Planänderungen für dieses Konto verfügbar.",
  },

  fr: {
    nav_links: "Recherches",
    settings_link: "Paramètres",
    settings_title: "Paramètres",
    settings_desc: "Configurez votre langue et votre fuseau horaire.",
    settings_language_label: "Langue",
    settings_timezone_label: "Fuseau horaire",
    settings_timezone_hint: "Utilisé pour les notifications et l'historique.",
    settings_saved_lang: "✅ Langue mise à jour vers {lang}",
    settings_saved_tz: "✅ Fuseau horaire mis à jour à {tz}",
    settings_error: "Une erreur s'est produite",
    settings_current_time: "Heure actuelle:",
    settings_back_links: "Retour à la liste",
    nav_billing: "Facturation",
    links_title: "Recherches",
    billing_title: "Facturation",

    plan_lower: "forfait :",
    active_lower: "actifs :",
    until_prefix: "jusqu’au",

    tg_commands_title: "Commandes Telegram",
    tg_commands_desc:
      "Vous pouvez faire les mêmes actions depuis le chat Telegram. Les plus utilisées :",
    tg_cmd_status:
      "/status — forfait, limites et paramètres des notifications",
    tg_cmd_add: "/dodaj — ajouter une nouvelle recherche (lien)",
    tg_cmd_list: "/lista — liste de vos recherches",
    tg_cmd_remove: "/usun ID — supprimer une recherche par ID",
    tg_cmd_onoff:
      "/on / /off — activer/désactiver les notifications dans ce chat",
    tg_cmd_mode:
      "/pojedyncze / /zbiorcze — mode des notifications dans ce chat",
    tg_cmd_mode_id:
      "/pojedyncze ID / /zbiorcze ID / /off ID / /on ID — paramètres pour un lien",

    chat_status_prefix: "Statut du chat :",
    chat_mode_prefix: "mode du chat :",
    notif_hint_off: "Notifications DÉSACTIVÉES — utilisez /on.",
    notif_hint_on: "Notifications ACTIVÉES — utilisez /off.",
    notif_off: "notifications DÉSACTIVÉES",
    notif_on: "notifications ACTIVÉES",

    links_list_desc: "Liste de vos liens suivis et actions rapides.",
    search_label: "Rechercher (nom / URL)",
    only_enabled: "seulement actifs",
    filter_btn: "Filtrer",
    clear_btn: "Effacer",

    col_id: "ID",
    col_status: "Statut",
    col_notifications: "Notifications",
    col_name: "Nom",
    col_source: "Source",
    col_offers: "Offres",
    col_link: "Lien",
    col_last_key: "Dernière clé",
    col_actions: "Actions",

    open_btn: "Ouvrir",
    reset_btn: "Effacer l’historique des offres",
    status_on_short: "ON",
    status_off_short: "OFF",
    settings_quiet_title: "🌙 Heures de silence (pas de notifications)",
    settings_quiet_desc: "Ne pas envoyer de notifications pendant les heures sélectionnées (dans votre fuseau horaire)",
    settings_quiet_enable: "Activer les heures de silence",
    settings_quiet_from: "De l'heure :",
    settings_quiet_to: "À l'heure :",
    settings_quiet_save: "Enregistrer les paramètres des heures de silence",
    settings_quiet_saving: "Enregistrement...",
    settings_notif_title: "Notifications",
    settings_notif_enabled: "Notifications activées",
    settings_notif_default_mode: "Mode de notification par défaut",
    settings_notif_mode_single: "Unique (immédiat)",
    settings_notif_mode_batch: "Groupe",
    settings_notif_save: "Enregistrer les paramètres de notification",
    settings_notif_saving: "Enregistrement...",
    settings_back_to_search: "RETOUR À LA RECHERCHE",
    mode_off: "OFF",
    mode_single: "unitaire",
    mode_batch: "groupé",
    mode_inherit: "hériter",

    billing_plan_title: "Votre forfait",
    billing_plan_prefix: "Forfait :",
    billing_valid_until: "Valable jusqu’au :",
    billing_link_limit: "Limite de liens :",
    billing_base: "base :",
    billing_addons: "options :",
    billing_packs: "packs +10 :",
    billing_enabled_links: "Liens activés",
    billing_remaining: "Restant",
    billing_usage: "Utilisation",
    billing_note_active:
      "C’est le nombre de liens actifs (active=true) par rapport à la limite du forfait.",

    billing_addons_title: "Options (+10 liens)",
    billing_addons_desc:
      "Vous avez un forfait {plan} actif. Vous pouvez acheter une option +10 liens.",
    billing_buy_addon_btn: "Acheter +10 liens (1 clic)",
    billing_after_payment:
      "Après le paiement, vous serez redirigé vers /billing/success.",
    
    // Addon pack section (Platinum users)
    billing_addon_pack_title: "Packs complémentaires (+10 liens)",
    billing_addon_pack_desc: "Vous avez le forfait Platinum. Élargissez votre capacité de liens avec des packs complémentaires.",
    billing_addon_pack_b1: "Chaque pack ajoute +10 liens à votre compte",
    billing_addon_pack_b2: "Activation immédiate après paiement",
    billing_addon_pack_b3: "Valable pendant toute la durée de votre forfait",
    billing_addon_pack_note: "Après le paiement, vous reviendrez sur /billing/success.",
    billing_buy_addon: "Acheter un pack +10 liens",
    
    // Upgrade section
    billing_upgrade_title: "Améliorez votre forfait",
    billing_upgrade_label: "Changer de forfait",
    billing_current_plan_label: "Forfait actuel:",
    billing_after_click: "Après avoir cliqué, vous serez redirigé vers la caisse Stripe.",
    
    // Error messages
    billing_error: "Erreur:",
    billing_no_url: "URL de paiement non reçue. Veuillez réessayer.",
    billing_loading: "Chargement...",
    
    notif_mode_label: "Mode :",
    notif_set_for_link: "(défini pour ce lien)",
    notif_inherit_from_chat: "(hérité du chat)",
    chat_no_connection: "pas de connexion",
    chat_connect_hint: "ouvre le bot et utilise /start",
    billing_change_plan_title: "Changer de forfait",
    billing_change_plan_desc: "Forfait actuel : {plan}. Mises à niveau disponibles : {upgrades}.",
    billing_select_plan_label: "Choisir un forfait",
    billing_checkout_btn: "Aller au paiement (Stripe)",
    billing_no_changes: "Aucun changement de forfait disponible pour ce compte.",
  },

  es: {
    nav_links: "Búsquedas",
    settings_link: "Configuración",
    settings_title: "Configuración",
    settings_desc: "Configure su idioma y zona horaria.",
    settings_language_label: "Idioma",
    settings_timezone_label: "Zona horaria",
    settings_timezone_hint: "Se utiliza para notificaciones e historial.",
    settings_saved_lang: "✅ Idioma actualizado a {lang}",
    settings_saved_tz: "✅ Zona horaria actualizada a {tz}",
    settings_error: "Algo salió mal",
    settings_current_time: "Hora actual:",
    settings_back_links: "Volver a la lista",
    nav_billing: "Facturación",
    links_title: "Búsquedas",
    billing_title: "Facturación",

    plan_lower: "plan:",
    active_lower: "activos:",
    until_prefix: "hasta",

    tg_commands_title: "Comandos de Telegram",
    tg_commands_desc:
      "Puedes hacer las mismas acciones desde el chat de Telegram. Más usados:",
    tg_cmd_status:
      "/status — plan, límites y ajustes de notificaciones",
    tg_cmd_add: "/dodaj — añadir una nueva búsqueda (enlace)",
    tg_cmd_list: "/lista — lista de tus búsquedas",
    tg_cmd_remove: "/usun ID — eliminar una búsqueda por ID",
    tg_cmd_onoff:
      "/on / /off — activar/desactivar notificaciones en este chat",
    tg_cmd_mode:
      "/pojedyncze / /zbiorcze — modo de notificaciones en este chat",
    tg_cmd_mode_id:
      "/pojedyncze ID / /zbiorcze ID / /off ID / /on ID — ajustes para un enlace",

    chat_status_prefix: "Estado del chat:",
    chat_mode_prefix: "modo del chat:",
    notif_hint_off: "Notificaciones DESACTIVADAS — usa /on.",
    notif_hint_on: "Notificaciones ACTIVADAS — usa /off.",
    notif_off: "notificaciones DESACTIVADAS",
    notif_on: "notificaciones ACTIVADAS",

    links_list_desc: "Lista de tus enlaces monitoreados y acciones rápidas.",
    search_label: "Buscar (nombre / URL)",
    only_enabled: "solo activos",
    filter_btn: "Filtrar",
    clear_btn: "Limpiar",

    col_id: "ID",
    col_status: "Estado",
    col_notifications: "Notificaciones",
    col_name: "Nombre",
    col_source: "Fuente",
    col_offers: "Ofertas",
    col_link: "Enlace",
    col_last_key: "Última clave",
    col_actions: "Acciones",

    open_btn: "Abrir",
    reset_btn: "Borrar el historial de ofertas",
    status_on_short: "ON",
    status_off_short: "OFF",
    settings_quiet_title: "🌙 Horas silenciosas (sin notificaciones)",
    settings_quiet_desc: "No enviar notificaciones durante las horas seleccionadas (en su zona horaria)",
    settings_quiet_enable: "Activar horas silenciosas",
    settings_quiet_from: "Desde hora:",
    settings_quiet_to: "Hasta hora:",
    settings_quiet_save: "Guardar configuración de horas silenciosas",
    settings_quiet_saving: "Guardando...",
    settings_notif_title: "Notificaciones",
    settings_notif_enabled: "Notificaciones activadas",
    settings_notif_default_mode: "Modo de notificación predeterminado",
    settings_notif_mode_single: "Individual (inmediato)",
    settings_notif_mode_batch: "Lote",
    settings_notif_save: "Guardar configuración de notificaciones",
    settings_notif_saving: "Guardando...",
    settings_back_to_search: "VOLVER A LA BÚSQUEDA",
    mode_off: "OFF",
    mode_single: "individual",
    mode_batch: "agrupado",
    mode_inherit: "heredar",

    billing_plan_title: "Tu plan",
    billing_plan_prefix: "Plan:",
    billing_valid_until: "Válido hasta:",
    billing_link_limit: "Límite de enlaces:",
    billing_base: "base:",
    billing_addons: "extras:",
    billing_packs: "paquetes +10:",
    billing_enabled_links: "Enlaces activos",
    billing_remaining: "Restante",
    billing_usage: "Uso",
    billing_note_active:
      "Es el número de enlaces activos (active=true) vs el límite del plan.",

    billing_addons_title: "Extras (+10 enlaces)",
    billing_addons_desc:
      "Tienes un plan {plan} activo. Puedes comprar un extra +10 enlaces.",
    billing_buy_addon_btn: "Comprar +10 enlaces (1 clic)",
    billing_after_payment: "Después del pago volverás a /billing/success.",
    
    // Addon pack section (Platinum users)
    billing_addon_pack_title: "Paquetes adicionales (+10 enlaces)",
    billing_addon_pack_desc: "Tienes el plan Platinum. Amplía tu capacidad de enlaces con paquetes adicionales.",
    billing_addon_pack_b1: "Cada paquete añade +10 enlaces a tu cuenta",
    billing_addon_pack_b2: "Activación inmediata después del pago",
    billing_addon_pack_b3: "Válido durante la duración de tu plan",
    billing_addon_pack_note: "Después del pago volverás a /billing/success.",
    billing_buy_addon: "Comprar paquete +10 enlaces",
    
    // Upgrade section
    billing_upgrade_title: "Mejora tu plan",
    billing_upgrade_label: "Cambiar plan",
    billing_current_plan_label: "Plan actual:",
    billing_after_click: "Después de hacer clic, serás redirigido al pago de Stripe.",
    
    // Error messages
    billing_error: "Error:",
    billing_no_url: "No se recibió URL de pago. Inténtalo de nuevo.",
    billing_loading: "Cargando...",
    
    notif_mode_label: "Modo:",
    notif_set_for_link: "(configurado para este enlace)",
    notif_inherit_from_chat: "(heredado del chat)",
    chat_no_connection: "sin conexión",
    chat_connect_hint: "abre el bot y usa /start",
    billing_change_plan_title: "Cambiar plan",
    billing_change_plan_desc: "Plan actual: {plan}. Cambios disponibles: {upgrades}.",
    billing_select_plan_label: "Elegir plan",
    billing_checkout_btn: "Ir a pagar (Stripe)",
    billing_no_changes: "No hay cambios de plan disponibles para esta cuenta.",
  },

  it: {
    nav_links: "Ricerche",
    settings_link: "Impostazioni",
    settings_title: "Impostazioni",
    settings_desc: "Configura la tua lingua e il fuso orario.",
    settings_language_label: "Lingua",
    settings_timezone_label: "Fuso orario",
    settings_timezone_hint: "Utilizzato per notifiche e cronologia.",
    settings_saved_lang: "✅ Lingua aggiornata a {lang}",
    settings_saved_tz: "✅ Fuso orario aggiornato a {tz}",
    settings_error: "Qualcosa è andato storto",
    settings_current_time: "Ora corrente:",
    settings_back_links: "Torna all'elenco",
    nav_billing: "Fatturazione",
    links_title: "Ricerche",
    billing_title: "Fatturazione",

    plan_lower: "piano:",
    active_lower: "attivi:",
    until_prefix: "fino al",

    tg_commands_title: "Comandi Telegram",
    tg_commands_desc:
      "Puoi fare le stesse azioni dalla chat di Telegram. Più usati:",
    tg_cmd_status:
      "/status — piano, limiti e impostazioni notifiche",
    tg_cmd_add: "/dodaj — aggiungi una nuova ricerca (link)",
    tg_cmd_list: "/lista — elenco delle tue ricerche",
    tg_cmd_remove: "/usun ID — elimina una ricerca per ID",
    tg_cmd_onoff:
      "/on / /off — abilita/disabilita notifiche in questa chat",
    tg_cmd_mode:
      "/pojedyncze / /zbiorcze — modalità notifiche in questa chat",
    tg_cmd_mode_id:
      "/pojedyncze ID / /zbiorcze ID / /off ID / /on ID — impostazioni per un link",

    chat_status_prefix: "Stato chat:",
    chat_mode_prefix: "modalità chat:",
    notif_hint_off: "Notifiche DISATTIVATE — usa /on.",
    notif_hint_on: "Notifiche ATTIVATE — usa /off.",
    notif_off: "notifiche DISATTIVATE",
    notif_on: "notifiche ATTIVATE",

    links_list_desc: "Elenco dei link monitorati e azioni rapide.",
    search_label: "Cerca (nome / URL)",
    only_enabled: "solo attivi",
    filter_btn: "Filtra",
    clear_btn: "Pulisci",

    col_id: "ID",
    col_status: "Stato",
    col_notifications: "Notifiche",
    col_name: "Nome",
    col_source: "Fonte",
    col_offers: "Offerte",
    col_link: "Link",
    col_last_key: "Ultima chiave",
    col_actions: "Azioni",

    open_btn: "Apri",
    reset_btn: "Cancella lo storico delle offerte",
    status_on_short: "ON",
    status_off_short: "OFF",
    settings_quiet_title: "🌙 Ore silenziose (nessuna notifica)",
    settings_quiet_desc: "Non inviare notifiche durante le ore selezionate (nel tuo fuso orario)",
    settings_quiet_enable: "Attiva ore silenziose",
    settings_quiet_from: "Dall'ora:",
    settings_quiet_to: "All'ora:",
    settings_quiet_save: "Salva impostazioni ore silenziose",
    settings_quiet_saving: "Salvataggio...",
    settings_notif_title: "Notifiche",
    settings_notif_enabled: "Notifiche attivate",
    settings_notif_default_mode: "Modalità notifica predefinita",
    settings_notif_mode_single: "Singola (immediata)",
    settings_notif_mode_batch: "Gruppo",
    settings_notif_save: "Salva impostazioni notifiche",
    settings_notif_saving: "Salvataggio...",
    settings_back_to_search: "TORNA ALLA RICERCA",
    mode_off: "OFF",
    mode_single: "singolo",
    mode_batch: "raggruppato",
    mode_inherit: "eredita",

    billing_plan_title: "Il tuo piano",
    billing_plan_prefix: "Piano:",
    billing_valid_until: "Valido fino al:",
    billing_link_limit: "Limite link:",
    billing_base: "base:",
    billing_addons: "extra:",
    billing_packs: "pacchetti +10:",
    billing_enabled_links: "Link attivi",
    billing_remaining: "Rimanenti",
    billing_usage: "Utilizzo",
    billing_note_active:
      "È il numero di link attivi (active=true) rispetto al limite del piano.",

    billing_addons_title: "Extra (+10 link)",
    billing_addons_desc:
      "Hai un piano {plan} attivo. Puoi acquistare un extra +10 link.",
    billing_buy_addon_btn: "Acquista +10 link (1 clic)",
    billing_after_payment: "Dopo il pagamento tornerai su /billing/success.",
    
    // Addon pack section (Platinum users)
    billing_addon_pack_title: "Pacchetti aggiuntivi (+10 link)",
    billing_addon_pack_desc: "Hai il piano Platinum. Espandi la tua capacità di link con pacchetti aggiuntivi.",
    billing_addon_pack_b1: "Ogni pacchetto aggiunge +10 link al tuo account",
    billing_addon_pack_b2: "Attivazione immediata dopo il pagamento",
    billing_addon_pack_b3: "Valido per la durata del tuo piano",
    billing_addon_pack_note: "Dopo il pagamento tornerai su /billing/success.",
    billing_buy_addon: "Acquista pacchetto +10 link",
    
    // Upgrade section
    billing_upgrade_title: "Aggiorna il tuo piano",
    billing_upgrade_label: "Cambia piano",
    billing_current_plan_label: "Piano attuale:",
    billing_after_click: "Dopo aver cliccato, sarai reindirizzato al checkout Stripe.",
    
    // Error messages
    billing_error: "Errore:",
    billing_no_url: "URL di pagamento non ricevuto. Riprova.",
    billing_loading: "Caricamento...",
    
    notif_mode_label: "Modalità:",
    notif_set_for_link: "(impostato per questo link)",
    notif_inherit_from_chat: "(ereditato dalla chat)",
    chat_no_connection: "nessuna connessione",
    chat_connect_hint: "apri il bot e usa /start",
    billing_change_plan_title: "Cambia piano",
    billing_change_plan_desc: "Piano attuale: {plan}. Upgrade disponibili: {upgrades}.",
    billing_select_plan_label: "Scegli piano",
    billing_checkout_btn: "Vai al pagamento (Stripe)",
    billing_no_changes: "Nessun cambio piano disponibile per questo account.",
  },

  pt: {
    nav_links: "Pesquisas",
    settings_link: "Configurações",
    settings_title: "Configurações",
    settings_desc: "Configure seu idioma e fuso horário.",
    settings_language_label: "Idioma",
    settings_timezone_label: "Fuso horário",
    settings_timezone_hint: "Usado para notificações e histórico.",
    settings_saved_lang: "✅ Idioma atualizado para {lang}",
    settings_saved_tz: "✅ Fuso horário atualizado para {tz}",
    settings_error: "Algo deu errado",
    settings_current_time: "Hora atual:",
    settings_back_links: "Voltar à lista",
    nav_billing: "Faturação",
    links_title: "Pesquisas",
    billing_title: "Faturação",

    plan_lower: "plano:",
    active_lower: "ativos:",
    until_prefix: "até",

    tg_commands_title: "Comandos do Telegram",
    tg_commands_desc:
      "Você pode fazer as mesmas ações pelo chat do Telegram. Mais usados:",
    tg_cmd_status:
      "/status — plano, limites e definições de notificações",
    tg_cmd_add: "/dodaj — adicionar uma nova pesquisa (link)",
    tg_cmd_list: "/lista — lista das suas pesquisas",
    tg_cmd_remove: "/usun ID — remover uma pesquisa por ID",
    tg_cmd_onoff:
      "/on / /off — ativar/desativar notificações neste chat",
    tg_cmd_mode:
      "/pojedyncze / /zbiorcze — modo de notificações neste chat",
    tg_cmd_mode_id:
      "/pojedyncze ID / /zbiorcze ID / /off ID / /on ID — definições para um link",

    chat_status_prefix: "Estado do chat:",
    chat_mode_prefix: "modo do chat:",
    notif_hint_off: "Notificações DESLIGADAS — use /on.",
    notif_hint_on: "Notificações LIGADAS — use /off.",
    notif_off: "notificações DESLIGADAS",
    notif_on: "notificações LIGADAS",

    links_list_desc: "Lista dos seus links monitorizados e ações rápidas.",
    search_label: "Pesquisar (nome / URL)",
    only_enabled: "apenas ativos",
    filter_btn: "Filtrar",
    clear_btn: "Limpar",

    col_id: "ID",
    col_status: "Estado",
    col_notifications: "Notificações",
    col_name: "Nome",
    col_source: "Fonte",
    col_offers: "Ofertas",
    col_link: "Link",
    col_last_key: "Última chave",
    col_actions: "Ações",

    open_btn: "Abrir",
    reset_btn: "Limpar o histórico de ofertas",
    status_on_short: "ON",
    status_off_short: "OFF",
    settings_quiet_title: "🌙 Horário silencioso (sem notificações)",
    settings_quiet_desc: "Não enviar notificações durante as horas selecionadas (no seu fuso horário)",
    settings_quiet_enable: "Ativar horário silencioso",
    settings_quiet_from: "Da hora:",
    settings_quiet_to: "Até hora:",
    settings_quiet_save: "Salvar configurações de horário silencioso",
    settings_quiet_saving: "Salvando...",
    settings_notif_title: "Notificações",
    settings_notif_enabled: "Notificações ativadas",
    settings_notif_default_mode: "Modo de notificação padrão",
    settings_notif_mode_single: "Individual (imediato)",
    settings_notif_mode_batch: "Lote",
    settings_notif_save: "Salvar configurações de notificação",
    settings_notif_saving: "Salvando...",
    settings_back_to_search: "VOLTAR À PESQUISA",
    mode_off: "OFF",
    mode_single: "único",
    mode_batch: "em lote",
    mode_inherit: "herdar",

    billing_plan_title: "O seu plano",
    billing_plan_prefix: "Plano:",
    billing_valid_until: "Válido até:",
    billing_link_limit: "Limite de links:",
    billing_base: "base:",
    billing_addons: "extras:",
    billing_packs: "pacotes +10:",
    billing_enabled_links: "Links ativos",
    billing_remaining: "Restantes",
    billing_usage: "Utilização",
    billing_note_active:
      "É o número de links ativos (active=true) vs o limite do plano.",

    billing_addons_title: "Extras (+10 links)",
    billing_addons_desc:
      "Você tem um plano {plan} ativo. Pode comprar um extra +10 links.",
    billing_buy_addon_btn: "Comprar +10 links (1 clique)",
    billing_after_payment: "Após o pagamento, voltará a /billing/success.",
    
    // Addon pack section (Platinum users)
    billing_addon_pack_title: "Pacotes adicionais (+10 links)",
    billing_addon_pack_desc: "Você tem o plano Platinum. Expanda sua capacidade de links com pacotes adicionais.",
    billing_addon_pack_b1: "Cada pacote adiciona +10 links à sua conta",
    billing_addon_pack_b2: "Ativação imediata após pagamento",
    billing_addon_pack_b3: "Válido durante a duração do seu plano",
    billing_addon_pack_note: "Após o pagamento, voltará a /billing/success.",
    billing_buy_addon: "Comprar pacote +10 links",
    
    // Upgrade section
    billing_upgrade_title: "Atualize seu plano",
    billing_upgrade_label: "Alterar plano",
    billing_current_plan_label: "Plano atual:",
    billing_after_click: "Após clicar, será redirecionado para o checkout Stripe.",
    
    // Error messages
    billing_error: "Erro:",
    billing_no_url: "URL de pagamento não recebida. Tente novamente.",
    billing_loading: "Carregando...",
    
    notif_mode_label: "Modo:",
    notif_set_for_link: "(definido para este link)",
    notif_inherit_from_chat: "(herdado do chat)",
    chat_no_connection: "sem ligação",
    chat_connect_hint: "abre o bot e usa /start",
    billing_change_plan_title: "Alterar plano",
    billing_change_plan_desc: "Plano atual: {plan}. Upgrades disponíveis: {upgrades}.",
    billing_select_plan_label: "Escolher plano",
    billing_checkout_btn: "Ir para pagamento (Stripe)",
    billing_no_changes: "Sem alterações de plano disponíveis para esta conta.",
  },

  ro: {
    nav_links: "Căutări",
    settings_link: "Setări",
    settings_title: "Setări",
    settings_desc: "Configurați limba și fusul orar.",
    settings_language_label: "Limba",
    settings_timezone_label: "Fusul orar",
    settings_timezone_hint: "Folosit pentru notificări și istoric.",
    settings_saved_lang: "✅ Limba actualizată la {lang}",
    settings_saved_tz: "✅ Fusul orar actualizat la {tz}",
    settings_error: "Ceva a mers greșit",
    settings_current_time: "Ora curentă:",
    settings_back_links: "Înapoi la listă",
    nav_billing: "Facturare",
    links_title: "Căutări",
    billing_title: "Facturare",

    plan_lower: "plan:",
    active_lower: "active:",
    until_prefix: "până la",

    tg_commands_title: "Comenzi Telegram",
    tg_commands_desc:
      "Poți face aceleași acțiuni din chatul Telegram. Cele mai folosite:",
    tg_cmd_status: "/status — plan, limite și setări notificări",
    tg_cmd_add: "/dodaj — adaugă o căutare nouă (link)",
    tg_cmd_list: "/lista — lista căutărilor tale",
    tg_cmd_remove: "/usun ID — șterge o căutare după ID",
    tg_cmd_onoff: "/on / /off — pornește/oprește notificările în chat",
    tg_cmd_mode: "/pojedyncze / /zbiorcze — modul notificărilor în chat",
    tg_cmd_mode_id:
      "/pojedyncze ID / /zbiorcze ID / /off ID / /on ID — setări pentru un link",

    chat_status_prefix: "Stare chat:",
    chat_mode_prefix: "mod chat:",
    notif_hint_off: "Notificări OPRITE — folosește /on.",
    notif_hint_on: "Notificări PORNITE — folosește /off.",
    notif_off: "notificări OPRITE",
    notif_on: "notificări PORNITE",

    links_list_desc: "Lista linkurilor monitorizate și acțiuni rapide.",
    search_label: "Caută (nume / URL)",
    only_enabled: "doar active",
    filter_btn: "Filtrează",
    clear_btn: "Șterge",

    col_id: "ID",
    col_status: "Stare",
    col_notifications: "Notificări",
    col_name: "Nume",
    col_source: "Sursă",
    col_offers: "Oferte",
    col_link: "Link",
    col_last_key: "Ultima cheie",
    col_actions: "Acțiuni",

    open_btn: "Deschide",
    reset_btn: "Șterge istoricul ofertelor",
    status_on_short: "ON",
    status_off_short: "OFF",
    mode_off: "OFF",
    mode_single: "individual",
    mode_batch: "grupat",
    settings_quiet_title: "🌙 Ore liniștite (fără notificări)",
    settings_quiet_desc: "Nu trimite notificări în orele selectate (în fusul tău orar)",
    settings_quiet_enable: "Activează ore liniștite",
    settings_quiet_from: "De la ora:",
    settings_quiet_to: "Până la ora:",
    settings_quiet_save: "Salvează setările orelor liniștite",
    settings_quiet_saving: "Salvare...",
    settings_notif_title: "Notificări",
    settings_notif_enabled: "Notificări activate",
    settings_notif_default_mode: "Modul implicit de notificare",
    settings_notif_mode_single: "Individual (imediat)",
    settings_notif_mode_batch: "Lot",
    settings_notif_save: "Salvează setările de notificare",
    settings_notif_saving: "Salvare...",
    settings_back_to_search: "ÎNAPOI LA CĂUTARE",
    mode_inherit: "moștenește",

    billing_plan_title: "Planul tău",
    billing_plan_prefix: "Plan:",
    billing_valid_until: "Valabil până la:",
    billing_link_limit: "Limită linkuri:",
    billing_base: "bază:",
    billing_addons: "add-on:",
    billing_packs: "pachete +10:",
    billing_enabled_links: "Linkuri active",
    billing_remaining: "Rămase",
    billing_usage: "Utilizare",
    billing_note_active:
      "Este numărul de linkuri active (active=true) vs limita planului.",

    billing_addons_title: "Add-on (+10 linkuri)",
    billing_addons_desc:
      "Ai un plan {plan} activ. Poți cumpăra un add-on +10 linkuri.",
    billing_buy_addon_btn: "Cumpără +10 linkuri (1 click)",
    billing_after_payment: "După plată revii la /billing/success.",
    notif_mode_label: "Mod:",
    notif_set_for_link: "(setat pentru acest link)",
    notif_inherit_from_chat: "(moștenit din chat)",
    chat_no_connection: "fără conexiune",
    chat_connect_hint: "deschide botul și folosește /start",
    billing_change_plan_title: "Schimbă planul",
    billing_change_plan_desc: "Plan curent: {plan}. Upgrade-uri disponibile: {upgrades}.",
    billing_select_plan_label: "Alege planul",
    billing_checkout_btn: "Mergi la plată (Stripe)",
    billing_no_changes: "Nu există schimbări de plan disponibile pentru acest cont.",
  },

  nl: {
    nav_links: "Zoekopdrachten",
    settings_link: "Instellingen",
    settings_title: "Instellingen",
    settings_desc: "Configureer uw taal en tijdzone.",
    settings_language_label: "Taal",
    settings_timezone_label: "Tijdzone",
    settings_timezone_hint: "Gebruikt voor meldingen en geschiedenis.",
    settings_saved_lang: "✅ Taal bijgewerkt naar {lang}",
    settings_saved_tz: "✅ Tijdzone bijgewerkt naar {tz}",
    settings_error: "Er is iets misgegaan",
    settings_current_time: "Huidige tijd:",
    settings_back_links: "Terug naar lijst",
    nav_billing: "Facturatie",
    links_title: "Zoekopdrachten",
    billing_title: "Facturatie",

    plan_lower: "plan:",
    active_lower: "actief:",
    until_prefix: "tot",

    tg_commands_title: "Telegram-commando’s",
    tg_commands_desc:
      "Je kunt dezelfde acties uitvoeren vanuit je Telegram-chat. Meest gebruikt:",
    tg_cmd_status: "/status — plan, limieten en notificatie-instellingen",
    tg_cmd_add: "/dodaj — nieuwe zoekopdracht toevoegen (link)",
    tg_cmd_list: "/lista — je zoekopdrachten",
    tg_cmd_remove: "/usun ID — zoekopdracht verwijderen op ID",
    tg_cmd_onoff: "/on / /off — meldingen in deze chat aan/uit",
    tg_cmd_mode: "/pojedyncze / /zbiorcze — meldingsmodus in deze chat",
    tg_cmd_mode_id:
      "/pojedyncze ID / /zbiorcze ID / /off ID / /on ID — instellingen per link",

    chat_status_prefix: "Chatstatus:",
    chat_mode_prefix: "chatmodus:",
    notif_hint_off: "Meldingen UIT — gebruik /on.",
    notif_hint_on: "Meldingen AAN — gebruik /off.",
    notif_off: "meldingen UIT",
    notif_on: "meldingen AAN",

    links_list_desc: "Lijst met gemonitorde links en snelle acties.",
    search_label: "Zoeken (naam / URL)",
    only_enabled: "alleen actief",
    filter_btn: "Filter",
    clear_btn: "Wissen",

    col_id: "ID",
    col_status: "Status",
    col_notifications: "Meldingen",
    col_name: "Naam",
    col_source: "Bron",
    col_offers: "Aanbiedingen",
    col_link: "Link",
    col_last_key: "Laatste sleutel",
    col_actions: "Acties",

    open_btn: "Openen",
    reset_btn: "Advertentiegeschiedenis wissen",
    status_on_short: "AAN",
    status_off_short: "UIT",
    mode_off: "OFF",
    mode_single: "los",
    mode_batch: "bundel",
    settings_quiet_title: "🌙 Stille uren (geen meldingen)",
    settings_quiet_desc: "Geen meldingen verzenden tijdens geselecteerde uren (in uw tijdzone)",
    settings_quiet_enable: "Stille uren inschakelen",
    settings_quiet_from: "Van uur:",
    settings_quiet_to: "Tot uur:",
    settings_quiet_save: "Instellingen stille uren opslaan",
    settings_quiet_saving: "Opslaan...",
    settings_notif_title: "Meldingen",
    settings_notif_enabled: "Meldingen ingeschakeld",
    settings_notif_default_mode: "Standaard meldingsmodus",
    settings_notif_mode_single: "Enkel (onmiddellijk)",
    settings_notif_mode_batch: "Batch",
    settings_notif_save: "Meldingsinstellingen opslaan",
    settings_notif_saving: "Opslaan...",
    settings_back_to_search: "TERUG NAAR ZOEKEN",
    mode_inherit: "erven",

    billing_plan_title: "Je plan",
    billing_plan_prefix: "Plan:",
    billing_valid_until: "Geldig tot:",
    billing_link_limit: "Linklimiet:",
    billing_base: "basis:",
    billing_addons: "add-ons:",
    billing_packs: "pakketten +10:",
    billing_enabled_links: "Actieve links",
    billing_remaining: "Resterend",
    billing_usage: "Gebruik",
    billing_note_active:
      "Dit is het aantal actieve links (active=true) vs de planlimiet.",

    billing_addons_title: "Add-ons (+10 links)",
    billing_addons_desc:
      "Je hebt een actief {plan}-plan. Je kunt een add-on +10 links kopen.",
    billing_buy_addon_btn: "+10 links kopen (1 klik)",
    billing_after_payment: "Na betaling ga je terug naar /billing/success.",
    
    // Addon pack section (Platinum users)
    billing_addon_pack_title: "Add-on pakketten (+10 links)",
    billing_addon_pack_desc: "Je hebt het Platinum plan. Breid je linkcapaciteit uit met add-on pakketten.",
    billing_addon_pack_b1: "Elk pakket voegt +10 links toe aan je account",
    billing_addon_pack_b2: "Onmiddellijke activering na betaling",
    billing_addon_pack_b3: "Geldig voor de duur van je plan",
    billing_addon_pack_note: "Na betaling ga je terug naar /billing/success.",
    billing_buy_addon: "+10 links pakket kopen",
    
    // Upgrade section
    billing_upgrade_title: "Upgrade je plan",
    billing_upgrade_label: "Abonnement wijzigen",
    billing_current_plan_label: "Huidig plan:",
    billing_after_click: "Na het klikken word je doorgestuurd naar Stripe checkout.",
    
    // Error messages
    billing_error: "Fout:",
    billing_no_url: "Geen betaal-URL ontvangen. Probeer het opnieuw.",
    billing_loading: "Laden...",
    
    notif_mode_label: "Modus:",
    notif_set_for_link: "(ingesteld voor deze link)",
    notif_inherit_from_chat: "(overgenomen van chat)",
    chat_no_connection: "geen verbinding",
    chat_connect_hint: "open de bot en gebruik /start",
    billing_change_plan_title: "Abonnement wijzigen",
    billing_change_plan_desc: "Huidig abonnement: {plan}. Beschikbare upgrades: {upgrades}.",
    billing_select_plan_label: "Kies plan",
    billing_checkout_btn: "Naar betalen (Stripe)",
    billing_no_changes: "Geen abonnementswijzigingen beschikbaar voor dit account.",
  },

  cs: {
    nav_links: "Vyhledávání",
    settings_link: "Nastavení",
    settings_title: "Nastavení",
    settings_desc: "Nakonfigurujte svůj jazyk a časové pásmo.",
    settings_language_label: "Jazyk",
    settings_timezone_label: "Časové pásmo",
    settings_timezone_hint: "Používáno pro oznámení a historii.",
    settings_saved_lang: "✅ Jazyk aktualizován na {lang}",
    settings_saved_tz: "✅ Časové pásmo aktualizováno na {tz}",
    settings_error: "Něco se pokazilo",
    settings_current_time: "Aktuální čas:",
    settings_back_links: "Zpět na seznam",
    nav_billing: "Fakturace",
    links_title: "Vyhledávání",
    billing_title: "Fakturace",

    plan_lower: "plán:",
    active_lower: "aktivní:",
    until_prefix: "do",

    tg_commands_title: "Příkazy Telegramu",
    tg_commands_desc:
      "Stejné akce můžeš dělat i z Telegram chatu. Nejčastěji používané:",
    tg_cmd_status: "/status — plán, limity a nastavení oznámení",
    tg_cmd_add: "/dodaj — přidat nové vyhledávání (odkaz)",
    tg_cmd_list: "/lista — seznam tvých vyhledávání",
    tg_cmd_remove: "/usun ID — odstranit vyhledávání podle ID",
    tg_cmd_onoff: "/on / /off — zapnout/vypnout oznámení v chatu",
    tg_cmd_mode: "/pojedyncze / /zbiorcze — režim oznámení v chatu",
    tg_cmd_mode_id:
      "/pojedyncze ID / /zbiorcze ID / /off ID / /on ID — nastavení pro konkrétní odkaz",

    chat_status_prefix: "Stav chatu:",
    chat_mode_prefix: "režim chatu:",
    notif_hint_off: "Oznámení VYPNUTO — použij /on.",
    notif_hint_on: "Oznámení ZAPNUTO — použij /off.",
    notif_off: "oznámení VYPNUTO",
    notif_on: "oznámení ZAPNUTO",

    links_list_desc: "Seznam monitorovaných odkazů a rychlé akce.",
    search_label: "Hledat (název / URL)",
    only_enabled: "jen zapnuté",
    filter_btn: "Filtrovat",
    clear_btn: "Vymazat",

    col_id: "ID",
    col_status: "Stav",
    col_notifications: "Oznámení",
    col_name: "Název",
    col_source: "Zdroj",
    col_offers: "Nabídky",
    col_link: "Odkaz",
    col_last_key: "Poslední klíč",
    col_actions: "Akce",

    open_btn: "Otevřít",
    reset_btn: "Smazat historii nabídek",
    status_on_short: "ON",
    status_off_short: "OFF",
    mode_off: "OFF",
    mode_single: "jednotlivě",
    mode_batch: "hromadně",
    settings_quiet_title: "🌙 Tichý režim (žádná oznámení)",
    settings_quiet_desc: "Neposílat oznámení během vybraných hodin (ve vašem časovém pásmu)",
    settings_quiet_enable: "Zapnout tichý režim",
    settings_quiet_from: "Od hodiny:",
    settings_quiet_to: "Do hodiny:",
    settings_quiet_save: "Uložit nastavení tichého režimu",
    settings_quiet_saving: "Ukládání...",
    settings_notif_title: "Oznámení",
    settings_notif_enabled: "Oznámení zapnuta",
    settings_notif_default_mode: "Výchozí režim oznámení",
    settings_notif_mode_single: "Jednotlivé (okamžité)",
    settings_notif_mode_batch: "Dávkové",
    settings_notif_save: "Uložit nastavení oznámení",
    settings_notif_saving: "Ukládání...",
    settings_back_to_search: "ZPĚT NA VYHLEDÁVÁNÍ",
    mode_inherit: "dědit",

    billing_plan_title: "Tvůj plán",
    billing_plan_prefix: "Plán:",
    billing_valid_until: "Platí do:",
    billing_link_limit: "Limit odkazů:",
    billing_base: "základ:",
    billing_addons: "doplňky:",
    billing_packs: "balíčky +10:",
    billing_enabled_links: "Zapnuté odkazy",
    billing_remaining: "Zbývá",
    billing_usage: "Využití",
    billing_note_active:
      "Je to počet aktivních odkazů (active=true) vs limit plánu.",

    billing_addons_title: "Doplňky (+10 odkazů)",
    billing_addons_desc:
      "Máš aktivní plán {plan}. Můžeš dokoupit doplněk +10 odkazů.",
    billing_buy_addon_btn: "Dokoupit +10 odkazů (1 klik)",
    billing_after_payment: "Po platbě se vrátíš na /billing/success.",
    
    // Addon pack section (Platinum users)
    billing_addon_pack_title: "Doplňkové balíčky (+10 odkazů)",
    billing_addon_pack_desc: "Máš Platinum plán. Rozšiř svou kapacitu odkazů doplňkovými balíčky.",
    billing_addon_pack_b1: "Každý balíček přidá +10 odkazů k tvému účtu",
    billing_addon_pack_b2: "Okamžitá aktivace po platbě",
    billing_addon_pack_b3: "Platné po dobu trvání tvého plánu",
    billing_addon_pack_note: "Po platbě se vrátíš na /billing/success.",
    billing_buy_addon: "Koupit balíček +10 odkazů",
    
    // Upgrade section
    billing_upgrade_title: "Upgraduj svůj plán",
    billing_upgrade_label: "Změnit tarif",
    billing_current_plan_label: "Aktuální tarif:",
    billing_after_click: "Po kliknutí budeš přesměrován na Stripe checkout.",
    
    // Error messages
    billing_error: "Chyba:",
    billing_no_url: "Nebyla přijata URL platby. Zkus to znovu.",
    billing_loading: "Načítání...",
    
    notif_mode_label: "Režim:",
    notif_set_for_link: "(nastaveno pro tento odkaz)",
    notif_inherit_from_chat: "(zděděno z chatu)",
    chat_no_connection: "bez připojení",
    chat_connect_hint: "otevři bota a použij /start",
    billing_change_plan_title: "Změnit tarif",
    billing_change_plan_desc: "Aktuální tarif: {plan}. Dostupné změny: {upgrades}.",
    billing_select_plan_label: "Vyber tarif",
    billing_checkout_btn: "Přejít k platbě (Stripe)",
    billing_no_changes: "Pro tento účet nejsou dostupné změny tarifu.",
  },

  sk: {
    nav_links: "Vyhľadávania",
    settings_link: "Nastavenia",
    settings_title: "Nastavenia",
    settings_desc: "Nakonfigurujte svoj jazyk a časové pásmo.",
    settings_language_label: "Jazyk",
    settings_timezone_label: "Časové pásmo",
    settings_timezone_hint: "Používané pre notifikácie a históriu.",
    settings_saved_lang: "✅ Jazyk aktualizovaný na {lang}",
    settings_saved_tz: "✅ Časové pásmo aktualizované na {tz}",
    settings_error: "Niečo sa pokazilo",
    settings_current_time: "Aktuálny čas:",
    settings_back_links: "Späť na seznam",
    nav_billing: "Fakturácia",
    links_title: "Vyhľadávania",
    billing_title: "Fakturácia",

    plan_lower: "plán:",
    active_lower: "aktívne:",
    until_prefix: "do",

    tg_commands_title: "Telegram príkazy",
    tg_commands_desc:
      "Rovnaké akcie môžeš robiť aj z Telegram chatu. Najčastejšie:",
    tg_cmd_status: "/status — plán, limity a nastavenia notifikácií",
    tg_cmd_add: "/dodaj — pridať nové vyhľadávanie (link)",
    tg_cmd_list: "/lista — zoznam tvojich vyhľadávaní",
    tg_cmd_remove: "/usun ID — odstrániť vyhľadávanie podľa ID",
    tg_cmd_onoff: "/on / /off — zapnúť/vypnúť notifikácie v chate",
    tg_cmd_mode: "/pojedyncze / /zbiorcze — režim notifikácií v chate",
    tg_cmd_mode_id:
      "/pojedyncze ID / /zbiorcze ID / /off ID / /on ID — nastavenia pre konkrétny link",

    chat_status_prefix: "Stav chatu:",
    chat_mode_prefix: "režim chatu:",
    notif_hint_off: "Notifikácie VYPNUTÉ — použi /on.",
    notif_hint_on: "Notifikácie ZAPNUTÉ — použi /off.",
    notif_off: "notifikácie VYPNUTÉ",
    notif_on: "notifikácie ZAPNUTÉ",

    links_list_desc: "Zoznam monitorovaných linkov a rýchle akcie.",
    search_label: "Hľadať (názov / URL)",
    only_enabled: "iba zapnuté",
    filter_btn: "Filtrovať",
    clear_btn: "Vymazať",

    col_id: "ID",
    col_status: "Stav",
    col_notifications: "Notifikácie",
    col_name: "Názov",
    col_source: "Zdroj",
    col_offers: "Ponuky",
    col_link: "Link",
    col_last_key: "Posledný kľúč",
    col_actions: "Akcie",

    open_btn: "Otvoriť",
    reset_btn: "Vymazať históriu ponúk",
    status_on_short: "ON",
    status_off_short: "OFF",
    mode_off: "OFF",
    mode_single: "jednotlivo",
    mode_batch: "hromadne",
    settings_quiet_title: "🌙 Tichý režim (žiadne upozornenia)",
    settings_quiet_desc: "Neposielať upozornenia počas vybraných hodín (vo vašom časovom pásme)",
    settings_quiet_enable: "Zapnúť tichý režim",
    settings_quiet_from: "Od hodiny:",
    settings_quiet_to: "Do hodiny:",
    settings_quiet_save: "Uložiť nastavenia tichého režimu",
    settings_quiet_saving: "Ukladanie...",
    settings_notif_title: "Upozornenia",
    settings_notif_enabled: "Upozornenia zapnuté",
    settings_notif_default_mode: "Predvolený režim upozornení",
    settings_notif_mode_single: "Jednotlivé (okamžité)",
    settings_notif_mode_batch: "Dávkové",
    settings_notif_save: "Uložiť nastavenia upozornení",
    settings_notif_saving: "Ukladanie...",
    settings_back_to_search: "SPÄŤ NA VYHĽADÁVANIE",
    mode_inherit: "dediť",

    billing_plan_title: "Tvoj plán",
    billing_plan_prefix: "Plán:",
    billing_valid_until: "Platný do:",
    billing_link_limit: "Limit linkov:",
    billing_base: "základ:",
    billing_addons: "doplnky:",
    billing_packs: "balíky +10:",
    billing_enabled_links: "Zapnuté linky",
    billing_remaining: "Zostáva",
    billing_usage: "Využitie",
    billing_note_active:
      "Je to počet aktívnych linkov (active=true) vs limit plánu.",

    billing_addons_title: "Doplnky (+10 linkov)",
    billing_addons_desc:
      "Máš aktívny plán {plan}. Môžeš dokúpiť doplnok +10 linkov.",
    billing_buy_addon_btn: "Dokúpiť +10 linkov (1 klik)",
    billing_after_payment: "Po platbe sa vrátiš na /billing/success.",
    
    // Addon pack section (Platinum users)
    billing_addon_pack_title: "Doplnkové balíky (+10 linkov)",
    billing_addon_pack_desc: "Máš Platinum plán. Rozšír svoju kapacitu linkov doplnkovými balíkmi.",
    billing_addon_pack_b1: "Každý balík pridá +10 linkov k tvojmu účtu",
    billing_addon_pack_b2: "Okamžitá aktivácia po platbe",
    billing_addon_pack_b3: "Platné po dobu trvania tvojho plánu",
    billing_addon_pack_note: "Po platbe sa vrátiš na /billing/success.",
    billing_buy_addon: "Kúpiť balík +10 linkov",
    
    // Upgrade section
    billing_upgrade_title: "Upgraduj svoj plán",
    billing_upgrade_label: "Zmeniť plán",
    billing_current_plan_label: "Aktuálny plán:",
    billing_after_click: "Po kliknutí budeš presmerovaný na Stripe checkout.",
    
    // Error messages
    billing_error: "Chyba:",
    billing_no_url: "Nebola prijatá URL platby. Skús to znovu.",
    billing_loading: "Načítava sa...",
    
    notif_mode_label: "Režim:",
    notif_set_for_link: "(nastavené pre tento odkaz)",
    notif_inherit_from_chat: "(zdedené z chatu)",
    chat_no_connection: "bez pripojenia",
    chat_connect_hint: "otvor bota a použi /start",
    billing_change_plan_title: "Zmeniť plán",
    billing_change_plan_desc: "Aktuálny plán: {plan}. Dostupné zmeny: {upgrades}.",
    billing_select_plan_label: "Vyber plán",
    billing_checkout_btn: "Prejsť na platbu (Stripe)",
    billing_no_changes: "Pre tento účet nie sú dostupné zmeny plánu.",
  },
};

function getStr(lang: Lang, key: string, vars?: Vars) {
  const alias =
    key === "active" ? "active_lower" :
    key === "plan" ? "plan_lower" :
    key;

  const s = DICT[lang]?.[alias] ?? DICT.en?.[alias] ?? alias;
  return fmt(s, vars);
}

// t(lang) -> Proxy do L.key
// t(lang, "key") -> string
export function t(lang: Lang, key?: string, vars?: Vars): any {
  if (!key) {
    return new Proxy(
      {},
      {
        get: (_t, p) => getStr(lang, String(p)),
      }
    ) as Record<string, string>;
  }
  return getStr(lang, key, vars);
}

// helper: tf(lang)("key")
export function tf(lang: Lang) {
  return (key: string, vars?: Vars) => getStr(lang, key, vars);
}