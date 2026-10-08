const express = require("express");

const {
    getStudentDashboard
} = require("../controllers/dashboardController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// All dashboard routes require authentication
router.use(authMiddleware);


// Student dashboard
router.get("/student", getStudentDashboard);


module.exports = router;