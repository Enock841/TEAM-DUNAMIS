import { z } from "zod";
import {
  addDayOff,
  listDaysOff,
  listLimits,
  removeDayLimit,
  removeDayOff,
  setClosedWeekdays,
  setDayLimit,
  setDefaultLimit,
  listDaySlots,
  removeDaySlots,
  setDaySlots
} from "../models/dayoff.model.js";
import { notFound } from "../utils/httpError.js";

const daySchema = z.object({
  day: z.string().date(),
  reason: z.string().trim().max(200).optional()
});

const weekdaysSchema = z.object({
  weekdays: z.array(z.number().int().min(0).max(6)).max(7)
});

export async function index(_req, res) {
  res.json(await listDaysOff());
}

export async function create(req, res) {
  const body = daySchema.parse(req.body);
  res.status(201).json(await addDayOff(body.day, body.reason));
}

export async function remove(req, res) {
  const day = z.string().date().parse(req.params.day);
  const removed = await removeDayOff(day);
  if (!removed) throw notFound("That day was not marked as closed");
  res.json({ removed: true });
}

export async function saveWeekdays(req, res) {
  const body = weekdaysSchema.parse(req.body);
  res.json({ weekdays: await setClosedWeekdays([...new Set(body.weekdays)]) });
}

const defaultLimitSchema = z.object({ maxClients: z.number().int().min(0).max(100) });
const dayLimitSchema = z.object({ day: z.string().date(), maxClients: z.number().int().min(1).max(100) });

const slotsSchema = z.object({
  day: z.string().date(),
  times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).min(1).max(40)
});

export async function slots(_req, res) {
  res.json({ days: await listDaySlots() });
}

export async function saveSlots(req, res) {
  const body = slotsSchema.parse(req.body);
  const times = [...new Set(body.times)].sort();
  res.json(await setDaySlots(body.day, times));
}

export async function removeSlots(req, res) {
  const day = z.string().date().parse(req.params.day);
  const removed = await removeDaySlots(day);
  if (!removed) throw notFound("That day had no special times");
  res.json({ removed: true });
}

export async function limits(_req, res) {
  res.json(await listLimits());
}

export async function saveDefaultLimit(req, res) {
  const body = defaultLimitSchema.parse(req.body);
  res.json({ maxClients: await setDefaultLimit(body.maxClients) });
}

export async function saveDayLimit(req, res) {
  const body = dayLimitSchema.parse(req.body);
  res.json(await setDayLimit(body.day, body.maxClients));
}

export async function removeDayLimitHandler(req, res) {
  const day = z.string().date().parse(req.params.day);
  const removed = await removeDayLimit(day);
  if (!removed) throw notFound("That day had no special limit");
  res.json({ removed: true });
}
