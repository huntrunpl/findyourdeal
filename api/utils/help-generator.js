/**
 * Dynamic help generator for advanced commands
 * Uses command aliases to show localized commands
 * EN is source of truth for fallback
 */

import { COMMAND_ALIASES } from "../command_aliases.js";
import { t } from "../i18n_unified.js";

/**
 * Build advanced help section dynamically based on user language
 * @param {string} lang - User language code (en, pl, de, fr, etc.)
 * @returns {string} - Formatted advanced help text with HTML tags
 */
export function buildAdvancedHelp(lang) {
  // Get command aliases for user's language (fallback to EN if not found)
  const getAliases = (canonical, showEnHint = false) => {
    const langAliases = COMMAND_ALIASES[canonical]?.[lang];
    const enAliases = COMMAND_ALIASES[canonical]?.en;
    const alias = langAliases?.[0] || enAliases?.[0] || canonical;
    
    // Show EN alias hint if lang != en and showEnHint = true
    if (showEnHint && lang !== 'en' && enAliases?.[0] && langAliases?.[0] !== enAliases[0]) {
      return `/${alias} (also: /${enAliases[0]})`;
    }
    
    return `/${alias}`;
  };

  // Build sections
  let text = "\n" + t(lang, "cmd.help_advanced_title") + "\n\n";
  
  // Basic Management
  text += t(lang, "cmd.help_advanced_basic_title") + "\n";
  text += `${getAliases('priorytet')} &lt;ID&gt; [low|normal|high] – ${lang === 'pl' ? 'ustaw priorytet' : lang === 'de' ? 'Priorität setzen' : lang === 'fr' ? 'définir priorité' : 'set priority'}\n`;
  text += `${getAliases('config')} &lt;ID&gt; – ${lang === 'pl' ? 'pokaż konfigurację' : lang === 'de' ? 'Konfiguration anzeigen' : lang === 'fr' ? 'afficher configuration' : 'show configuration'}\n`;
  text += `${getAliases('ukry')} &lt;ID&gt; – ${lang === 'pl' ? 'ukryj link' : lang === 'de' ? 'Link verstecken' : lang === 'fr' ? 'cacher lien' : 'hide link'}\n`;
  text += `${getAliases('ukry_off')} &lt;ID&gt; – ${lang === 'pl' ? 'pokaż link' : lang === 'de' ? 'Link zeigen' : lang === 'fr' ? 'montrer lien' : 'show link'}\n`;
  text += "\n";
  
  // Search & Filters
  text += t(lang, "cmd.help_advanced_search_title") + "\n";
  text += `${getAliases('cena')} &lt;ID&gt; &lt;min&gt; &lt;max&gt; – ${lang === 'pl' ? 'filtr ceny' : lang === 'de' ? 'Preisfilter' : lang === 'fr' ? 'filtre prix' : 'price filter'}\n`;
  text += `${getAliases('cena_off')} &lt;ID&gt; – ${lang === 'pl' ? 'wyłącz filtr ceny' : lang === 'de' ? 'Preisfilter aus' : lang === 'fr' ? 'désactiver filtre prix' : 'clear price filter'}\n`;
  text += `${getAliases('rozmiar')} &lt;ID&gt; &lt;sizes&gt; – ${lang === 'pl' ? 'filtr rozmiaru' : lang === 'de' ? 'Größenfilter' : lang === 'fr' ? 'filtre taille' : 'size filter'}\n`;
  text += `${getAliases('marka')} &lt;ID&gt; &lt;brands&gt; – ${lang === 'pl' ? 'filtr marki' : lang === 'de' ? 'Markenfilter' : lang === 'fr' ? 'filtre marque' : 'brand filter'}\n`;
  text += `${getAliases('max')} &lt;ID&gt; &lt;n&gt; – ${lang === 'pl' ? 'limit ofert' : lang === 'de' ? 'Angebotslimit' : lang === 'fr' ? 'limite offres' : 'max offers'}\n`;
  text += `${getAliases('filtry')} &lt;ID&gt; – ${lang === 'pl' ? 'pokaż filtry' : lang === 'de' ? 'Filter zeigen' : lang === 'fr' ? 'afficher filtres' : 'show filters'}\n`;
  text += `${getAliases('resetfiltry')} &lt;ID&gt; – ${lang === 'pl' ? 'resetuj filtry' : lang === 'de' ? 'Filter zurücksetzen' : lang === 'fr' ? 'réinitialiser filtres' : 'reset filters'}\n`;
  text += "\n";
  
  // Settings
  text += t(lang, "cmd.help_advanced_settings_title") + "\n";
  text += `${getAliases('zapis')} &lt;ID&gt; – ${lang === 'pl' ? 'zapisz preset' : lang === 'de' ? 'Preset speichern' : lang === 'fr' ? 'sauvegarder preset' : 'save preset'}\n`;
  text += `${getAliases('zapis_off')} &lt;ID&gt; – ${lang === 'pl' ? 'wyczyść preset' : lang === 'de' ? 'Preset löschen' : lang === 'fr' ? 'effacer preset' : 'clear preset'}\n`;
  text += "\n";
  
  // Examples
  text += t(lang, "cmd.help_advanced_examples_title") + "\n";
  text += `<code>${getAliases('priorytet')} 18 high</code>\n`;
  text += `<code>${getAliases('cena')} 18 100 500</code>\n`;
  text += `<code>${getAliases('filtry')} 18</code>\n`;
  
  return text;
}
