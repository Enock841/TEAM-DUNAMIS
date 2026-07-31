import { Router } from "express";
import {
  create,
  index,
  remove,
  update
} from "../controllers/category.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(index));
router.post("/", requireAuth, requireAdmin, asyncHandler(create));
router.put("/:id", requireAuth, requireAdmin, asyncHandler(update));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(remove));

export default router;
