import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  createStaff,
  deletePayment,
  findCustomerDetails,
  getAnalytics,
  getSettings,
  listCustomers,
  listPayments,
  listStaff,
  updateSettings,
  updateStaffStatus
} from "../models/admin.model.js";
import { HttpError, notFound } from "../utils/httpError.js";

const settingsSchema = z.object({
  businessName: z.string().min(2).optional(),
  phone: z.string().min(7).max(20).optional(),
  address: z.string().min(2).optional(),
  openingHours: z.record(z.string()).optional(),
  notifications: z.record(z.boolean()).optional(),
  paymentMethods: z.record(z.boolean()).optional(),
  aboutImageUrl: z.string().optional()
});

export async function customers(_req, res) {
  res.json(await listCustomers());
}

export async function customer(req, res) {
  const details = await findCustomerDetails(req.params.id);
  if (!details) throw notFound("Customer not found");
  res.json(details);
}

export async function payments(_req, res) {
  res.json(await listPayments());
}

export async function removePayment(req, res) {
  const removed = await deletePayment(req.params.id);
  if (!removed) throw notFound("Payment not found");
  res.json({ removed: true });
}

export async function analytics(_req, res) {
  res.json(await getAnalytics());
}

export async function showSettings(_req, res) {
  res.json(await getSettings());
}

export async function saveSettings(req, res) {
  res.json(await updateSettings(settingsSchema.parse(req.body)));
}

export async function staff(_req, res) {
  res.json(await listStaff());
}

export async function addStaff(req, res) {
  const body = z.object({
    name: z.string().min(2),
    phone: z.string().min(7).max(20),
    email: z.string().email(),
    password: z.string().min(8)
  }).parse(req.body);
  const member = await createStaff({
    name: body.name,
    phone: body.phone,
    email: body.email,
    passwordHash: await bcrypt.hash(body.password, 12)
  });
  res.status(201).json({ staff: member });
}

export async function setStaffStatus(req, res) {
  const body = z.object({ isActive: z.boolean() }).parse(req.body);
  if (req.params.id === req.user.id && body.isActive === false) {
    throw new HttpError(409, "You cannot deactivate your own account");
  }
  const member = await updateStaffStatus(req.params.id, body.isActive);
  if (!member) throw notFound("Staff account not found");
  res.json({ staff: member });
}