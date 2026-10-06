const express = require("express");
const {
    loginOrganizer,
    getCurrentOrganizer
} = require("../controllers/organizerController");
const organizerAuth = require("../middleware/organizerAuth");

const router = express.Router();

router.post("/login", loginOrganizer);
router.get("/me", organizerAuth, getCurrentOrganizer);

module.exports = router;