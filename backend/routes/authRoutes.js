const express = require("express");

const {
    registerUser,
    loginUser,
    getCurrentUser
} = require("../controllers/authController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router =
    express.Router();


// =====================================================
// REGISTER
// POST /api/auth/register
// =====================================================

router.post(
    "/register",
    registerUser
);


// =====================================================
// LOGIN
// POST /api/auth/login
// =====================================================

router.post(
    "/login",
    loginUser
);


// =====================================================
// CURRENT USER
// GET /api/auth/me
// =====================================================

router.get(
    "/me",
    authMiddleware,
    getCurrentUser
);


module.exports = router;