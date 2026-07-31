function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function newsletterWelcomeEmail({ appUrl }) {
  const shopUrl = escapeHtml(`${appUrl.replace(/\/$/, "")}/#/shop`);
  const appointmentsUrl = escapeHtml(`${appUrl.replace(/\/$/, "")}/#/appointments`);

  return {
    subject: "Welcome to Beryl's — you're on the list",
    text: [
      "Welcome to Beryl's Beauty Mark.",
      "",
      "You're now on our list for new arrivals, practical hair-care notes, and newly available appointment dates.",
      "",
      `Shop the collection: ${appUrl.replace(/\/$/, "")}/#/shop`,
      `Book an appointment: ${appUrl.replace(/\/$/, "")}/#/appointments`,
      "",
      "With love,",
      "Beryl's Beauty Mark"
    ].join("\n"),
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to Beryl's</title>
  </head>
  <body style="margin:0;background:#fff8fb;color:#402231;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      New arrivals, hair-care notes and appointment dates are coming your way.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff8fb;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(64,34,49,0.10);">
            <tr>
              <td style="background:#402231;padding:34px 36px;text-align:center;">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:5px;color:#ffffff;">BERYL'S</div>
                <div style="margin-top:8px;font-size:11px;letter-spacing:3px;color:#f1a3c6;">BEAUTY MARK</div>
              </td>
            </tr>
            <tr>
              <td style="padding:52px 42px 28px;text-align:center;">
                <div style="font-size:12px;font-weight:700;letter-spacing:3px;color:#dc2d83;">WELCOME, BEAUTIFUL</div>
                <h1 style="margin:18px 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.15;font-weight:400;color:#402231;">You're officially on the list.</h1>
                <p style="margin:0 auto;max-width:470px;font-size:16px;line-height:1.8;color:#745d69;">
                  Expect thoughtful hair-care notes, first looks at new arrivals, and a heads-up when fresh appointment dates become available.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 42px 46px;text-align:center;">
                <a href="${shopUrl}" style="display:inline-block;margin:6px;padding:15px 26px;border-radius:999px;background:#dc2d83;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1.5px;text-decoration:none;">EXPLORE THE SHOP</a>
                <a href="${appointmentsUrl}" style="display:inline-block;margin:6px;padding:14px 25px;border:1px solid #d6b56e;border-radius:999px;color:#402231;font-size:12px;font-weight:700;letter-spacing:1.5px;text-decoration:none;">BOOK A VISIT</a>
              </td>
            </tr>
            <tr>
              <td style="background:#fff1f7;padding:30px 42px;text-align:center;border-top:1px solid #f5dce7;">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:19px;color:#402231;">Quality hair. Intentional care. Beautiful results.</p>
                <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#8b7280;">Beryl's Beauty Mark · Ayeduase Newsite, Kumasi, Ghana</p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:11px;line-height:1.6;color:#9b8490;">You received this email because you signed up for updates from Beryl's Beauty Mark.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
  };
}
