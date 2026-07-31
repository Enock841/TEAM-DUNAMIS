import { Resend } from "resend";
import { env } from "../config/env.js";

let resendClient;

function getResendClient() {
  if (!env.resendApiKey) {
    throw new Error("Email is not configured: RESEND_API_KEY is missing");
  }

  if (!resendClient) {
    resendClient = new Resend(env.resendApiKey);
  }

  return resendClient;
}

/**
 * Sends an email through the app's configured Resend account.
 *
 * Feature-specific code should call this service instead of constructing its own
 * Resend client. That keeps credentials and sender details server-side.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo = env.resendReplyToEmail || undefined,
  tags
}) {
  if (!env.resendFromEmail) {
    throw new Error("Email is not configured: RESEND_FROM_EMAIL is missing");
  }

  if (!to || !subject || (!html && !text)) {
    throw new TypeError("Email requires a recipient, subject, and html or text body");
  }

  const { data, error } = await getResendClient().emails.send({
    from: env.resendFromEmail,
    to,
    subject,
    html,
    text,
    replyTo,
    tags
  });

  if (error) {
    const sendError = new Error(`Resend could not send the email: ${error.message}`);
    sendError.name = "EmailDeliveryError";
    sendError.cause = error;
    throw sendError;
  }

  return data;
}

export function isEmailConfigured() {
  return Boolean(env.resendApiKey && env.resendFromEmail);
}
