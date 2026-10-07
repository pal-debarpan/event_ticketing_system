const pool = require("../db");
const crypto = require("crypto");
const QRCode = require("qrcode");
const { sendTicketEmail } = require("../services/mailer");

const registerForEvent = async (req, res) => {
    const { id: eventId } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            error: "Name and email are required"
        });
    }

    const client = await pool.connect();
    let transactionCommitted = false;

    try {
        await client.query("BEGIN");

        const eventResult = await client.query(
            "SELECT * FROM events WHERE id = $1 FOR UPDATE",
            [eventId]
        );

        if (eventResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                error: "Event not found"
            });
        }

        const event = eventResult.rows[0];

        const countResult = await client.query(
            "SELECT COUNT(*) FROM registrations WHERE event_id = $1",
            [eventId]
        );

        const registrationCount = Number(countResult.rows[0].count);

        if (registrationCount >= event.capacity) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                error: "Event capacity reached"
            });
        }

        const participantResult = await client.query(
            `INSERT INTO participants (name, email)
             VALUES ($1, $2)
             ON CONFLICT (email)
             DO UPDATE SET name = participants.name
             RETURNING *`,
            [name, email]
        );

        const participant = participantResult.rows[0];

        const registrationResult = await client.query(
            `INSERT INTO registrations (event_id, participant_id)
             VALUES ($1, $2)
             RETURNING *`,
            [eventId, participant.id]
        );

        const registration = registrationResult.rows[0];

        const payload = JSON.stringify({
            registrationId: registration.id,
            eventId,
            participantId: participant.id,
            issuedAt: Date.now()
        });

        const signature = crypto
            .createHmac("sha256", process.env.TICKET_SECRET)
            .update(payload)
            .digest("hex");

        const ticketToken = Buffer
            .from(`${payload}.${signature}`)
            .toString("base64url");

        const tokenHash = crypto
            .createHash("sha256")
            .update(ticketToken)
            .digest("hex");

        const ticketResult = await client.query(
            `INSERT INTO tickets (registration_id, token_hash)
             VALUES ($1, $2)
             RETURNING *`,
            [registration.id, tokenHash]
        );

        const ticket = ticketResult.rows[0];
        const qrCode = await QRCode.toDataURL(ticketToken, {
            width: 400,
            margin: 4,
            errorCorrectionLevel: "M"
        });

        await client.query("COMMIT");
        transactionCommitted = true;

        let emailSent = true;

        try {
            await sendTicketEmail({
                email,
                name,
                event,
                qrCode
            });
        } catch (emailError) {
            emailSent = false;
            console.error("Ticket email failed:", emailError);
        }

        return res.status(201).json({
            message: emailSent
                ? "Registration successful"
                : "Registration successful, but the confirmation email could not be sent.",
            emailSent,
            registration,
            ticket: {
                id: ticket.id
            }
        });

    } catch (error) {
        if (!transactionCommitted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError);
            }
        }

        if (error.code === "23505") {
            return res.status(409).json({
                error: "You are already registered for this event"
            });
        }

        console.error("Error registering for event:", error);

        return res.status(500).json({
            error: "Registration failed"
        });

    } finally {
        client.release();
    }
};

module.exports = { registerForEvent };