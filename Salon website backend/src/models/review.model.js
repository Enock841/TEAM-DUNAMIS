import { pool, query } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";

export async function createReview(userId, input) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const existingResult = await client.query(
      `select id from reviews where user_id = $1 for update`,
      [userId]
    );
    if (existingResult.rows[0]) {
      throw new HttpError(409, "You have already left a review");
    }

    if (input.bookingId) {
      const bookingResult = await client.query(
        `select id, status from bookings where id = $1 and user_id = $2 for update`,
        [input.bookingId, userId]
      );
      const booking = bookingResult.rows[0];
      if (!booking) throw new HttpError(404, "Appointment not found");
      if (booking.status !== "completed") {
        throw new HttpError(409, "You can only review an appointment after it has been completed");
      }
    }

    const result = await client.query(
      `insert into reviews (booking_id, user_id, rating, comment, media_url, media_type)
       values ($1, $2, $3, $4, $5, $6)
       returning id, booking_id as "bookingId", rating, comment,
                 media_url as "mediaUrl", media_type as "mediaType", status,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [
        input.bookingId || null,
        userId,
        input.rating,
        input.comment || "",
        input.mediaUrl || null,
        input.mediaType || null
      ]
    );
    await client.query("commit");
    return {
      ...result.rows[0],
      customerName: "",
      serviceName: input.bookingId ? "" : "General experience"
    };
  } catch (error) {
    await client.query("rollback");
    if (error.code === "23505") {
      throw new HttpError(409, "You have already left a review");
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function listApprovedReviews() {
  const result = await query(
    `select r.id, r.rating, r.comment, r.media_url as "mediaUrl", r.media_type as "mediaType",
            r.created_at as "createdAt", r.updated_at as "updatedAt",
            u.name as "customerName", coalesce(s.name, 'General experience') as "serviceName"
     from reviews r
     join users u on u.id = r.user_id
     left join bookings b on b.id = r.booking_id
     left join services s on s.id = b.service_id
     where r.status = 'approved'
     order by r.created_at desc`
  );
  return result.rows;
}

export async function listAllReviews() {
  const result = await query(
    `select r.id, r.rating, r.comment, r.media_url as "mediaUrl", r.media_type as "mediaType",
            r.status, r.created_at as "createdAt", r.updated_at as "updatedAt",
            u.name as "customerName", coalesce(s.name, 'General experience') as "serviceName"
     from reviews r
     join users u on u.id = r.user_id
     left join bookings b on b.id = r.booking_id
     left join services s on s.id = b.service_id
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

export async function findMyReview(userId) {
  const result = await query(
    `select r.id, r.rating, r.comment, r.media_url as "mediaUrl", r.media_type as "mediaType",
            r.status, r.created_at as "createdAt", r.updated_at as "updatedAt",
            u.name as "customerName", coalesce(s.name, 'General experience') as "serviceName"
     from reviews r
     join users u on u.id = r.user_id
     left join bookings b on b.id = r.booking_id
     left join services s on s.id = b.service_id
     where r.user_id = $1
     limit 1`,
    [userId]
  );
  return result.rows[0] || null;
}

export async function updateOwnedReview(id, userId, input) {
  const result = await query(
    `update reviews
     set rating = $1,
         comment = $2,
         media_url = $3,
         media_type = $4,
         status = 'pending',
         updated_at = now()
     where id = $5 and user_id = $6
     returning id`,
    [
      input.rating,
      input.comment || "",
      input.mediaUrl || null,
      input.mediaType || null,
      id,
      userId
    ]
  );
  if (!result.rows[0]) return null;
  return findMyReview(userId);
}

export async function deleteOwnedReview(id, userId) {
  const result = await query(
    `delete from reviews where id = $1 and user_id = $2 returning id`,
    [id, userId]
  );
  return Boolean(result.rows[0]);
}

export async function listMyReviewableBookings(userId) {
  const result = await query(
    `select b.id as "bookingId", s.name as "serviceName", b.booking_date as date
     from bookings b
     join services s on s.id = b.service_id
     left join reviews r on r.booking_id = b.id
     where b.user_id = $1
       and b.status = 'completed'
       and r.id is null
       and not exists (select 1 from reviews mine where mine.user_id = $1)
     order by b.booking_date desc`,
    [userId]
  );
  return result.rows;
}
