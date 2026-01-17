/**
 * Link commands extracted from api/telegram-bot.js
 * - /list
 * - /add
 * - /remove
 *
 * All external deps are passed in via `deps` to avoid side-effects / tight coupling.
 */

export async function handleList(deps, msg, user) {
  const { dbQuery, tgSend, escapeHtml, fydResolveLang } = deps;

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
      await tgSend(chatId, lang === "pl" ? "Brak aktywnych linków. Dodaj: /dodaj <URL>" : "No active links. Add: /add <URL>");
      return;
    }

    let out = lang === "pl" ? "📋 Aktywne monitorowane linki:\n\n" : "📋 Active monitored links:\n\n";

    for (const row of rows) {
      out += `ID ${Number(row.id)} — ${escapeHtml(String(row.name || "Monitoring"))}\n`;
      out += `${escapeHtml(String(row.url || ""))}\n\n`;
    }

    out += (lang === "pl"
      ? "Usuń: /usun ID\nnp. /usun 18\n\nHistoria konkretnego linku: /najnowsze ID\n"
      : "Remove: /remove ID\nex. /remove 18\n\nHistory for a specific link: /latest ID\n"
    );

    for (const row of rows) {
      out += `/najnowsze ${Number(row.id)} — ${escapeHtml(String(row.name || "Monitoring"))}\n`;
    }

    await tgSend(chatId, out.trim(), { disable_web_page_preview: true, link_preview_options: { is_disabled: true } });
  } catch (e) {
    await tgSend(chatId, lang === "pl"
      ? `❌ Błąd /lista: ${escapeHtml(e?.message || e)}`
      : `❌ /list error: ${escapeHtml(e?.message || e)}`
    );
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
  } = deps;

  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");

  if (!argText) {
    await tgSend(chatId, lang === "pl"
      ? "Użycie:\n<code>/dodaj &lt;url&gt; [nazwa]</code>\n\nPrzykład:\n<code>/dodaj https://m.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>"
      : "Usage:\n<code>/add &lt;url&gt; [name]</code>\n\nExample:\n<code>/add https://m.olx.pl/oferty/?q=iphone14 iPhone 14 OLX</code>"
    );
    return;
  }

  const parts = argText.split(/\s+/);
  const url = parts[0];
  const name = parts.slice(1).join(" ") || null;

  if (!url || !/^https?:\/\//i.test(url)) {
    await tgSend(chatId, lang === "pl"
      ? "Pierwszy parametr musi być URL, np. <code>/dodaj https://m.olx.pl/oferty/?q=iphone14</code>"
      : "First parameter must be a URL, e.g. <code>/add https://m.olx.pl/oferty/?q=iphone14</code>"
    );
    return;
  }

  const ent = await getUserEntitlementsByTelegramId(user.telegram_user_id).catch(() => null);
  const limit = Number(ent?.links_limit_total ?? 0);
  if (!ent || !(limit > 0)) {
    await tgSend(chatId, lang === "pl"
      ? "❌ Nie masz aktywnego planu. Użyj /plany żeby kupić plan."
      : "❌ You don't have an active plan. Use /plans to buy a plan."
    );
    return;
  }

  const totalLinks = await countActiveLinksForUserId(user.id).catch(() => 0);
  if (totalLinks >= limit) {
    await tgSend(chatId, lang === "pl"
      ? `❌ Osiągnięto limit linków: <b>${totalLinks}/${limit}</b>`
      : `❌ Link limit reached: <b>${totalLinks}/${limit}</b>`
    );
    return;
  }

  const row = await insertLinkForUserId(user.id, name, url);
  await tgSend(
    chatId,
    (lang === "pl"
      ? `✅ Dodałem nowy link:\n\nID <b>${row.id}</b> — ${escapeHtml(row.name || "(bez nazwy)")}\n<code>${escapeHtml(row.url)}</code>\n\nLinki (łącznie): ${totalLinks + 1}/${limit}\n\nSprawdź: <code>/lista</code>`
      : `✅ Added a new link:\n\nID <b>${row.id}</b> — ${escapeHtml(row.name || "(no name)")}\n<code>${escapeHtml(row.url)}</code>\n\nLinks total: ${totalLinks + 1}/${limit}\n\nCheck: <code>/list</code>`
    ),
    { disable_web_page_preview: true, link_preview_options: { is_disabled: true } }
  );
}

export async function handleRemove(deps, msg, user, argText) {
  const { pool, tgSend, escapeHtml, fydResolveLang } = deps;

  const chatId = String(msg.chat.id);
  const lang = await fydResolveLang(chatId, user, msg?.from?.language_code || "");
  const id = parseInt(argText, 10);

  if (!id) {
    await tgSend(chatId, lang === "pl"
      ? "Podaj ID linku, np.:\n<code>/usun 18</code>"
      : "Provide link ID, e.g.:\n<code>/remove 18</code>"
    );
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
      await tgSend(chatId, lang === "pl"
        ? `Nie znalazłem linku <b>${id}</b> na Twoim koncie. Użyj /lista.`
        : `I can't find link <b>${id}</b> on your account. Use /list.`
      );
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
      await tgSend(chatId, lang === "pl"
        ? `Nie znalazłem linku <b>${id}</b> na Twoim koncie. Użyj /lista.`
        : `I can't find link <b>${id}</b> on your account. Use /list.`
      );
      return;
    }

    await client.query("COMMIT");

    await tgSend(chatId, lang === "pl"
      ? `🗑️ Usunąłem link (zwolniono miejsce):\n\nID <b>${row.id}</b> — ${escapeHtml(row.name || "(bez nazwy)")}\n<code>${escapeHtml(row.url || "")}</code>`
      : `🗑️ Removed link (slot freed):\n\nID <b>${row.id}</b> — ${escapeHtml(row.name || "(no name)")}\n<code>${escapeHtml(row.url || "")}</code>`
    );
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    await tgSend(chatId, lang === "pl"
      ? `❌ Błąd usuwania linku: ${escapeHtml(String(e?.message || e))}`
      : `❌ Error removing link: ${escapeHtml(String(e?.message || e))}`
    );
  } finally {
    try { client.release(); } catch {}
  }
}
