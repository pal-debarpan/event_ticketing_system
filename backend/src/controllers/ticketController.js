const crypto = require("crypto");
const pool = require("../db");

// UUID v4 validation regex
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Shared check-in logic.
 * Expects `ticket` to have: { id, name, email, event_name, venue }
 * Runs inside its own BEGIN/COMMIT/ROLLBACK transaction.
 */
const performCheckIn = async (ticket, res) => {
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
};

/** Shared SELECT that fetches ticket + participant + event by an arbitrary WHERE clause. */
const TICKET_SELECT = `
    SELECT
        tickets.id,
        tickets.status,
        tickets.registration_id,
        participants.name,
        participants.email,
        events.name  AS event_name,
        events.venue,
        events.event_date
    FROM tickets
    JOIN registrations  ON tickets.registration_id = registrations.id
    JOIN participants   ON registrations.participant_id = participants.id
    JOIN events         ON registrations.event_id = events.id
`;

const verifyTicket = async (req, res) => {
    const { token, ticketId } = req.body;

    // ── Path A: ticketId lookup ─────────────────────────────────────────────
    if (ticketId) {
        if (!UUID_RE.test(ticketId)) {
            return res.status(400).json({
                status: "INVALID TICKET",
                message: "ticketId must be a valid UUID"
            });
        }

        try {
            const ticketResult = await pool.query(
                TICKET_SELECT + `WHERE tickets.id = $1`,
                [ticketId]
            );

            if (ticketResult.rows.length === 0) {
                return res.status(400).json({
                    status: "INVALID TICKET",
                    message: "Ticket not found"
                });
            }

            return await performCheckIn(ticketResult.rows[0], res);

        } catch (error) {
            console.error("Ticket verification error (ticketId):", error);
            return res.status(500).json({
                status: "INVALID TICKET",
                message: "Verification failed"
            });
        }
    }

    // ── Path B: signed token lookup ─────────────────────────────────────────
    if (!token) {
        return res.status(400).json({
            status: "INVALID TICKET",
            message: "Either token or ticketId is required"
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

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const ticketResult = await pool.query(
            TICKET_SELECT + `WHERE tickets.token_hash = $1`,
            [tokenHash]
        );

        if (ticketResult.rows.length === 0) {
            return res.status(400).json({
                status: "INVALID TICKET",
                message: "Ticket not found"
            });
        }

        return await performCheckIn(ticketResult.rows[0], res);

    } catch (error) {
        console.error("Ticket verification error (token):", error);

        return res.status(400).json({
            status: "INVALID TICKET",
            message: "Invalid ticket"
        });
    }
};

module.exports = { verifyTicket };