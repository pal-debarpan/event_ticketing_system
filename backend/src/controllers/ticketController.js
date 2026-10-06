const crypto = require("crypto");
const pool = require("../db");

const verifyTicket = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({
            status: "INVALID TICKET",
            message: "Ticket token is required"
        });
    }

    try {
        const decoded = Buffer
            .from(token, "base64url")
            .toString("utf8");

        const separatorIndex = decoded.lastIndexOf(".");

        if (separatorIndex === -1) {
            return res.status(400).json({
                status: "INVALID TICKET",
                message: "Malformed ticket token"
            });
        }

        const payload = decoded.slice(0, separatorIndex);
        const signature = decoded.slice(separatorIndex + 1);

        const expectedSignature = crypto
            .createHmac("sha256", process.env.TICKET_SECRET)
            .update(payload)
            .digest("hex");

        if (
            signature.length !== expectedSignature.length ||
            !/^[0-9a-f]+$/i.test(signature)
        ) {
            return res.status(400).json({
                status: "INVALID TICKET",
                message: "Invalid ticket signature"
            });
        }

        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature, "hex"),
            Buffer.from(expectedSignature, "hex")
        );

        if (!isValid) {
            return res.status(400).json({
                status: "INVALID TICKET",
                message: "Invalid ticket signature"
            });
        }

        const ticketData = JSON.parse(payload);

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const ticketResult = await pool.query(
            `SELECT
                tickets.id,
                tickets.status,
                tickets.registration_id,
                participants.name,
                participants.email,
                events.name AS event_name,
                events.venue,
                events.event_date
             FROM tickets
             JOIN registrations
                ON tickets.registration_id = registrations.id
             JOIN participants
                ON registrations.participant_id = participants.id
             JOIN events
                ON registrations.event_id = events.id
             WHERE tickets.token_hash = $1`,
            [tokenHash]
        );

        if (ticketResult.rows.length === 0) {
            return res.status(400).json({
                status: "INVALID TICKET",
                message: "Ticket not found"
            });
        }

        const ticket = ticketResult.rows[0];

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const lockedTicketResult = await client.query(
                `SELECT status
                FROM tickets
                WHERE id = $1
                FOR UPDATE`,
                [ticket.id]
            );

            const lockedTicket = lockedTicketResult.rows[0];

            if (lockedTicket.status === "CHECKED_IN") {
                const checkInResult = await client.query(
                    `SELECT checked_in_at
                    FROM check_ins
                    WHERE ticket_id = $1`,
                    [ticket.id]
                );

                await client.query("COMMIT");

                return res.status(409).json({
                    status: "ALREADY USED",
                    checkedInAt: checkInResult.rows[0]?.checked_in_at || null,
                    participant: {
                        name: ticket.name,
                        email: ticket.email
                    },
                    event: {
                        name: ticket.event_name,
                        venue: ticket.venue
                    }
                });
            }

            await client.query(
                `UPDATE tickets
                SET status = 'CHECKED_IN'
                WHERE id = $1`,
                [ticket.id]
            );

            const checkInResult = await client.query(
                `INSERT INTO check_ins (ticket_id)
                VALUES ($1)
                RETURNING checked_in_at`,
                [ticket.id]
            );

            await client.query("COMMIT");

            return res.json({
                status: "CHECKED-IN",
                checkedInAt: checkInResult.rows[0].checked_in_at,
                participant: {
                    name: ticket.name,
                    email: ticket.email
                },
                event: {
                    name: ticket.event_name,
                    venue: ticket.venue
                }
            });

        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }


    } catch (error) {
        console.error("Ticket verification error:", error);

        return res.status(400).json({
            status: "INVALID TICKET",
            message: "Invalid ticket"
        });
    }
};

module.exports = { verifyTicket };