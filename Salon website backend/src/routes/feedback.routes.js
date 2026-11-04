import { Router } from "express";
import { create, index, remove } from "../controllers/feedback.controller.js";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", optionalAuth, asyncHandler(create));
router.get("/", requireAuth, requireAdmin, asyncHandler(index));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(remove));

export default router;
