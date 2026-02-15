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
  priorytet: {
    en: ["priority"],
    pl: ["priorytet"],
    de: ["priorität"],
    fr: ["priorité"],
    it: ["priorità"],
    es: ["prioridad"],
    pt: ["prioridade"],
    ro: ["prioritate"],
    nl: ["prioriteit"],
  },
  ukry: {
    en: ["hide"],
    pl: ["ukry"],
    de: ["verstecken"],
    fr: ["cacher"],
    it: ["nascondi"],
    es: ["ocultar"],
    pt: ["esconder"],
    ro: ["ascunde"],
    nl: ["verbergen"],
    cs: ["skrýt"],
    sk: ["skryť"],
  },
  ukry_off: {
    en: ["ukry_off", "unhide", "show", "odkryj"],
    de: ["zeigen"],
    fr: ["montrer"],
    it: ["mostra"],
    es: ["mostrar"],
    ro: ["afișează"],
    nl: ["tonen"],
    cs: ["zobrazit"],
    sk: ["zobraziť"],
  },
  zapis: {
    pl: ["zapis"],
    en: ["save"],
    de: ["speichern"],
    fr: ["sauvegarder"],
    it: ["salva"],
    es: ["guardar"],
    pt: ["salvar"],
    ro: ["salvează"],
    nl: ["opslaan"],
    cs: ["uložit"],
  },
  zapis_off: {
    en: ["zapis_off", "unsave", "clear_preset"],
    de: ["löschen"],
    fr: ["effacer"],
    it: ["cancella"],
    es: ["borrar"],
    pt: ["apagar"],
    ro: ["șterge"],
    nl: ["wissen"],
    cs: ["smazat"],
    sk: ["zmazať"],
  },
  config: {
    pl: ["konfiguracja"],
    en: ["config"],
    de: ["konfiguration"],
    fr: ["configuration"],
    it: ["configurazione"],
    es: ["configuración"],
    pt: ["configuração"],
    ro: ["configurare"],
    nl: ["configuratie"],
  },
  cena: {
    pl: ["cena"],
    en: ["price"],
    de: ["preis"],
    fr: ["prix"],
    it: ["prezzo"],
    es: ["precio"],
    pt: ["preço"],
    ro: ["preț"],
    nl: ["prijs"],
  },
  cena_off: {
    pl: ["cena_off"],
    en: ["price_off", "clear_price"],
    de: ["preis_aus"],
    fr: ["prix_off"],
    it: ["prezzo_off"],
    es: ["precio_off"],
    pt: ["preço_off"],
    ro: ["preț_off"],
    nl: ["prijs_uit"],
  },
  rozmiar: {
    en: ["size"],
    pl: ["rozmiar"],
    de: ["größe"],
    fr: ["taille"],
    it: ["dimensione"],
    es: ["tamaño"],
    pt: ["tamanho"],
    ro: ["mărime"],
    nl: ["maat"],
    cs: ["velikost"],
  },
  rozmiar_off: {
    pl: ["rozmiar_off"],
    en: ["size_off", "clear_size"],
    de: ["größe_aus"],
    fr: ["taille_off"],
    it: ["dimensione_off"],
    es: ["tamaño_off"],
    pt: ["tamanho_off"],
    ro: ["mărime_off"],
    nl: ["maat_uit"],
  },
  marka: {
    en: ["brand"],
    pl: ["marka"],
    de: ["marke"],
    fr: ["marque"],
    it: ["marca"],
  },
  marka_off: {
    pl: ["marka_off"],
    en: ["brand_off", "clear_brand"],
    de: ["marke_aus"],
    fr: ["marque_off"],
    it: ["marca_off"],
    es: ["marca_off"],
    pt: ["marca_off"],
  },
  max: {
    en: ["max", "maksimum", "maximum", "máximo"],
  },
  max_off: {
    pl: ["max_off"],
    en: ["clear_max"],
    de: ["max_aus"],
  },
  filtry: {
    pl: ["filtry"],
    en: ["filters", "filter"],
    fr: ["filtres"],
    it: ["filtri"],
    es: ["filtros"],
    pt: ["filtros"],
  },
  resetfiltry: {
    pl: ["resetfiltry"],
    en: ["resetfilters", "clear_filters"],
    de: ["filter_zurücksetzen"],
    fr: ["réinitialiser_filtres"],
    it: ["ripristina_filtri"],
    es: ["reiniciar_filtros"],
    pt: ["redefinir_filtros"],
    ro: ["resetare_filtre"],
    nl: ["filters_wissen"],
    cs: ["resetovat_filtry"],
    sk: ["resetovat_filtry"],
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
  },};

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
