import { z } from "zod";
import { createFeedback, deleteFeedback, listFeedback } from "../models/feedback.model.js";
import { HttpError, notFound } from "../utils/httpError.js";

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().max(1000).optional(),
  name: z.string().trim().max(80).optional(),
  contact: z.string().trim().max(120).optional(),
  page: z.string().trim().max(80).optional()
});

const recent = new Map();

function tooMany(key) {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const hits = (recent.get(key) || []).filter((time) => time > hourAgo);
  if (hits.length >= 5) {
    recent.set(key, hits);
    return true;
  }
  hits.push(now);
  recent.set(key, hits);
  return false;
}

export async function create(req, res) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const key = req.user ? "user:" + req.user.id : "ip:" + (forwarded || req.ip || "unknown");
  if (tooMany(key)) {
    throw new HttpError(429, "Thank you! You have already sent feedback a few times. Please try again later.");
  }
  const body = feedbackSchema.parse(req.body);
  const saved = await createFeedback({ userId: req.user ? req.user.id : null, ...body });
  res.status(201).json({ ok: true, id: saved.id });
}

export async function index(_req, res) {
  res.json(await listFeedback());
}

export async function remove(req, res) {
  const id = z.string().uuid().parse(req.params.id);
  const removed = await deleteFeedback(id);
  if (!removed) throw notFound("Feedback not found");
  res.json({ removed: true });
}
