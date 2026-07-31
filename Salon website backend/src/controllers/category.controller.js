import { z } from "zod";
import {
  archiveCategory,
  createCategory,
  listCategories,
  updateCategory
} from "../models/category.model.js";
import { notFound } from "../utils/httpError.js";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  dailyCap: z.number().int().positive(),
  imageUrl: z.string().trim().max(1000).optional()
});

const updateSchema = categorySchema.partial();

export async function index(_req, res) {
  res.json(await listCategories());
}

export async function create(req, res) {
  const category = await createCategory(categorySchema.parse(req.body));
  res.status(201).json({ category });
}

export async function update(req, res) {
  const category = await updateCategory(
    req.params.id,
    updateSchema.parse(req.body)
  );
  if (!category) throw notFound("Category not found");
  res.json({ category });
}

export async function remove(req, res) {
  const removed = await archiveCategory(req.params.id);
  if (!removed) throw notFound("Category not found");
  res.status(204).end();
}
