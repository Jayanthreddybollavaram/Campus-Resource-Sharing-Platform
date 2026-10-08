const express = require("express");

const {
    getMyTransactions,
    getAllTransactions,
    getResourceTransactions,
    getTransactionById
} = require("../controllers/transactionController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// All transaction routes require authentication
router.use(authMiddleware);


// My transaction history
router.get("/my", getMyTransactions);


// Transactions related to a resource
router.get("/resource/:id", getResourceTransactions);


// Individual transaction
router.get("/:id", getTransactionById);


// All transactions
router.get("/", getAllTransactions);


module.exports = router;