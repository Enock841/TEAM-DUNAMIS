import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notFound } from "../utils/httpError.js";

const router = Router();

const initiateSchema = z.object({
  type: z.enum(["booking", "order"]),
  refId: z.string().uuid(),
  momoNumber: z.string().min(7).max(20)
});

router.post(
  "/initiate",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = initiateSchema.parse(req.body);
    const reference = `MOMO-${crypto.randomUUID()}`;
    const amountResult =
      body.type === "order"
        ? await query("select total_amount as amount from orders where id = $1 and user_id = $2", [
            body.refId,
            req.user.id
          ])
        : await query(
            `select s.price_min as amount
             from bookings b
             join services s on s.id = b.service_id
             where b.id = $1 and b.user_id = $2`,
            [body.refId, req.user.id]
          );

    if (!amountResult.rowCount) throw notFound(`${body.type} not found`);
    const amount = amountResult.rows[0].amount;

    const result = await query(
      `insert into payments (reference, user_id, payment_type, ref_id, momo_number, amount, status)
       values ($1, $2, $3, $4, $5, $6, 'pending')
       returning reference as "paymentReference", amount, status`,
      [reference, req.user.id, body.type, body.refId, body.momoNumber, amount]
    );

    res.status(201).json(result.rows[0]);
  })
);

router.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        reference: z.string(),
        status: z.enum(["pending", "success", "failed"])
      })
      .parse(req.body);

    await query("update payments set status = $1, updated_at = now() where reference = $2", [
      body.status,
      body.reference
    ]);

    res.json({ received: true });
  })
);

router.get(
  "/:reference",
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await query(
      `select reference, status, amount, payment_type as type, ref_id as "refId", created_at as "createdAt"
       from payments
       where reference = $1 and user_id = $2`,
      [req.params.reference, req.user.id]
    );

    if (!result.rowCount) throw notFound("Payment not found");
    res.json(result.rows[0]);
  })
);

export default router;
