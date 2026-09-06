import { Router } from "express";
import {
  approveCustomLengthRequest,
  availability,
  create,
  index,
  mine,
  monthAvailability,
  remove,
  reschedule,
  sendReminders,
  updateStatus,
  verifyCode
} from "../controllers/booking.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/availability", asyncHandler(availability));
router.get("/month-availability", asyncHandler(monthAvailability));
router.post("/", requireAuth, asyncHandler(create));
router.get("/me", requireAuth, asyncHandler(mine));
router.get("/", requireAuth, requireAdmin, asyncHandler(index));
router.post(
  "/verify-code",
  requireAuth,
  requireAdmin,
  asyncHandler(verifyCode)
);
router.put(
  "/:id/status",
  requireAuth,
  requireAdmin,
  asyncHandler(updateStatus)
);
router.put(
  "/:id/schedule",
  requireAuth,
  requireAdmin,
  asyncHandler(reschedule)
);
router.put(
  "/:id/approve-custom-length",
  requireAuth,
  requireAdmin,
  asyncHandler(approveCustomLengthRequest)
);
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(remove));
router.post("/send-reminders", asyncHandler(sendReminders));

export default router;