const { pool } = require("../config/database");


// =====================================================
// GET MY TRANSACTIONS
// GET /api/transactions/my
// =====================================================

const getMyTransactions = async (req, res) => {
    try {

        const userId = req.user.user_id;

        const [transactions] = await pool.execute(
            `SELECT
                t.transaction_id,
                t.resource_id,
                r.resource_name,
                r.category,
                t.user_id,
                u.full_name AS user_name,
                t.transaction_type,
                t.transaction_date,
                t.description

             FROM transactions t

             INNER JOIN resources r
                ON t.resource_id = r.resource_id

             INNER JOIN users u
                ON t.user_id = u.user_id

             WHERE t.user_id = ?

             ORDER BY t.transaction_date DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            count: transactions.length,
            transactions
        });

    } catch (error) {

        console.error("Get my transactions error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your transactions.",
            error: error.message
        });
    }
};


// =====================================================
// GET ALL TRANSACTIONS
// GET /api/transactions
// =====================================================

const getAllTransactions = async (req, res) => {
    try {

        const [transactions] = await pool.execute(
            `SELECT
                t.transaction_id,
                t.resource_id,
                r.resource_name,
                r.category,

                t.user_id,
                u.full_name AS user_name,

                t.transaction_type,
                t.transaction_date,
                t.description

             FROM transactions t

             INNER JOIN resources r
                ON t.resource_id = r.resource_id

             INNER JOIN users u
                ON t.user_id = u.user_id

             ORDER BY t.transaction_date DESC`
        );

        return res.status(200).json({
            success: true,
            count: transactions.length,
            transactions
        });

    } catch (error) {

        console.error("Get all transactions error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve transactions.",
            error: error.message
        });
    }
};


// =====================================================
// GET TRANSACTIONS FOR RESOURCE
// GET /api/transactions/resource/:id
// =====================================================

const getResourceTransactions = async (req, res) => {
    try {

        const resourceId = req.params.id;

        // Check whether resource exists
        const [resources] = await pool.execute(
            `SELECT resource_id, resource_name
             FROM resources
             WHERE resource_id = ?
             LIMIT 1`,
            [resourceId]
        );

        if (resources.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });
        }

        const [transactions] = await pool.execute(
            `SELECT
                t.transaction_id,
                t.resource_id,
                r.resource_name,

                t.user_id,
                u.full_name AS user_name,

                t.transaction_type,
                t.transaction_date,
                t.description

             FROM transactions t

             INNER JOIN resources r
                ON t.resource_id = r.resource_id

             INNER JOIN users u
                ON t.user_id = u.user_id

             WHERE t.resource_id = ?

             ORDER BY t.transaction_date DESC`,
            [resourceId]
        );

        return res.status(200).json({
            success: true,
            resource: resources[0],
            count: transactions.length,
            transactions
        });

    } catch (error) {

        console.error("Get resource transactions error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve resource transactions.",
            error: error.message
        });
    }
};


// =====================================================
// GET TRANSACTION BY ID
// GET /api/transactions/:id
// =====================================================

const getTransactionById = async (req, res) => {
    try {

        const transactionId = req.params.id;
        const userId = req.user.user_id;

        const [transactions] = await pool.execute(
            `SELECT
                t.transaction_id,
                t.resource_id,
                r.resource_name,
                r.category,

                t.user_id,
                u.full_name AS user_name,

                t.transaction_type,
                t.transaction_date,
                t.description

             FROM transactions t

             INNER JOIN resources r
                ON t.resource_id = r.resource_id

             INNER JOIN users u
                ON t.user_id = u.user_id

             WHERE t.transaction_id = ?

             LIMIT 1`,
            [transactionId]
        );

        if (transactions.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Transaction not found."
            });
        }

        const transaction = transactions[0];

        // Only the transaction owner can view the individual record
        if (transaction.user_id !== userId) {

            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this transaction."
            });
        }

        return res.status(200).json({
            success: true,
            transaction
        });

    } catch (error) {

        console.error("Get transaction error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve transaction.",
            error: error.message
        });
    }
};


module.exports = {
    getMyTransactions,
    getAllTransactions,
    getResourceTransactions,
    getTransactionById
};