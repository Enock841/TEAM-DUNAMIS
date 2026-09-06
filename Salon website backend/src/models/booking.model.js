import { pool, query } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";

function generateConfirmationCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function availabilityWithClient(client, serviceId, date) {
  const result = await client.query(
    `select s.id as service_id, c.id as category_id, c.daily_cap,
            count(b.id)::int as booked_count
     from services s
     join service_categories c on c.id = s.category_id
     left join services category_service on category_service.category_id = c.id
       and category_service.is_active = true
     left join bookings b on b.service_id = category_service.id
       and b.booking_date = $2
       and b.status in ('pending', 'confirmed')
     where s.id = $1 and s.is_active = true
     group by s.id, c.id, c.daily_cap`,
    [serviceId, date]
  );

  const row = result.rows[0];
  if (!row) throw new HttpError(404, "Service not found");

  const takenResult = await client.query(
    `select distinct b.time_slot
     from bookings b
     join services category_service on category_service.id = b.service_id
     where category_service.category_id = $1
       and b.booking_date = $2
       and b.status in ('pending', 'confirmed')`,
    [row.category_id, date]
  );
  const bookedTimeSlots = takenResult.rows.map(function (r) { return r.time_slot; });

  const slotsRemaining = Math.max(row.daily_cap - row.booked_count, 0);
  return {
    date,
    serviceId,
    categoryId: row.category_id,
    dailyCap: row.daily_cap,
    bookedCount: row.booked_count,
    slotsRemaining,
    available: slotsRemaining > 0,
    bookedTimeSlots
  };
}

export function getBookingAvailability(serviceId, date) {
  return availabilityWithClient(pool, serviceId, date);
}

export async function getMonthAvailability(serviceId, year, month) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const result = await query(
    `select b.booking_date::text as date, c.daily_cap, count(b.id)::int as booked_count
     from services s
     join service_categories c on c.id = s.category_id
     join services category_service on category_service.category_id = c.id
       and category_service.is_active = true
     left join bookings b on b.service_id = category_service.id
       and b.status in ('pending', 'confirmed')
       and b.booking_date >= $2::date
       and b.booking_date < ($2::date + interval '1 month')
     where s.id = $1
     group by b.booking_date, c.daily_cap`,
    [serviceId, start]
  );

  const capResult = await query(
    `select c.daily_cap
     from services s
     join service_categories c on c.id = s.category_id
     where s.id = $1`,
    [serviceId]
  );
  const dailyCap = capResult.rows[0]?.daily_cap ?? 0;

  const byDate = {};
  for (const row of result.rows) {
    if (row.date) byDate[row.date] = row.booked_count;
  }

  return { dailyCap, bookedByDate: byDate };
}

export async function createBooking(userId, input) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const availability = await availabilityWithClient(client, input.serviceId, input.date);
    if (!availability.available) {
      throw new HttpError(
        409,
        "Daily booking cap reached for this service category",
        availability
      );
    }

    const code = generateConfirmationCode();

    const result = await client.query(
      `insert into bookings (
         user_id, service_id, booking_date, time_slot, status,
         reference_image_url, length_label, confirmation_code,
         custom_length_request, custom_length_status, notes, contact_email,
         extension_product_id, extension_product_name, extension_quantity, extension_product_price
       )
       values ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       returning id, user_id as "userId", service_id as "serviceId",
                 booking_date as date, time_slot as "timeSlot", status,
                 reference_image_url as "referenceImageUrl", length_label as "lengthLabel",
                 confirmation_code as "confirmationCode",
                 custom_length_request as "customLengthRequest",
                 custom_length_status as "customLengthStatus",
                 notes, contact_email as "contactEmail",
                 extension_product_id as "extensionProductId",
                 extension_product_name as "extensionProductName",
                 extension_quantity as "extensionQuantity",
                 extension_product_price as "extensionProductPrice",
                 created_at as "createdAt"`,
      [
        userId,
        input.serviceId,
        input.date,
        input.timeSlot,
        input.referenceImageUrl || null,
        input.lengthLabel || null,
        code,
        input.customLengthRequest || null,
        input.customLengthRequest ? "pending" : null,
        input.notes || null,
        input.contactEmail || null,
        input.extensionProductId || null,
        input.extensionProductName || null,
        input.extensionQuantity || null,
        input.extensionProductPrice || null
      ]
    );
    await client.query("commit");
    return result.rows[0];
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function listBookingsForUser(userId) {
  const result = await query(
    `select b.id, b.booking_date as date, b.time_slot as "timeSlot", b.status,
            b.reference_image_url as "referenceImageUrl", b.length_label as "lengthLabel",
            b.confirmation_code as "confirmationCode",
            b.custom_length_request as "customLengthRequest",
            b.custom_length_price as "customLengthPrice",
            b.custom_length_status as "customLengthStatus",
            b.confirmed_price as "confirmedPrice",
            b.amount_paid as "amountPaid",
            (b.confirmed_price is not null and b.amount_paid >= b.confirmed_price) as "isPaid",
            s.name as "serviceName", c.name as "categoryName"
     from bookings b
     join services s on s.id = b.service_id
     join service_categories c on c.id = s.category_id
     where b.user_id = $1
     order by b.created_at desc`,
    [userId]
  );
  return result.rows;
}

export async function listBookings({ date, categoryId }) {
  const result = await query(
    `select b.id, b.booking_date as date, b.time_slot as "timeSlot", b.status,
            b.reference_image_url as "referenceImageUrl", b.length_label as "lengthLabel",
            b.custom_length_request as "customLengthRequest",
            b.custom_length_price as "customLengthPrice",
            b.custom_length_status as "customLengthStatus",
            b.confirmed_price as "confirmedPrice",
            b.amount_paid as "amountPaid",
            b.notes,
            b.extension_product_name as "extensionProductName",
            b.extension_quantity as "extensionQuantity",
            b.extension_product_price as "extensionProductPrice",
            json_build_object('id', u.id, 'name', u.name, 'phone', u.phone) as "user",
            json_build_object('id', s.id, 'name', s.name) as "service",
            json_build_object('id', c.id, 'name', c.name) as "category"
     from bookings b
     join users u on u.id = b.user_id
     join services s on s.id = b.service_id
     join service_categories c on c.id = s.category_id
     where ($1::date is null or b.booking_date = $1::date)
       and ($2::uuid is null or c.id = $2::uuid)
     order by b.created_at desc`,
    [date || null, categoryId || null]
  );
  return result.rows;
}

export async function findBookingByCode(code) {
  const result = await query(
    `select b.id, b.booking_date as date, b.time_slot as "timeSlot", b.status,
            b.confirmation_code as "confirmationCode",
            b.confirmed_price as "confirmedPrice", b.amount_paid as "amountPaid",
            u.name as "customerName", u.phone as "customerPhone",
            s.name as "serviceName"
     from bookings b
     join users u on u.id = b.user_id
     join services s on s.id = b.service_id
     where upper(b.confirmation_code) = upper($1)`,
    [code]
  );
  return result.rows[0] || null;
}

export async function updateBookingStatus(id, status, price) {
  const result = await query(
    `update bookings
     set status = $1,
         confirmed_price = coalesce($2, confirmed_price),
         updated_at = now()
     where id = $3
     returning id, user_id as "userId", service_id as "serviceId",
               booking_date as date, time_slot as "timeSlot", status,
               confirmed_price as "confirmedPrice"`,
    [status, price ?? null, id]
  );
  return result.rows[0] || null;
}

export async function rescheduleBooking(id, date, timeSlot) {
  const result = await query(
    `update bookings
     set booking_date = $1, time_slot = $2, updated_at = now()
     where id = $3
     returning id, user_id as "userId", service_id as "serviceId",
               booking_date as date, time_slot as "timeSlot", status`,
    [date, timeSlot, id]
  );
  return result.rows[0] || null;
}

export async function getBookingsNeedingReminder() {
  const result = await query(
    `select b.id, b.booking_date as date, b.time_slot as "timeSlot",
            b.confirmation_code as "confirmationCode",
            s.name as "serviceName",
            u.name as "customerName", u.phone as "customerPhone", u.email as "customerEmail"
     from bookings b
     join services s on s.id = b.service_id
     join users u on u.id = b.user_id
     where b.status = 'confirmed'
       and b.reminder_sent = false
       and b.booking_date = (current_date + interval '1 day')::date`
  );
  return result.rows;
}

export async function markReminderSent(id) {
  await query("update bookings set reminder_sent = true where id = $1", [id]);
}

export async function deleteBooking(id) {
  const result = await query(
    "delete from bookings where id = $1 and status in ('completed', 'cancelled') returning id",
    [id]
  );
  return Boolean(result.rowCount);
}

export async function approveCustomLength(id, price) {
  const result = await query(
    `update bookings
     set custom_length_price = $1, custom_length_status = 'approved', updated_at = now()
     where id = $2
     returning id, user_id as "userId", custom_length_request as "customLengthRequest",
               custom_length_price as "customLengthPrice", custom_length_status as "customLengthStatus"`,
    [price, id]
  );
  return result.rows[0] || null;
}