import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

if (!env.databaseUrl) {
  console.warn("DATABASE_URL is not set. Database-backed routes will fail until .env is configured.");
}

export const pool = new Pool({
  connectionString: env.databaseUrl
});

export async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

