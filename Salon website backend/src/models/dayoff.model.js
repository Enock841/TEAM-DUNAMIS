import { query } from "../config/db.js";

export async function listDaysOff() {
  const days = await query(
    `select day::text as day, reason from days_off
     where day >= current_date - interval '1 day'
     order by day`
  );
  const weekdays = await query("select weekday from closed_weekdays order by weekday");
  return { days: days.rows, weekdays: weekdays.rows.map((row) => row.weekday) };
}

export async function addDayOff(day, reason) {
  await query(
    `insert into days_off (day, reason) values ($1::date, $2)
     on conflict (day) do update set reason = excluded.reason`,
    [day, reason || null]
  );
  const count = await query(
    `select count(*)::int as n from bookings
     where booking_date = $1::date and status in ('pending', 'confirmed')`,
    [day]
  );
  return { day, reason: reason || null, existingBookings: count.rows[0].n };
}

export async function removeDayOff(day) {
  const result = await query("delete from days_off where day = $1::date", [day]);
  return Boolean(result.rowCount);
}

export async function setClosedWeekdays(weekdays) {
  await query("delete from closed_weekdays");
  if (weekdays.length) {
    await query(
      "insert into closed_weekdays (weekday) select unnest($1::int[]) on conflict do nothing",
      [weekdays]
    );
  }
  return weekdays;
}

export async function listLimits() {
  const setting = await query("select max_clients_per_day from business_settings where id = 1");
  const days = await query(
    `select day::text as day, max_clients as "maxClients" from day_limits
     where day >= current_date order by day`
  );
  return { defaultMax: setting.rows[0]?.max_clients_per_day ?? 0, days: days.rows };
}

export async function setDefaultLimit(maxClients) {
  await query("update business_settings set max_clients_per_day = $1 where id = 1", [maxClients]);
  return maxClients;
}

export async function setDayLimit(day, maxClients) {
  await query(
    `insert into day_limits (day, max_clients) values ($1::date, $2)
     on conflict (day) do update set max_clients = excluded.max_clients`,
    [day, maxClients]
  );
  return { day, maxClients };
}

export async function removeDayLimit(day) {
  const result = await query("delete from day_limits where day = $1::date", [day]);
  return Boolean(result.rowCount);
}
