const pool = require("./db");
const eventsRouter = require("./routes/events");

require("dotenv").config();

const express = require("express");

const app = express();

app.use(express.json());
app.use("/api/events", eventsRouter);


app.get("/" ,(req,res) => {
    res.send("API Running.")
})

app.listen(process.env.PORT);