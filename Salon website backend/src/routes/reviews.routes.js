import { Router } from "express";
import {
  adminIndex,
  create,
  index,
  mine,
  myReview,
  remove,
  update,
  updateStatus
} from "../controllers/review.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(index));
router.get("/admin", requireAuth, requireAdmin, asyncHandler(adminIndex));
router.get("/mine", requireAuth, asyncHandler(mine));
router.get("/my-review", requireAuth, asyncHandler(myReview));
router.post("/", requireAuth, asyncHandler(create));
router.put("/:id/status", requireAuth, requireAdmin, asyncHandler(updateStatus));
router.put("/:id", requireAuth, asyncHandler(update));
router.delete("/:id", requireAuth, asyncHandler(remove));

export default router;
