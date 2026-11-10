import { Router } from "express";
import { create, index, remove } from "../controllers/lengthSizeOption.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/service/:serviceId", asyncHandler(index));
router.post("/", requireAuth, requireAdmin, asyncHandler(create));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(remove));

export default router;
