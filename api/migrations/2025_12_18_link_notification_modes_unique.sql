-- 1) usuń duplikaty, zostawiając najnowszy rekord per (user_id, chat_id, link_id)
WITH ranked AS (
  SELECT
    ctid,
    row_number() OVER (
      PARTITION BY user_id, chat_id, link_id
      ORDER BY updated_at DESC, ctid DESC
    ) AS rn
  FROM link_notification_modes
)
DELETE FROM link_notification_modes
WHERE ctid IN (SELECT ctid FROM ranked WHERE rn > 1);

-- 2) unikalność na przyszłość
CREATE UNIQUE INDEX IF NOT EXISTS link_notification_modes_uniq
ON link_notification_modes (user_id, chat_id, link_id);
