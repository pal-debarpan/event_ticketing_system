const pool = require("./db");
const eventsRouter = require("./routes/events");
const registrationsRouter = require("./routes/registrations");
const ticketsRouter = require("./routes/tickets");

require("dotenv").config();

const express = require("express");

const app = express();

app.use(express.json());
app.use("/api/events", eventsRouter);
app.use("/api/events", registrationsRouter);
app.use("/api/tickets", ticketsRouter);


app.get("/" ,(req,res) => {
    res.send("API Running.")
})

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});