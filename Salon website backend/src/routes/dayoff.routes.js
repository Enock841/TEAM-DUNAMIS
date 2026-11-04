import { Router } from "express";
import {
  create,
  index,
  limits,
  remove,
  removeDayLimitHandler,
  saveDayLimit,
  saveDefaultLimit,
  saveSlots,
  saveWeekdays,
  removeSlots,
  slots
} from "../controllers/dayoff.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/", asyncHandler(index));
router.post("/", asyncHandler(create));
router.put("/weekdays", asyncHandler(saveWeekdays));
router.get("/limits", asyncHandler(limits));
router.put("/limits/default", asyncHandler(saveDefaultLimit));
router.put("/limits", asyncHandler(saveDayLimit));
router.delete("/limits/:day", asyncHandler(removeDayLimitHandler));
router.get("/slots", asyncHandler(slots));
router.put("/slots", asyncHandler(saveSlots));
router.delete("/slots/:day", asyncHandler(removeSlots));
router.delete("/:day", asyncHandler(remove));

export default router;