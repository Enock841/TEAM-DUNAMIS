import { Router } from "express";
import { create, index, mine, updateStatus } from "../controllers/order.controller.js";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", optionalAuth, asyncHandler(create));
router.get("/me", requireAuth, asyncHandler(mine));
router.get("/", requireAuth, requireAdmin, asyncHandler(index));
router.put("/:id/status", requireAuth, requireAdmin, asyncHandler(updateStatus));

export default router;