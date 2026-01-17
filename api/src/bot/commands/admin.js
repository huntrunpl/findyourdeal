"use strict";

/**
 * Import-safe admin commands module.
 * No side-effects on import.
 */
export function createAdminHandlers({ tgSend, escapeHtml, dbQuery }) {
  // ---------- admin helpers ----------
  function getAdminIds() {
    const raw =
      process.env.FYD_ADMIN_TG_IDS ||
      process.env.FYD_SUPERADMIN_TG_IDS ||
      "";
    return String(raw)
      .split(/[, ]+/)
      .map((x) => Number(String(x || "").trim()))
      .filter((x) => Number.isFinite(x) && x > 0);
  }

  function isAdminTgId(tgId) {
    const ids = getAdminIds();
    return ids.length ? ids.includes(Number(tgId)) : false;
  }

  // /technik (ADMIN)
  async function handleTechnik(msg, user, argText) {
    const chatId = String(msg.chat.id);
    const fromId = msg?.from?.id;
    if (!isAdminTgId(fromId)) {
      await tgSend(chatId, "⛔ Brak uprawnień (ADMIN).");
      return;
    }

    const target = Number(argText || fromId || 0);
    if (!Number.isFinite(target) || target <= 0) {
      await tgSend(chatId, "Użycie: /technik <telegram_user_id>");
      return;
    }

    const r = await dbQuery(
      `SELECT id FROM users WHERE telegram_user_id=$1 LIMIT 1`,
      [target]
    ).catch(() => ({ rows: [] }));
    const uid = r?.rows?.[0]?.id ? Number(r.rows[0].id) : 0;

    await tgSend(
      chatId,
      `🛠 <b>TECHNIK</b>\n` +
        `tg_user_id: <code>${escapeHtml(String(target))}</code>\n` +
        `user_id: <code>${escapeHtml(String(uid || 0))}</code>`,
      { disable_web_page_preview: true, link_preview_options: { is_disabled: true } }
    );
  }

  // /usun_uzytkownika (SUPERADMIN)
  async function handleUsunUzytkownika(msg, user) {
    const chatId = String(msg.chat.id);
    const fromId = msg?.from?.id || 0;
    const superAdmins = String(process.env.FYD_SUPERADMIN_TG_IDS || "")
      .split(/[, ]+/)
      .map((x) => Number(String(x || "").trim()))
      .filter((x) => Number.isFinite(x) && x > 0);

    if (!superAdmins.includes(Number(fromId))) {
      await tgSend(chatId, "⛔ Brak uprawnień (tylko SUPERADMIN).");
      return;
    }

    const parts = String(msg.text || "").trim().split(/\s+/);
    const tgId = Number(parts[1] || 0);

    if (!Number.isFinite(tgId) || tgId <= 0) {
      await tgSend(chatId, "Użycie: /usun_uzytkownika <telegram_user_id>");
      return;
    }

    const safe = async (sql, params) => {
      try { await dbQuery(sql, params); } catch {}
    };

    try {
      const u = await dbQuery("SELECT id FROM users WHERE telegram_user_id=$1 LIMIT 1", [tgId]);
      if (!u.rows.length) {
        await tgSend(chatId, `ℹ️ Nie znaleziono użytkownika o telegram_user_id=${tgId}`);
        return;
      }
      const userId = Number(u.rows[0].id);

      await dbQuery("BEGIN");

      await safe("DELETE FROM panel_sessions WHERE user_id=$1", [userId]);
      await safe("DELETE FROM panel_login_tokens WHERE user_id=$1", [userId]);
      await safe("DELETE FROM subscriptions WHERE user_id=$1", [userId]);

      await safe("DELETE FROM link_notification_modes WHERE user_id=$1", [userId]);
      await safe("DELETE FROM chat_notifications WHERE user_id=$1", [userId]);

      await safe("DELETE FROM link_items WHERE link_id IN (SELECT id FROM links WHERE user_id=$1)", [userId]);
      await safe("DELETE FROM link_notification_modes WHERE link_id IN (SELECT id FROM links WHERE user_id=$1)", [userId]);
      await safe("DELETE FROM links WHERE user_id=$1", [userId]);

      await dbQuery("DELETE FROM users WHERE id=$1", [userId]);

      await dbQuery("COMMIT");
      await tgSend(chatId, `✅ Usunięto użytkownika telegram_user_id=${tgId} (user_id=${userId}) i wyczyszczono jego dane.`);
    } catch (e) {
      try { await dbQuery("ROLLBACK"); } catch {}
      await tgSend(chatId, `❌ Błąd usuwania użytkownika: ${escapeHtml(String(e?.message || e))}`);
    }
  }

  // /daj_admina (SUPERADMIN)
  async function handleDajAdmina(msg, user) {
    const chatId = String(msg.chat.id);
    const fromId = msg?.from?.id || 0;
    const superAdmins = String(process.env.FYD_SUPERADMIN_TG_IDS || "")
      .split(/[, ]+/)
      .map((x) => Number(String(x || "").trim()))
      .filter((x) => Number.isFinite(x) && x > 0);

    if (!superAdmins.includes(Number(fromId))) {
      await tgSend(chatId, "⛔ Brak uprawnień (tylko SUPERADMIN).");
      return;
    }

    const parts = String(msg.text || "").trim().split(/\s+/);
    const tgId = Number(parts[1] || 0);

    if (!Number.isFinite(tgId) || tgId <= 0) {
      await tgSend(chatId, "Użycie: /daj_admina <telegram_user_id>");
      return;
    }

    try {
      await dbQuery("UPDATE users SET is_admin=TRUE WHERE telegram_user_id=$1", [tgId]).catch(() => {});
      const check = await dbQuery("SELECT id FROM users WHERE telegram_user_id=$1 LIMIT 1", [tgId]);
      if (!check.rows.length) {
        await tgSend(chatId, `ℹ️ Nie znaleziono użytkownika o telegram_user_id=${tgId} (najpierw musi zrobić /start).`);
        return;
      }
      await tgSend(chatId, `✅ Nadano ADMIN dla telegram_user_id=${tgId}`);
    } catch (e) {
      await tgSend(chatId, `❌ Błąd nadawania admina: ${escapeHtml(String(e?.message || e))}`);
    }
  }

  return { handleTechnik, handleUsunUzytkownika, handleDajAdmina };
}
