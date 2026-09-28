const pool = require("./db");
require("dotenv").config();

const express = require("express");

const app = express();


app.get("/" ,(req,res) => {
    res.send("API Running.")
})

app.listen(process.env.PORT);