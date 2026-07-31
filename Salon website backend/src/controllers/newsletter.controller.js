import { z } from "zod";
import { env } from "../config/env.js";
import { newsletterWelcomeEmail } from "../emails/newsletterWelcome.email.js";
import {
  markNewsletterWelcomeSent,
  subscribeNewsletterEmail
} from "../models/newsletterSubscriber.model.js";
import { sendEmail } from "../services/email.service.js";
import { HttpError } from "../utils/httpError.js";

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254)
});

export async function subscribe(req, res) {
  const { email } = subscribeSchema.parse(req.body);
  const subscriber = await subscribeNewsletterEmail(email);

  if (!subscriber.welcomeEmailSentAt) {
    const message = newsletterWelcomeEmail({ appUrl: env.frontendUrl });
    try {
      await sendEmail({
        to: email,
        ...message,
        tags: [{ name: "function", value: "newsletter-welcome" }]
      });
    } catch (error) {
      console.error("Newsletter welcome email failed:", error);
      throw new HttpError(
        503,
        "Email signup is temporarily unavailable. Please try again shortly."
      );
    }
    await markNewsletterWelcomeSent(subscriber.id);
  }

  res.status(subscriber.isNewSubscriber ? 201 : 200).json({
    message: subscriber.isNewSubscriber
      ? "You're on the list. Check your inbox for a welcome email."
      : "You're already on the list."
  });
}
