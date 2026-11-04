import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { z } from "zod";
import {
  createStaff,
  deactivateCustomer,
  deletePayment,
  findCustomerDetails,
  getAnalytics,
  getNotificationCounts,
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
  aboutImageUrl: z.string().optional(),
  momoNetwork: z.string().max(40).optional(),
  momoNumber: z.string().max(20).optional(),
  momoAccountName: z.string().max(120).optional(),
  bookingStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  bookingEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  bookingIntervalMinutes: z.number().int().min(15).max(240).optional()
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

export async function removeCustomer(req, res) {
  const removed = await deactivateCustomer(req.params.id);
  if (!removed) throw notFound("Customer not found");
  res.json({ removed: true });
}

export async function removePayment(req, res) {
  const removed = await deletePayment(req.params.id);
  if (!removed) throw notFound("Payment not found");
  res.json({ removed: true });
}

export async function analytics(_req, res) {
  res.json(await getAnalytics());
}

export async function testEmail(_req, res) {
  const to = env.adminEmail;
  const from = env.gmailUser;
  const problems = [];
  if (!env.sendgridApiKey) problems.push("SENDGRID_API_KEY is missing in Render.");
  if (!from) problems.push("GMAIL_USER (the sender address) is missing in Render.");
  if (!to) problems.push("ADMIN_EMAIL is missing in Render.");
  if (problems.length) {
    res.json({ ok: false, message: problems.join(" ") });
    return;
  }
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: "Bearer " + env.sendgridApiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from, name: "Beryl's Beauty Mark" },
        subject: "Test email from Beryl's Beauty Mark",
        content: [{ type: "text/html", value: "<p>This is a test. If you can read this, booking alerts can reach you.</p>" }]
      })
    });
    if (response.ok) {
      res.json({ ok: true, message: "SendGrid accepted the test email for " + to + " (sent from " + from + "). Check that inbox, including Spam and Promotions." });
      return;
    }
    const text = await response.text();
    res.json({ ok: false, message: "SendGrid refused it (status " + response.status + "): " + text.slice(0, 400) });
  } catch (error) {
    res.json({ ok: false, message: "Could not reach SendGrid: " + error.message });
  }
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

export async function notifications(req, res) {
  const raw = typeof req.query.customersSince === "string" ? req.query.customersSince : "";
  const since = raw && !Number.isNaN(Date.parse(raw)) ? new Date(raw).toISOString() : null;
  res.json(await getNotificationCounts(since));
}
