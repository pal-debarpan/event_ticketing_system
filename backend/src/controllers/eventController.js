const pool = require("../db");

const getEvents = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM events ORDER BY event_date ASC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
};

const createEvent = async (req, res) => {
    try {
        const { name, description, venue, event_date, capacity } = req.body;

        if (!name || !venue || !event_date || !capacity) {
            return res.status(400).json({
                error: "name, venue, event_date and capacity are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO events (name, description, venue, event_date, capacity)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, description || null, venue, event_date, capacity]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ error: "Failed to create event" });
    }
};

module.exports = { getEvents, createEvent };