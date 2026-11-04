import { query } from "../config/db.js";

export async function createFeedback({ userId, name, contact, rating, message, page }) {
  const result = await query(
    `insert into feedback (user_id, name, contact, rating, message, page)
     values ($1, $2, $3, $4, $5, $6)
     returning id, created_at as "createdAt"`,
    [userId || null, name || "", contact || "", rating, message || "", page || ""]
  );
  return result.rows[0];
}

export async function listFeedback() {
  const items = await query(
    `select f.id, f.rating, f.message,
            coalesce(nullif(f.name, ''), u.name, '') as name,
            coalesce(nullif(f.contact, ''), u.email, u.phone, '') as contact,
            f.page, f.created_at as "createdAt"
     from feedback f
     left join users u on u.id = f.user_id
     order by f.created_at desc
     limit 300`
  );
  const stats = await query(
    `select count(*)::int as total, coalesce(round(avg(rating)::numeric, 1), 0)::float as average
     from feedback`
  );
  return { items: items.rows, total: stats.rows[0].total, average: stats.rows[0].average };
}

export async function deleteFeedback(id) {
  const result = await query("delete from feedback where id = $1", [id]);
  return Boolean(result.rowCount);
}
