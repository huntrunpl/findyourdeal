export default {
  common: {
    unknownAction: "Nieznana akcja.",
    panelUnavailableNoBase: "Panel jest chwilowo niedostępny (brak konfiguracji PANEL_BASE_URL).",
    panelFallback: "Panel: {base}",
    panelLink: "Panel: {url}\nToken ważny {minutes} minut.",
    privateOnly: "Bot działa tylko w prywatnej rozmowie (bez grup).\nNapisz do mnie bezpośrednio.",
    wrongChat: "❌ Ten bot jest przypisany do innego czatu. Otwórz pierwotną rozmowę z botem.",
    bindChatFail: "❌ Nie udało się przypiąć czatu do konta. Spróbuj ponownie.",
    noTelegramId: "Nie udało się ustalić Twojego ID Telegram. Spróbuj ponownie.",
    unknownCommand: "❓ Nieznana komenda. Użyj /help.",
  },

  help: {
    text:
      "👋 Cześć! To bot FindYourDeal.\n\n" +
      "Podstawowe komendy:\n" +
      "/lista – pokaż Twoje aktywne monitorowane linki\n" +
      "/usun &lt;ID&gt; – wyłącz monitorowanie linku o ID\n" +
      "/dodaj &lt;url&gt; [nazwa] – dodaj nowy link do monitorowania\n" +
      "/status – status bota, planu i powiadomień\n" +
      "/panel – link do panelu WWW (logowanie tokenem)\n\n" +
      "Powiadomienia PUSH na tym czacie:\n" +
      "/on – włącz\n" +
      "/off – wyłącz\n" +
      "/pojedyncze – pojedyncze karty\n" +
      "/zbiorcze – zbiorcza lista\n\n" +
      "Tryb per-link (TYLKO na tym czacie):\n" +
      "/pojedyncze_ID, /zbiorcze_ID, /off_ID (np. /zbiorcze_18)\n\n" +
      "Cisza nocna:\n" +
      "/cisza – pokaż\n" +
      "/cisza HH-HH – ustaw (np. /cisza 22-7)\n" +
      "/cisza_off – wyłącz\n\n" +
      "Historia:\n" +
      "/najnowsze &lt;ID&gt; – najnowsze oferty z historii linku\n\n" +
      "Przykłady:\n" +
      "/lista\n" +
      "/usun 18\n" +
      "/dodaj https://m.olx.pl/oferty/?q=iphone14 iPhone 14 OLX\n" +
      "/najnowsze 18\n" +
      "/panel",
  },

  list: {
    header: "📋 Aktywne monitorowane linki:\n\n",
    item: "ID <b>{id}</b> — {name}\n<code>{url}</code>\n\n",
    footer: "Wyłącz: <code>/usun ID</code>\nnp. <code>/usun 18</code>",
    empty: "Nie masz jeszcze żadnych linków łącznie.",
    error: "❌ Błąd przy pobieraniu listy linków.",
  },

  delete: {
    usage: "Użycie:\n<code>/usun &lt;ID&gt;</code>\n\nPrzykład:\n<code>/usun 18</code>",
    notFoundHint: "Nie znalazłem linku o ID {id} na Twoim koncie. Użyj /lista.",
    alreadyOff: "ℹ️ Link o ID {id} jest już wyłączony. Możesz go włączyć w panelu.",
    okDetailed:
      "✅ Wyłączyłem monitorowanie linku:\n\n" +
      "ID {id} — {name}\n" +
      "{url}\n\n" +
      "Możesz go włączyć ponownie w panelu albo dodać ponownie jako nowe monitorowanie.",
    ok: "✅ Wyłączyłem monitorowanie linku o ID {id}.",
    error: "❌ Błąd przy wyłączaniu linku.",
  },

  add: {
    usage:
      "Użycie:\n<code>/dodaj &lt;url&gt; [nazwa]</code>\n\n" +
      "Przykład:\n" +
      "<code>/dodaj https://m.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
    invalidUrl:
      "Pierwszy parametr musi być poprawnym URL, np.:\n" +
      "<code>/dodaj https://m.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>",
    trialExpired:
      "⏰ Twój plan Trial wygasł.\nMonitoring w Trial jest już niedostępny.\n\n" +
      "Aby dalej korzystać z bota, wybierz plan płatny (Starter / Growth / Platinum).",
    paidPlanExpired:
      "⏰ Twój plan wygasł.\nAby dodać nowe linki i wznowić monitoring, przedłuż plan w panelu klienta.",
    noActivePlanTrialUsed:
      "Nie masz aktywnego planu z monitoringiem linków.\nTrial został już wykorzystany. Wykup plan Starter / Growth / Platinum.",
    noActivePlanTrialAvailable:
      "Nie masz aktywnego planu z monitoringiem linków.\nMożesz uruchomić jednorazowo Trial (3 dni / 5 linków) albo wybrać plan Starter / Growth / Platinum.",
    duplicateActive: "ℹ️ Ten link już istnieje i jest włączony. ID: <b>{id}</b>",
    reenabled: "✅ Link został ponownie włączony. ID: <b>{id}</b>",
    ok:
      "✅ Dodałem nowy link do monitorowania:\n\n" +
      "ID <b>{id}</b> — {name}\n" +
      "<code>{url}</code>\n\n" +
      "Aktywne linki: {activeCount}/{limit}\n\n" +
      "Linki sprawdzisz komendą: <code>/lista</code>",
    error: "❌ Błąd przy dodawaniu linku.",
  },
};
