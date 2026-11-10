import { z } from "zod";
import { createSize, deleteSize, listSizesForService } from "../models/lengthSizeOption.model.js";
import { notFound } from "../utils/httpError.js";

const createSchema = z.object({
  lengthOptionId: z.string().uuid(),
  label: z.string().trim().min(1).max(60),
  price: z.number().nonnegative()
});

export async function index(req, res) {
  res.json(await listSizesForService(req.params.serviceId));
}

export async function create(req, res) {
  const size = await createSize(createSchema.parse(req.body));
  res.status(201).json({ size });
}

export async function remove(req, res) {
  if (!(await deleteSize(req.params.id))) throw notFound("Size not found");
  res.status(204).send();
}
