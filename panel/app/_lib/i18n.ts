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
      "/pojedyncze_ID / /zbiorcze_ID / /off_ID / /on_ID — settings for a specific link",

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
      "/pojedyncze_ID / /zbiorcze_ID / /off_ID / /on_ID — ustawienia dla konkretnego linku",

    chat_status_prefix: "Status czatu:",
    chat_mode_prefix: "tryb czatu:",
    notif_hint_off: "Powiadomienia wyłączone — użyj /on.",
    notif_hint_on: "Powiadomienia włączone — użyj /off.",
    notif_off: "powiadomienia WYŁ.",
    notif_on: "powiadomienia WŁ.",

    links_list_desc:
      "Lista Twoich linków monitorowanych przez bota oraz szybkie akcje.",
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
      "/pojedyncze_ID / /zbiorcze_ID / /off_ID / /on_ID — Einstellungen für einen Link",

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
      "/pojedyncze_ID / /zbiorcze_ID / /off_ID / /on_ID — paramètres pour un lien",

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
      "/pojedyncze_ID / /zbiorcze_ID / /off_ID / /on_ID — ajustes para un enlace",

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
      "/pojedyncze_ID / /zbiorcze_ID / /off_ID / /on_ID — impostazioni per un link",

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
      "/pojedyncze_ID / /zbiorcze_ID / /off_ID / /on_ID — definições para um link",

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
      "/pojedyncze_ID / /zbiorcze_ID / /off_ID / /on_ID — setări pentru un link",

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
      "/pojedyncze_ID / /zbiorcze_ID / /off_ID / /on_ID — instellingen per link",

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
      "/pojedyncze_ID / /zbiorcze_ID / /off_ID / /on_ID — nastavení pro konkrétní odkaz",

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
      "/pojedyncze_ID / /zbiorcze_ID / /off_ID / /on_ID — nastavenia pre konkrétny link",

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