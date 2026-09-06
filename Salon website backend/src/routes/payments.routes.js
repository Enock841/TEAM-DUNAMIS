import { Router } from "express";
import {
  initiate,
  settleBookingBalance,
  show,
  verify,
  webhook
} from "../controllers/payment.controller.js";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/initiate", optionalAuth, asyncHandler(initiate));
router.post("/webhook", asyncHandler(webhook));
router.get("/:reference/verify", optionalAuth, asyncHandler(verify));
router.get("/:reference", requireAuth, asyncHandler(show));
router.put(
  "/bookings/:id/settle-balance",
  requireAuth,
  requireAdmin,
  asyncHandler(settleBookingBalance)
);

export default router;