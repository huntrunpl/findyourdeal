/**
 * Command aliasing layer for Telegram bot
 * Maps user input (in various languages) to canonical command names
 * 
 * Format: per-language arrays for easy lookup
 * All commands in lowercase
 */

// Canonical commands → per-language aliases
export const COMMAND_ALIASES = {
  start: {
    en: ["start", "rozpocznij"],
    de: ["anfang"],
    fr: ["commencer"],
    it: ["inizia"],
    es: ["empezar"],
    pt: ["começar"],
    ro: ["început"],
    nl: ["beginnen"],
    cs: ["začít"],
    sk: ["začať"],
  },
  help: {
    en: ["help"],
    de: ["hilfe"],
    fr: ["aide"],
    it: ["aiuto"],
    es: ["ayuda"],
    pt: ["ajuda"],
    ro: ["ajutor"],
    nl: ["hulp"],
    cs: ["nápověda"],
    sk: ["pomoc", "pomoc"],
  },
  commands: {
    en: ["commands"],
    pl: ["komendy"],
    de: ["befehle"],
    fr: ["commandes"],
    it: ["comandi"],
    es: ["comandos"],
    pt: ["comandos"],
    ro: ["comenzi"],
    nl: ["opdrachten"],
    cs: ["příkazy"],
    sk: ["príkazy"],
  },
  status: {
    en: ["status"],
    pl: ["status", "stan"],
    de: ["status", "zustand"],
    fr: ["status", "état"],
    it: ["status", "stato"],
    es: ["status", "estado"],
    pt: ["status"],
    ro: ["status", "stare"],
    nl: ["status"],
    cs: ["status", "stav"],
    sk: ["status", "stav"],
  },
  panel: {
    en: ["panel"],
    pl: ["panel"],
    de: ["panel"],
    fr: ["panel", "panneau"],
    it: ["panel", "pannello"],
    es: ["panel"],
    pt: ["panel", "painel"],
    ro: ["panel", "panou"],
    nl: ["panel", "paneel"],
    cs: ["panel"],
    sk: ["panel"],
  },
  plany: {
    en: ["plans"],
    pl: ["plany"],
    de: ["plaene"],
    fr: ["plans", "forfaits"],
    it: ["piani"],
    es: ["planes"],
    pt: ["planos"],
    ro: ["planuri"],
    nl: ["plannen"],
    cs: ["plany", "tarify"],
    sk: ["plany"],
  },
  lista: {
    en: ["list"],
    pl: ["lista"],
    de: ["liste"],
    fr: ["liste"],
    it: ["lista", "elenco"],
    es: ["lista", "listar"],
    pt: ["lista"],
    ro: ["lista"],
    nl: ["lijst"],
    cs: ["seznam"],
    sk: ["zoznam"],
  },
  dodaj: {
    en: ["add"],
    pl: ["dodaj"],
    de: ["hinzufuegen"],
    fr: ["ajouter"],
    it: ["aggiungi"],
    es: ["agregar"],
    pt: ["adicionar"],
    ro: ["adauga"],
    nl: ["toevoegen"],
    cs: ["pridat"],
    sk: ["pridat"],
  },
  usun: {
    en: ["remove", "delete"],
    pl: ["usun"],
    de: ["entfernen"],
    fr: ["supprimer"],
    it: ["elimina"],
    es: ["eliminar"],
    pt: ["remover"],
    ro: ["sterge"],
    nl: ["verwijderen"],
    cs: ["odstranit"],
    sk: ["odstranit"],
  },
  nazwa: {
    en: ["name", "rename"],
    pl: ["nazwa"],
    de: ["name", "namen"],
    fr: ["nom", "renommer"],
    it: ["nome"],
    es: ["nombre", "renombrar"],
    pt: ["nome"],
    ro: ["nume"],
    nl: ["naam", "hernoemen"],
    cs: ["nazev", "prejmenovat"],
    sk: ["nazov", "premenovat"],
  },
  on: {
    en: ["on"],
    pl: ["wlacz"],
    de: ["ein", "einschalten"],
    fr: ["activer", "active"],
    it: ["attiva"],
    es: ["activar"],
    pt: ["ativar"],
    ro: ["porneste"],
    nl: ["aanzetten"],
    cs: ["zapnout"],
    sk: ["zapnut"],
  },
  off: {
    en: ["off"],
    pl: ["wylacz"],
    de: ["aus", "ausschalten"],
    fr: ["desactiver", "desactive"],
    it: ["disattiva"],
    es: ["desactivar"],
    pt: ["desativar"],
    ro: ["opreste"],
    nl: ["uitzetten"],
    cs: ["vypnout"],
    sk: ["vypnut"],
  },
  pojedyncze: {
    en: ["single"],
    pl: ["pojedyncze"],
    de: ["einzeln"],
    fr: ["unitaire"],
    it: ["singolo"],
    es: ["individual"],
    pt: ["unico"],
    nl: ["enkel"],
    cs: ["jednotlive"],
    sk: ["jednotlivo"],
  },
  zbiorcze: {
    en: ["batch", "grouped"],
    pl: ["zbiorcze"],
    de: ["paket"],
    fr: ["groupe"],
    it: ["raggruppato"],
    es: ["agrupado"],
    pt: ["lote"],
    ro: ["grupate"],
    nl: ["gebundeld"],
    cs: ["hromadne"],
    sk: ["hromadne"],
  },
  cisza: {
    en: ["quiet", "silent"],
    pl: ["cisza"],
    de: ["ruhe"],
    fr: ["silence"],
    it: ["silenzio"],
    es: ["silencio"],
    pt: ["silencio"],
    ro: ["tacere"],
    nl: ["stil"],
    cs: ["ticho"],
    sk: ["ticho"],
  },
  cisza_off: {
    en: ["quiet_off"],
    pl: ["cisza_off"],
    de: ["ruhe_aus"],
    fr: ["silence_off"],
    it: ["silenzio_off"],
    es: ["silencio_off"],
    pt: ["silencio_off"],
    ro: ["tacere_off"],
    nl: ["stil_uit"],
    cs: ["ticho_off"],
    sk: ["ticho_off"],
  },
  najnowsze: {
    en: ["latest", "recent"],
    pl: ["najnowsze"],
    de: ["neueste"],
    fr: ["recents"],
    it: ["recenti"],
    es: ["recientes"],
    pt: ["recentes"],
    ro: ["recente"],
    nl: ["nieuwste"],
    cs: ["nejnovejsi"],
    sk: ["najnovsie"],
  },
  najtansze: {
    en: ["cheapest", "lowest"],
    pl: ["najtansze"],
    de: ["billigste"],
    fr: ["moinscher"],
    it: ["economici"],
    es: ["baratos"],
    pt: ["baratos"],
    ro: ["ieftine"],
    nl: ["goedkoopste"],
    cs: ["nejlevnejsi"],
    sk: ["najlacnejsie"],
  },
  lang: {
    en: ["lang"],
    pl: ["lang", "jezyk"],
    de: ["lang", "sprache"],
    fr: ["lang", "langue"],
    it: ["lang", "lingua"],
    es: ["lang", "idioma"],
    pt: ["lang", "lingua"],
    ro: ["lang", "limba"],
    nl: ["lang", "taal"],
    cs: ["lang", "jazyk"],
    sk: ["lang", "jazyk"],
  },
  timezone: {
    en: ["timezone"],
    pl: ["timezone", "strefa"],
    de: ["timezone", "zeitzone"],
    fr: ["timezone", "fuseau"],
    it: ["timezone", "fuso"],
    es: ["timezone", "zona"],
    pt: ["timezone", "fuso"],
    ro: ["timezone", "fus"],
    nl: ["timezone", "tijdzone"],
    cs: ["timezone", "pasmo"],
    sk: ["timezone", "pasmo"],
  },
  max: {
    en: ["max"],
    pl: ["max", "maksimum"],
    de: ["max", "maximum"],
    fr: ["max", "maximum"],
    it: ["max", "massimo"],
    es: ["max", "maximo"],
    pt: ["max", "maximo"],
    ro: ["max", "maxim"],
    nl: ["max", "maximum"],
    cs: ["max", "maximum"],
    sk: ["max", "maximum"],
  },
  max_off: {
    en: ["clear_max"],
    pl: ["max_off"],
    de: ["max_aus"],
    fr: ["max_off"],
    it: ["max_off"],
    es: ["max_off"],
    pt: ["max_off"],
    ro: ["max_off"],
    nl: ["max_off"],
    cs: ["max_off"],
    sk: ["max_off"],
  },
  starter: {
    en: ["starter"],
  },
  growth: {
    en: ["growth"],
  },
  platinum: {
    en: ["platinum"],
  },
  addon10: {
    en: ["addon10"],
  },
  etykieta: {
    en: ["etykieta", "label", "etikett", "étiquette", "etichetta", "etiqueta", "rótulo", "etichetă", "label", "štítek"],
  },
  links: {
    en: ["links", "linki", "liens", "collegamenti", "enlaces", "ligações", "legături", "koppelingen", "odkazy"],
  },
  limity: {
    en: ["limity", "limits", "grenzen", "limites", "limiti", "límites", "limite"],
  },
  domyslnie: {
    en: ["domyslnie", "default", "standard", "par défaut", "predefinito", "defecto", "padrão", "implicit", "standaard", "výchozí"],
  },
  usun_uzytkownika: {
    en: ["usun_uzytkownika", "delete_user", "eliminar_usuario", "utilizator_șterge", "gebruiker_verwijderen"],
  },
  test_najnowsze: {
    en: ["test_najnowsze", "test_latest"],
  },
  debug_worker_links: {
    en: ["debug_worker_links"],
  },
  // ---------- Admin commands ----------
  help_admin: {
    en: ["help_admin"],
    pl: ["pomoc_admin"],
    de: ["hilfe_admin"],
    fr: ["aide_admin"],
    it: ["aiuto_admin"],
    es: ["ayuda_admin"],
    pt: ["ajuda_admin"],
    cs: ["napoveda_admin"],
    sk: ["pomoc_admin"],
    ro: ["ajutor_admin"],
    nl: ["hulp_admin"],
  },
  audit: {
    en: ["audit"],
    pl: ["audyt"],
    de: ["audit"],
    fr: ["audit"],
    it: ["audit"],
    es: ["auditoria"],
    pt: ["auditoria"],
    cs: ["audit"],
    sk: ["audit"],
    ro: ["audit"],
    nl: ["audit"],
  },
  reset_daily: {
    en: ["reset_daily"],
    pl: ["reset_dzienny"],
    de: ["reset_tag"],
    fr: ["reset_jour"],
    it: ["reset_giorno"],
    es: ["reset_dia"],
    pt: ["reset_dia"],
    cs: ["reset_den"],
    sk: ["reset_den"],
    ro: ["reset_zi"],
    nl: ["reset_dag"],
  },
  technik: {
    en: ["tech", "technik"],
    pl: ["technik"],
    de: ["technik"],
    fr: ["tech"],
    it: ["tech"],
    es: ["tech"],
    pt: ["tech"],
    cs: ["technik"],
    sk: ["technik"],
    ro: ["tech"],
    nl: ["tech"],
  },
  daj_admina: {
    en: ["grant_admin"],
    pl: ["daj_admina"],
    de: ["admin_geben"],
    fr: ["donner_admin"],
    it: ["dai_admin"],
    es: ["dar_admin"],
    pt: ["dar_admin"],
    cs: ["dej_admina"],
    sk: ["daj_admina"],
    ro: ["da_admin"],
    nl: ["geef_admin"],
  },
  usun_uzytkownika: {
    en: ["delete_user"],
    pl: ["usun_uzytkownika"],
    de: ["benutzer_loeschen"],
    fr: ["supprimer_utilisateur"],
    it: ["elimina_utente"],
    es: ["borrar_usuario"],
    pt: ["apagar_usuario"],
    cs: ["smazat_uzivatele"],
    sk: ["zmazat_uzivatela"],
    ro: ["sterge_utilizator"],
    nl: ["verwijder_gebruiker"],
  },
  debug: {
    en: ["debug"],
  },
};

/**
 * Generate dynamic help text with localized command names
 * @param {string} lang - Language code (e.g., "en", "pl", "de")
 * @param {function} t - i18n translation function
 * @returns {string} - Formatted help text with commands in user's language
 */
export function generateHelpText(lang, t) {
  // Get primary aliases for current language
  const lista = getPrimaryAlias("lista", lang);
  const usun = getPrimaryAlias("usun", lang);
  const dodaj = getPrimaryAlias("dodaj", lang);
  const status = getPrimaryAlias("status", lang);
  const panel = getPrimaryAlias("panel", lang);
  const nazwa = getPrimaryAlias("nazwa", lang);
  const on = getPrimaryAlias("on", lang);
  const off = getPrimaryAlias("off", lang);
  const single = getPrimaryAlias("pojedyncze", lang);
  const batch = getPrimaryAlias("zbiorcze", lang);
  const max = getPrimaryAlias("max", lang);
  const cisza = getPrimaryAlias("cisza", lang);
  const cisza_off = getPrimaryAlias("cisza_off", lang);
  const najnowsze = getPrimaryAlias("najnowsze", lang);
  const najtansze = getPrimaryAlias("najtansze", lang);
  const plany = getPrimaryAlias("plany", lang);
  const langCmd = getPrimaryAlias("lang", lang);
  
  // Build help text dynamically
  let help = t(lang, "cmd.help_greeting") + "\n\n";
  
  // Basic commands
  help += t(lang, "cmd.help_basic") + "\n";
  help += `/${lista} ${t(lang, "cmd.help_basic_lista_desc")}\n`;
  help += `/${usun} &lt;ID&gt; ${t(lang, "cmd.help_basic_usun_desc")}\n`;
  help += `/${dodaj} &lt;url&gt; [${t(lang, "cmd.help_basic_name")}] ${t(lang, "cmd.help_basic_dodaj_desc")}\n`;
  help += `/${status} ${t(lang, "cmd.help_basic_status_desc")}\n`;
  help += `/${panel} ${t(lang, "cmd.help_basic_panel_desc")}\n`;
  help += `/${nazwa} &lt;ID&gt; [${t(lang, "cmd.help_basic_name")}] ${t(lang, "cmd.help_basic_nazwa_desc")}\n\n`;
  
  // Notifications
  help += t(lang, "cmd.help_notif") + "\n";
  help += `/${on} ${t(lang, "cmd.help_notif_on_desc")}\n`;
  help += `/${off} ${t(lang, "cmd.help_notif_off_desc")}\n`;
  help += `/${single} ${t(lang, "cmd.help_notif_single_desc")}\n`;
  help += `/${batch} ${t(lang, "cmd.help_notif_batch_desc")}\n\n`;
  
  // Per-link controls
  help += t(lang, "cmd.help_perlink") + "\n";
  help += t(lang, "cmd.help_perlink_commands", { single, batch, off, on }) + "\n";
  help += `/${max} &lt;ID&gt; &lt;${t(lang, "cmd.help_value")}&gt; ${t(lang, "cmd.help_perlink_max_desc")}\n\n`;
  
  // Quiet hours
  help += t(lang, "cmd.help_quiet") + "\n";
  help += `/${cisza} ${t(lang, "cmd.help_quiet_show_desc")}\n`;
  help += `/${cisza} HH-HH ${t(lang, "cmd.help_quiet_set_desc")}\n`;
  help += `/${cisza_off} ${t(lang, "cmd.help_quiet_off_desc")}\n\n`;
  
  // History
  help += t(lang, "cmd.help_history") + "\n";
  help += `/${najnowsze} ${t(lang, "cmd.help_history_najnowsze_desc")}\n`;
  help += `/${najnowsze} &lt;ID&gt; ${t(lang, "cmd.help_history_najnowsze_id_desc")}\n`;
  help += `/${najtansze} ${t(lang, "cmd.help_history_najtansze_desc")}\n`;
  help += `/${najtansze} &lt;ID&gt; ${t(lang, "cmd.help_history_najtansze_id_desc")}\n\n`;
  
  // Plans
  help += t(lang, "cmd.help_plans") + "\n";
  help += `/${plany} ${t(lang, "cmd.help_plans_show_desc")}\n\n`;
  
  // Language
  help += t(lang, "cmd.help_lang") + "\n";
  help += `/${langCmd} &lt;${t(lang, "cmd.help_code")}&gt; ${t(lang, "cmd.help_lang_set_desc")}\n\n`;
  
  // Examples
  help += t(lang, "cmd.help_examples") + "\n";
  help += `<code>/${lista}</code>\n`;
  help += `<code>/${usun} 18</code>\n`;
  help += `<code>/${dodaj} https://www.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>\n`;
  help += `<code>/${najnowsze} 18</code>`;
  
  return help;
}

/**
 * Normalizes user command input to canonical form
 * @param {string} text - Raw message text (e.g., "/Status@BotName", "/stan")
 * @returns {string|null} - Canonical command name or null if not recognized
 */
export function normalizeCommand(text) {
  if (!text || typeof text !== 'string') return null;
  
  // Remove leading /
  let cmd = text.trim();
  if (cmd.startsWith('/')) cmd = cmd.slice(1);
  
  // Remove @BotName suffix
  const atIndex = cmd.indexOf('@');
  if (atIndex !== -1) cmd = cmd.slice(0, atIndex);
  
  // Extract first word (ignore arguments)
  const spaceIndex = cmd.indexOf(' ');
  if (spaceIndex !== -1) cmd = cmd.slice(0, spaceIndex);
  
  // Lowercase for comparison
  cmd = cmd.toLowerCase();
  
  // Find canonical command
  for (const [canonical, langAliases] of Object.entries(COMMAND_ALIASES)) {
    for (const aliases of Object.values(langAliases)) {
      if (aliases.includes(cmd)) {
        return canonical;
      }
    }
  }
  
  return null;
}

/**
 * Get primary (first) alias for a command in specified language
 * @param {string} canonical - Canonical command name (e.g., "usun", "dodaj")
 * @param {string} lang - Language code (e.g., "de", "fr", "it")
 * @returns {string} - Primary alias for that language, or canonical if not found
 */
export function getPrimaryAlias(canonical, lang) {
  const langAliases = COMMAND_ALIASES[canonical];
  if (!langAliases) return canonical;
  
  // Try specified language first
  if (langAliases[lang] && langAliases[lang].length > 0) {
    return langAliases[lang][0];
  }
  
  // Fall back to EN
  if (langAliases.en && langAliases.en.length > 0) {
    return langAliases.en[0];
  }
  
  // Last resort: return canonical
  return canonical;
}
