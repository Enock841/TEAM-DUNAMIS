import { z } from "zod";
import {
  createReview,
  listApprovedReviews,
  listAllReviews,
  listMyReviewableBookings,
  listMyReviewableOrders,
  updateReviewStatus,
  deleteReview
} from "../models/review.model.js";
import { notFound } from "../utils/httpError.js";

const createSchema = z.object({
  bookingId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(["photo", "video"]).optional()
});

export async function index(_req, res) {
  res.json(await listApprovedReviews());
}

export async function adminIndex(_req, res) {
  res.json(await listAllReviews());
}

export async function mine(req, res) {
  const bookings = await listMyReviewableBookings(req.user.id);
  const orders = await listMyReviewableOrders(req.user.id);
  res.json({ bookings, orders });
}

export async function create(req, res) {
  const review = await createReview(req.user.id, createSchema.parse(req.body));
  res.status(201).json({ review });
}

export async function updateStatus(req, res) {
  const body = z.object({ status: z.enum(["approved", "rejected"]) }).parse(req.body);
  const review = await updateReviewStatus(req.params.id, body.status);
  if (!review) throw notFound("Review not found");
  res.json({ review });
}

export async function remove(req, res) {
  const removed = await deleteReview(req.params.id);
  if (!removed) throw notFound("Review not found");
  res.json({ removed: true });
}