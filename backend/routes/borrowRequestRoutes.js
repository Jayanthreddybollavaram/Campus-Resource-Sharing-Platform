const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    createBorrowRequest,
    getMyRequests,
    getReceivedRequests,
    getRequestById,
    cancelRequest,
    approveRequest,
    rejectRequest
} = require("../controllers/borrowRequestController");

// =====================================================
// BORROW REQUEST ROUTES (/api/borrow-requests)
// =====================================================

// Get received requests by default or my requests
router.get("/", authMiddleware, getReceivedRequests);
router.get("/received", authMiddleware, getReceivedRequests);
router.get("/my", authMiddleware, getMyRequests);

// Get single request
router.get("/:id", authMiddleware, getRequestById);

// Create request
router.post("/", authMiddleware, createBorrowRequest);

// Approve / Reject / Cancel
router.put("/:id/approve", authMiddleware, approveRequest);
router.patch("/:id/approve", authMiddleware, approveRequest);
router.post("/:id/approve", authMiddleware, approveRequest);

router.put("/:id/reject", authMiddleware, rejectRequest);
router.patch("/:id/reject", authMiddleware, rejectRequest);
router.post("/:id/reject", authMiddleware, rejectRequest);

router.put("/:id/cancel", authMiddleware, cancelRequest);
router.patch("/:id/cancel", authMiddleware, cancelRequest);

module.exports = router;