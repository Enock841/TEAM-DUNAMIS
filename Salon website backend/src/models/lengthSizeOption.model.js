import { query } from "../config/db.js";

export async function listSizesForService(serviceId) {
  const result = await query(
    `select s.id, s.length_option_id as "lengthOptionId", s.label,
            s.price::float8 as price, s.sort_order as "sortOrder"
     from length_size_options s
     join service_length_options l on l.id = s.length_option_id
     where l.service_id = $1
     order by s.sort_order asc, s.created_at asc`,
    [serviceId]
  );
  return result.rows;
}

export async function createSize(data) {
  const result = await query(
    `insert into length_size_options (length_option_id, label, price)
     values ($1, $2, $3)
     returning id, length_option_id as "lengthOptionId", label,
               price::float8 as price, sort_order as "sortOrder"`,
    [data.lengthOptionId, data.label, data.price]
  );
  return result.rows[0];
}

export async function deleteSize(id) {
  const result = await query("delete from length_size_options where id = $1 returning id", [id]);
  return result.rowCount > 0;
}
