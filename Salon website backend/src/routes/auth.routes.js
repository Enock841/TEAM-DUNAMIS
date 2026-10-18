import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  login,
  me,
  register,
  resetPassword,
  updateProfile
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));
router.get("/me", requireAuth, asyncHandler(me));
router.put("/me", requireAuth, asyncHandler(updateProfile));
router.put("/password", requireAuth, asyncHandler(changePassword));

export default router;
