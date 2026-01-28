export const DEFAULT_LANG = "en";

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
];

export function isSupportedLang(code) {
  return LANGS.some((l) => l.code === code);
}

export function normalizeLang(code) {
  const raw = String(code || "").toLowerCase().replace("_", "-").trim();
  if (!raw) return DEFAULT_LANG;

  if (raw.startsWith("pt-")) return "pt";
  if (raw.startsWith("en-")) return "en";
  if (raw.startsWith("de-")) return "de";
  if (raw.startsWith("fr-")) return "fr";
  if (raw.startsWith("es-")) return "es";
  if (raw.startsWith("it-")) return "it";
  if (raw.startsWith("ro-")) return "ro";
  if (raw.startsWith("nl-")) return "nl";
  if (raw.startsWith("cs-")) return "cs";
  if (raw.startsWith("sk-")) return "sk";
  if (raw === "pl") return "pl";

  return isSupportedLang(raw) ? raw : DEFAULT_LANG; // unsupported -> EN
}

export function langLabel(code) {
  const c = normalizeLang(code);
  const l = LANGS.find((x) => x.code === c) || LANGS.find((x) => x.code === DEFAULT_LANG);
  return l ? l.name : "English";
}

export function buildLanguageKeyboard() {
  const buttons = LANGS.map((l) => ({
    text: `${l.name} ${l.flag}`,
    callback_data: `lang:${l.code}`,
  }));
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));
  return { inline_keyboard: rows };
}

const DICTS = {
  en: {
    choose_language: "Choose your language:",
    language_set: "Language set to: {language}.",
    language_current: "Current language: {language}.",
    unknown_command: "❓ Unknown command. Use /help.",

    help_text:
`👋 Hi! I'm the FindYourDeal bot.

🔎 Links
<code>/list</code> — show your monitored links
<code>/remove &lt;ID&gt;</code> — disable a link
<code>/add &lt;url&gt; [name]</code> — add a new link

ℹ️ Status & panel
<code>/status</code> — plan & notifications status
<code>/panel</code> — login link to the web panel
<code>/lang</code> — change language

🔔 Notifications (this chat)
<code>/on</code> — enable
<code>/off</code> — disable
<code>/single</code> — single cards
<code>/batch</code> — grouped list

Per-link (this chat)
<code>/single_ID</code> <code>/batch_ID</code> <code>/off_ID</code> <code>/on_ID</code> (e.g. <code>/batch_18</code>)
You can also use a space: <code>/on 18</code>

🌙 Quiet hours
<code>/quiet</code> — show
<code>/quiet HH-HH</code> — set (e.g. <code>/quiet 22-7</code>)
<code>/quiet_off</code> — disable

🧾 History
<code>/latest &lt;ID&gt;</code> — latest saved items for a link

💳 Billing
<code>/plans</code> — buy a plan
<code>/addon10</code> — +10 links and +100 history (Platinum only)
After checkout you return to the bot and activation happens via <code>/start act_...</code>`,

    plans_text:
`💳 Choose a plan:

• Starter: <code>/starter</code>
• Growth: <code>/growth</code>
• Platinum: <code>/platinum</code>

After checkout you'll return to the bot and activation will be automatic.`,
  },

  pl: {
    choose_language: "Wybierz język:",
    language_set: "Ustawiono język: {language}.",
    language_current: "Aktualny język: {language}.",
    unknown_command: "❓ Nieznana komenda. Użyj /help.",

    help_text:
`👋 Cześć! To bot FindYourDeal.

🔎 Linki
<code>/lista</code> — pokaż Twoje monitorowane linki (działa też: <code>/list</code>)
<code>/usun &lt;ID&gt;</code> — wyłącz link (działa też: <code>/remove</code>)
<code>/dodaj &lt;url&gt; [nazwa]</code> — dodaj nowy link (działa też: <code>/add</code>)

ℹ️ Status & panel
<code>/status</code> — status planu i powiadomień
<code>/panel</code> — link logowania do panelu WWW
<code>/lang</code> — zmień język

🔔 Powiadomienia (ten czat)
<code>/on</code> — włącz
<code>/off</code> — wyłącz
<code>/pojedyncze</code> — pojedyncze karty (działa też: <code>/single</code>)
<code>/zbiorcze</code> — zbiorcza lista (działa też: <code>/batch</code>)

Per-link (ten czat)
<code>/pojedyncze_ID</code> <code>/zbiorcze_ID</code> <code>/off_ID</code> <code>/on_ID</code> (np. <code>/zbiorcze_18</code>)
Możesz też ze spacją: <code>/on 18</code>

🌙 Cisza nocna
<code>/cisza</code> — pokaż (działa też: <code>/quiet</code>)
<code>/cisza HH-HH</code> — ustaw (np. <code>/cisza 22-7</code>)
<code>/cisza_off</code> — wyłącz (działa też: <code>/quiet_off</code>)

🧾 Historia
<code>/najnowsze &lt;ID&gt;</code> — najnowsze oferty z historii (działa też: <code>/latest</code>)

💳 Płatności
<code>/plany</code> — zakup planu (działa też: <code>/plans</code>)
<code>/addon10</code> — +10 linków i +100 historii (tylko Platinum)
Po checkout wracasz do bota, a aktywacja robi się przez <code>/start act_...</code>`,

    plans_text:
`💳 Wybierz plan:

• Starter: <code>/starter</code>
• Growth: <code>/growth</code>
• Platinum: <code>/platinum</code>

Po opłaceniu wrócisz do bota i aktywacja zrobi się automatycznie.`,
  },

  de: {
    choose_language: "Wähle deine Sprache:",
    language_set: "Sprache eingestellt: {language}.",
    language_current: "Aktuelle Sprache: {language}.",
    unknown_command: "❓ Unbekannter Befehl. Nutze /help.",

    help_text:
`👋 Hallo! Ich bin der FindYourDeal Bot.

🔎 Links
<code>/list</code> — überwachte Links anzeigen (auch: <code>/lista</code>)
<code>/remove &lt;ID&gt;</code> — Link deaktivieren (auch: <code>/usun</code>)
<code>/add &lt;url&gt; [Name]</code> — neuen Link hinzufügen (auch: <code>/dodaj</code>)

ℹ️ Status & Panel
<code>/status</code> — Plan- und Benachrichtigungsstatus
<code>/panel</code> — Login-Link zum Web-Panel
<code>/lang</code> — Sprache ändern

🔔 Benachrichtigungen (dieser Chat)
<code>/on</code> — aktivieren
<code>/off</code> — deaktivieren
<code>/single</code> — einzelne Karten (auch: <code>/pojedyncze</code>)
<code>/batch</code> — Sammelliste (auch: <code>/zbiorcze</code>)

Pro-Link (dieser Chat)
<code>/single_ID</code> <code>/batch_ID</code> <code>/off_ID</code> <code>/on_ID</code> (z.B. <code>/batch_18</code>)
Du kannst auch mit Leerzeichen: <code>/on 18</code>

🌙 Ruhezeiten
<code>/quiet</code> — anzeigen (auch: <code>/cisza</code>)
<code>/quiet HH-HH</code> — setzen (z.B. <code>/quiet 22-7</code>)
<code>/quiet_off</code> — deaktivieren

🧾 Verlauf
<code>/latest &lt;ID&gt;</code> — neueste gespeicherte Angebote (auch: <code>/najnowsze</code>)

💳 Zahlung
<code>/plans</code> — Plan kaufen (auch: <code>/plany</code>)
<code>/addon10</code> — +10 Links und +100 Verlauf (nur Platinum)
Nach dem Checkout kehrst du zum Bot zurück und die Aktivierung erfolgt über <code>/start act_...</code>`,

    plans_text:
`💳 Wähle einen Plan:

• Starter: <code>/starter</code>
• Growth: <code>/growth</code>
• Platinum: <code>/platinum</code>

Nach dem Checkout kehrst du zum Bot zurück und die Aktivierung erfolgt automatisch.`,
  },

  fr: {
    choose_language: "Choisissez votre langue :",
    language_set: "Langue définie : {language}.",
    language_current: "Langue actuelle : {language}.",
    unknown_command: "❓ Commande inconnue. Utilisez /help.",

    help_text:
`👋 Bonjour ! Je suis le bot FindYourDeal.

🔎 Liens
<code>/list</code> — afficher vos liens suivis (aussi : <code>/lista</code>)
<code>/remove &lt;ID&gt;</code> — désactiver un lien (aussi : <code>/usun</code>)
<code>/add &lt;url&gt; [nom]</code> — ajouter un nouveau lien (aussi : <code>/dodaj</code>)

ℹ️ Statut & panel
<code>/status</code> — statut du plan et des notifications
<code>/panel</code> — lien de connexion au panel web
<code>/lang</code> — changer la langue

🔔 Notifications (ce chat)
<code>/on</code> — activer
<code>/off</code> — désactiver
<code>/single</code> — cartes individuelles (aussi : <code>/pojedyncze</code>)
<code>/batch</code> — liste groupée (aussi : <code>/zbiorcze</code>)

Par lien (ce chat)
<code>/single_ID</code> <code>/batch_ID</code> <code>/off_ID</code> <code>/on_ID</code> (ex. <code>/batch_18</code>)
Vous pouvez aussi avec un espace : <code>/on 18</code>

🌙 Heures silencieuses
<code>/quiet</code> — afficher (aussi : <code>/cisza</code>)
<code>/quiet HH-HH</code> — définir (ex. <code>/quiet 22-7</code>)
<code>/quiet_off</code> — désactiver

🧾 Historique
<code>/latest &lt;ID&gt;</code> — dernières annonces enregistrées (aussi : <code>/najnowsze</code>)

💳 Paiement
<code>/plans</code> — acheter un plan (aussi : <code>/plany</code>)
<code>/addon10</code> — +10 liens et +100 historique (Platinum uniquement)
Après le paiement, vous revenez au bot et l’activation se fait via <code>/start act_...</code>`,

    plans_text:
`💳 Choisissez un plan :

• Starter : <code>/starter</code>
• Growth : <code>/growth</code>
• Platinum : <code>/platinum</code>

Après le paiement, vous revenez au bot et l’activation sera automatique.`,
  },

  es: {
    choose_language: "Elige tu idioma:",
    language_set: "Idioma configurado: {language}.",
    language_current: "Idioma actual: {language}.",
    unknown_command: "❓ Comando desconocido. Usa /help.",

    help_text:
`👋 ¡Hola! Soy el bot FindYourDeal.

🔎 Enlaces
<code>/list</code> — ver tus enlaces monitorizados (también: <code>/lista</code>)
<code>/remove &lt;ID&gt;</code> — desactivar un enlace (también: <code>/usun</code>)
<code>/add &lt;url&gt; [nombre]</code> — añadir un nuevo enlace (también: <code>/dodaj</code>)

ℹ️ Estado & panel
<code>/status</code> — estado del plan y notificaciones
<code>/panel</code> — enlace de acceso al panel web
<code>/lang</code> — cambiar idioma

🔔 Notificaciones (este chat)
<code>/on</code> — activar
<code>/off</code> — desactivar
<code>/single</code> — tarjetas individuales (también: <code>/pojedyncze</code>)
<code>/batch</code> — lista agrupada (también: <code>/zbiorcze</code>)

Por enlace (este chat)
<code>/single_ID</code> <code>/batch_ID</code> <code>/off_ID</code> <code>/on_ID</code> (ej. <code>/batch_18</code>)
También puedes con espacio: <code>/on 18</code>

🌙 Horas silenciosas
<code>/quiet</code> — ver (también: <code>/cisza</code>)
<code>/quiet HH-HH</code> — establecer (ej. <code>/quiet 22-7</code>)
<code>/quiet_off</code> — desactivar

🧾 Historial
<code>/latest &lt;ID&gt;</code> — últimas ofertas guardadas (también: <code>/najnowsze</code>)

💳 Pagos
<code>/plans</code> — comprar un plan (también: <code>/plany</code>)
<code>/addon10</code> — +10 enlaces y +100 historial (solo Platinum)
Tras pagar vuelves al bot y la activación se hace vía <code>/start act_...</code>`,

    plans_text:
`💳 Elige un plan:

• Starter: <code>/starter</code>
• Growth: <code>/growth</code>
• Platinum: <code>/platinum</code>

Después del pago vuelves al bot y la activación será automática.`,
  },

  it: {
    choose_language: "Scegli la tua lingua:",
    language_set: "Lingua impostata: {language}.",
    language_current: "Lingua attuale: {language}.",
    unknown_command: "❓ Comando sconosciuto. Usa /help.",

    help_text:
`👋 Ciao! Sono il bot FindYourDeal.

🔎 Link
<code>/list</code> — mostra i link monitorati (anche: <code>/lista</code>)
<code>/remove &lt;ID&gt;</code> — disattiva un link (anche: <code>/usun</code>)
<code>/add &lt;url&gt; [nome]</code> — aggiungi un nuovo link (anche: <code>/dodaj</code>)

ℹ️ Stato & pannello
<code>/status</code> — stato del piano e notifiche
<code>/panel</code> — link di accesso al pannello web
<code>/lang</code> — cambia lingua

🔔 Notifiche (questa chat)
<code>/on</code> — attiva
<code>/off</code> — disattiva
<code>/single</code> — schede singole (anche: <code>/pojedyncze</code>)
<code>/batch</code> — lista raggruppata (anche: <code>/zbiorcze</code>)

Per link (questa chat)
<code>/single_ID</code> <code>/batch_ID</code> <code>/off_ID</code> <code>/on_ID</code> (es. <code>/batch_18</code>)
Puoi anche con uno spazio: <code>/on 18</code>

🌙 Ore silenziose
<code>/quiet</code> — mostra (anche: <code>/cisza</code>)
<code>/quiet HH-HH</code> — imposta (es. <code>/quiet 22-7</code>)
<code>/quiet_off</code> — disattiva

🧾 Storico
<code>/latest &lt;ID&gt;</code> — ultimi annunci salvati (anche: <code>/najnowsze</code>)

💳 Pagamenti
<code>/plans</code> — acquista un piano (anche: <code>/plany</code>)
<code>/addon10</code> — +10 link e +100 storico (solo Platinum)
Dopo il pagamento torni al bot e l’attivazione avviene via <code>/start act_...</code>`,

    plans_text:
`💳 Scegli un piano:

• Starter: <code>/starter</code>
• Growth: <code>/growth</code>
• Platinum: <code>/platinum</code>

Dopo il pagamento tornerai al bot e l’attivazione sarà automatica.`,
  },

  pt: {
    choose_language: "Escolha o seu idioma:",
    language_set: "Idioma definido: {language}.",
    language_current: "Idioma atual: {language}.",
    unknown_command: "❓ Comando desconhecido. Use /help.",

    help_text:
`👋 Olá! Sou o bot FindYourDeal.

🔎 Links
<code>/list</code> — ver links monitorizados (também: <code>/lista</code>)
<code>/remove &lt;ID&gt;</code> — desativar um link (também: <code>/usun</code>)
<code>/add &lt;url&gt; [nome]</code> — adicionar um novo link (também: <code>/dodaj</code>)

ℹ️ Status & painel
<code>/status</code> — status do plano e notificações
<code>/panel</code> — link de login do painel web
<code>/lang</code> — mudar idioma

🔔 Notificações (este chat)
<code>/on</code> — ativar
<code>/off</code> — desativar
<code>/single</code> — cartões individuais (também: <code>/pojedyncze</code>)
<code>/batch</code> — lista agrupada (também: <code>/zbiorcze</code>)

Por link (este chat)
<code>/single_ID</code> <code>/batch_ID</code> <code>/off_ID</code> <code>/on_ID</code> (ex.: <code>/batch_18</code>)
Você também pode com espaço: <code>/on 18</code>

🌙 Horas silenciosas
<code>/quiet</code> — ver (também: <code>/cisza</code>)
<code>/quiet HH-HH</code> — definir (ex.: <code>/quiet 22-7</code>)
<code>/quiet_off</code> — desativar

🧾 Histórico
<code>/latest &lt;ID&gt;</code> — últimas ofertas salvas (também: <code>/najnowsze</code>)

💳 Pagamento
<code>/plans</code> — comprar um plano (também: <code>/plany</code>)
<code>/addon10</code> — +10 links e +100 histórico (somente Platinum)
Após pagar, você volta ao bot e a ativação acontece via <code>/start act_...</code>`,

    plans_text:
`💳 Escolha um plano:

• Starter: <code>/starter</code>
• Growth: <code>/growth</code>
• Platinum: <code>/platinum</code>

Após pagar, você volta ao bot e a ativação será automática.`,
  },

  ro: {
    choose_language: "Alege limba:",
    language_set: "Limba a fost setată: {language}.",
    language_current: "Limba curentă: {language}.",
    unknown_command: "❓ Comandă necunoscută. Folosește /help.",

    help_text:
`👋 Salut! Sunt botul FindYourDeal.

🔎 Linkuri
<code>/list</code> — arată linkurile monitorizate (și: <code>/lista</code>)
<code>/remove &lt;ID&gt;</code> — dezactivează un link (și: <code>/usun</code>)
<code>/add &lt;url&gt; [nume]</code> — adaugă un link nou (și: <code>/dodaj</code>)

ℹ️ Status & panel
<code>/status</code> — status plan și notificări
<code>/panel</code> — link de autentificare în panelul web
<code>/lang</code> — schimbă limba

🔔 Notificări (acest chat)
<code>/on</code> — activează
<code>/off</code> — dezactivează
<code>/single</code> — carduri individuale (și: <code>/pojedyncze</code>)
<code>/batch</code> — listă grupată (și: <code>/zbiorcze</code>)

Pe link (acest chat)
<code>/single_ID</code> <code>/batch_ID</code> <code>/off_ID</code> <code>/on_ID</code> (ex.: <code>/batch_18</code>)
Poți și cu spațiu: <code>/on 18</code>

🌙 Ore silențioase
<code>/quiet</code> — arată (și: <code>/cisza</code>)
<code>/quiet HH-HH</code> — setează (ex.: <code>/quiet 22-7</code>)
<code>/quiet_off</code> — dezactivează

🧾 Istoric
<code>/latest &lt;ID&gt;</code> — ultimele oferte salvate (și: <code>/najnowsze</code>)

💳 Plăți
<code>/plans</code> — cumpără un plan (și: <code>/plany</code>)
<code>/addon10</code> — +10 linkuri și +100 istoric (doar Platinum)
După plată revii la bot, iar activarea se face prin <code>/start act_...</code>`,

    plans_text:
`💳 Alege un plan:

• Starter: <code>/starter</code>
• Growth: <code>/growth</code>
• Platinum: <code>/platinum</code>

După plată revii la bot și activarea va fi automată.`,
  },

  nl: {
    choose_language: "Kies je taal:",
    language_set: "Taal ingesteld op: {language}.",
    language_current: "Huidige taal: {language}.",
    unknown_command: "❓ Onbekend commando. Gebruik /help.",

    help_text:
`👋 Hoi! Ik ben de FindYourDeal-bot.

🔎 Links
<code>/list</code> — toon je gemonitorde links (ook: <code>/lista</code>)
<code>/remove &lt;ID&gt;</code> — schakel een link uit (ook: <code>/usun</code>)
<code>/add &lt;url&gt; [naam]</code> — voeg een nieuwe link toe (ook: <code>/dodaj</code>)

ℹ️ Status & paneel
<code>/status</code> — plan- en meldingenstatus
<code>/panel</code> — inloglink voor het webpaneel
<code>/lang</code> — taal wijzigen

🔔 Meldingen (deze chat)
<code>/on</code> — aan
<code>/off</code> — uit
<code>/single</code> — losse kaarten (ook: <code>/pojedyncze</code>)
<code>/batch</code> — gegroepeerde lijst (ook: <code>/zbiorcze</code>)

Per link (deze chat)
<code>/single_ID</code> <code>/batch_ID</code> <code>/off_ID</code> <code>/on_ID</code> (bv. <code>/batch_18</code>)
Je kunt ook met spatie: <code>/on 18</code>

🌙 Stille uren
<code>/quiet</code> — tonen (ook: <code>/cisza</code>)
<code>/quiet HH-HH</code> — instellen (bv. <code>/quiet 22-7</code>)
<code>/quiet_off</code> — uitzetten

🧾 Geschiedenis
<code>/latest &lt;ID&gt;</code> — nieuwste opgeslagen items (ook: <code>/najnowsze</code>)

💳 Betaling
<code>/plans</code> — koop een plan (ook: <code>/plany</code>)
<code>/addon10</code> — +10 links en +100 geschiedenis (alleen Platinum)
Na betaling ga je terug naar de bot en activatie gebeurt via <code>/start act_...</code>`,

    plans_text:
`💳 Kies een plan:

• Starter: <code>/starter</code>
• Growth: <code>/growth</code>
• Platinum: <code>/platinum</code>

Na betaling ga je terug naar de bot en activatie gebeurt automatisch.`,
  },

  cs: {
    choose_language: "Vyberte jazyk:",
    language_set: "Jazyk nastaven na: {language}.",
    language_current: "Aktuální jazyk: {language}.",
    unknown_command: "❓ Neznámý příkaz. Použij /help.",

    help_text:
`👋 Ahoj! Jsem bot FindYourDeal.

🔎 Odkazy
<code>/list</code> — zobrazit monitorované odkazy (také: <code>/lista</code>)
<code>/remove &lt;ID&gt;</code> — vypnout odkaz (také: <code>/usun</code>)
<code>/add &lt;url&gt; [název]</code> — přidat nový odkaz (také: <code>/dodaj</code>)

ℹ️ Stav & panel
<code>/status</code> — stav plánu a notifikací
<code>/panel</code> — přihlašovací odkaz do web panelu
<code>/lang</code> — změnit jazyk

🔔 Notifikace (tento chat)
<code>/on</code> — zapnout
<code>/off</code> — vypnout
<code>/single</code> — jednotlivé karty (také: <code>/pojedyncze</code>)
<code>/batch</code> — souhrnný seznam (také: <code>/zbiorcze</code>)

Pro odkaz (tento chat)
<code>/single_ID</code> <code>/batch_ID</code> <code>/off_ID</code> <code>/on_ID</code> (např. <code>/batch_18</code>)
Lze i s mezerou: <code>/on 18</code>

🌙 Tichý režim
<code>/quiet</code> — zobrazit (také: <code>/cisza</code>)
<code>/quiet HH-HH</code> — nastavit (např. <code>/quiet 22-7</code>)
<code>/quiet_off</code> — vypnout

🧾 Historie
<code>/latest &lt;ID&gt;</code> — nejnovější uložené položky (také: <code>/najnowsze</code>)

💳 Platby
<code>/plans</code> — koupit plán (také: <code>/plany</code>)
<code>/addon10</code> — +10 odkazů a +100 historie (jen Platinum)
Po platbě se vrátíš do bota a aktivace proběhne přes <code>/start act_...</code>`,

    plans_text:
`💳 Vyberte plán:

• Starter: <code>/starter</code>
• Growth: <code>/growth</code>
• Platinum: <code>/platinum</code>

Po platbě se vrátíte do bota a aktivace bude automatická.`,
  },

  sk: {
    choose_language: "Vyberte jazyk:",
    language_set: "Jazyk nastavený na: {language}.",
    language_current: "Aktuálny jazyk: {language}.",
    unknown_command: "❓ Neznámy príkaz. Použi /help.",

    help_text:
`👋 Ahoj! Som bot FindYourDeal.

🔎 Odkazy
<code>/list</code> — zobraziť monitorované odkazy (aj: <code>/lista</code>)
<code>/remove &lt;ID&gt;</code> — vypnúť odkaz (aj: <code>/usun</code>)
<code>/add &lt;url&gt; [názov]</code> — pridať nový odkaz (aj: <code>/dodaj</code>)

ℹ️ Stav & panel
<code>/status</code> — stav plánu a notifikácií
<code>/panel</code> — prihlasovací odkaz do web panelu
<code>/lang</code> — zmeniť jazyk

🔔 Notifikácie (tento chat)
<code>/on</code> — zapnúť
<code>/off</code> — vypnúť
<code>/single</code> — jednotlivé karty (aj: <code>/pojedyncze</code>)
<code>/batch</code> — súhrnný zoznam (aj: <code>/zbiorcze</code>)

Pre link (tento chat)
<code>/single_ID</code> <code>/batch_ID</code> <code>/off_ID</code> <code>/on_ID</code> (napr. <code>/batch_18</code>)
Dá sa aj s medzerou: <code>/on 18</code>

🌙 Tiché hodiny
<code>/quiet</code> — zobraziť (aj: <code>/cisza</code>)
<code>/quiet HH-HH</code> — nastaviť (napr. <code>/quiet 22-7</code>)
<code>/quiet_off</code> — vypnúť

🧾 História
<code>/latest &lt;ID&gt;</code> — najnovšie uložené položky (aj: <code>/najnowsze</code>)

💳 Platby
<code>/plans</code> — kúpiť plán (aj: <code>/plany</code>)
<code>/addon10</code> — +10 odkazov a +100 histórie (iba Platinum)
Po platbe sa vrátiš do bota a aktivácia prebehne cez <code>/start act_...</code>`,

    plans_text:
`💳 Vyberte plán:

• Starter: <code>/starter</code>
• Growth: <code>/growth</code>
• Platinum: <code>/platinum</code>

Po platbe sa vrátite do bota a aktivácia bude automatická.`,
  },
};

// [FYD_PLANS_ADDON10_DESC] START
// Tekst dla /plany gdy użytkownik ma Platinum (link do Addon +10) – we wszystkich językach.
const __fydPlansPlatinumAddon10 = {
  pl: `✅ {plan}

➕ Addon +10: +10 linków oraz +100 limitu historii.
Otwórz płatność poniżej:

{url}`,
  en: `✅ {plan}

➕ Addon +10: +10 links and +100 history limit.
Open payment below:

{url}`,
  de: `✅ {plan}

➕ Addon +10: +10 Links und +100 Verlaufslimit.
Öffne die Zahlung unten:

{url}`,
  fr: `✅ {plan}

➕ Addon +10 : +10 liens et +100 limite d'historique.
Ouvrez le paiement ci-dessous :

{url}`,
  es: `✅ {plan}

➕ Addon +10: +10 enlaces y +100 límite de historial.
Abre el pago abajo:

{url}`,
  it: `✅ {plan}

➕ Addon +10: +10 link e +100 limite cronologia.
Apri il pagamento qui sotto:

{url}`,
  pt: `✅ {plan}

➕ Addon +10: +10 links e +100 limite de histórico.
Abra o pagamento abaixo:

{url}`,
  ro: `✅ {plan}

➕ Addon +10: +10 linkuri și +100 limită de istoric.
Deschide plata mai jos:

{url}`,
  nl: `✅ {plan}

➕ Addon +10: +10 links en +100 limiet voor geschiedenis.
Open de betaling hieronder:

{url}`,
  cs: `✅ {plan}

➕ Addon +10: +10 odkazů a +100 limit historie.
Otevři platbu níže:

{url}`,
  sk: `✅ {plan}

➕ Addon +10: +10 odkazov a +100 limit histórie.
Otvorte platbu nižšie:

{url}`,
};

for (const [code, txt] of Object.entries(__fydPlansPlatinumAddon10)) {
  if (!DICTS[code]) DICTS[code] = {};
  DICTS[code].plans_platinum_addon10 = txt;
}
// [FYD_PLANS_ADDON10_DESC] END



// __FYD_I18N_EXTRA_KEYS_V1__
const __FYD_I18N_EXTRA = {
  "en": {
    "new_listings": "New listings",
    "full_history": "Full history:",
    "btn_disable": "Disable this link",
    "btn_single": "Single",
    "btn_batch": "Batch",
    "status_title": "ℹ️ Bot Status",
    "status_quiet_on": "Quiet hours: enabled ({from}:00–{to}:00)"
  },
  "pl": {
    "new_listings": "Nowe ogłoszenia",
    "full_history": "Pełną historię zobaczysz w",
    "btn_disable": "Wyłącz ten link",
    "btn_single": "Pojedynczo",
    "btn_batch": "Zbiorczo",
    "status_title": "ℹ️ Status bota",
    "status_quiet_on": "Cisza nocna: włączona ({from}:00–{to}:00)"
  },
  "de": {
    "new_listings": "Neue Angebote",
    "full_history": "Voller Verlauf:",
    "btn_disable": "Link deaktivieren",
    "btn_single": "Einzeln",
    "btn_batch": "Sammel",
    "status_title": "ℹ️ Bot-Status",
    "status_quiet_on": "Ruhezeiten: aktiviert ({from}:00–{to}:00)"
  },
  "fr": {
    "new_listings": "Nouvelles annonces",
    "full_history": "Historique complet :",
    "btn_disable": "Désactiver ce lien",
    "btn_single": "Unitaire",
    "btn_batch": "Groupé"
  },
  "es": {
    "new_listings": "Nuevos anuncios",
    "full_history": "Historial completo:",
    "btn_disable": "Desactivar este enlace",
    "btn_single": "Individual",
    "btn_batch": "Por lotes"
  },
  "it": {
    "new_listings": "Nuovi annunci",
    "full_history": "Cronologia completa:",
    "btn_disable": "Disattiva questo link",
    "btn_single": "Singolo",
    "btn_batch": "Raggruppato"
  },
  "pt": {
    "new_listings": "Novos anúncios",
    "full_history": "Histórico completo:",
    "btn_disable": "Desativar este link",
    "btn_single": "Individual",
    "btn_batch": "Em lote"
  },
  "nl": {
    "new_listings": "Nieuwe advertenties",
    "full_history": "Volledige geschiedenis:",
    "btn_disable": "Deze link uitzetten",
    "btn_single": "Los",
    "btn_batch": "Batch",
    "status_title": "ℹ️ Bot-status",
    "status_quiet_on": "Stille uren: ingeschakeld ({from}:00–{to}:00)"
  },
  "ro": {
    "new_listings": "Anunțuri noi",
    "full_history": "Istoric complet:",
    "btn_disable": "Dezactivează acest link",
    "btn_single": "Individual",
    "btn_batch": "În lot",
    "status_title": "ℹ️ Starea bot",
    "status_quiet_on": "Ore liniștite: activate ({from}:00–{to}:00)"
  },
  "cs": {
    "new_listings": "Nové inzeráty",
    "full_history": "Celá historie:",
    "btn_disable": "Vypnout tento odkaz",
    "btn_single": "Jednotlivě",
    "btn_batch": "Hromadně",
    "status_title": "ℹ️ Stav bota",
    "status_quiet_on": "Tiché hodiny: povoleny ({from}:00–{to}:00)"
  },
  "hu": {
    "new_listings": "Új hirdetések",
    "full_history": "Teljes előzmény:",
    "btn_disable": "Link kikapcsolása",
    "btn_single": "Egyenként",
    "btn_batch": "Csoportosan"
  },
  "sk": {}
};

export function t(lang, key, vars = {}) {
  // __FYD_I18N_EXTRA_KEYS_V1__HOOK
  try {
    const raw = String(lang || "").trim().toLowerCase();
    const base = raw.includes("-") ? raw.split("-")[0] : raw;
    const L = base || "en";
    const ex = __FYD_I18N_EXTRA[L] || __FYD_I18N_EXTRA.en;
    if (ex && Object.prototype.hasOwnProperty.call(ex, key)) { const val = ex[key]; return String(val).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`)); };
  } catch (e) {}

  const L = normalizeLang(lang);
  const dict = DICTS[L] || DICTS[DEFAULT_LANG];
  const baseStr = (dict && dict[key]) ?? DICTS[DEFAULT_LANG][key] ?? key;
  return String(baseStr).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}
