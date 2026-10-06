import crypto from "node:crypto";
import { env } from "../config/env.js";
import { query } from "../config/db.js";
import { z } from "zod";
import {
  createPayment,
  findPaymentAmount,
  findPaymentByReference,
  updatePaymentStatus,
  markPaymentSuccessAndUnlock,
  markBookingBalanceSettledInPerson,
  getOrderDetailsForEmail,
  getBookingDetailsForEmail,
  getGiftCardForEmail,
  listPendingPayments,
  createManualPayment,
  findOpenManualPayment,
  findManualPayment,
  rejectManualPayment,
  claimManualPayment,
  releaseManualPayment
} from "../models/payment.model.js";
import { HttpError, notFound } from "../utils/httpError.js";
import { getSettings } from "../models/admin.model.js";
import { sendOrderConfirmation, sendAdminOrderNotification, sendGiftCardEmail, sendManualPaymentAdminAlert, sendManualPaymentConfirmed, sendPaymentRejected } from "../utils/email.js";

const initiateSchema = z.object({
  type: z.enum(["booking", "order", "gift_card"]),
  refId: z.string().uuid(),
  momoNumber: z.string().min(7).max(20),
  portion: z.enum(["half", "full"]).optional()
});

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export async function initiate(req, res) {
  const body = initiateSchema.parse(req.body);
  const userId = req.user ? req.user.id : null;
  const amount = await findPaymentAmount(body.type, body.refId, userId, body.portion);
  if (amount === null) throw notFound(`${body.type} not found`);

  let customerEmail = userId + "@customer.salon";
  if (body.type === "order") {
    const orderResult = await query(
      "select delivery_email as email from orders where id = $1",
      [body.refId]
    );
    if (orderResult.rows[0]?.email) customerEmail = orderResult.rows[0].email;
  }

  const reference = `SALON-${crypto.randomUUID()}`;

  await createPayment({
    reference,
    userId,
    type: body.type,
    refId: body.refId,
    momoNumber: body.momoNumber,
    amount
  });

  const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: customerEmail,
      amount: Math.round(amount * 100),
      reference,
      callback_url: `${FRONTEND_URL}/#/payment-complete`
    })
  });

  const paystackData = await paystackResponse.json();

  if (!paystackData.status) {
    throw new Error(paystackData.message || "Could not start payment with Paystack");
  }

  res.status(201).json({
    paymentReference: reference,
    amount,
    status: "pending",
    authorizationUrl: paystackData.data.authorization_url
  });
}

async function unlockAndNotify(reference) {
  const unlocked = await markPaymentSuccessAndUnlock(reference);
  if (!unlocked) return null;

  if (unlocked.type === "order") {
    const order = await getOrderDetailsForEmail(unlocked.refId);
    if (order) {
      if (order.customerEmail) sendOrderConfirmation(order.customerEmail, order);
      sendAdminOrderNotification(order, {
        name: order.customerName,
        phone: order.customerPhone
      });
    }
  }

  if (unlocked.type === "gift_card") {
    const giftCard = await getGiftCardForEmail(unlocked.refId);
    if (giftCard) sendGiftCardEmail(giftCard);
  }

  return unlocked;
}

export async function verify(req, res) {
  const reference = req.params.reference;

  const paystackResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
  );
  const paystackData = await paystackResponse.json();
  const paystackStatus = paystackData.data?.status;

  if (paystackStatus === "success") {
    const unlocked = await unlockAndNotify(reference);
    if (!unlocked) throw notFound("Payment not found");
    res.json({ reference, status: "success", amount: unlocked.amount, type: unlocked.type });
  } else if (paystackStatus === "failed" || paystackStatus === "abandoned") {
    await updatePaymentStatus(reference, "failed");
    res.json({ reference, status: "failed" });
  } else {
    res.json({ reference, status: "pending" });
  }
}

export async function reconcilePending(req, res) {
  const pending = await listPendingPayments();
  let confirmed = 0;
  let failed = 0;
  let stillPending = 0;

  for (const payment of pending) {
    try {
      const paystackResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${payment.reference}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );
      const paystackData = await paystackResponse.json();
      const paystackStatus = paystackData.data?.status;

      if (paystackStatus === "success") {
        const unlocked = await unlockAndNotify(payment.reference);
        if (unlocked) confirmed += 1;
      } else if (paystackStatus === "failed" || paystackStatus === "abandoned") {
        await updatePaymentStatus(payment.reference, "failed");
        failed += 1;
      } else {
        stillPending += 1;
      }
    } catch {
      stillPending += 1;
    }
  }

  res.json({ checked: pending.length, confirmed, failed, stillPending });
}

export async function webhook(req, res) {
  const signature = req.headers["x-paystack-signature"];
  const expectedSignature = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(req.rawBody || "")
    .digest("hex");

  if (!signature || signature !== expectedSignature) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  const body = z
    .object({
      reference: z.string(),
      status: z.enum(["pending", "success", "failed"])
    })
    .parse(req.body);
  await updatePaymentStatus(body.reference, body.status);
  res.json({ received: true });
}

export async function show(req, res) {
  const payment = await findPaymentByReference(req.params.reference, req.user.id);
  if (!payment) throw notFound("Payment not found");
  res.json(payment);
}

export async function settleBookingBalance(req, res) {
  const booking = await markBookingBalanceSettledInPerson(req.params.id);
  if (!booking) throw notFound("Booking not found");
  res.json({ booking });
}


// ---------- Manual Mobile Money payments ----------

const manualQuoteSchema = z.object({
  type: z.enum(["booking", "order", "gift_card"]),
  refId: z.string().uuid(),
  portion: z.enum(["half", "full"]).optional()
});

const manualSubmitSchema = manualQuoteSchema.extend({
  payerName: z.string().trim().min(2).max(120),
  claimedAmount: z.number().positive(),
  proofImageUrl: z.string().url().max(1000)
});

async function customerEmailFor(type, refId) {
  if (type === "order") {
    const order = await getOrderDetailsForEmail(refId);
    return order?.customerEmail || null;
  }
  if (type === "gift_card") {
    const giftCard = await getGiftCardForEmail(refId);
    return giftCard?.purchaserEmail || null;
  }
  const booking = await getBookingDetailsForEmail(refId);
  return booking?.customerEmail || null;
}

export async function manualQuote(req, res) {
  const body = manualQuoteSchema.parse(req.body);
  const userId = req.user ? req.user.id : null;
  const amount = await findPaymentAmount(body.type, body.refId, userId, body.portion);
  if (amount === null) throw notFound(`${body.type} not found`);

  const settings = await getSettings();
  if (!settings?.momoNumber) {
    throw new HttpError(503, "Mobile Money payment is not set up yet. Please pay with card instead.");
  }

  res.json({
    amount,
    momoNetwork: settings.momoNetwork || "",
    momoNumber: settings.momoNumber,
    momoAccountName: settings.momoAccountName || ""
  });
}

export async function submitManual(req, res) {
  const body = manualSubmitSchema.parse(req.body);
  const userId = req.user ? req.user.id : null;
  const amount = await findPaymentAmount(body.type, body.refId, userId, body.portion);
  if (amount === null) throw notFound(`${body.type} not found`);

  const existing = await findOpenManualPayment(body.type, body.refId);
  if (existing) {
    throw new HttpError(409, "You have already sent your payment details. Please wait while the salon confirms it.");
  }

  const reference = `MOMO-${crypto.randomUUID()}`;
  await createManualPayment({
    reference,
    userId,
    type: body.type,
    refId: body.refId,
    amount,
    payerName: body.payerName,
    claimedAmount: body.claimedAmount,
    proofImageUrl: body.proofImageUrl
  });

  try {
    sendManualPaymentAdminAlert({
      payerName: body.payerName,
      amount,
      claimedAmount: body.claimedAmount,
      type: body.type
    });
  } catch {
    // the email is a courtesy, the payment is already saved
  }

  res.status(201).json({ paymentReference: reference, amount, status: "awaiting_confirmation" });
}

export async function confirmManual(req, res) {
  const reference = req.params.reference;
  const payment = await findManualPayment(reference);
  if (!payment || payment.method !== "manual_momo") throw notFound("Payment not found");

  const claimed = await claimManualPayment(reference);
  if (!claimed) throw new HttpError(409, "This payment has already been confirmed or rejected.");

  try {
    await unlockAndNotify(reference);
  } catch (error) {
    await releaseManualPayment(reference);
    throw error;
  }

  if (payment.type === "booking") {
    try {
      const email = await customerEmailFor(payment.type, payment.refId);
      sendManualPaymentConfirmed(email, payment.amount);
    } catch {
      // email is a courtesy
    }
  }

  res.json({ reference, status: "success" });
}

export async function rejectManual(req, res) {
  const reference = req.params.reference;
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 300) : "";

  const payment = await findManualPayment(reference);
  if (!payment || payment.method !== "manual_momo") throw notFound("Payment not found");

  const rejected = await rejectManualPayment(reference);
  if (!rejected) throw new HttpError(409, "This payment has already been confirmed or rejected.");

  try {
    const email = await customerEmailFor(payment.type, payment.refId);
    sendPaymentRejected(email, payment.amount, reason);
  } catch {
    // email is a courtesy
  }

  res.json({ reference, status: "failed" });
}