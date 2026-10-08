const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: Number(process.env.BREVO_SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY,
    },
});

const sendTicketEmail = async ({ email, name, event, qrCode, ticketId }) => {
    const base64Image = qrCode.split(",")[1];

    const eventDate = new Date(event.event_date).toLocaleString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    await transporter.sendMail({
        from: `Event Ticketing <${process.env.BREVO_FROM_EMAIL}>`,
        to: email,
        subject: `Your ticket for ${event.name}`,

        attachments: [
            {
                filename: "ticket-qr.png",
                content: base64Image,
                encoding: "base64",
                cid: "ticket-qr",
            },
        ],

        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Event Ticket</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f766e,#0d9488);padding:32px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#99f6e4;">Booking Confirmed</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;">${event.name}</h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0;font-size:16px;color:#475569;">Hello <strong style="color:#0f172a;">${name}</strong>,</p>
              <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:#64748b;">
                Your registration is confirmed. Show the QR code below at the entrance — the organizer will scan it to check you in.
              </p>
            </td>
          </tr>

          <!-- Event details -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Venue</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0f172a;">${event.venue}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Date &amp; Time</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0f172a;">${eventDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QR Code -->
          <tr>
            <td style="padding:32px 40px 0;text-align:center;">
              <p style="margin:0 0 16px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Your Entry QR Code</p>
              <div style="display:inline-block;padding:16px;border:2px solid #e2e8f0;border-radius:12px;background:#ffffff;">
                <img src="cid:ticket-qr" alt="Event Ticket QR Code" width="220" height="220" style="display:block;" />
              </div>
            </td>
          </tr>

          <!-- Ticket ID fallback -->
          <tr>
            <td style="padding:20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#92400e;">
                      <strong>&#9888; If QR scanning is unavailable,</strong> provide this Ticket ID to the organizer:
                    </p>
                    <p style="margin:0;font-size:15px;font-weight:700;font-family:'Courier New',Courier,monospace;color:#1e293b;letter-spacing:0.5px;word-break:break-all;">${ticketId}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">This ticket is non-transferable. One entry per ticket.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
    });
};

module.exports = { sendTicketEmail };