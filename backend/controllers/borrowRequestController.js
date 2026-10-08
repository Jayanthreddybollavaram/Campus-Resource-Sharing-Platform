const { pool } = require("../config/database");

const MAX_BORROW_DAYS = 30;

const isValidExpectedReturnDate = (dateValue) => {
    if (typeof dateValue !== "string") {
        return false;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

    if (!match) {
        return false;
    }

    const [, year, month, day] = match;
    const returnDate = new Date(Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day)
    ));

    if (
        Number.isNaN(returnDate.getTime()) ||
        returnDate.toISOString().slice(0, 10) !== dateValue
    ) {
        return false;
    }

    const today = new Date();
    const todayUtc = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );
    const daysUntilReturn = (returnDate.getTime() - todayUtc) / 86400000;

    return daysUntilReturn >= 1 && daysUntilReturn <= MAX_BORROW_DAYS;
};


// =====================================================
// CREATE BORROW REQUEST
// POST /api/requests
// =====================================================

const createBorrowRequest = async (req, res) => {
    try {

        const requesterId = req.user.user_id;

        const {
            resource_id,
            expected_return_date,
            message
        } = req.body;

        // ---------------------------------------------
        // Validate input
        // ---------------------------------------------

        if (!resource_id || !expected_return_date) {
            return res.status(400).json({
                success: false,
                message: "Resource ID and expected return date are required."
            });
        }

        if (!isValidExpectedReturnDate(expected_return_date)) {
            return res.status(400).json({
                success: false,
                message: "Expected return date must be within the next 30 days."
            });
        }

        // ---------------------------------------------
        // Find resource
        // ---------------------------------------------

        const [resources] = await pool.execute(
            `SELECT
                resource_id,
                resource_name,
                owner_id,
                availability
             FROM resources
             WHERE resource_id = ?
             LIMIT 1`,
            [resource_id]
        );

        if (resources.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });
        }

        const resource = resources[0];

        // ---------------------------------------------
        // Prevent owner requesting own resource
        // ---------------------------------------------

        if (resource.owner_id === requesterId) {
            return res.status(400).json({
                success: false,
                message: "You cannot request your own resource."
            });
        }

        // ---------------------------------------------
        // Check availability
        // ---------------------------------------------

        if (resource.availability !== "Available") {
            return res.status(400).json({
                success: false,
                message: "This resource is currently not available."
            });
        }

        // ---------------------------------------------
        // Check existing pending request
        // ---------------------------------------------

        const [existingRequests] = await pool.execute(
            `SELECT request_id
             FROM borrow_requests
             WHERE resource_id = ?
             AND requester_id = ?
             AND status = 'Pending'
             LIMIT 1`,
            [resource_id, requesterId]
        );

        if (existingRequests.length > 0) {
            return res.status(409).json({
                success: false,
                message: "You already have a pending request for this resource."
            });
        }

        // ---------------------------------------------
        // Create request
        // ---------------------------------------------

        const [result] = await pool.execute(
            `INSERT INTO borrow_requests
            (
                resource_id,
                requester_id,
                owner_id,
                expected_return_date,
                message,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                resource_id,
                requesterId,
                resource.owner_id,
                expected_return_date,
                message || null,
                "Pending"
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Borrow request submitted successfully.",
            request_id: result.insertId
        });

    } catch (error) {

        console.error("Create borrow request error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create borrow request.",
            error: error.message
        });
    }
};


// =====================================================
// GET MY REQUESTS
// GET /api/requests/my
// =====================================================

const getMyRequests = async (req, res) => {

    try {

        const requesterId = req.user.user_id;

        const [requests] = await pool.execute(
            `SELECT
                br.request_id,
                br.resource_id,
                r.resource_name,
                r.category,
                r.image,
                br.owner_id,
                owner.full_name AS owner_name,
                br.request_date,
                br.expected_return_date,
                br.message,
                br.status
             FROM borrow_requests br

             INNER JOIN resources r
                ON br.resource_id = r.resource_id

             INNER JOIN users owner
                ON br.owner_id = owner.user_id

             WHERE br.requester_id = ?

             ORDER BY br.request_date DESC`,
            [requesterId]
        );

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {

        console.error("Get my requests error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your requests.",
            error: error.message
        });
    }
};


// =====================================================
// GET RECEIVED REQUESTS
// GET /api/requests/received
// =====================================================

const getReceivedRequests = async (req, res) => {

    try {

        const ownerId = req.user.user_id;

        const [requests] = await pool.execute(
            `SELECT
                br.request_id,
                br.resource_id,
                r.resource_name,
                r.category,
                r.image,
                br.requester_id,
                requester.full_name AS requester_name,
                requester.email AS requester_email,
                requester.roll_number,
                br.request_date,
                br.expected_return_date,
                br.message,
                br.status
             FROM borrow_requests br

             INNER JOIN resources r
                ON br.resource_id = r.resource_id

             INNER JOIN users requester
                ON br.requester_id = requester.user_id

             WHERE br.owner_id = ?

             ORDER BY br.request_date DESC`,
            [ownerId]
        );

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {

        console.error("Get received requests error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve received requests.",
            error: error.message
        });
    }
};


// =====================================================
// GET REQUEST BY ID
// GET /api/requests/:id
// =====================================================

const getRequestById = async (req, res) => {

    try {

        const requestId = req.params.id;
        const userId = req.user.user_id;

        const [requests] = await pool.execute(
            `SELECT
                br.request_id,
                br.resource_id,
                r.resource_name,
                r.category,
                r.description,
                r.image,

                br.requester_id,
                requester.full_name AS requester_name,

                br.owner_id,
                owner.full_name AS owner_name,

                br.request_date,
                br.expected_return_date,
                br.message,
                br.status

             FROM borrow_requests br

             INNER JOIN resources r
                ON br.resource_id = r.resource_id

             INNER JOIN users requester
                ON br.requester_id = requester.user_id

             INNER JOIN users owner
                ON br.owner_id = owner.user_id

             WHERE br.request_id = ?

             AND (
                 br.requester_id = ?
                 OR br.owner_id = ?
             )

             LIMIT 1`,
            [requestId, userId, userId]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Request not found."
            });
        }

        return res.status(200).json({
            success: true,
            request: requests[0]
        });

    } catch (error) {

        console.error("Get request error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve request.",
            error: error.message
        });
    }
};


// =====================================================
// CANCEL REQUEST
// PUT /api/requests/:id/cancel
// =====================================================

const cancelRequest = async (req, res) => {

    try {

        const requestId = req.params.id;
        const requesterId = req.user.user_id;

        const [requests] = await pool.execute(
            `SELECT
                request_id,
                status
             FROM borrow_requests
             WHERE request_id = ?
             AND requester_id = ?
             LIMIT 1`,
            [requestId, requesterId]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Request not found."
            });
        }

        if (requests[0].status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Only pending requests can be cancelled."
            });
        }

        await pool.execute(
            `UPDATE borrow_requests
             SET status = 'Cancelled'
             WHERE request_id = ?`,
            [requestId]
        );

        return res.status(200).json({
            success: true,
            message: "Borrow request cancelled successfully."
        });

    } catch (error) {

        console.error("Cancel request error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel request.",
            error: error.message
        });
    }
};


// =====================================================
// APPROVE REQUEST
// PUT /api/requests/:id/approve
// =====================================================

const approveRequest = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const requestId = req.params.id;
        const ownerId = req.user.user_id;

        await connection.beginTransaction();

        // ---------------------------------------------
        // Find request
        // ---------------------------------------------

        const [requests] = await connection.execute(
            `SELECT
                request_id,
                resource_id,
                requester_id,
                owner_id,
                expected_return_date,
                status
             FROM borrow_requests
             WHERE request_id = ?
             AND owner_id = ?
             LIMIT 1`,
            [requestId, ownerId]
        );

        if (requests.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Request not found."
            });
        }

        const request = requests[0];

        if (request.status !== "Pending") {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Only pending requests can be approved."
            });
        }

        // ---------------------------------------------
        // Check resource availability
        // ---------------------------------------------

        const [resources] = await connection.execute(
            `SELECT
                resource_id,
                availability
             FROM resources
             WHERE resource_id = ?
             LIMIT 1`,
            [request.resource_id]
        );

        if (resources.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });
        }

        if (resources[0].availability !== "Available") {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Resource is no longer available."
            });
        }

        // ---------------------------------------------
        // Approve request
        // ---------------------------------------------

        await connection.execute(
            `UPDATE borrow_requests
             SET status = 'Approved'
             WHERE request_id = ?`,
            [requestId]
        );

        // ---------------------------------------------
        // Mark resource as borrowed
        // ---------------------------------------------

        await connection.execute(
            `UPDATE resources
             SET availability = 'Borrowed'
             WHERE resource_id = ?`,
            [request.resource_id]
        );

        // ---------------------------------------------
        // Create borrowing record
        // ---------------------------------------------

        const today = new Date()
            .toISOString()
            .split("T")[0];

        await connection.execute(
            `INSERT INTO borrowings
            (
                resource_id,
                borrower_id,
                owner_id,
                borrow_date,
                due_date,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                request.resource_id,
                request.requester_id,
                request.owner_id,
                today,
                request.expected_return_date,
                "Borrowed"
            ]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Borrow request approved successfully."
        });

    } catch (error) {

        await connection.rollback();

        console.error("Approve request error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to approve request.",
            error: error.message
        });

    } finally {

        connection.release();
    }
};


// =====================================================
// REJECT REQUEST
// PUT /api/requests/:id/reject
// =====================================================

const rejectRequest = async (req, res) => {

    try {

        const requestId = req.params.id;
        const ownerId = req.user.user_id;

        const [requests] = await pool.execute(
            `SELECT
                request_id,
                status
             FROM borrow_requests
             WHERE request_id = ?
             AND owner_id = ?
             LIMIT 1`,
            [requestId, ownerId]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Request not found."
            });
        }

        if (requests[0].status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Only pending requests can be rejected."
            });
        }

        await pool.execute(
            `UPDATE borrow_requests
             SET status = 'Rejected'
             WHERE request_id = ?`,
            [requestId]
        );

        return res.status(200).json({
            success: true,
            message: "Borrow request rejected successfully."
        });

    } catch (error) {

        console.error("Reject request error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to reject request.",
            error: error.message
        });
    }
};


module.exports = {
    createBorrowRequest,
    getMyRequests,
    getReceivedRequests,
    getRequestById,
    cancelRequest,
    approveRequest,
    rejectRequest
};