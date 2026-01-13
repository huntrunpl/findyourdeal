import "dotenv/config";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function main() {
  console.log("=== Dezaktywacja linków po wygasłych planach ===");

  // 1. Podgląd – ilu userów ma nieaktywny plan
  const usersRes = await pool.query(
    `
    SELECT id, telegram_user_id, username, plan_name, plan_expires_at
    FROM users
    WHERE
      plan_name = 'none'
      OR plan_expires_at IS NULL
      OR plan_expires_at < NOW()
    ORDER BY id
    `
  );

  if (usersRes.rows.length === 0) {
    console.log("Brak użytkowników z nieaktywnym planem. Nic do zrobienia.");
    return;
  }

  console.log(
    `Znaleziono ${usersRes.rows.length} użytkowników z nieaktywnym planem:`
  );
  for (const u of usersRes.rows) {
    console.log(
      `- user_id=${u.id}, telegram_user_id=${u.telegram_user_id}, plan=${u.plan_name}, expires=${u.plan_expires_at}`
    );
  }

  // 2. Dezaktywacja linków tych użytkowników
  const updateRes = await pool.query(
    `
    UPDATE links
    SET active = FALSE
    WHERE active = TRUE
      AND user_id IN (
        SELECT id
        FROM users
        WHERE
          plan_name = 'none'
          OR plan_expires_at IS NULL
          OR plan_expires_at < NOW()
      )
    RETURNING id, user_id, name, url
    `
  );

  console.log(
    `\nZdezaktywowano linków (active = false): ${updateRes.rowCount}`
  );

  if (updateRes.rows.length > 0) {
    console.log("Przykładowe linki:");
    for (const row of updateRes.rows.slice(0, 10)) {
      console.log(
        `- id=${row.id}, user_id=${row.user_id}, name="${row.name}", url=${row.url}`
      );
    }
    if (updateRes.rows.length > 10) {
      console.log(`... oraz ${updateRes.rows.length - 10} więcej.`);
    }
  }

  console.log("\nGotowe.\n");
}

(async () => {
  try {
    await main();
  } catch (err) {
    console.error("Błąd w maintenance-deactivate-expired-links:", err);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
})();
