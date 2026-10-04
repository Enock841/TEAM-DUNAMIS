import { pool, query } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";

export async function createReview(userId, input) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    if (input.orderId) {
      const orderResult = await client.query(
        `select id, status from orders where id = $1 and user_id = $2 for update`,
        [input.orderId, userId]
      );
      const order = orderResult.rows[0];
      if (!order) throw new HttpError(404, "Order not found");
      if (order.status !== "fulfilled") {
        throw new HttpError(409, "You can only review an order after it has been delivered");
      }

      const result = await client.query(
        `insert into reviews (order_id, user_id, rating, comment, media_url, media_type, status)
         values ($1, $2, $3, $4, $5, $6, 'pending')
         returning id, order_id as "orderId", rating, comment,
                   media_url as "mediaUrl", media_type as "mediaType", status, created_at as "createdAt"`,
        [input.orderId, userId, input.rating, input.comment || "", input.mediaUrl || null, input.mediaType || null]
      );
      await client.query("commit");
      return result.rows[0];
    }

    const bookingResult = await client.query(
      `select id, status from bookings where id = $1 and user_id = $2 for update`,
      [input.bookingId, userId]
    );
    const booking = bookingResult.rows[0];
    if (!booking) throw new HttpError(404, "Appointment not found");
    if (booking.status !== "completed") {
      throw new HttpError(409, "You can only review an appointment after it has been completed");
    }

    const result = await client.query(
      `insert into reviews (booking_id, user_id, rating, comment, media_url, media_type, status)
       values ($1, $2, $3, $4, $5, $6, 'pending')
       returning id, booking_id as "bookingId", rating, comment,
                 media_url as "mediaUrl", media_type as "mediaType", status, created_at as "createdAt"`,
      [input.bookingId, userId, input.rating, input.comment || "", input.mediaUrl || null, input.mediaType || null]
    );
    await client.query("commit");
    return result.rows[0];
  } catch (error) {
    await client.query("rollback");
    if (error.code === "23505") {
      throw new HttpError(409, "You have already left a review for this");
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function listApprovedReviews() {
  const result = await query(
    `select r.id, r.rating, r.comment, r.media_url as "mediaUrl", r.media_type as "mediaType",
            r.created_at as "createdAt", u.name as "customerName",
            coalesce(s.name, order_summary.names) as "serviceName"
     from reviews r
     join users u on u.id = r.user_id
     left join bookings b on b.id = r.booking_id
     left join services s on s.id = b.service_id
     left join lateral (
       select string_agg(p.name, ', ') as names
       from order_items oi
       join products p on p.id = oi.product_id
       where oi.order_id = r.order_id
     ) order_summary on r.order_id is not null
     where r.status = 'approved'
     order by r.created_at desc`
  );
  return result.rows;
}

export async function listAllReviews() {
  const result = await query(
    `select r.id, r.rating, r.comment, r.media_url as "mediaUrl", r.media_type as "mediaType",
            r.status, r.created_at as "createdAt", u.name as "customerName",
            coalesce(s.name, order_summary.names) as "serviceName"
     from reviews r
     join users u on u.id = r.user_id
     left join bookings b on b.id = r.booking_id
     left join services s on s.id = b.service_id
     left join lateral (
       select string_agg(p.name, ', ') as names
       from order_items oi
       join products p on p.id = oi.product_id
       where oi.order_id = r.order_id
     ) order_summary on r.order_id is not null
     order by r.created_at desc`
  );
  return result.rows;
}

export async function updateReviewStatus(id, status) {
  const result = await query(
    `update reviews set status = $1 where id = $2 returning id, status`,
    [status, id]
  );
  return result.rows[0] || null;
}

export async function deleteReview(id) {
  const result = await query(`delete from reviews where id = $1 returning id`, [id]);
  return result.rows[0] || null;
}
export async function listMyReviewableBookings(userId) {
  const result = await query(
    `select b.id as "bookingId", s.name as "serviceName", b.booking_date as date
     from bookings b
     join services s on s.id = b.service_id
     left join reviews r on r.booking_id = b.id
     where b.user_id = $1 and b.status = 'completed' and r.id is null
     order by b.booking_date desc`,
    [userId]
  );
  return result.rows;
}

export async function listMyReviewableOrders(userId) {
  const result = await query(
    `select o.id as "orderId", o.created_at as date,
            string_agg(p.name, ', ') as "productNames"
     from orders o
     join order_items oi on oi.order_id = o.id
     join products p on p.id = oi.product_id
     left join reviews r on r.order_id = o.id
     where o.user_id = $1 and o.status = 'fulfilled' and r.id is null
     group by o.id, o.created_at
     order by o.created_at desc`,
    [userId]
  );
  return result.rows;
}