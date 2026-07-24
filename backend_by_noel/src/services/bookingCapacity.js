import { HttpError } from "../utils/httpError.js";

export async function getAvailability(client, serviceId, date) {
  const result = await client.query(
    `select s.id as service_id, c.id as category_id, c.daily_cap,
            count(b.id)::int as booked_count
     from services s
     join service_categories c on c.id = s.category_id
     left join bookings b on b.service_id = s.id
       and b.booking_date = $2
       and b.status in ('pending', 'confirmed')
     where s.id = $1 and s.is_active = true
     group by s.id, c.id, c.daily_cap`,
    [serviceId, date]
  );

  const row = result.rows[0];
  if (!row) throw new HttpError(404, "Service not found");

  const slotsRemaining = Math.max(row.daily_cap - row.booked_count, 0);
  return {
    date,
    serviceId,
    categoryId: row.category_id,
    dailyCap: row.daily_cap,
    bookedCount: row.booked_count,
    slotsRemaining,
    available: slotsRemaining > 0
  };
}

export async function assertBookingCapacity(client, serviceId, date) {
  const availability = await getAvailability(client, serviceId, date);

  if (!availability.available) {
    throw new HttpError(409, "Daily booking cap reached for this service category", availability);
  }

  return availability;
}

