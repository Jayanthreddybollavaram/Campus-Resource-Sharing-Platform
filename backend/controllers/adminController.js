const { pool } = require("../config/database");


// =====================================================
// ADMIN DASHBOARD
// GET /api/admin/dashboard
// =====================================================

const getAdminDashboard = async (req, res) => {

    try {

        // =================================================
        // 1. USER STATISTICS
        // =================================================

        const [userStats] = await pool.execute(
            `SELECT
                COUNT(*) AS total_users
             FROM users`
        );


        // =================================================
        // 2. RESOURCE STATISTICS
        // =================================================

        const [resourceStats] = await pool.execute(
            `SELECT

                COUNT(*) AS total_resources,

                COALESCE(
                    SUM(
                        CASE
                            WHEN availability = 'Available'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS available_resources,

                COALESCE(
                    SUM(
                        CASE
                            WHEN availability = 'Borrowed'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS borrowed_resources

             FROM resources`
        );


        // =================================================
        // 3. REQUEST STATISTICS
        // =================================================

        const [requestStats] = await pool.execute(
            `SELECT

                COUNT(*) AS total_requests,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Pending'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS pending_requests,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Approved'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS approved_requests,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Rejected'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS rejected_requests

             FROM borrow_requests`
        );


        // =================================================
        // 4. BORROWING STATISTICS
        // =================================================

        const [borrowingStats] = await pool.execute(
            `SELECT

                COUNT(*) AS total_borrowings,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Borrowed'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS active_borrowings,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Returned'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS returned_borrowings,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Borrowed'
                            AND due_date < CURDATE()
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS overdue_borrowings

             FROM borrowings`
        );


        // =================================================
        // 5. RECENT USERS
        // =================================================

        const [recentUsers] = await pool.execute(
            `SELECT
                user_id,
                full_name,
                email,
                roll_number,
                created_at
             FROM users
             ORDER BY created_at DESC
             LIMIT 5`
        );


        // =================================================
        // 6. RECENT RESOURCES
        // =================================================

        const [recentResources] = await pool.execute(
            `SELECT

                r.resource_id,
                r.resource_name,
                r.category,
                r.availability,
                r.condition_state,
                r.created_at,

                u.full_name AS owner_name

             FROM resources r

             INNER JOIN users u
                ON r.owner_id = u.user_id

             ORDER BY r.created_at DESC

             LIMIT 5`
        );


        // =================================================
        // 7. RECENT TRANSACTIONS
        // =================================================

        const [recentTransactions] = await pool.execute(
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

             ORDER BY t.transaction_date DESC

             LIMIT 10`
        );


        // =================================================
        // 8. SEND RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            dashboard: {

                statistics: {

                    users: userStats[0],

                    resources: resourceStats[0],

                    requests: requestStats[0],

                    borrowings: borrowingStats[0]

                },

                recent_users: recentUsers,

                recent_resources: recentResources,

                recent_transactions: recentTransactions

            }

        });


    } catch (error) {

        console.error(
            "Admin dashboard error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Failed to load admin dashboard.",

            error: error.message

        });

    }

};


module.exports = {
    getAdminDashboard
};