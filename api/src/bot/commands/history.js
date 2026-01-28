/**
 * Extracted from api/telegram-bot.js (history: /latest + /cheapest)
 * No behavior change.
 */

export function createHistoryHandlers(ctx) {
  const {
    tgSend,
    fydResolveLang,
    escapeHtml,
    dbQuery,
    hasColumn,
    stripPrefixIcons,
    dedupePanelLoginUrlText,
    appendUrlFromKeyboard,
    normLang,
    t,
  } = ctx;

  function extractTs(payload, createdAt) {
    try {
      const candidates = [
        payload?.created_time, payload?.createdTime, payload?.created_at_ts, payload?.createdAtTs,
        payload?.created_at, payload?.createdAt, payload?.posted_at, payload?.postedAt,
        payload?.published_at, payload?.publishedAt, payload?.time, payload?.timestamp,
      ];
      for (const v of candidates) {
        if (v == null) continue;
        if (typeof v === "number" && Number.isFinite(v)) return v < 1e11 ? v * 1000 : v;
        if (typeof v === "string") {
          const s = v.trim();
          if (/^\d{9,13}$/.test(s)) {
            const n = parseInt(s, 10);
            return n < 1e11 ? n * 1000 : n;
          }
          const d = Date.parse(s);
          if (!Number.isNaN(d)) return d;
        }
      }
    } catch {}
  
    try {
      const d2 = Date.parse(String(createdAt || ""));
      if (!Number.isNaN(d2)) return d2;
    } catch {}
    return 0;
  }
  
  async function handleNewestStrict(msg, user) {
    const chatId = String(msg.chat.id);
    const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  
    const pick = (row, keys) => {
      for (const k of keys) {
        const v = row?.[k];
        if (v === null || typeof v === "undefined") continue;
        const s = String(v).trim();
        if (s) return s;
      }
      return "";
    };
  
    const pickNum = (row, keys) => {
      for (const k of keys) {
        const v = row?.[k];
        if (v === null || typeof v === "undefined") continue;
        if (typeof v === "number" && Number.isFinite(v)) return v;
        const s = String(v).replace(",", ".").trim();
        const n = Number(s);
        if (Number.isFinite(n)) return n;
      }
      return null;
    };
  
    const toItem = (row) => {
      const title = pick(row, ["title", "offer_title", "item_title", "name"]) || "(no title)";
      const url = pick(row, ["url", "item_url", "offer_url", "link", "href"]);
      const price = pickNum(row, ["price_pln", "price", "amount", "value"]);
      const cur = pick(row, ["currency", "curr", "currency_code", "currencycode"]);
      const linkId = Number(row?.link_id || row?.linkid || 0);
      const linkName = pick(row, ["link_name", "linkname"]) || "";
      return {
        ts: extractTs(row?.payload || row?.data || row || null, row?.created_at || row?.createdAt || row?.seen_at || null),
        id: Number(row?.id || 0),
        title,
        url,
        price,
        cur,
        linkId,
        linkName,
      };
    };
  
    try {
      const raw = String(msg.text || "").trim();
      const parts = raw.split(/\s+/);
      const linkIdArg = Number(parts[1] || 0);
  
      // /najnowsze ID
      if (Number.isFinite(linkIdArg) && linkIdArg > 0) {
        const lk = await dbQuery(
          `SELECT id, COALESCE(NULLIF(label,''), NULLIF(name,''), 'Monitoring') AS name
           FROM public.links
           WHERE id=$1 AND user_id=$2
           LIMIT 1`,
          [linkIdArg, Number(user.id)]
        );
  
        if (!lk.rowCount) {
          await tgSend(chatId, t(lang, "hist_bad_link_id", { linkId: linkIdArg }));
          return;
        }

        const linkName = String(lk.rows[0]?.name || "").trim();

        const r = await dbQuery(
          `SELECT *
           FROM public.link_items
           WHERE link_id=$1
           ORDER BY id DESC
           LIMIT 120`,
          [linkIdArg]
        );

        const rows = (r.rows || []).map((row) => {
          const x = toItem(row);
          x.linkId = linkIdArg;
          x.linkName = linkName;
          return x;
        });
  
        rows.sort((a, b) => (b.ts - a.ts) || (b.id - a.id));
        const top = rows.slice(0, 10);

        if (!top.length) {
          await tgSend(chatId, t(lang, "hist_none"));
          return;
        }

        let out = t(lang, "hist_latest_title") + "\n\n";
        for (let i = 0; i < top.length; i++) {
          const it = top[i];
          out += `${i + 1}. ${escapeHtml(it.title)} [${linkIdArg} – ${escapeHtml(linkName)}]\n`;
          if (it.price != null) out += `💰 ${escapeHtml(String(it.price))}${it.cur ? " " + escapeHtml(String(it.cur)) : ""}\n`;
          if (it.url) out += `${escapeHtml(it.url)}\n`;
          out += "\n";
        }
  
        await tgSend(chatId, out.trim(), { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
        return;
      }
  
      // /najnowsze (GLOBAL)
      const g = await dbQuery(
        `SELECT li.*, COALESCE(NULLIF(l.label,''), NULLIF(l.name,''), 'Monitoring') AS link_name
         FROM public.link_items li
         JOIN public.links l ON l.id=li.link_id
         WHERE l.user_id=$1 AND l.active=true
         ORDER BY li.id DESC
         LIMIT 240`,
        [Number(user.id)]
      );
  
      const rows = (g.rows || []).map(toItem);
      rows.sort((a, b) => (b.ts - a.ts) || (b.id - a.id));
      const top = rows.slice(0, 10);

      if (!top.length) {
        await tgSend(chatId, t(lang, "hist_none"));
        return;
      }

      let out = t(lang, "hist_latest_title_global") + "\n\n";
      for (let i = 0; i < top.length; i++) {
        const it = top[i];
        out += `${i + 1}. ${escapeHtml(it.title)} [${it.linkId} – ${escapeHtml(it.linkName)}]\n`;
        if (it.price != null) out += `💰 ${escapeHtml(String(it.price))}${it.cur ? " " + escapeHtml(String(it.cur)) : ""}\n`;
        if (it.url) out += `${escapeHtml(it.url)}\n`;
        out += "\n";
      }
      out += "\n" + t(lang, "hist_latest_footer");

      await tgSend(chatId, out.trim(), { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
    } catch (e) {
      await tgSend(chatId, t(lang, "hist_error", { error: escapeHtml(String(e?.message || e)) }));
    }
  }
  
  // ---------- /najtansze (schema-aware) ----------
  let __LINKITEMS_META = null;
  
  function qi(id) {
    return `"${String(id).replace(/"/g, '""')}"`;
  }
  
  async function linkItemsMeta() {
    if (__LINKITEMS_META) return __LINKITEMS_META;
  
    const colsR = await dbQuery(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name='link_items'
       ORDER BY ordinal_position`
    );
    const cols = new Set((colsR.rows || []).map((r) => String(r.column_name)));
  
    const pick = (cands) => {
      for (const c of cands) if (cols.has(c)) return c;
      return null;
    };
  
    const ts = pick(["first_seen_at", "created_at", "seen_at", "inserted_at", "updated_at"]);
    const url = pick(["url", "item_url", "href", "link"]);
    const title = pick(["title", "name", "item_title"]);
    const price = pick(["price", "price_value", "amount", "price_pln"]);
    const currency = pick(["currency", "cur", "currency_code"]);
  
    __LINKITEMS_META = { ts, url, title, price, currency };
    return __LINKITEMS_META;
  }
  
  async function handleCheapest(msg, user) {
    const chatId = String(msg.chat.id);
    const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  
    const parts = String(msg.text || "").trim().split(/\s+/);
    const linkId = Number(parts[1] || 0);
    const useLink = Number.isFinite(linkId) && linkId > 0;
  
    if (parts.length > 1 && !useLink) {
      await tgSend(chatId, t(lang, "hist_bad_link_id"));
      return;
    }

    const m = await linkItemsMeta();
    if (!m.ts || !m.url || !m.price) {
      await tgSend(chatId, t(lang, "hist_none"));
      return;
    }

    const where = useLink ? "AND li.link_id=$2" : "";
    const params = useLink ? [Number(user.id), linkId] : [Number(user.id)];
  
    const sql = `
      SELECT
        li.link_id,
        COALESCE(l.label, l.name, '') AS link_name,
        ${title ? `COALESCE(li.${title}::text,'')` : `''`} AS title,
        li.${price} AS price,
        ${currency ? `COALESCE(li.${currency}::text,'')` : `''`} AS currency,
        li.${url}::text AS url,
        li.${ts} AS ts
      FROM link_items li
      JOIN links l ON l.id=li.link_id
      WHERE l.user_id=$1
        ${where}
        AND li.${price} IS NOT NULL
      ORDER BY li.${price} ASC, li.${ts} DESC
      LIMIT 10
    `;
  
    const r = await dbQuery(sql, params);
    if (!r.rows || !r.rows.length) {
      await tgSend(chatId, t(lang, "hist_none"));
      return;
    }

    let out = t(lang, "hist_cheapest_title") + "\n\n";
    let i = 1;
    for (const row of r.rows) {
      const t0 = String(row.title || "").trim();
      const u0 = String(row.url || "").trim();
      const p0 = row.price != null && row.price !== "" ? String(row.price) : "";
      const c0 = String(row.currency || "").trim();
      const tag = row.link_name ? ` [${row.link_id} – ${row.link_name}]` : ` [${row.link_id}]`;
  
      out += `${i}. ${escapeHtml(t0 || t(lang, "hist_no_title"))}${escapeHtml(tag)}\n`;
      out += `💰 ${escapeHtml(p0)}${c0 ? " " + escapeHtml(c0) : ""}\n`;
      out += `${escapeHtml(u0)}\n\n`;
      i++;
    }

    await tgSend(chatId, out.trim(), { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
  }

  return { handleNewestStrict, handleCheapest };
}
