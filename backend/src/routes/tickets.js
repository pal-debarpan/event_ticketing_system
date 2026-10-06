const express = require("express");
const { verifyTicket } = require("../controllers/ticketController");

const router = express.Router();

router.post("/verify", verifyTicket);

module.exports = router;