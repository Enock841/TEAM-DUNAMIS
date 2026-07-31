import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { subscribe } from "../controllers/newsletter.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many signup attempts. Please try again later." }
});

router.post("/subscribe", subscribeLimiter, asyncHandler(subscribe));

export default router;
