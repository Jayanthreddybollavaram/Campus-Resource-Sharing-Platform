const { pool } = require("../config/database");


// =====================================================
// STUDENT DASHBOARD
// GET /api/dashboard/student
// =====================================================

const getStudentDashboard = async (req, res) => {

    try {

        const userId = req.user.user_id;


        // =================================================
        // 1. USER INFORMATION
        // =================================================

        const [users] = await pool.execute(
            `SELECT
                user_id,
                full_name,
                email,
                roll_number
             FROM users
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );


        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        const user = users[0];


        // =================================================
        // 2. MY RESOURCE STATISTICS
        // =================================================

        const [resourceStats] = await pool.execute(
            `SELECT

                COUNT(*) AS total_resources,

                SUM(
                    CASE
                        WHEN availability = 'Available'
                        THEN 1
                        ELSE 0
                    END
                ) AS available_resources,

                SUM(
                    CASE
                        WHEN availability = 'Borrowed'
                        THEN 1
                        ELSE 0
                    END
                ) AS borrowed_resources

             FROM resources

             WHERE owner_id = ?`,
            [userId]
        );


        // =================================================
        // 3. MY REQUEST STATISTICS
        // =================================================

        const [requestStats] = await pool.execute(
            `SELECT

                COUNT(*) AS total_requests,

                SUM(
                    CASE
                        WHEN status = 'Pending'
                        THEN 1
                        ELSE 0
                    END
                ) AS pending_requests,

                SUM(
                    CASE
                        WHEN status = 'Approved'
                        THEN 1
                        ELSE 0
                    END
                ) AS approved_requests,

                SUM(
                    CASE
                        WHEN status = 'Rejected'
                        THEN 1
                        ELSE 0
                    END
                ) AS rejected_requests

             FROM borrow_requests

             WHERE requester_id = ?`,
            [userId]
        );


        // =================================================
        // 4. MY BORROWING STATISTICS
        // =================================================

        const [borrowingStats] = await pool.execute(
            `SELECT

                COUNT(*) AS total_borrowings,

                SUM(
                    CASE
                        WHEN status = 'Borrowed'
                        THEN 1
                        ELSE 0
                    END
                ) AS active_borrowings,

                SUM(
                    CASE
                        WHEN status = 'Returned'
                        THEN 1
                        ELSE 0
                    END
                ) AS returned_borrowings,

                SUM(
                    CASE
                        WHEN status = 'Borrowed'
                        AND due_date < CURDATE()
                        THEN 1
                        ELSE 0
                    END
                ) AS overdue_borrowings

             FROM borrowings

             WHERE borrower_id = ?`,
            [userId]
        );


        // =================================================
        // 5. ACTIVE BORROWINGS
        // =================================================

        const [activeBorrowings] = await pool.execute(
            `SELECT

                b.borrowing_id,
                b.resource_id,

                r.resource_name,
                r.category,
                r.image,

                owner.full_name AS owner_name,

                b.borrow_date,
                b.due_date,
                b.status

             FROM borrowings b

             INNER JOIN resources r
                ON b.resource_id = r.resource_id

             INNER JOIN users owner
                ON b.owner_id = owner.user_id

             WHERE b.borrower_id = ?

             AND b.status = 'Borrowed'

             ORDER BY b.due_date ASC

             LIMIT 5`,
            [userId]
        );


        // =================================================
        // 6. RECENT REQUESTS
        // =================================================

        const [recentRequests] = await pool.execute(
            `SELECT

                br.request_id,
                br.resource_id,

                r.resource_name,
                r.category,
                r.image,

                owner.full_name AS owner_name,

                br.request_date,
                br.expected_return_date,
                br.status

             FROM borrow_requests br

             INNER JOIN resources r
                ON br.resource_id = r.resource_id

             INNER JOIN users owner
                ON br.owner_id = owner.user_id

             WHERE br.requester_id = ?

             ORDER BY br.request_date DESC

             LIMIT 5`,
            [userId]
        );


        // =================================================
        // 7. RECENT TRANSACTIONS
        // =================================================

        const [recentTransactions] = await pool.execute(
            `SELECT

                t.transaction_id,
                t.resource_id,

                r.resource_name,

                t.transaction_type,
                t.transaction_date,
                t.description

             FROM transactions t

             INNER JOIN resources r
                ON t.resource_id = r.resource_id

             WHERE t.user_id = ?

             ORDER BY t.transaction_date DESC

             LIMIT 10`,
            [userId]
        );


        // =================================================
        // 8. SEND DASHBOARD RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            dashboard: {

                user: user,

                statistics: {

                    resources: resourceStats[0],

                    requests: requestStats[0],

                    borrowings: borrowingStats[0]

                },

                active_borrowings: activeBorrowings,

                recent_requests: recentRequests,

                recent_transactions: recentTransactions

            }

        });


    } catch (error) {

        console.error(
            "Student dashboard error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Failed to load student dashboard.",

            error: error.message

        });

    }

};


module.exports = {
    getStudentDashboard
};