import { Router } from "express";
import { z } from "zod";
import { pool, query } from "../db/pool.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { assertBookingCapacity, getAvailability } from "../services/bookingCapacity.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notFound } from "../utils/httpError.js";

const router = Router();

const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().date(),
  timeSlot: z.string().min(3).max(20)
});

const statusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"])
});

router.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const params = z.object({ serviceId: z.string().uuid(), date: z.string().date() }).parse(req.query);
    const availability = await getAvailability(pool, params.serviceId, params.date);
    res.json(availability);
  })
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = createBookingSchema.parse(req.body);
    const client = await pool.connect();

    try {
      await client.query("begin");
      await assertBookingCapacity(client, body.serviceId, body.date);

      const result = await client.query(
        `insert into bookings (user_id, service_id, booking_date, time_slot, status)
         values ($1, $2, $3, $4, 'pending')
         returning id, user_id as "userId", service_id as "serviceId",
                   booking_date as date, time_slot as "timeSlot", status, created_at as "createdAt"`,
        [req.user.id, body.serviceId, body.date, body.timeSlot]
      );

      await client.query("commit");
      res.status(201).json({ booking: result.rows[0] });
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await query(
      `select b.id, b.booking_date as date, b.time_slot as "timeSlot", b.status,
              s.name as "serviceName", c.name as "categoryName"
       from bookings b
       join services s on s.id = b.service_id
       join service_categories c on c.id = s.category_id
       where b.user_id = $1
       order by b.booking_date desc, b.time_slot`,
      [req.user.id]
    );
    res.json(result.rows);
  })
);

router.get(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const params = z
      .object({ date: z.string().date().optional(), categoryId: z.string().uuid().optional() })
      .parse(req.query);

    const result = await query(
      `select b.id, b.booking_date as date, b.time_slot as "timeSlot", b.status,
              json_build_object('id', u.id, 'name', u.name, 'phone', u.phone) as "user",
              json_build_object('id', s.id, 'name', s.name) as "service",
              json_build_object('id', c.id, 'name', c.name) as "category"
       from bookings b
       join users u on u.id = b.user_id
       join services s on s.id = b.service_id
       join service_categories c on c.id = s.category_id
       where ($1::date is null or b.booking_date = $1::date)
         and ($2::uuid is null or c.id = $2::uuid)
       order by b.booking_date desc, b.time_slot`,
      [params.date || null, params.categoryId || null]
    );
    res.json(result.rows);
  })
);

router.put(
  "/:id/status",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = statusSchema.parse(req.body);
    const result = await query(
      `update bookings
       set status = $1, updated_at = now()
       where id = $2
       returning id, user_id as "userId", service_id as "serviceId",
                 booking_date as date, time_slot as "timeSlot", status`,
      [body.status, req.params.id]
    );

    if (!result.rowCount) throw notFound("Booking not found");
    res.json({ booking: result.rows[0] });
  })
);

export default router;

