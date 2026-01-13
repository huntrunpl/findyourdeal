/**
 * FYD "compat" link counters (used by /me and /status).
 * Extracted from api/index.js to keep the main file smaller.
 *
 * Expects a pg Pool-like object with .query(sql, params)
 */
export function createLinkCounters(db) {
  // Auto-detekcja tabeli z linkami + liczniki dla /me i /status (żeby nie wywalało API)
  let __fydLinksMetaPromise = null;

  function __fydIdent(x) {
    const v = String(x ?? "");
    return '"' + v.replace(/"/g, '""') + '"';
  }

  function __fydPickFirst(cols, names) {
    for (const n of names) if (cols.has(n)) return n;
    return null;
  }

  async function __fydDetectLinksMeta() {
    if (__fydLinksMetaPromise) return __fydLinksMetaPromise;

    __fydLinksMetaPromise = (async () => {
      const { rows } = await db.query(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema='public'
        ORDER BY table_name, ordinal_position
      `);

      const tables = new Map(); // table -> Set(columns)
      for (const r of rows) {
        if (!tables.has(r.table_name)) tables.set(r.table_name, new Set());
        tables.get(r.table_name).add(r.column_name);
      }

      let best = null;
      let bestScore = -1;

      for (const [t, cols] of tables.entries()) {
        const userCol = __fydPickFirst(cols, ["user_id", "telegram_user_id"]);
        const urlCol  = __fydPickFirst(cols, ["url", "link", "link_url", "search_url", "query_url"]);
        if (!userCol || !urlCol) continue;

        const enabledCol = __fydPickFirst(cols, ["enabled","is_enabled","active","is_active","disabled","is_disabled"]);
        const deletedCol = __fydPickFirst(cols, ["deleted_at","removed_at","deleted"]);

        let score = 0;
        score += 10; // ma user+url
        if (cols.has("id")) score += 2;
        if (enabledCol) score += 2;
        if (cols.has("title") || cols.has("name") || cols.has("label")) score += 1;
        const tl = String(t).toLowerCase();
        if (tl.includes("link")) score += 2;

        if (score > bestScore) {
          bestScore = score;
          best = { table: t, userCol, urlCol, enabledCol, deletedCol };
        }
      }

      if (!best) {
        throw new Error("[FYD] Nie wykryłem tabeli z linkami (brak tabeli z user_id/telegram_user_id + url/link)");
      }
      return best;
    })();

    return __fydLinksMetaPromise;
  }

  async function __fydCountLinks(userId, onlyEnabled) {
    const meta = await __fydDetectLinksMeta();

    const where = [`${__fydIdent(meta.userCol)} = $1`];

    if (meta.deletedCol) {
      where.push(`${__fydIdent(meta.deletedCol)} IS NULL`);
    }

    if (onlyEnabled && meta.enabledCol) {
      const c = meta.enabledCol;
      if (c.includes("disabled")) where.push(`${__fydIdent(c)} = false`);
      else where.push(`${__fydIdent(c)} = true`);
    }

    const q = `SELECT COUNT(*)::int AS c FROM ${__fydIdent(meta.table)} WHERE ${where.join(" AND ")}`;
    const { rows } = await db.query(q, [userId]);
    return (rows && rows[0] && rows[0].c) ? rows[0].c : 0;
  }

  // Te nazwy woła Twoje api/index.js:
  async function countActiveLinksForUserId(userId) {
    return __fydCountLinks(userId, true);
  }

  async function countAllLinksForUserId(userId) {
    return __fydCountLinks(userId, false);
  }

  return { countActiveLinksForUserId, countAllLinksForUserId };
}
