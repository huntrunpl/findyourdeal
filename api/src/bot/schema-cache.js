// extracted from api/telegram-bot.js (NO behavior change)

// ---------- schema cache ----------
const __colCache = new Map(); // key: "table.column" -> boolean
async function hasColumn(table, column) {
  const key = `${table}.${column}`;
  if (__colCache.has(key)) return __colCache.get(key);

  try {
    const r = await dbQuery(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 AND column_name=$2
       LIMIT 1`,
      [String(table), String(column)]
    );
    const ok = !!r.rowCount;
    __colCache.set(key, ok);
    return ok;
  } catch {
    __colCache.set(key, false);
    return false;
  }
}

export { hasColumn };
