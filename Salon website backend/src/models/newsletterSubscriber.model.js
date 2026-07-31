import { query } from "../config/db.js";

export async function subscribeNewsletterEmail(email) {
  const result = await query(
    `insert into newsletter_subscribers (email)
     values ($1)
     on conflict (email) do update
       set is_active = true,
           updated_at = now()
     returning id, email, welcome_email_sent_at as "welcomeEmailSentAt",
               (xmax = 0) as "isNewSubscriber"`,
    [email]
  );

  return result.rows[0];
}

export async function markNewsletterWelcomeSent(id) {
  await query(
    `update newsletter_subscribers
     set welcome_email_sent_at = now(), updated_at = now()
     where id = $1`,
    [id]
  );
}
