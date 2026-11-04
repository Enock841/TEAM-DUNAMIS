import { Router } from "express";
import { getSettings } from "../models/admin.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  res.json({
    businessName: settings.businessName,
    phone: settings.phone,
    address: settings.address,
    openingHours: settings.openingHours,
    aboutImageUrl: settings.aboutImageUrl,
    bookingStartTime: settings.bookingStartTime,
    bookingEndTime: settings.bookingEndTime,
    bookingIntervalMinutes: settings.bookingIntervalMinutes
  });
}));

export default router;