import bcrypt from "bcryptjs";
import { env } from "../src/config/env.js";
import { pool } from "../src/db/pool.js";

const admin = {
  name: process.env.ADMIN_NAME,
  phone: process.env.ADMIN_PHONE,
  password: process.env.ADMIN_PASSWORD
};

async function createAdmin() {
  if (!admin.name || !admin.phone || !admin.password) {
    throw new Error("Set ADMIN_NAME, ADMIN_PHONE, and ADMIN_PASSWORD in .env before running this script.");
  }

  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const passwordHash = await bcrypt.hash(admin.password, 12);

  const result = await pool.query(
    `insert into users (name, phone, password_hash, role)
     values ($1, $2, $3, 'admin')
     on conflict (phone) do update
       set name = excluded.name,
           password_hash = excluded.password_hash,
           role = 'admin',
           updated_at = now()
     returning id, name, phone, role`,
    [admin.name, admin.phone, passwordHash]
  );

  await pool.end();
  console.log(`Admin ready: ${result.rows[0].name} (${result.rows[0].phone})`);
}

createAdmin().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});

