const pool = require("./db");
const eventsRouter = require("./routes/events");
const registrationsRouter = require("./routes/registrations");
const ticketsRouter = require("./routes/tickets");
const organizersRouter = require("./routes/organizers");

require("dotenv").config();

const express = require("express");

const app = express();

app.use(express.json());
app.use("/api/events", eventsRouter);
app.use("/api/events", registrationsRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/organizers", organizersRouter);


app.get("/", (req, res) => {
    res.send("API Running.");
});

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ error: "Invalid JSON format" });
    }
    console.error("Unhandled server error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Vercel invokes the exported Express application as a serverless function.
// Keep the listener for the existing local development workflow.
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = app;

