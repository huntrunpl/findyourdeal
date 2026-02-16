# ⚠️ DEPRECATED: telegram-bot.js w tym katalogu

**Data deprecation:** 2026-02-02

## NIE EDYTOWAĆ tego pliku

**Powód deprecation:**
- Ten plik (1828 linii, 57KB, Feb 1 12:00) jest **nieaktualny** i **wprowadzał w błąd** podczas audytów
- Źle raportowano "dead aliases" dla `/nazwa` i `/domyslnie`, bo ten plik nie miał tych handlerów
- Runtime bot używał nowszej wersji (2213 linii, 72KB, Feb 1 19:50)

## JEDYNE ŹRÓDŁO PRAWDY dla Telegram Bota:

```
/opt/findyourdeal/api/telegram-bot.js
```

**Dlaczego tam:**
- Docker build context: `/opt/findyourdeal/`
- Dockerfile: `Dockerfile.worker` kopiuje `COPY api/ /app/api/`
- Runtime bot wykonuje: `node telegram-bot.js` w `/app/api/`
- Źródło builda: `/opt/findyourdeal/api/telegram-bot.js`

## Backup starej wersji:

```
telegram-bot.js.deprecated_20260202_132720
```

**Nie usuwaj** tego pliku — to archiwum dla analizy historycznej.

---

**Jeśli chcesz edytować bota:** edytuj `/opt/findyourdeal/api/telegram-bot.js`
