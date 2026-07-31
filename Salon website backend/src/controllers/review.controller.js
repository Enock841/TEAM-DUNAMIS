import { z } from "zod";
import {
  createReview,
  deleteOwnedReview,
  findMyReview,
  listApprovedReviews,
  listAllReviews,
  listMyReviewableBookings,
  updateOwnedReview,
  updateReviewStatus
} from "../models/review.model.js";
import { notFound } from "../utils/httpError.js";

const createSchema = z.object({
  bookingId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  mediaUrl: z.string().url().nullable().optional(),
  mediaType: z.enum(["photo", "video"]).nullable().optional()
});

const updateSchema = createSchema.omit({ bookingId: true });

export async function index(_req, res) {
  res.json(await listApprovedReviews());
}

export async function adminIndex(_req, res) {
  res.json(await listAllReviews());
}

export async function mine(req, res) {
  res.json(await listMyReviewableBookings(req.user.id));
}

export async function myReview(req, res) {
  res.json({ review: await findMyReview(req.user.id) });
}

export async function create(req, res) {
  const review = await createReview(req.user.id, createSchema.parse(req.body));
  res.status(201).json({ review });
}

export async function update(req, res) {
  const review = await updateOwnedReview(
    req.params.id,
    req.user.id,
    updateSchema.parse(req.body)
  );
  if (!review) throw notFound("Review not found");
  res.json({ review });
}

export async function remove(req, res) {
  const deleted = await deleteOwnedReview(req.params.id, req.user.id);
  if (!deleted) throw notFound("Review not found");
  res.status(204).end();
}

export async function updateStatus(req, res) {
  const body = z.object({ status: z.enum(["approved", "rejected"]) }).parse(req.body);
  const review = await updateReviewStatus(req.params.id, body.status);
  if (!review) throw notFound("Review not found");
  res.json({ review });
}
