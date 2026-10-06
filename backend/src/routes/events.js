const express = require("express");
const {
    getEvents,
    createEvent,
    getEventById
} = require("../controllers/eventController");

const router = express.Router();

router.get("/", getEvents);

router.post("/", createEvent);

router.get("/:id", getEventById);

module.exports = router;