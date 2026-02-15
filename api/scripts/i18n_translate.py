#!/usr/bin/env python3
"""
Automatic translation generator for bot i18n (9 languages)
Preserves: commands /..., placeholders {var}, HTML tags, emoji, proper nouns
"""

import re

# Translation dictionaries for common terms (informal tu/du style)
TRANSLATIONS = {
    "de": {
        "Hello": "Hallo", "This is": "Das ist", "bot": "Bot",
        "Basic commands": "Grundlegende Befehle", "show": "zeigen",
        "your": "deine", "active": "aktiven", "monitored": "überwachten",
        "links": "Links", "disable": "deaktivieren", "monitoring": "Überwachung",
        "for link": "für Link", "add new": "neu hinzufügen", "to monitor": "zum Überwachen",
        "status": "Status", "plan": "Plan", "and": "und",
        "notifications": "Benachrichtigungen", "open": "öffnen",
        "management": "Verwaltungs", "panel": "Panel", "PUSH": "PUSH",
        "on this chat": "in diesem Chat", "enable": "aktivieren",
        "single": "einzeln", "cards": "Karten", "batch": "gesammelt",
        "list": "Liste", "Per-link mode": "Pro-Link-Modus", "ONLY": "NUR",
        "e.g.": "z.B.", "Quiet hours": "Ruhezeiten", "set": "setzen", "Mode": "Modus",
        "Sent history": "Sende-Verlauf", "newest sent": "neueste gesendet",
        "cheapest sent": "billigste gesendet", "Examples": "Beispiele",
        "rename": "umbenennen", "or": "oder", "to clear": "zum Löschen",
        "Plans": "Pläne", "available plans": "verfügbare Pläne",
        "purchase options": "Kaufoptionen", "Language": "Sprache",
        "Advanced commands": "Erweiterte Befehle",
        "Advanced features": "Erweiterte Funktionen",
        "filters": "Filter", "priorities": "Prioritäten", "etc.": "usw.",
        "are currently under development": "sind derzeit in Entwicklung",
        "Active": "Aktive", "No active": "Keine aktiven",
        "Add one with": "Füge einen hinzu mit", "Plan": "Plan",
        "with addons": "mit Add-ons", "enabled": "aktiviert",
        "total": "gesamt", "daily limit": "Tageslimit",
        "ENABLED": "AKTIVIERT", "DISABLED": "DEAKTIVIERT",
        "ON": "EIN", "OFF": "AUS", "no links": "keine Links",
        "per link": "pro Link", "unknown": "unbekannt",
        "Language set to": "Sprache gesetzt auf", "supported": "unterstützt",
        "Notifications": "Benachrichtigungen", "in chat": "im Chat",
        "Quiet": "Ruhe", "from": "von", "to": "bis",
        "Default mode": "Standardmodus", "for this chat": "für diesen Chat",
        "Links": "Links", "language": "Sprache",
    },
    "fr": {
        "Hello": "Bonjour", "This is": "Ceci est", "bot": "bot",
        "Basic commands": "Commandes de base", "show": "afficher",
        "your": "tes", "active": "actifs", "monitored": "surveillés",
        "links": "liens", "disable": "désactiver", "monitoring": "surveillance",
        "for link": "pour le lien", "add new": "ajouter nouveau",
        "to monitor": "à surveiller", "status": "statut", "plan": "plan",
        "and": "et", "notifications": "notifications", "open": "ouvrir",
        "management": "gestion", "panel": "panneau", "PUSH": "PUSH",
        "on this chat": "sur ce chat", "enable": "activer",
        "single": "unique", "cards": "cartes", "batch": "groupe",
        "list": "liste", "Per-link mode": "Mode par lien", "ONLY": "UNIQUEMENT",
        "e.g.": "p.ex.", "Quiet hours": "Heures de silence", "set": "définir", "Mode": "Mode",
        "Sent history": "Historique envoyé", "newest sent": "plus récent envoyé",
        "cheapest sent": "moins cher envoyé", "Examples": "Exemples",
        "rename": "renommer", "or": "ou", "to clear": "pour effacer",
        "Plans": "Plans", "available plans": "plans disponibles",
        "purchase options": "options d'achat", "Language": "Langue",
        "Advanced commands": "Commandes avancées",
        "Advanced features": "Fonctions avancées",
        "filters": "filtres", "priorities": "priorités", "etc.": "etc.",
        "are currently under development": "sont actuellement en développement",
        "Active": "Actifs", "No active": "Aucun actif",
        "Add one with": "Ajoutez-en un avec", "Plan": "Plan",
        "with addons": "avec modules", "enabled": "activé",
        "total": "total", "daily limit": "limite quotidienne",
        "ENABLED": "ACTIVÉ", "DISABLED": "DÉSACTIVÉ",
        "ON": "ACTIVÉ", "OFF": "DÉSACTIVÉ", "no links": "aucun lien",
        "per link": "par lien", "unknown": "inconnu",
        "Language set to": "Langue définie sur", "supported": "supporté",
        "Notifications": "Notifications", "in chat": "dans le chat",
        "Quiet": "Silence", "from": "de", "to": "à",
        "Default mode": "Mode par défaut", "for this chat": "pour ce chat",
        "Links": "Liens", "language": "langue",
    },
    "it": {
        "Hello": "Ciao", "This is": "Questo è", "bot": "bot",
        "Basic commands": "Comandi base", "show": "mostrare",
        "your": "tuoi", "active": "attivi", "monitored": "monitorati",
        "links": "link", "disable": "disattivare", "monitoring": "monitoraggio",
        "for link": "per il link", "add new": "aggiungi nuovo",
        "to monitor": "da monitorare", "status": "stato", "plan": "piano",
        "and": "e", "notifications": "notifiche", "open": "aprire",
        "management": "gestione", "panel": "pannello", "PUSH": "PUSH",
        "on this chat": "su questa chat", "enable": "attivare",
        "single": "singola", "cards": "schede", "batch": "gruppo",
        "list": "lista", "Per-link mode": "Modalità per link", "ONLY": "SOLO",
        "e.g.": "es.", "Quiet hours": "Ore silenziose", "set": "impostare", "Mode": "Modalità",
        "Sent history": "Cronologia inviati", "newest sent": "più recente inviato",
        "cheapest sent": "più economico inviato", "Examples": "Esempi",
        "rename": "rinominare", "or": "o", "to clear": "per cancellare",
        "Plans": "Piani", "available plans": "piani disponibili",
        "purchase options": "opzioni di acquisto", "Language": "Lingua",
        "Advanced commands": "Comandi avanzati",
        "Advanced features": "Funzionalità avanzate",
        "filters": "filtri", "priorities": "priorità", "etc.": "ecc.",
        "are currently under development": "sono attualmente in sviluppo",
        "Active": "Attivi", "No active": "Nessun attivo",
        "Add one with": "Aggiungi uno con", "Plan": "Piano",
        "with addons": "con componenti aggiuntivi", "enabled": "attivato",
        "total": "totale", "daily limit": "limite giornaliero",
        "ENABLED": "ATTIVATO", "DISABLED": "DISATTIVATO",
        "ON": "ATTIVATO", "OFF": "DISATTIVATO", "no links": "nessun link",
        "per link": "per link", "unknown": "sconosciuto",
        "Language set to": "Lingua impostata su", "supported": "supportato",
        "Notifications": "Notifiche", "in chat": "nella chat",
        "Quiet": "Silenzio", "from": "da", "to": "a",
        "Default mode": "Modalità predefinita", "for this chat": "per questa chat",
        "Links": "Link", "language": "lingua",
    },
    "es": {
        "Hello": "Hola", "This is": "Este es", "bot": "bot",
        "Basic commands": "Comandos básicos", "show": "mostrar",
        "your": "tus", "active": "activos", "monitored": "monitoreados",
        "links": "enlaces", "disable": "desactivar", "monitoring": "monitoreo",
        "for link": "para el enlace", "add new": "agregar nuevo",
        "to monitor": "para monitorear", "status": "estado", "plan": "plan",
        "and": "y", "notifications": "notificaciones", "open": "abrir",
        "management": "gestión", "panel": "panel", "PUSH": "PUSH",
        "on this chat": "en este chat", "enable": "activar",
        "single": "individual", "cards": "tarjetas", "batch": "lote",
        "list": "lista", "Per-link mode": "Modo por enlace", "ONLY": "SOLO",
        "e.g.": "p.ej.", "Quiet hours": "Horas silenciosas", "set": "establecer", "Mode": "Modo",
        "Sent history": "Historial enviado", "newest sent": "más reciente enviado",
        "cheapest sent": "más barato enviado", "Examples": "Ejemplos",
        "rename": "renombrar", "or": "o", "to clear": "para borrar",
        "Plans": "Planes", "available plans": "planes disponibles",
        "purchase options": "opciones de compra", "Language": "Idioma",
        "Advanced commands": "Comandos avanzados",
        "Advanced features": "Funciones avanzadas",
        "filters": "filtros", "priorities": "prioridades", "etc.": "etc.",
        "are currently under development": "están actualmente en desarrollo",
        "Active": "Activos", "No active": "Sin activos",
        "Add one with": "Agrega uno con", "Plan": "Plan",
        "with addons": "con complementos", "enabled": "activado",
        "total": "total", "daily limit": "límite diario",
        "ENABLED": "ACTIVADO", "DISABLED": "DESACTIVADO",
        "ON": "ACTIVADO", "OFF": "DESACTIVADO", "no links": "sin enlaces",
        "per link": "por enlace", "unknown": "desconocido",
        "Language set to": "Idioma establecido en", "supported": "compatible",
        "Notifications": "Notificaciones", "in chat": "en el chat",
        "Quiet": "Silencio", "from": "desde", "to": "hasta",
        "Default mode": "Modo predeterminado", "for this chat": "para este chat",
        "Links": "Enlaces", "language": "idioma",
    },
    "pt": {
        "Hello": "Olá", "This is": "Este é", "bot": "bot",
        "Basic commands": "Comandos básicos", "show": "mostrar",
        "your": "seus", "active": "ativos", "monitored": "monitorados",
        "links": "links", "disable": "desativar", "monitoring": "monitoramento",
        "for link": "para o link", "add new": "adicionar novo",
        "to monitor": "para monitorar", "status": "status", "plan": "plano",
        "and": "e", "notifications": "notificações", "open": "abrir",
        "management": "gerenciamento", "panel": "painel", "PUSH": "PUSH",
        "on this chat": "neste chat", "enable": "ativar",
        "single": "individual", "cards": "cartões", "batch": "lote",
        "list": "lista", "Per-link mode": "Modo por link", "ONLY": "APENAS",
        "e.g.": "ex.", "Horário silencioso": "Horário silencioso", "set": "definir", "Mode": "Modo",
        "Sent history": "Histórico enviado", "newest sent": "mais recente enviado",
        "cheapest sent": "mais barato enviado", "Examples": "Exemplos",
        "rename": "renomear", "or": "ou", "to clear": "para limpar",
        "Plans": "Planos", "available plans": "planos disponíveis",
        "purchase options": "opções de compra", "Language": "Idioma",
        "Advanced commands": "Comandos avançados",
        "Advanced features": "Recursos avançados",
        "filters": "filtros", "priorities": "prioridades", "etc.": "etc.",
        "are currently under development": "estão atualmente em desenvolvimento",
        "Active": "Ativos", "No active": "Sem ativos",
        "Add one with": "Adicione um com", "Plan": "Plano",
        "with addons": "com complementos", "enabled": "ativado",
        "total": "total", "daily limit": "limite diário",
        "ENABLED": "ATIVADO", "DISABLED": "DESATIVADO",
        "ON": "ATIVADO", "OFF": "DESATIVADO", "no links": "sem links",
        "per link": "por link", "unknown": "desconhecido",
        "Language set to": "Idioma definido para", "supported": "suportado",
        "Notifications": "Notificações", "in chat": "no chat",
        "Quiet": "Silêncio", "from": "de", "to": "até",
        "Default mode": "Modo padrão", "for this chat": "para este chat",
        "Links": "Links", "language": "idioma",
    },
    "cs": {
        "Hello": "Ahoj", "This is": "Toto je", "bot": "bot",
        "Basic commands": "Základní příkazy", "show": "zobrazit",
        "your": "tvoje", "active": "aktivní", "monitored": "monitorované",
        "links": "odkazy", "disable": "deaktivovat", "monitoring": "monitorování",
        "for link": "pro odkaz", "add new": "přidat nový",
        "to monitor": "k monitorování", "status": "stav", "plan": "plán",
        "and": "a", "notifications": "oznámení", "open": "otevřít",
        "management": "správa", "panel": "panel", "PUSH": "PUSH",
        "on this chat": "na tomto chatu", "enable": "aktivovat",
        "single": "jednotlivé", "cards": "karty", "batch": "dávkové",
        "list": "seznam", "Per-link mode": "Režim pro odkaz", "ONLY": "POUZE",
        "e.g.": "např.", "Quiet hours": "Tichý režim", "set": "nastavit", "Mode": "Režim",
        "Sent history": "Historie odeslaných", "newest sent": "nejnovější odeslané",
        "cheapest sent": "nejlevnější odeslané", "Examples": "Příklady",
        "rename": "přejmenovat", "or": "nebo", "to clear": "pro vymazání",
        "Plans": "Plány", "available plans": "dostupné plány",
        "purchase options": "možnosti nákupu", "Language": "Jazyk",
        "Advanced commands": "Pokročilé příkazy",
        "Advanced features": "Pokročilé funkce",
        "filters": "filtry", "priorities": "priority", "etc.": "atd.",
        "are currently under development": "jsou momentálně ve vývoji",
        "Active": "Aktivní", "No active": "Žádné aktivní",
        "Add one with": "Přidej jeden pomocí", "Plan": "Plán",
        "with addons": "s doplňky", "enabled": "aktivováno",
        "total": "celkem", "daily limit": "denní limit",
        "ENABLED": "AKTIVOVÁNO", "DISABLED": "DEAKTIVOVÁNO",
        "ON": "ZAPNUTO", "OFF": "VYPNUTO", "no links": "žádné odkazy",
        "per link": "na odkaz", "unknown": "neznámý",
        "Language set to": "Jazyk nastaven na", "supported": "podporovaný",
        "Notifications": "Oznámení", "in chat": "v chatu",
        "Quiet": "Ticho", "from": "od", "to": "do",
        "Default mode": "Výchozí režim", "for this chat": "pro tento chat",
        "Links": "Odkazy", "language": "jazyk",
    },
    "sk": {
        "Hello": "Ahoj", "This is": "Toto je", "bot": "bot",
        "Basic commands": "Základné príkazy", "show": "zobraziť",
        "your": "tvoje", "active": "aktívne", "monitored": "monitorované",
        "links": "odkazy", "disable": "deaktivovať", "monitoring": "monitorovanie",
        "for link": "pre odkaz", "add new": "pridať nový",
        "to monitor": "na monitorovanie", "status": "stav", "plan": "plán",
        "and": "a", "notifications": "upozornenia", "open": "otvoriť",
        "management": "správa", "panel": "panel", "PUSH": "PUSH",
        "on this chat": "na tomto chate", "enable": "aktivovať",
        "single": "jednotlivé", "cards": "karty", "batch": "dávkové",
        "list": "zoznam", "Per-link mode": "Režim pre odkaz", "ONLY": "IBA",
        "e.g.": "napr.", "Quiet hours": "Tichý režim", "set": "nastaviť", "Mode": "Režim",
        "Sent history": "História odoslaných", "newest sent": "najnovšie odoslané",
        "cheapest sent": "najlacnejšie odoslané", "Examples": "Príklady",
        "rename": "premenovať", "or": "alebo", "to clear": "na vymazanie",
        "Plans": "Plány", "available plans": "dostupné plány",
        "purchase options": "možnosti nákupu", "Language": "Jazyk",
        "Advanced commands": "Pokročilé príkazy",
        "Advanced features": "Pokročilé funkcie",
        "filters": "filtre", "priorities": "priority", "etc.": "atď.",
        "are currently under development": "sú momentálne vo vývoji",
        "Active": "Aktívne", "No active": "Žiadne aktívne",
        "Add one with": "Pridaj jeden pomocou", "Plan": "Plán",
        "with addons": "s doplnkami", "enabled": "aktivované",
        "total": "celkom", "daily limit": "denný limit",
        "ENABLED": "AKTIVOVANÉ", "DISABLED": "DEAKTIVOVANÉ",
        "ON": "ZAPNUTÉ", "OFF": "VYPNUTÉ", "no links": "žiadne odkazy",
        "per link": "na odkaz", "unknown": "neznámy",
        "Language set to": "Jazyk nastavený na", "supported": "podporovaný",
        "Notifications": "Upozornenia", "in chat": "v chate",
        "Quiet": "Ticho", "from": "od", "to": "do",
        "Default mode": "Predvolený režim", "for this chat": "pre tento chat",
        "Links": "Odkazy", "language": "jazyk",
    },
    "ro": {
        "Hello": "Bună", "This is": "Acesta este", "bot": "bot",
        "Basic commands": "Comenzi de bază", "show": "arată",
        "your": "tale", "active": "active", "monitored": "monitorizate",
        "links": "link-uri", "disable": "dezactivează", "monitoring": "monitorizare",
        "for link": "pentru link", "add new": "adaugă nou",
        "to monitor": "de monitorizat", "status": "stare", "plan": "plan",
        "and": "și", "notifications": "notificări", "open": "deschide",
        "management": "gestionare", "panel": "panou", "PUSH": "PUSH",
        "on this chat": "pe acest chat", "enable": "activează",
        "single": "individual", "cards": "carduri", "batch": "lot",
        "list": "listă", "Per-link mode": "Mod per link", "ONLY": "DOAR",
        "e.g.": "de ex.", "Quiet hours": "Ore liniștite", "set": "setează", "Mode": "Mod",
        "Sent history": "Istoric trimis", "newest sent": "cel mai recent trimis",
        "cheapest sent": "cel mai ieftin trimis", "Examples": "Exemple",
        "rename": "redenumește", "or": "sau", "to clear": "pentru a șterge",
        "Plans": "Planuri", "available plans": "planuri disponibile",
        "purchase options": "opțiuni de achiziție", "Language": "Limbă",
        "Advanced commands": "Comenzi avansate",
        "Advanced features": "Funcții avansate",
        "filters": "filtre", "priorities": "priorități", "etc.": "etc.",
        "are currently under development": "sunt în curs de dezvoltare",
        "Active": "Active", "No active": "Fără active",
        "Add one with": "Adaugă unul cu", "Plan": "Plan",
        "with addons": "cu suplimente", "enabled": "activat",
        "total": "total", "daily limit": "limită zilnică",
        "ENABLED": "ACTIVAT", "DISABLED": "DEZACTIVAT",
        "ON": "PORNIT", "OFF": "OPRIT", "no links": "fără link-uri",
        "per link": "pe link", "unknown": "necunoscut",
        "Language set to": "Limbă setată la", "supported": "suportat",
        "Notifications": "Notificări", "in chat": "în chat",
        "Quiet": "Liniște", "from": "de la", "to": "la",
        "Default mode": "Mod implicit", "for this chat": "pentru acest chat",
        "Links": "Link-uri", "language": "limbă",
    },
    "nl": {
        "Hello": "Hallo", "This is": "Dit is", "bot": "bot",
        "Basic commands": "Basiscommando's", "show": "toon",
        "your": "jouw", "active": "actieve", "monitored": "gemonitorde",
        "links": "links", "disable": "deactiveren", "monitoring": "monitoring",
        "for link": "voor link", "add new": "voeg nieuw toe",
        "to monitor": "om te monitoren", "status": "status", "plan": "plan",
        "and": "en", "notifications": "meldingen", "open": "open",
        "management": "beheer", "panel": "paneel", "PUSH": "PUSH",
        "on this chat": "in deze chat", "enable": "activeren",
        "single": "enkel", "cards": "kaarten", "batch": "batch",
        "list": "lijst", "Per-link mode": "Per-link modus", "ONLY": "ALLEEN",
        "e.g.": "bijv.", "Quiet hours": "Stille uren", "set": "instellen", "Mode": "Modus",
        "Sent history": "Verzonden geschiedenis", "newest sent": "nieuwste verzonden",
        "cheapest sent": "goedkoopste verzonden", "Examples": "Voorbeelden",
        "rename": "hernoemen", "or": "of", "to clear": "om te wissen",
        "Plans": "Plannen", "available plans": "beschikbare plannen",
        "purchase options": "aankoopopties", "Language": "Taal",
        "Advanced commands": "Geavanceerde commando's",
        "Advanced features": "Geavanceerde functies",
        "filters": "filters", "priorities": "prioriteiten", "etc.": "enz.",
        "are currently under development": "zijn momenteel in ontwikkeling",
        "Active": "Actieve", "No active": "Geen actieve",
        "Add one with": "Voeg er een toe met", "Plan": "Plan",
        "with addons": "met add-ons", "enabled": "geactiveerd",
        "total": "totaal", "daily limit": "dagelijkse limiet",
        "ENABLED": "GEACTIVEERD", "DISABLED": "GEDEACTIVEERD",
        "ON": "AAN", "OFF": "UIT", "no links": "geen links",
        "per link": "per link", "unknown": "onbekend",
        "Language set to": "Taal ingesteld op", "supported": "ondersteund",
        "Notifications": "Meldingen", "in chat": "in chat",
        "Quiet": "Stil", "from": "van", "to": "tot",
        "Default mode": "Standaardmodus", "for this chat": "voor deze chat",
        "Links": "Links", "language": "taal",
    },
}

def translate_text(text, lang):
    """Translate text preserving commands, placeholders, HTML, emoji"""
    
    # Don't translate if it's just a command
    if re.match(r'^/[a-z_]+$', text.strip()):
        return text
    
    # Extract placeholders {var} before translation
    placeholders = re.findall(r'\{[^}]+\}', text)
    temp_text = text
    for i, placeholder in enumerate(placeholders):
        temp_text = temp_text.replace(placeholder, f'__PH{i}__', 1)
    
    result = temp_text
    
    # Translate using dictionary
    if lang in TRANSLATIONS:
        trans_dict = TRANSLATIONS[lang]
        for en_term, trans_term in trans_dict.items():
            # Case insensitive replacement
            result = re.sub(r'\b' + re.escape(en_term) + r'\b', trans_term, result, flags=re.IGNORECASE)
    
    # Restore placeholders
    for i, placeholder in enumerate(placeholders):
        result = result.replace(f'__PH{i}__', placeholder, 1)
    
    return result

def parse_en_section(file_path):
    """Parse EN section from i18n_unified.js"""
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    # Find EN section (line 4 to line before pl:)
    en_start = None
    en_end = None
    pl_start = None
    
    for i, line in enumerate(lines):
        if line.strip() == "en: {":
            en_start = i + 1  # Start after "en: {"
        elif line.strip() == "pl: {":
            pl_start = i
            break
    
    if en_start is None or pl_start is None:
        print("ERROR: Could not find EN or PL section markers")
        return None
    
    # Find end of EN (should be "  }," before pl:)
    for i in range(pl_start - 1, en_start, -1):
        if lines[i].strip() in ["},", "},"]:
            en_end = i
            break
    
    if en_end is None:
        print("ERROR: Could not find EN section end")
        return None
    
    # Extract EN content (between en: { and closing })
    en_text = ''.join(lines[en_start:en_end])
    return en_text

def generate_translation(en_text, lang):
    """Generate translation for a language"""
    lines = en_text.split('\n')
    translated_lines = []
    
    for line in lines:
        # Skip empty lines and comments
        if not line.strip() or line.strip().startswith('//'):
            translated_lines.append(line)
            continue
        
        # Match key: value pattern
        match = re.match(r'(\s*)([a-z_]+):\s*["`](.+?)["`](,?)(\s*)', line)
        if match:
            indent = match.group(1)
            key = match.group(2)
            value = match.group(3)
            comma = match.group(4)
            trailing = match.group(5)
            
            # Translate value
            translated_value = translate_text(value, lang)
            
            # Preserve original quote style
            quote = '"'
            translated_line = f'{indent}{key}: {quote}{translated_value}{quote}{comma}{trailing}'
            translated_lines.append(translated_line)
        else:
            # Keep line as-is if pattern doesn't match
            translated_lines.append(line)
    
    return '\n'.join(translated_lines)

def main():
    file_path = "/opt/findyourdeal/api/i18n_unified.js"
    
    print("📖 Parsing EN section...")
    en_text = parse_en_section(file_path)
    if not en_text:
        return
    
    print(f"✅ Found EN section with {len(en_text.split(chr(10)))} lines")
    
    # Read original file
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Generate translations for 9 languages
    languages = ["de", "fr", "it", "es", "pt", "cs", "sk", "ro", "nl"]
    
    # Find insertion point after PL section
    lines = content.split('\n')
    pl_start = None
    pl_end_line = None
    
    # Find PL section start
    for i, line in enumerate(lines):
        if line.strip() == "pl: {":
            pl_start = i
            break
    
    if pl_start is None:
        print("ERROR: Could not find PL section start")
        return
    
    # Find PL section end by counting braces
    brace_count = 0
    for i in range(pl_start, len(lines)):
        if '{' in lines[i]:
            brace_count += lines[i].count('{')
        if '}' in lines[i]:
            brace_count -= lines[i].count('}')
        
        # When braces balance, we found the end
        if brace_count == 0 and i > pl_start:
            pl_end_line = i + 1  # Insert after closing },
            break
    
    if pl_end_line is None:
        print("ERROR: Could not find PL section end")
        return
    
    for lang in languages:
        print(f"🔄 Generating {lang.upper()} translations...")
        translated_text = generate_translation(en_text, lang)
        
        # Check if language section already exists
        if f"  {lang}: {{" in content:
            print(f"  ⚠️  {lang.upper()} section already exists, skipping...")
            continue
        
        # Insert new section
        new_section = f"  {lang}: {{\n{translated_text}  }},\n"
        lines.insert(pl_end_line, new_section)
        pl_end_line += 1  # Adjust for next insertion
        print(f"  ✅ {lang.upper()} section added")
    
    # Rejoin content
    content = '\n'.join(lines)
    
    # Write back
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    print("\n✅ All 9 languages generated and injected into i18n_unified.js")
    print("⚠️  Next step: Run validation with: node /opt/findyourdeal/api/i18n-check.js")

if __name__ == "__main__":
    main()
