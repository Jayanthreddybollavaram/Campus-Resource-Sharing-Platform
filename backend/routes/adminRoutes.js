const express = require("express");
const {
    getAdminDashboard
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const router = express.Router();
// All admin routes require authentication
router.use(authMiddleware);
// Admin dashboard
router.use(roleMiddleware("Administrator"));
router.get("/dashboard", getAdminDashboard);
module.exports = router;