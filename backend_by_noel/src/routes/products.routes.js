import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notFound } from "../utils/httpError.js";

const router = Router();

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  price: z.number().nonnegative(),
  stockQty: z.number().int().nonnegative(),
  images: z.array(z.string().url()).optional().default([])
});

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await query(
      `select id, name, description, price, stock_qty as "stockQty",
              stock_qty > 0 as "inStock", images
       from products
       where is_active = true
       order by name`
    );
    res.json(result.rows);
  })
);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = productSchema.parse(req.body);
    const result = await query(
      `insert into products (name, description, price, stock_qty, images)
       values ($1, $2, $3, $4, $5)
       returning id, name, description, price, stock_qty as "stockQty", images`,
      [body.name, body.description, body.price, body.stockQty, body.images]
    );
    res.status(201).json({ product: result.rows[0] });
  })
);

router.put(
  "/:id/stock",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = z.object({ stockQty: z.number().int().nonnegative() }).parse(req.body);
    const result = await query(
      `update products
       set stock_qty = $1, updated_at = now()
       where id = $2
       returning id, name, description, price, stock_qty as "stockQty", images`,
      [body.stockQty, req.params.id]
    );

    if (!result.rowCount) throw notFound("Product not found");
    res.json({ product: result.rows[0] });
  })
);

export default router;

