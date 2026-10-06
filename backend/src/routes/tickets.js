const express = require("express");
const { verifyTicket } = require("../controllers/ticketController");
const organizerAuth = require("../middleware/organizerAuth");

const router = express.Router();

router.post("/verify", organizerAuth, verifyTicket);

module.exports = router;