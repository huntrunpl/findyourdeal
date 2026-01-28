/**
 * Link commands extracted from api/telegram-bot.js
 * - /list
 * - /add
 * - /remove
 *
 * All external deps are passed in via `deps` to avoid side-effects / tight coupling.
 */

export async function handleList(deps, msg, user) {
  const { dbQuery, tgSend, escapeHtml, fydResolveLang, t } = deps;

  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");

  try {
    const r = await dbQuery(
      `SELECT id, COALESCE(NULLIF(label,''), NULLIF(name,''), 'Monitoring') AS name, url
       FROM public.links
       WHERE user_id=$1 AND active=true
       ORDER BY id ASC`,
      [Number(user.id)]
    );

    const rows = r.rows || [];
    if (!rows.length) {
      await tgSend(chatId, t(lang, "links_none", { usage: "/add <URL>" }));
      return;
    }

    let out = t(lang, "links_title") + "\n\n";

    for (const row of rows) {
      out += `ID ${Number(row.id)} — ${escapeHtml(String(row.name || "Monitoring"))}\n`;
      out += `${escapeHtml(String(row.url || ""))}\n\n`;
    }

    out += "\n" + t(lang, "links_footer") + "\n\n";

    for (const row of rows) {
      out += `/latest ${Number(row.id)} — ${escapeHtml(String(row.name || "Monitoring"))}\n`;
    }

    await tgSend(chatId, out.trim(), { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
  } catch (e) {
    await tgSend(chatId, t(lang, "links_error", { error: escapeHtml(e?.message || e) }));
  }
}

export async function handleAdd(deps, msg, user, argText) {
  const {
    tgSend,
    escapeHtml,
    fydResolveLang,
    getUserEntitlementsByTelegramId,
    countActiveLinksForUserId,
    insertLinkForUserId,
    t,
  } = deps;

  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");

  if (!argText) {
    await tgSend(chatId, t(lang, "links_add_usage"));
    return;
  }

  const parts = argText.split(/\s+/);
  const url = parts[0];
  const name = parts.slice(1).join(" ") || null;

  if (!url || !/^https?:\/\//i.test(url)) {
    await tgSend(chatId, t(lang, "links_add_invalid_url"));
    return;
  }

  const ent = await getUserEntitlementsByTelegramId(user.telegram_user_id).catch(() => null);
  const limit = Number(ent?.links_limit_total ?? 0);
  if (!ent || !(limit > 0)) {
    await tgSend(chatId, t(lang, "links_no_plan"));
    return;
  }

  const totalLinks = await countActiveLinksForUserId(user.id).catch(() => 0);
  if (totalLinks >= limit) {
    await tgSend(chatId, t(lang, "links_add_limit_reached", { current: totalLinks, limit }));
    return;
  }

  const row = await insertLinkForUserId(user.id, name, url);
  await tgSend(
    chatId,
    t(lang, "links_add_ok", {
      linkId: row.id,
      linkName: escapeHtml(row.name || "(no name)"),
      linkUrl: escapeHtml(row.url),
      current: totalLinks + 1,
      limit,
    }),
    { disable_web_page_preview: true, link_preview_options: { is_disabled: true } }
  );
}

export async function handleRemove(deps, msg, user, argText) {
  const { pool, tgSend, escapeHtml, fydResolveLang, t } = deps;

  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  const id = parseInt(argText, 10);

  if (!id) {
    await tgSend(chatId, t(lang, "links_remove_usage"));
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const r0 = await client.query(
      `SELECT id,
              COALESCE(NULLIF(label,''), NULLIF(name,''), '') AS name,
              COALESCE(url,'') AS url
       FROM links
       WHERE id=$1 AND user_id=$2
       LIMIT 1`,
      [id, Number(user.id)]
    );

    if (!r0.rowCount) {
      await client.query("ROLLBACK");
      await tgSend(chatId, t(lang, "links_remove_not_found", { linkId: id }));
      return;
    }

    const row = r0.rows[0];

    // dependencies best-effort
    try { await client.query("DELETE FROM link_items WHERE link_id=$1", [id]); } catch {}
    try { await client.query("DELETE FROM link_notification_modes WHERE link_id=$1 AND user_id=$2", [id, Number(user.id)]); } catch {}

    const r1 = await client.query(
      "DELETE FROM links WHERE id=$1 AND user_id=$2 RETURNING id",
      [id, Number(user.id)]
    );

    if (!r1.rowCount) {
      await client.query("ROLLBACK");
      await tgSend(chatId, t(lang, "links_remove_not_found", { linkId: id }));
      return;
    }

    await client.query("COMMIT");

    await tgSend(chatId, t(lang, "links_remove_ok", {
      linkId: row.id,
      linkName: escapeHtml(row.name || "(no name)"),
      linkUrl: escapeHtml(row.url || ""),
    }));
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    await tgSend(chatId, t(lang, "links_error", { error: escapeHtml(String(e?.message || e)) }));
  } finally {
    try { client.release(); } catch {}
  }
}
