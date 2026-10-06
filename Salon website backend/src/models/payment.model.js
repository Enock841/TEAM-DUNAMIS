import crypto from "node:crypto";
import { pool, query } from "../config/db.js";

export async function findPaymentAmount(type, refId, userId, portion) {
  if (type === "order") {
    const result = userId
      ? await query(
          "select total_amount as amount from orders where id = $1 and user_id = $2",
          [refId, userId]
        )
      : await query(
          "select total_amount as amount from orders where id = $1 and user_id is null",
          [refId]
        );
    return result.rows[0]?.amount ?? null;
  }

  if (type === "gift_card") {
    const result = await query(
      "select amount from gift_cards where id = $1 and status = 'pending'",
      [refId]
    );
    return result.rows[0]?.amount ?? null;
  }

  const result = await query(
    `select b.confirmed_price as "confirmedPrice", b.amount_paid as "amountPaid",
            b.deposit_amount as "depositAmount"
     from bookings b
     where b.id = $1 and b.user_id = $2`,
    [refId, userId]
  );
  const booking = result.rows[0];
  if (!booking || booking.confirmedPrice == null) return null;

  const remaining = Number(booking.confirmedPrice) - Number(booking.amountPaid || 0);
  if (remaining <= 0) return null;

  if (Number(booking.amountPaid || 0) === 0) {
    if (booking.depositAmount != null) {
      return Math.min(Number(booking.depositAmount), remaining);
    }
    return Math.round((Number(booking.confirmedPrice) / 2) * 100) / 100;
  }

  return remaining;
}

export async function createPayment({
  reference,
  userId,
  type,
  refId,
  momoNumber,
  amount
}) {
  const result = await query(
    `insert into payments
       (reference, user_id, payment_type, ref_id, momo_number, amount, status)
     values ($1, $2, $3, $4, $5, $6, 'pending')
     returning reference as "paymentReference", amount, status`,
    [reference, userId, type, refId, momoNumber, amount]
  );
  return result.rows[0];
}

export async function updatePaymentStatus(reference, status) {
  await query(
    "update payments set status = $1, updated_at = now() where reference = $2",
    [status, reference]
  );
}

export async function findPaymentByReference(reference, userId) {
  const result = await query(
    `select reference, status, amount, payment_type as type, ref_id as "refId",
            created_at as "createdAt"
     from payments
     where reference = $1 and user_id = $2`,
    [reference, userId]
  );
  return result.rows[0] || null;
}

export async function getGiftCardForEmail(id) {
  const result = await query(
    `select id, code, amount, purchaser_name as "purchaserName", purchaser_email as "purchaserEmail",
            recipient_name as "recipientName", recipient_email as "recipientEmail", message
     from gift_cards
     where id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getOrderDetailsForEmail(orderId) {
  const orderResult = await query(
    `select o.id, o.total_amount as "totalAmount", o.delivery_email as "deliveryEmail",
            coalesce(u.name, o.delivery_name) as "customerName",
            coalesce(u.phone, o.delivery_phone) as "customerPhone",
            u.email as "customerEmail"
     from orders o
     left join users u on u.id = o.user_id
     where o.id = $1`,
    [orderId]
  );
  const order = orderResult.rows[0];
  if (!order) return null;
  order.customerEmail = order.deliveryEmail || order.customerEmail;

  const itemsResult = await query(
    `select oi.quantity, oi.unit_price as "unitPrice", p.name
     from order_items oi
     join products p on p.id = oi.product_id
     where oi.order_id = $1`,
    [orderId]
  );
  order.items = itemsResult.rows;
  return order;
}

export async function getBookingDetailsForEmail(bookingId) {
  const result = await query(
    `select b.id, b.booking_date as date, b.time_slot as "timeSlot",
            b.confirmation_code as "confirmationCode", b.status,
            b.confirmed_price as "confirmedPrice", b.amount_paid as "amountPaid",
            s.name as "serviceName", s.price_min as "priceMin", s.price_max as "priceMax",
            u.name as "customerName", u.phone as "customerPhone",
            coalesce(b.contact_email, u.email) as "customerEmail"
     from bookings b
     join services s on s.id = b.service_id
     join users u on u.id = b.user_id
     where b.id = $1`,
    [bookingId]
  );
  return result.rows[0] || null;
}

export async function markPaymentSuccessAndUnlock(reference) {
  const result = await query(
    `update payments set status = 'success', updated_at = now()
     where reference = $1
     returning reference, payment_type as type, ref_id as "refId", amount`,
    [reference]
  );
  const payment = result.rows[0];
  if (!payment) return null;

  if (payment.type === "order") {
    await query("update orders set status = 'paid' where id = $1", [payment.refId]);
  } else if (payment.type === "gift_card") {
    await query("update gift_cards set status = 'active', updated_at = now() where id = $1", [payment.refId]);
  } else {
    await query(
      `update bookings
       set status = 'confirmed', amount_paid = amount_paid + $1
       where id = $2`,
      [payment.amount, payment.refId]
    );
  }

  return payment;
}

export async function markBookingBalanceSettledInPerson(id) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const bookingResult = await client.query(
      `select user_id as "userId", confirmed_price as "confirmedPrice", amount_paid as "amountPaid"
       from bookings where id = $1 for update`,
      [id]
    );
    const booking = bookingResult.rows[0];
    if (!booking || booking.confirmedPrice == null) {
      await client.query("rollback");
      return null;
    }

    const remaining = Number(booking.confirmedPrice) - Number(booking.amountPaid || 0);
    if (remaining <= 0) {
      await client.query("rollback");
      return null;
    }

    const reference = `CASH-${crypto.randomUUID()}`;
    await client.query(
      `insert into payments (reference, user_id, payment_type, ref_id, momo_number, amount, status)
       values ($1, $2, 'booking', $3, 'Cash', $4, 'success')`,
      [reference, booking.userId, id, remaining]
    );

    const result = await client.query(
      `update bookings
       set amount_paid = confirmed_price, updated_at = now()
       where id = $1
       returning id, confirmed_price as "confirmedPrice", amount_paid as "amountPaid"`,
      [id]
    );

    await client.query("commit");
    return result.rows[0] || null;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function listPendingPayments() {
  const result = await query(
    `select reference, payment_type as type, ref_id as "refId", amount, created_at as "createdAt"
     from payments
     where status = 'pending' and method = 'paystack'
       and created_at < now() - interval '90 seconds'
     order by created_at asc`
  );
  return result.rows;
}

export async function createManualPayment({ reference, userId, type, refId, amount, payerName, claimedAmount, proofImageUrl }) {
  const result = await query(
    `insert into payments
       (reference, user_id, payment_type, ref_id, momo_number, amount, status, method, payer_name, claimed_amount, proof_image_url)
     values ($1, $2, $3, $4, '', $5, 'awaiting_confirmation', 'manual_momo', $6, $7, $8)
     returning reference as "paymentReference", amount, status`,
    [reference, userId, type, refId, amount, payerName, claimedAmount, proofImageUrl]
  );
  return result.rows[0];
}

export async function findOpenManualPayment(type, refId) {
  const result = await query(
    `select reference from payments
     where payment_type = $1 and ref_id = $2 and method = 'manual_momo' and status = 'awaiting_confirmation'
     limit 1`,
    [type, refId]
  );
  return result.rows[0] || null;
}

export async function findManualPayment(reference) {
  const result = await query(
    `select reference, payment_type as type, ref_id as "refId", amount, status, method
     from payments where reference = $1`,
    [reference]
  );
  return result.rows[0] || null;
}

export async function rejectManualPayment(reference) {
  const result = await query(
    `update payments set status = 'failed', updated_at = now()
     where reference = $1 and method = 'manual_momo' and status = 'awaiting_confirmation'
     returning reference, payment_type as type, ref_id as "refId", amount`,
    [reference]
  );
  return result.rows[0] || null;
}

export async function claimManualPayment(reference) {
  const result = await query(
    `update payments set status = 'success', updated_at = now()
     where reference = $1 and method = 'manual_momo' and status = 'awaiting_confirmation'
     returning reference`,
    [reference]
  );
  return result.rows[0] || null;
}

export async function releaseManualPayment(reference) {
  await query(
    `update payments set status = 'awaiting_confirmation', updated_at = now()
     where reference = $1 and method = 'manual_momo'`,
    [reference]
  );
}