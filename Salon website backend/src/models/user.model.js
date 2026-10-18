import { query } from "../config/db.js";

export async function createCustomer({ name, phone, passwordHash, email, area }) {
  const result = await query(
    `insert into users (name, phone, password_hash, role, email, area)
     values ($1, $2, $3, 'customer', $4, $5)
     returning id, name, phone, role, email, area, avatar_url`,
    [name, phone, passwordHash, email || null, area || null]
  );
  return result.rows[0];
}

export async function findUserByPhone(phone) {
  const result = await query("select * from users where phone = $1", [phone]);
  return result.rows[0] || null;
}

export async function findUserByEmail(email) {
  const result = await query("select * from users where lower(email) = lower($1)", [email]);
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await query(
    "select id, name, phone, role, email, area, avatar_url, is_active as \"isActive\" from users where id = $1",
    [id]
  );
  return result.rows[0] || null;
}

export async function findUserWithPasswordById(id) {
  const result = await query("select * from users where id = $1", [id]);
  return result.rows[0] || null;
}

export async function updateUserProfile(id, { name, phone, email, area, avatarUrl }) {
  const result = await query(
    `update users
     set name = $1, phone = $2, email = coalesce($3, email), area = coalesce($4, area),
         avatar_url = coalesce($5, avatar_url), updated_at = now()
     where id = $6
     returning id, name, phone, role, email, area, avatar_url`,
    [name, phone, email || null, area || null, avatarUrl || null, id]
  );
  return result.rows[0] || null;
}

export async function updateUserPassword(id, passwordHash) {
  const result = await query(
    `update users
     set password_hash = $1, updated_at = now()
     where id = $2
     returning id`,
    [passwordHash, id]
  );
  return Boolean(result.rowCount);
}

export async function createPasswordReset(userId, tokenHash, expiresAt) {
  await query("delete from password_resets where user_id = $1", [userId]);
  await query(
    "insert into password_resets (user_id, token_hash, expires_at) values ($1, $2, $3)",
    [userId, tokenHash, expiresAt]
  );
}

export async function findValidPasswordReset(tokenHash) {
  const result = await query(
    `select id, user_id as "userId" from password_resets
     where token_hash = $1 and used_at is null and expires_at > now()`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

export async function markPasswordResetUsed(id) {
  await query("update password_resets set used_at = now() where id = $1", [id]);
}
