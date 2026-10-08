const express = require("express");

const {
    getOwnerDashboard
} = require("../controllers/ownerController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// Authentication required
router.use(authMiddleware);


// Owner dashboard
router.get("/dashboard", getOwnerDashboard);


module.exports = router;