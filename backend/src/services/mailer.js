const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendTicketEmail = async ({ email, name, event, qrCode }) => {
    const base64Image = qrCode.split(",")[1];

    const { data, error } = await resend.emails.send({
        from: "Event Ticketing <onboarding@resend.dev>",
        to: [email],
        subject: `Your ticket for ${event.name}`,

        attachments: [
            {
                filename: "ticket-qr.png",
                content: base64Image,
                contentId: "ticket-qr"
            }
        ],

        html: `
            <h2>Hello ${name}!</h2>

            <p>Your registration for <strong>${event.name}</strong> is confirmed.</p>

            <p><strong>Venue:</strong> ${event.venue}</p>
            <p><strong>Date:</strong> ${new Date(event.event_date).toLocaleString()}</p>

            <h3>Your Ticket QR Code</h3>

            <img src="cid:ticket-qr" alt="Event Ticket QR Code" />

            <p>Please show this QR code at the entrance.</p>
        `
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

module.exports = { sendTicketEmail };