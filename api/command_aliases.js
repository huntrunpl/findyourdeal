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
    en: ["commands", "komendy", "befehle", "commandes", "comandi", "comandos", "comenzi", "opdrachten", "příkazy"],
  },
  status: {
    en: ["status", "stan"],
    de: ["zustand"],
    fr: ["état"],
    it: ["stato"],
    es: ["estado"],
  },
  panel: {
    en: ["panel"],
  },
  plany: {
    en: ["plany", "plans", "pläne", "forfaits", "piani", "planes", "planos", "planuri", "plannen", "tarify", "plány"],
  },
  lista: {
    en: ["lista", "list"],
    de: ["liste"],
    it: ["elenco"],
    es: ["listar"],
    ro: ["listă"],
    nl: ["lijst"],
    cs: ["seznam"],
  },
  dodaj: {
    en: ["add"],
    pl: ["dodaj"],
    de: ["hinzufügen"],
    fr: ["ajouter"],
    it: ["aggiungi"],
    es: ["agregar"],
    pt: ["adicionar"],
    ro: ["adaugă"],
    nl: ["toevoegen"],
    cs: ["přidat"],
    sk: ["pridať"],
  },
  usun: {
    en: ["remove", "delete"],
    pl: ["usun"],
    de: ["entfernen"],
    fr: ["supprimer"],
    it: ["elimina"],
    es: ["eliminar"],
    pt: ["remover"],
    ro: ["șterge"],
    nl: ["verwijderen"],
    cs: ["odstranit"],
    sk: ["odstrániť"],
  },
  nazwa: {
    en: ["nazwa", "name", "rename", "namen", "nom", "renommer", "nome", "renombrar", "cambiar nome", "mudar nome", "ridenumi", "hernoemen", "přejmenovat", "premenovať"],
  },
  on: {
    en: ["on"],
    pl: ["wlacz", "włącz"],
    de: ["ein", "einschalten"],
    fr: ["activer"],
    it: ["attiva"],
    es: ["activar"],
    pt: ["ativar"],
    ro: ["pornește"],
    nl: ["aanzetten"],
    cs: ["zapnout"],
    sk: ["zapnúť"],
  },
  off: {
    en: ["off"],
    pl: ["wylacz", "wyłącz"],
    de: ["aus", "ausschalten"],
    fr: ["désactiver"],
    it: ["disattiva"],
    es: ["desactivar"],
    pt: ["desativar"],
    ro: ["oprește"],
    nl: ["uitzetten"],
    cs: ["vypnout"],
    sk: ["vypnúť"],
  },
  pojedyncze: {
    en: ["single"],
    pl: ["pojedyncze"],
    de: ["einzeln"],
    fr: ["unitaire"],
    it: ["singolo"],
    es: ["individual", "individual"],
    pt: ["único"],
    nl: ["enkel"],
    cs: ["jednotlivě"],
    sk: ["jednotlivo"],
  },
  zbiorcze: {
    en: ["batch", "grouped"],
    pl: ["zbiorcze"],
    de: ["paket"],
    fr: ["groupé"],
    it: ["raggruppato"],
    es: ["agrupado"],
    pt: ["em lote"],
    ro: ["grupate"],
    nl: ["gebundeld"],
    cs: ["hromadně"],
    sk: ["hromadne"],
  },
  cisza: {
    en: ["quiet", "silent"],
    pl: ["cisza"],
    de: ["ruhe"],
    fr: ["silence"],
    it: ["silenzio"],
    es: ["silencio"],
    pt: ["silêncio"],
    ro: ["tăcere"],
    nl: ["stil"],
    cs: ["ticho"],
  },
  cisza_off: {
    pl: ["cisza_off"],
    en: ["quiet_off"],
    de: ["ruhe_aus"],
    fr: ["silence_off"],
    it: ["silenzio_off"],
    es: ["silencio_off"],
    pt: ["silêncio_off"],
    ro: ["tăcere_off"],
    nl: ["stil_uit"],
    cs: ["ticho_off"],
    sk: ["ticho_off"],
  },
  najnowsze: {
    en: ["najnowsze", "latest", "recent", "neueste", "récents", "recenti", "recientes", "recentes", "recente", "nieuwste", "nejnovější", "najnovšie"],
  },
  najtansze: {
    en: ["najtansze", "cheapest", "lowest", "billigste", "moins cher", "più economici", "más baratos", "mais baratos", "cele mai ieftine", "goedkoopste", "nejlevnější", "najlacnejšie"],
  },
  lang: {
    en: ["lang", "jezyk", "język", "sprache", "langue", "lingua", "idioma", "língua", "limbă", "taal", "jazyk"],
  },
  max: {
    en: ["max", "maksimum", "maximum", "máximo"],
  },
  max_off: {
    pl: ["max_off"],
    en: ["clear_max"],
    de: ["max_aus"],
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
