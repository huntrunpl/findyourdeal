import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

// =======================
// Inicjalizacja bazy
// =======================
export async function initDb() {
  // links – jeśli jakiejś kolumny nie ma, to ALTER TABLE nic nie popsuje
  await pool.query(`
    CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      name TEXT,
      url TEXT NOT NULL,
      source TEXT,
      active BOOLEAN DEFAULT TRUE,
      chat_id TEXT,
      thread_id TEXT,
      last_key TEXT,
      last_seen_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // dodatkowa kolumna na filtry – jeśli jej nie ma
  await pool.query(`
    ALTER TABLE links
    ADD COLUMN IF NOT EXISTS filters JSONB;
  `);

  // historia ogłoszeń
  await pool.query(`
    CREATE TABLE IF NOT EXISTS link_items (
      id SERIAL PRIMARY KEY,
      link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
      item_key TEXT NOT NULL,
      title TEXT,
      price NUMERIC,
      currency TEXT,
      brand TEXT,
      size TEXT,
      condition TEXT,
      url TEXT,
      first_seen_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(link_id, item_key)
    );
  `);
}

// =======================
// Funkcje dla WORKERA
// =======================

// WAŻNE: tutaj robimy „wygaszanie po planie”.
// Worker bierze tylko linki aktywne, należące do userów z AKTYWNYM planem.
export async function getLinksForWorker() {
  const q = await pool.query(
    `
    SELECT
      l.id,
      l.url,
      l.name,
      l.last_key,
      l.filters
    FROM links l
    JOIN users u
      ON u.id = l.user_id
    WHERE l.active = TRUE
      AND u.plan_name <> 'none'
      AND u.plan_expires_at IS NOT NULL
      AND u.plan_expires_at >= NOW()
    ORDER BY l.id ASC
    `
  );
  return q.rows;
}

export async function updateLastKey(id, key) {
  await pool.query(
    `
    UPDATE links
    SET last_key = $1, last_seen_at = NOW()
    WHERE id = $2
    `,
    [key, id]
  );
}

// =======================
// Historia ogłoszeń – helpery
// =======================

// Zwraca zbiór item_key, które już widzieliśmy dla danego linku
export async function getSeenItemKeys(linkId, itemKeys) {
  if (!itemKeys || itemKeys.length === 0) {
    return new Set();
  }

  const { rows } = await pool.query(
    "SELECT item_key FROM link_items WHERE link_id = $1 AND item_key = ANY($2)",
    [linkId, itemKeys]
  );

  return new Set(rows.map((r) => r.item_key));
}

// Zapisuje nowe ogłoszenia do link_items (tylko te, których jeszcze nie było)
export async function insertLinkItems(linkId, items) {
  if (!items || items.length === 0) return;

  const values = [];
  const params = [];
  let idx = 1;

  for (const it of items) {
    values.push(
      `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8})`
    );

    params.push(
      linkId,
      it.itemKey,
      it.title ?? "",
      it.price ?? null,
      it.currency ?? null,
      it.brand ?? null,
      it.size ?? null,
      it.condition ?? null,
      it.url ?? ""
    );

    idx += 9;
  }

  const sql = `
    INSERT INTO link_items
      (link_id, item_key, title, price, currency, brand, size, condition, url)
    VALUES
      ${values.join(",")}
    ON CONFLICT (link_id, item_key) DO NOTHING
  `;

  await pool.query(sql, params);
}

// =======================
// X najtańszych / X najnowszych – dla KONKRETNEGO linku
// (np. worker może z tego kiedyś korzystać, bot już korzysta z własnych zapytań)
// =======================

export async function getCheapestItems(linkId, limit) {
  const { rows } = await pool.query(
    `
    SELECT title, price, currency, brand, size, condition, url, first_seen_at
    FROM link_items
    WHERE link_id = $1 AND price IS NOT NULL
    ORDER BY price ASC, first_seen_at DESC
    LIMIT $2
    `,
    [linkId, limit]
  );

  return rows;
}

export async function getNewestItems(linkId, limit) {
  const { rows } = await pool.query(
    `
    SELECT title, price, currency, brand, size, condition, url, first_seen_at
    FROM link_items
    WHERE link_id = $1
    ORDER BY first_seen_at DESC
    LIMIT $2
    `,
    [linkId, limit]
  );

  return rows;
}

// =======================
// X najtańszych / X najnowszych – GLOBALNIE dla usera
// (na razie helpery, z których może korzystać bot / inne kawałki kodu)
// =======================

export async function getCheapestItemsForUser(userId, limit) {
  const { rows } = await pool.query(
    `
    SELECT
      li.link_id,
      li.item_key,
      li.title,
      li.price,
      li.currency,
      li.brand,
      li.size,
      li.condition,
      li.url,
      li.first_seen_at,
      l.name   AS link_name,
      l.source AS link_source
    FROM link_items li
    JOIN links l ON l.id = li.link_id
    WHERE l.user_id = $1
      AND li.price IS NOT NULL
    ORDER BY li.price ASC, li.first_seen_at DESC
    LIMIT $2
    `,
    [userId, limit]
  );

  return rows;
}

export async function getNewestItemsForUser(userId, limit) {
  const { rows } = await pool.query(
    `
    SELECT
      li.link_id,
      li.item_key,
      li.title,
      li.price,
      li.currency,
      li.brand,
      li.size,
      li.condition,
      li.url,
      li.first_seen_at,
      l.name   AS link_name,
      l.source AS link_source
    FROM link_items li
    JOIN links l ON l.id = li.link_id
    WHERE l.user_id = $1
    ORDER BY li.first_seen_at DESC
    LIMIT $2
    `,
    [userId, limit]
  );

  return rows;
}
