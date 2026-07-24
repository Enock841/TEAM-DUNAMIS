import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notFound } from "../utils/httpError.js";

const router = Router();

const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  categoryId: z.string().uuid(),
  priceMin: z.number().nonnegative(),
  priceMax: z.number().nonnegative(),
  images: z.array(z.string().url()).optional().default([])
});

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await query(
      `select s.id, s.name, s.description, s.price_min as "priceMin",
              s.price_max as "priceMax", s.images,
              json_build_object('id', c.id, 'name', c.name, 'dailyCap', c.daily_cap) as category
       from services s
       join service_categories c on c.id = s.category_id
       where s.is_active = true
       order by c.name, s.name`
    );
    res.json(result.rows);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await query(
      `select s.id, s.name, s.description, s.price_min as "priceMin",
              s.price_max as "priceMax", s.images,
              json_build_object('id', c.id, 'name', c.name, 'dailyCap', c.daily_cap) as category
       from services s
       join service_categories c on c.id = s.category_id
       where s.id = $1 and s.is_active = true`,
      [req.params.id]
    );

    if (!result.rowCount) throw notFound("Service not found");
    res.json(result.rows[0]);
  })
);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = serviceSchema.parse(req.body);
    const result = await query(
      `insert into services (name, description, category_id, price_min, price_max, images)
       values ($1, $2, $3, $4, $5, $6)
       returning id, name, description, category_id as "categoryId",
                 price_min as "priceMin", price_max as "priceMax", images`,
      [body.name, body.description, body.categoryId, body.priceMin, body.priceMax, body.images]
    );
    res.status(201).json({ service: result.rows[0] });
  })
);

router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = serviceSchema.partial().parse(req.body);
    const current = await query("select * from services where id = $1", [req.params.id]);
    if (!current.rowCount) throw notFound("Service not found");

    const merged = { ...current.rows[0], ...body };
    const result = await query(
      `update services
       set name = $1, description = $2, category_id = $3, price_min = $4,
           price_max = $5, images = $6, updated_at = now()
       where id = $7
       returning id, name, description, category_id as "categoryId",
                 price_min as "priceMin", price_max as "priceMax", images`,
      [
        merged.name,
        merged.description,
        merged.categoryId || merged.category_id,
        merged.priceMin ?? merged.price_min,
        merged.priceMax ?? merged.price_max,
        merged.images,
        req.params.id
      ]
    );
    res.json({ service: result.rows[0] });
  })
);

export default router;

