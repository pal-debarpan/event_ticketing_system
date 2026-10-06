const pool = require("../db");
const bcrypt = require("bcrypt");

const createOrganizer = async () => {
    const name = "AWS Builder Club Organizer";
    const email = "organizer@awsbuilderclub.com";
    const password = "Organizer@123";

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
        `INSERT INTO organizers (name, email, password_hash)
         VALUES ($1, $2, $3)`,
        [name, email, passwordHash]
    );

    console.log("Organizer created successfully");

    await pool.end();
};

createOrganizer().catch(async (error) => {
    console.error("Failed to create organizer:", error);
    await pool.end();
});