const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginOrganizer = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: "Email and password are required"
        });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM organizers WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const organizer = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            organizer.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                organizerId: organizer.id,
                email: organizer.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.json({
            message: "Login successful",
            token
        });

    } catch (error) {
        console.error("Organizer login error:", error);

        res.status(500).json({
            error: "Login failed"
        });
    }
};

const getCurrentOrganizer = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email
             FROM organizers
             WHERE id = $1`,
            [req.organizer.organizerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Organizer not found"
            });
        }

        res.json({
            organizer: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching organizer:", error);

        res.status(500).json({
            error: "Failed to fetch organizer"
        });
    }
};

module.exports = {
    loginOrganizer,
    getCurrentOrganizer
};