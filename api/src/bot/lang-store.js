import pg from "pg";
import { hasColumn } from "./schema-cache.js";
import { normLang } from "./utils.js";
import { FYD_DEFAULT_LANG, isSupportedLang } from "./i18n.js";

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL || "";
const __pool = globalThis.__FYD_LANG_POOL_SINGLE || new Pool({ connectionString: DATABASE_URL });
globalThis.__FYD_LANG_POOL_SINGLE = __pool;
async function dbQuery(sql, params = []) { return __pool.query(sql, params); }

// extracted from api/telegram-bot.js (NO behavior change)

// ---------- language read/write (panel <-> tg) ----------
async function getUserLangByUserId(userId) {
  const uid = Number(userId);
  if (!uid) return null;

  // prefer users.lang, then users.language
  try {
    if (await hasColumn("users", "lang")) {
      const r = await dbQuery(`SELECT lang FROM public.users WHERE id=$1 LIMIT 1`, [uid]);
      const v = normLang(r?.rows?.[0]?.lang || "");
      if (v && isSupportedLang(v)) return v;
    }
  } catch {}

  try {
    if (await hasColumn("users", "language")) {
      const r = await dbQuery(`SELECT language FROM public.users WHERE id=$1 LIMIT 1`, [uid]);
      const v = normLang(r?.rows?.[0]?.language || "");
      if (v && isSupportedLang(v)) return v;
    }
  } catch {}

  return null;
}

async function maybeMigrateChatLangToUser(chatId, userId) {
  try {
    if (!(await hasColumn("chat_notifications", "language"))) return null;

    const r = await dbQuery(
      `SELECT language FROM public.chat_notifications WHERE chat_id=$1 AND user_id=$2 LIMIT 1`,
      [String(chatId), Number(userId)]
    );
    const v = normLang(r?.rows?.[0]?.language || "");
    if (!v || !isSupportedLang(v)) return null;

    // write into users.lang / users.language if empty (best-effort)
    try {
      if (await hasColumn("users", "lang")) {
        await dbQuery(
          `UPDATE public.users SET lang=$2, updated_at=NOW()
           WHERE id=$1 AND (lang IS NULL OR lang='') AND (lang IS NULL OR lang='')`,
          [Number(userId), v]
        );
      }
    } catch {}
    try {
      if (await hasColumn("users", "language")) {
        await dbQuery(
          `UPDATE public.users SET language=$2, updated_at=NOW()
           WHERE id=$1 AND (language IS NULL OR language='') AND (language IS NULL OR language='')`,
          [Number(userId), v]
        );
      }
    } catch {}

    return v;
  } catch {
    return null;
  }
}

async function OLD_getLangFromUsers(chatId, user, telegramLangCode = "") {
  const uid = Number(user?.id || 0);

  // 1) DB is source of truth
  if (uid) {
    const dbLang = await getUserLangByUserId(uid);
    if (dbLang) return dbLang;

    // 2) migrate legacy chat_notifications.language -> users
    const legacy = await maybeMigrateChatLangToUser(chatId, uid);
    if (legacy) return legacy;
  }

  // 3) fallback: telegram language_code and persist if possible
  const guess0 = normLang(telegramLangCode || user?.language_code || user?.language || "");
  const guess = isSupportedLang(guess0) ? guess0 : FYD_DEFAULT_LANG;

  if (uid) {
    try {
      if (await hasColumn("users", "lang")) {
        await dbQuery(
          `UPDATE public.users SET lang=$2, updated_at=NOW()
           WHERE id=$1 AND (lang IS NULL OR lang='') AND (lang IS NULL OR lang='')`,
          [uid, guess]
        );
      }
    } catch {}
    try {
      if (await hasColumn("users", "language")) {
        await dbQuery(
          `UPDATE public.users SET language=$2, updated_at=NOW()
           WHERE id=$1 AND (language IS NULL OR language='') AND (language IS NULL OR language='')`,
          [uid, guess]
        );
      }
    } catch {}
  }

  return guess;
}

async function setLang(chatId, user, langCode) {
  const uid = Number(user?.id || 0);
  const lang = isSupportedLang(normLang(langCode)) ? normLang(langCode) : FYD_DEFAULT_LANG;

  if (uid) {
    try {
      if (await hasColumn("users", "lang")) {
        await dbQuery(`UPDATE public.users SET lang=$2, updated_at=NOW() WHERE id=$1`, [uid, lang]);
      }
    } catch {}
    try {
      if (await hasColumn("users", "language")) {
        await dbQuery(`UPDATE public.users SET language=$2, updated_at=NOW() WHERE id=$1`, [uid, lang]);
      }
    } catch {}
  }  
  return lang;
}

export { getUserLangByUserId, maybeMigrateChatLangToUser, OLD_getLangFromUsers, setLang };
