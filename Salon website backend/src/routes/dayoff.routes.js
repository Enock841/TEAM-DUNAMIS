import { Router } from "express";
import { create, index, remove, saveWeekdays } from "../controllers/dayoff.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/", asyncHandler(index));
router.post("/", asyncHandler(create));
router.put("/weekdays", asyncHandler(saveWeekdays));
router.delete("/:day", asyncHandler(remove));

export default router;