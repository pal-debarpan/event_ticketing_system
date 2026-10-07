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

const sendTicketEmail = async ({ email, name, event, qrCode }) => {
    const base64Image = qrCode.split(",")[1];

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
            <h2>Hello ${name}!</h2>

            <p>Your registration for <strong>${event.name}</strong> is confirmed.</p>

            <p><strong>Venue:</strong> ${event.venue}</p>

            <p><strong>Date:</strong> ${new Date(event.event_date).toLocaleString()}</p>

            <h3>Your Ticket QR Code</h3>

            <img src="cid:ticket-qr" alt="Event Ticket QR Code" />

            <p>Please show this QR code at the entrance.</p>
        `,
    });
};

module.exports = { sendTicketEmail };