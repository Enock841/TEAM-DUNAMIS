import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notFound } from "../utils/httpError.js";

const router = Router();
const capSchema = z.object({ dailyCap: z.number().int().positive() });

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await query(
      "select id, name, daily_cap as \"dailyCap\" from service_categories order by name"
    );
    res.json(result.rows);
  })
);

router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = capSchema.parse(req.body);
    const result = await query(
      `update service_categories
       set daily_cap = $1, updated_at = now()
       where id = $2
       returning id, name, daily_cap as "dailyCap"`,
      [body.dailyCap, req.params.id]
    );

    if (!result.rowCount) throw notFound("Category not found");
    res.json({ category: result.rows[0] });
  })
);

export default router;

