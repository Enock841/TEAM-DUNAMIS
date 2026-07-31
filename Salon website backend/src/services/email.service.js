import { Resend } from "resend";
import { env } from "../config/env.js";

let resendClient;

function configurationError(message) {
  const error = new Error(message);
  error.name = "EmailConfigurationError";
  error.status = 503;
  return error;
}

function hasValidSenderFormat(value) {
  const trimmed = value.trim();
  const namedAddress = trimmed.match(/^[^<>\r\n]+\s<([^<>\s]+)>$/);
  const address = namedAddress ? namedAddress[1] : trimmed;
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address);
}

function getResendClient() {
  if (!env.resendApiKey) {
    throw configurationError("Email is not configured: RESEND_API_KEY is missing");
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
    throw configurationError("Email is not configured: RESEND_FROM_EMAIL is missing");
  }

  if (!hasValidSenderFormat(env.resendFromEmail)) {
    throw configurationError(
      "Email is not configured: RESEND_FROM_EMAIL must use sender@example.com or Name <sender@example.com>"
    );
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
    sendError.status = 502;
    sendError.cause = error;
    throw sendError;
  }

  return data;
}

export function isEmailConfigured() {
  return Boolean(
    env.resendApiKey &&
    env.resendFromEmail &&
    hasValidSenderFormat(env.resendFromEmail)
  );
}
