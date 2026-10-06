const jwt = require("jsonwebtoken");

const organizerAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Organizer authentication required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.organizer = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            error: "Invalid or expired organizer token"
        });
    }
};

module.exports = organizerAuth;