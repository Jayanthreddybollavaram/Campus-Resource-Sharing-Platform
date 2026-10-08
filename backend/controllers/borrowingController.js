const { pool } = require("../config/database");


// =====================================================
// GET MY ACTIVE BORROWINGS
// GET /api/borrowings/my
// =====================================================

const getMyBorrowings = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [borrowings] = await pool.execute(
            `SELECT
                b.borrowing_id,
                b.resource_id,
                r.resource_name,
                r.category,
                r.description,
                r.condition_state,
                r.image,

                b.owner_id,
                owner.full_name AS owner_name,

                b.borrow_date,
                b.due_date,
                b.return_date,
                b.status

             FROM borrowings b

             INNER JOIN resources r
                ON b.resource_id = r.resource_id

             INNER JOIN users owner
                ON b.owner_id = owner.user_id

             WHERE b.borrower_id = ?

             ORDER BY b.borrow_date DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            count: borrowings.length,
            borrowings
        });

    } catch (error) {
        console.error("Get my borrowings error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your borrowings.",
            error: error.message
        });
    }
};


// =====================================================
// GET BORROWINGS OF MY RESOURCES
// GET /api/borrowings/owned
// =====================================================

const getOwnedBorrowings = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [borrowings] = await pool.execute(
            `SELECT
                b.borrowing_id,
                b.resource_id,
                r.resource_name,
                r.category,
                r.image,

                b.borrower_id,
                borrower.full_name AS borrower_name,
                borrower.email AS borrower_email,

                b.borrow_date,
                b.due_date,
                b.return_date,
                b.status

             FROM borrowings b

             INNER JOIN resources r
                ON b.resource_id = r.resource_id

             INNER JOIN users borrower
                ON b.borrower_id = borrower.user_id

             WHERE b.owner_id = ?

             ORDER BY b.borrow_date DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            count: borrowings.length,
            borrowings
        });

    } catch (error) {
        console.error("Get owned borrowings error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve borrowings.",
            error: error.message
        });
    }
};


// =====================================================
// GET BORROWING BY ID
// GET /api/borrowings/:id
// =====================================================

const getBorrowingById = async (req, res) => {
    try {
        const borrowingId = req.params.id;
        const userId = req.user.user_id;

        const [borrowings] = await pool.execute(
            `SELECT
                b.borrowing_id,
                b.resource_id,

                r.resource_name,
                r.category,
                r.description,
                r.condition_state,
                r.image,

                b.borrower_id,
                borrower.full_name AS borrower_name,

                b.owner_id,
                owner.full_name AS owner_name,

                b.borrow_date,
                b.due_date,
                b.return_date,
                b.status

             FROM borrowings b

             INNER JOIN resources r
                ON b.resource_id = r.resource_id

             INNER JOIN users borrower
                ON b.borrower_id = borrower.user_id

             INNER JOIN users owner
                ON b.owner_id = owner.user_id

             WHERE b.borrowing_id = ?

             AND (
                 b.borrower_id = ?
                 OR b.owner_id = ?
             )

             LIMIT 1`,
            [borrowingId, userId, userId]
        );

        if (borrowings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Borrowing record not found."
            });
        }

        return res.status(200).json({
            success: true,
            borrowing: borrowings[0]
        });

    } catch (error) {
        console.error("Get borrowing error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve borrowing.",
            error: error.message
        });
    }
};


// =====================================================
// RETURN RESOURCE
// PUT /api/borrowings/:id/return
// =====================================================

const returnResource = async (req, res) => {

    const connection = await pool.getConnection();

    try {
        const borrowingId = req.params.id;
        const userId = req.user.user_id;

        await connection.beginTransaction();

        // ---------------------------------------------
        // Find borrowing
        // ---------------------------------------------

        const [borrowings] = await connection.execute(
            `SELECT
                borrowing_id,
                resource_id,
                borrower_id,
                owner_id,
                due_date,
                status

             FROM borrowings

             WHERE borrowing_id = ?

             AND (
                 borrower_id = ?
                 OR owner_id = ?
             )

             LIMIT 1`,
            [borrowingId, userId, userId]
        );

        if (borrowings.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Borrowing record not found."
            });
        }

        const borrowing = borrowings[0];

        // ---------------------------------------------
        // Check status
        // ---------------------------------------------

        if (
            borrowing.status === "Returned"
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This resource has already been returned."
            });
        }

        // ---------------------------------------------
        // Return date
        // ---------------------------------------------

        const returnDate = new Date()
            .toISOString()
            .split("T")[0];

        // ---------------------------------------------
        // Update borrowing
        // ---------------------------------------------

        await connection.execute(
            `UPDATE borrowings
             SET
                return_date = ?,
                status = 'Returned'
             WHERE borrowing_id = ?`,
            [
                returnDate,
                borrowingId
            ]
        );

        // ---------------------------------------------
        // Make resource available
        // ---------------------------------------------

        await connection.execute(
            `UPDATE resources
             SET availability = 'Available'
             WHERE resource_id = ?`,
            [borrowing.resource_id]
        );

        // ---------------------------------------------
        // Update corresponding borrow request
        // ---------------------------------------------

        await connection.execute(
            `UPDATE borrow_requests
             SET status = 'Returned'
             WHERE resource_id = ?
             AND requester_id = ?
             AND owner_id = ?
             AND status = 'Approved'`,
            [
                borrowing.resource_id,
                borrowing.borrower_id,
                borrowing.owner_id
            ]
        );

        // ---------------------------------------------
        // Get resource name
        // ---------------------------------------------

        const [resources] = await connection.execute(
            `SELECT resource_name
             FROM resources
             WHERE resource_id = ?
             LIMIT 1`,
            [borrowing.resource_id]
        );

        const resourceName =
            resources.length > 0
                ? resources[0].resource_name
                : "Resource";

        // ---------------------------------------------
        // Create transaction record
        // ---------------------------------------------

        await connection.execute(
            `INSERT INTO transactions
            (
                resource_id,
                user_id,
                transaction_type,
                description
            )
            VALUES (?, ?, ?, ?)`,
            [
                borrowing.resource_id,
                userId,
                "Returned",
                `Resource "${resourceName}" was returned`
            ]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Resource returned successfully."
        });

    } catch (error) {

        await connection.rollback();

        console.error("Return resource error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to return resource.",
            error: error.message
        });

    } finally {
        connection.release();
    }
};


// =====================================================
// GET OVERDUE BORROWINGS
// GET /api/borrowings/overdue
// =====================================================

const getOverdueBorrowings = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [borrowings] = await pool.execute(
            `SELECT
                b.borrowing_id,
                b.resource_id,
                r.resource_name,
                r.category,

                b.borrower_id,
                borrower.full_name AS borrower_name,

                b.owner_id,
                owner.full_name AS owner_name,

                b.borrow_date,
                b.due_date,
                b.return_date,
                b.status

             FROM borrowings b

             INNER JOIN resources r
                ON b.resource_id = r.resource_id

             INNER JOIN users borrower
                ON b.borrower_id = borrower.user_id

             INNER JOIN users owner
                ON b.owner_id = owner.user_id

             WHERE
                (
                    b.borrower_id = ?
                    OR b.owner_id = ?
                )

                AND b.status = 'Borrowed'

                AND b.due_date < CURDATE()

             ORDER BY b.due_date ASC`,
            [userId, userId]
        );

        return res.status(200).json({
            success: true,
            count: borrowings.length,
            borrowings
        });

    } catch (error) {
        console.error("Get overdue borrowings error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve overdue borrowings.",
            error: error.message
        });
    }
};


module.exports = {
    getMyBorrowings,
    getOwnedBorrowings,
    getBorrowingById,
    returnResource,
    getOverdueBorrowings
};