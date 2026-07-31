import { query } from "../config/db.js";

const publicSelection = `
  select s.id, s.name, s.description, s.duration_minutes as "durationMinutes",
         s.price_min as "priceMin", s.price_max as "priceMax", s.images,
         json_build_object(
           'id', c.id,
           'name', c.name,
           'dailyCap', c.daily_cap,
           'imageUrl', c.image_url
         ) as category
  from services s
  join service_categories c on c.id = s.category_id
`;

export async function listServices() {
  const result = await query(
    `${publicSelection}
     where s.is_active = true and c.is_active = true
     order by
       case c.name
         when 'Braiding' then 1
         when 'Nails' then 2
         when 'Piercings' then 3
         when 'Lash & Brows' then 4
         when 'Wigs' then 5
         when 'Others' then 6
         else 7
       end,
       s.name`
  );
  return result.rows;
}

export async function findServiceById(id) {
  const result = await query(
    `${publicSelection}
     where s.id = $1 and s.is_active = true and c.is_active = true`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createService(input) {
  const result = await query(
    `insert into services
       (name, description, category_id, duration_minutes, price_min, price_max, images)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id, name, description, category_id as "categoryId",
               duration_minutes as "durationMinutes", price_min as "priceMin",
               price_max as "priceMax", images`,
    [
      input.name,
      input.description,
      input.categoryId,
      input.durationMinutes,
      input.priceMin,
      input.priceMax,
      input.images
    ]
  );
  return result.rows[0];
}

export async function updateService(id, input) {
  const current = await query("select * from services where id = $1", [id]);
  if (!current.rowCount) return null;

  const merged = { ...current.rows[0], ...input };
  const result = await query(
    `update services
     set name = $1, description = $2, category_id = $3, duration_minutes = $4,
         price_min = $5, price_max = $6, images = $7, updated_at = now()
     where id = $8
     returning id, name, description, category_id as "categoryId",
               duration_minutes as "durationMinutes", price_min as "priceMin",
               price_max as "priceMax", images`,
    [
      merged.name,
      merged.description,
      merged.categoryId || merged.category_id,
      merged.durationMinutes ?? merged.duration_minutes,
      merged.priceMin ?? merged.price_min,
      merged.priceMax ?? merged.price_max,
      merged.images,
      id
    ]
  );
  return result.rows[0];
}

export async function archiveService(id) {
  const result = await query(
    `update services
     set is_active = false, updated_at = now()
     where id = $1 and is_active = true
     returning id`,
    [id]
  );
  return Boolean(result.rowCount);
}
