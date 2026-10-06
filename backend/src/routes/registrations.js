const express = require("express");
const { registerForEvent } = require("../controllers/registrationController");

const router = express.Router();

router.post("/:id/register", registerForEvent);

module.exports = router;