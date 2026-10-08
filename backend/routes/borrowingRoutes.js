const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getMyBorrowings,
    getOwnedBorrowings,
    getBorrowingById,
    returnResource
} = require("../controllers/borrowingController");

// =====================================================
// BORROWINGS ROUTES
// =====================================================

// Get borrowings of current user
router.get("/", authMiddleware, getMyBorrowings);
router.get("/my", authMiddleware, getMyBorrowings);
router.get("/owned", authMiddleware, getOwnedBorrowings);

// Get single borrowing record
router.get("/:id", authMiddleware, getBorrowingById);

// Return borrowed resource (Triggers Resource status -> Available & Borrowing status -> Returned)
router.put("/:id/return", authMiddleware, returnResource);
router.patch("/:id/return", authMiddleware, returnResource);
router.post("/:id/return", authMiddleware, returnResource);

module.exports = router;