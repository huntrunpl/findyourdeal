"use server";

import { revalidatePath } from "next/cache";
import { pool } from "../../lib/db";
import { getSessionUserId } from "../../lib/auth";

function mustInt(v: FormDataEntryValue | null, name: string) {
  const n = Number(String(v ?? ""));
  if (!Number.isFinite(n)) throw new Error(`Bad ${name}`);
  return n;
}

async function mustSessionUserId() {
  const uid = await getSessionUserId();
  if (!uid) throw new Error("Unauthorized");
  return uid;
}

async function getPrimaryChatId(userId: number) {
  const q = await pool.query(
    `
    SELECT chat_id
    FROM chat_notifications
    WHERE user_id=$1
    ORDER BY enabled DESC, updated_at DESC, id DESC
    LIMIT 1
    `,
    [userId]
  );
  return String(q.rows?.[0]?.chat_id || "");
}

export async function toggleLinkActive(formData: FormData) {
  const userId = await mustSessionUserId();
  const id = mustInt(formData.get("id"), "id");
  const active = String(formData.get("active") ?? "") === "true";

  await pool.query("UPDATE links SET active=$1 WHERE id=$2 AND user_id=$3", [
    !active,
    id,
    userId,
  ]);

  revalidatePath("/links");
}

export async function resetBaseline(formData: FormData) {
  const userId = await mustSessionUserId();
  const id = mustInt(formData.get("id"), "id");

  await pool.query("UPDATE links SET last_key=NULL WHERE id=$1 AND user_id=$2", [
    id,
    userId,
  ]);
  await pool.query(
    `
    DELETE FROM link_items
    WHERE link_id = $1
      AND EXISTS (SELECT 1 FROM links WHERE id = $1 AND user_id = $2)
    `,
    [id, userId]
  );

  revalidatePath("/links");
}

export async function setLinkNotificationMode(formData: FormData) {
  const userId = await mustSessionUserId();
  const linkId = mustInt(formData.get("link_id"), "link_id");
  const mode = String(formData.get("mode") ?? "").toLowerCase();

  if (!["single", "batch", "off"].includes(mode)) {
    throw new Error("Bad mode");
  }

  const chatId = await getPrimaryChatId(userId);
  if (!chatId) {
    throw new Error("Brak połączonego Telegrama. Otwórz bota w Telegramie i użyj /start.");
  }

  await pool.query(
    `
    INSERT INTO link_notification_modes (chat_id, user_id, link_id, mode, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (chat_id, user_id, link_id)
    DO UPDATE SET mode=EXCLUDED.mode, updated_at=NOW()
    `,
    [chatId, userId, linkId, mode]
  );

  revalidatePath("/links");
}

export async function clearLinkNotificationMode(formData: FormData) {
  const userId = await mustSessionUserId();
  const linkId = mustInt(formData.get("link_id"), "link_id");

  const chatId = await getPrimaryChatId(userId);
  if (!chatId) {
    throw new Error("Brak połączonego Telegrama. Otwórz bota w Telegramie i użyj /start.");
  }

  await pool.query(
    `
    DELETE FROM link_notification_modes
    WHERE chat_id=$1 AND user_id=$2 AND link_id=$3
    `,
    [chatId, userId, linkId]
  );

  revalidatePath("/links");
}
