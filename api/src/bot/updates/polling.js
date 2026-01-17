/**
 * Long polling runner factory extracted from api/telegram-bot.js (no behavior change).
 *
 * ctx must provide:
 * - TG (bot token string)
 * - fetch (node-fetch compatible)
 * - sleep(ms)
 * - handleUpdate(update)
 * - log (console-like, must support .log/.error)
 */
export function createPollingRunner(ctx) {
  const { TG, fetch, sleep, handleUpdate, log = console } = ctx;

  let offset = 0;

  async function fetchUpdates() {
    const url = new URL(`https://api.telegram.org/bot${TG}/getUpdates`);
    url.searchParams.set("timeout", "30");
    if (offset) url.searchParams.set("offset", String(offset));
    const res = await fetch(url.href);
    if (!res.ok) throw new Error(`getUpdates HTTP ${res.status}`);
    const data = await res.json();
    if (!data.ok) throw new Error(`getUpdates Telegram error: ${data.description}`);
    return data.result;
  }

  return async function main() {
    log.log("telegram-bot.js start");

    while (true) {
      try {
        const updates = await fetchUpdates();
        for (const u of updates) {
          offset = u.update_id + 1;
          try {
            await handleUpdate(u);
          } catch (e) {
            log.error("handleUpdate error:", e);
          }
        }
      } catch (e) {
        log.error("polling error:", e);
        await sleep(1500);
      }
    }
  };
}
