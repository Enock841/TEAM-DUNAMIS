import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const FROM_EMAIL = env.gmailUser;
const FROM_NAME = "Beryl's Beauty Mark";

export async function sendEmail({ to, subject, html }) {
  if (!env.sendgridApiKey || !FROM_EMAIL) {
    console.log("SendGrid not set, skipping email:", subject);
    return;
  }
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.sendgridApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        content: [{ type: "text/html", value: html }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send email:", subject, response.status, errorText);
    }
  } catch (error) {
    console.error("Failed to send email:", subject, error.message);
  }
}

export function sendOrderConfirmation(customerEmail, order) {
  if (!customerEmail) return;
  const itemsHtml = order.items
    .map((item) => `<li>${item.quantity} x ${item.name} - GHC ${item.unitPrice}</li>`)
    .join("");
  return sendEmail({
    to: customerEmail,
    subject: "Your Beryl's Beauty Mark order is confirmed",
    html: `
      <h2>Thank you for your order</h2>
      <p>We have received your payment and your order is being prepared.</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total: GHC ${order.totalAmount}</strong></p>
      <p>We will notify you as your order status updates.</p>
    `,
  });
}

export function sendAdminOrderNotification(order, customer) {
  if (!env.adminEmail) return;
  return sendEmail({
    to: env.adminEmail,
    subject: "New order received",
    html: `
      <h2>New order</h2>
      <p><strong>${customer.name}</strong> (${customer.phone}) just paid for an order.</p>
      <p>Total: GHC ${order.totalAmount}</p>
      <p>Check the admin dashboard for full details.</p>
    `,
  });
}

export function sendOrderStatusUpdate(customerEmail, order, status) {
  if (!customerEmail) return;
  return sendEmail({
    to: customerEmail,
    subject: "Your order status has been updated",
    html: `
      <h2>Order update</h2>
      <p>Your order is now: <strong>${status.replaceAll("_", " ")}</strong></p>
    `,
  });
}

export function sendBookingReceived(booking) {
  if (!booking.customerEmail) return;
  return sendEmail({
    to: booking.customerEmail,
    subject: "Your appointment request was received",
    html: `
      <h2>Appointment request received</h2>
      <p>Service: ${booking.serviceName}</p>
      <p>Date: ${booking.date}</p>
      <p>Time: ${booking.timeSlot}</p>
      <p>Your confirmation code: <strong>${booking.confirmationCode}</strong></p>
      <p>We will notify you once your appointment has been reviewed.</p>
    `,
  });
}

export function sendAdminBookingNotification(booking) {
  if (!env.adminEmail) return;
  return sendEmail({
    to: env.adminEmail,
    subject: "New appointment request",
    html: `
      <h2>New appointment request</h2>
      <p><strong>${booking.customerName}</strong> (${booking.customerPhone}) requested an appointment.</p>
      <p>Service: ${booking.serviceName}</p>
      <p>Date: ${booking.date}</p>
      <p>Time: ${booking.timeSlot}</p>
    `,
  });
}

export function sendBookingApproved(booking) {
  if (!booking.customerEmail) return;
  return sendEmail({
    to: booking.customerEmail,
    subject: "Your appointment is approved",
    html: `
      <h2>Your appointment is approved</h2>
      <p>Service: ${booking.serviceName}</p>
      <p>Date: ${booking.date}</p>
      <p>Time: ${booking.timeSlot}</p>
      <p>Price: GHC ${booking.confirmedPrice}</p>
      <p>Your confirmation code: <strong>${booking.confirmationCode}</strong></p>
      <p>If you have not already paid, please complete payment from your account to secure this slot.</p>
    `,
  });
}

export function sendBookingRescheduled(booking) {
  if (!booking.customerEmail) return;
  return sendEmail({
    to: booking.customerEmail,
    subject: "Your appointment has a new date and time",
    html: `
      <h2>Your appointment was rescheduled</h2>
      <p>Service: ${booking.serviceName}</p>
      <p>New date: ${booking.date}</p>
      <p>New time: ${booking.timeSlot}</p>
      <p>Your confirmation code: <strong>${booking.confirmationCode}</strong></p>
      <p>If this new time does not work for you, please contact the salon directly.</p>
    `,
  });
}

export function sendBookingCancelled(booking) {
  if (!booking.customerEmail) return;
  return sendEmail({
    to: booking.customerEmail,
    subject: "Your appointment has been cancelled",
    html: `
      <h2>Appointment cancelled</h2>
      <p>Service: ${booking.serviceName}</p>
      <p>Date: ${booking.date}</p>
      <p>Time: ${booking.timeSlot}</p>
      <p>If you already paid and believe this was in error, please contact the salon directly to discuss a refund.</p>
    `,
  });
}

export function sendGiftCardEmail(giftCard) {
  const recipientEmail = giftCard.recipientEmail || giftCard.purchaserEmail;
  if (!recipientEmail) return;
  const isGift = Boolean(giftCard.recipientEmail && giftCard.recipientEmail !== giftCard.purchaserEmail);
  return sendEmail({
    to: recipientEmail,
    subject: isGift ? `${giftCard.purchaserName} sent you a gift card` : "Your gift card is ready",
    html: `
      <h2>${isGift ? "You've received a gift card" : "Your gift card is ready"}</h2>
      ${isGift ? `<p>${giftCard.purchaserName} sent you a Beryl's Beauty Mark gift card.</p>` : ""}
      ${giftCard.message ? `<p><em>"${giftCard.message}"</em></p>` : ""}
      <p>Amount: GHC ${giftCard.amount}</p>
      <p>Your code: <strong style="font-size:1.2em;letter-spacing:2px">${giftCard.code}</strong></p>
      <p>Use this code at checkout on any order or appointment.</p>
    `,
  });
}

export function sendLowStockAlert(itemName, remaining) {
  if (!env.adminEmail) return;
  return sendEmail({
    to: env.adminEmail,
    subject: "Low stock warning: " + itemName,
    html: `
      <h2>Running low on stock</h2>
      <p><strong>${itemName}</strong> now has only <strong>${remaining}</strong> left.</p>
      <p>Consider restocking soon.</p>
    `,
  });
}

export function sendBookingReminder(booking) {
  if (!booking.customerEmail) return;
  return sendEmail({
    to: booking.customerEmail,
    subject: "Your appointment is coming up",
    html: `
      <h2>See you soon</h2>
      <p>This is a reminder that your appointment is coming up.</p>
      <p>Service: ${booking.serviceName}</p>
      <p>Date: ${booking.date}</p>
      <p>Time: ${booking.timeSlot}</p>
      <p>Your confirmation code: <strong>${booking.confirmationCode}</strong></p>
      <p>Please note, if you arrive late, the salon has the right to cancel and reschedule your booking, or additional charges may apply.</p>
    `,
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function sendManualPaymentAdminAlert({ payerName, amount, claimedAmount, type }) {
  if (!env.adminEmail) return;
  return sendEmail({
    to: env.adminEmail,
    subject: "Mobile Money payment waiting for your confirmation",
    html: `
      <h2>Please check your Mobile Money</h2>
      <p><strong>${escapeHtml(payerName)}</strong> says they sent GHC ${escapeHtml(claimedAmount)} for a ${escapeHtml(String(type).replace("_", " "))} (expected GHC ${escapeHtml(amount)}).</p>
      <p>Check your Mobile Money messages for this amount, then open the Mobile Money page in the admin dashboard to see their screenshot and confirm or reject it.</p>
    `,
  });
}

export function sendManualPaymentConfirmed(customerEmail, amount) {
  if (!customerEmail) return;
  return sendEmail({
    to: customerEmail,
    subject: "Your Mobile Money payment is confirmed",
    html: `
      <h2>Payment confirmed</h2>
      <p>We have received your Mobile Money payment of GHC ${escapeHtml(amount)}. Thank you!</p>
      <p>You can see the update in your account on the website.</p>
    `,
  });
}

export function sendPaymentRejected(customerEmail, amount, reason) {
  if (!customerEmail) return;
  return sendEmail({
    to: customerEmail,
    subject: "We could not find your Mobile Money payment",
    html: `
      <h2>We could not confirm your payment</h2>
      <p>We were not able to find your Mobile Money payment of GHC ${escapeHtml(amount)}.</p>
      ${reason ? `<p>Note from the salon: ${escapeHtml(reason)}</p>` : ""}
      <p>If you did send the money, please contact the salon directly with your payment screenshot, or submit your payment details again.</p>
    `,
  });
}