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
// BORROW REQUEST ROUTES (/api/requests)
// =====================================================

// Get my sent requests
router.get("/", authMiddleware, getMyRequests);
router.get("/my", authMiddleware, getMyRequests);

// Get received requests (for resource owners)
router.get("/received", authMiddleware, getReceivedRequests);

// Get single request
router.get("/:id", authMiddleware, getRequestById);

// Create a new borrow request
router.post("/", authMiddleware, createBorrowRequest);

// Cancel a request (by requester)
router.put("/:id/cancel", authMiddleware, cancelRequest);
router.patch("/:id/cancel", authMiddleware, cancelRequest);

// Approve a request (by owner)
router.put("/:id/approve", authMiddleware, approveRequest);
router.patch("/:id/approve", authMiddleware, approveRequest);
router.post("/:id/approve", authMiddleware, approveRequest);

// Reject a request (by owner)
router.put("/:id/reject", authMiddleware, rejectRequest);
router.patch("/:id/reject", authMiddleware, rejectRequest);
router.post("/:id/reject", authMiddleware, rejectRequest);

module.exports = router;