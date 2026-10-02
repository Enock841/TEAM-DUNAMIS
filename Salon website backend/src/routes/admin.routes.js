import { Router } from "express";
import {
  addStaff,
  analytics,
  customer,
  customers,
  payments,
  removePayment,
  saveSettings,
  setStaffStatus,
  showSettings,
  staff
} from "../controllers/admin.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/customers", asyncHandler(customers));
router.get("/customers/:id", asyncHandler(customer));
router.get("/payments", asyncHandler(payments));
router.delete("/payments/:id", asyncHandler(removePayment));
router.get("/analytics", asyncHandler(analytics));
router.get("/settings", asyncHandler(showSettings));
router.put("/settings", asyncHandler(saveSettings));
router.get("/staff", asyncHandler(staff));
router.post("/staff", asyncHandler(addStaff));
router.put("/staff/:id/status", asyncHandler(setStaffStatus));

export default router;