import { query } from "../config/db.js";

export async function listCategories() {
  const result = await query(
    `select id, name, daily_cap as "dailyCap", image_url as "imageUrl"
     from service_categories
     where is_active = true
     order by
       case name
         when 'Braiding' then 1
         when 'Nails' then 2
         when 'Piercings' then 3
         when 'Lash & Brows' then 4
         when 'Wigs' then 5
         when 'Others' then 6
         else 7
       end`
  );
  return result.rows;
}

export async function createCategory(input) {
  const result = await query(
    `insert into service_categories (name, daily_cap, image_url, is_active)
     values ($1, $2, $3, true)
     returning id, name, daily_cap as "dailyCap", image_url as "imageUrl"`,
    [input.name, input.dailyCap, input.imageUrl || null]
  );
  return result.rows[0];
}

export async function updateCategory(id, input) {
  const current = await query(
    `select name, daily_cap, image_url from service_categories where id = $1 and is_active = true`,
    [id]
  );
  if (!current.rows[0]) return null;
  const merged = { ...current.rows[0], ...input };
  const result = await query(
    `update service_categories
     set name = $1, daily_cap = $2, image_url = $3, updated_at = now()
     where id = $4 and is_active = true
     returning id, name, daily_cap as "dailyCap", image_url as "imageUrl"`,
    [
      merged.name,
      merged.dailyCap ?? merged.daily_cap,
      merged.imageUrl ?? merged.image_url,
      id
    ]
  );
  return result.rows[0] || null;
}

export async function archiveCategory(id) {
  const result = await query(
    `update service_categories
     set is_active = false, updated_at = now()
     where id = $1 and is_active = true
     returning id`,
    [id]
  );
  return Boolean(result.rows[0]);
}
