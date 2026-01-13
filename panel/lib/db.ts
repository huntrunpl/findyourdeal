import pg from "pg";

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var __FYD_POOL__: pg.Pool | undefined;
}

export const pool =
  global.__FYD_POOL__ ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  global.__FYD_POOL__ = pool;
}
