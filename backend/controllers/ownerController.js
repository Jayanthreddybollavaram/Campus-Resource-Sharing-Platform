const { pool } = require("../config/database");


// =====================================================
// OWNER DASHBOARD
// GET /api/owner/dashboard
// =====================================================

const getOwnerDashboard = async (req, res) => {

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
                roll_number,
                role
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


        // =================================================
        // 2. MY RESOURCE STATISTICS
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

             FROM resources

             WHERE owner_id = ?`,
            [userId]
        );


        // =================================================
        // 3. REQUESTS RECEIVED FOR MY RESOURCES
        // =================================================

        const [requestStats] = await pool.execute(
            `SELECT

                COUNT(*) AS total_requests,

                COALESCE(
                    SUM(
                        CASE
                            WHEN br.status = 'Pending'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS pending_requests,

                COALESCE(
                    SUM(
                        CASE
                            WHEN br.status = 'Approved'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS approved_requests,

                COALESCE(
                    SUM(
                        CASE
                            WHEN br.status = 'Rejected'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS rejected_requests

             FROM borrow_requests br

             INNER JOIN resources r
                ON br.resource_id = r.resource_id

             WHERE r.owner_id = ?`,
            [userId]
        );


        // =================================================
        // 4. ACTIVE BORROWINGS OF MY RESOURCES
        // =================================================

        const [activeBorrowings] = await pool.execute(
            `SELECT

                b.borrowing_id,
                b.resource_id,

                r.resource_name,
                r.category,

                borrower.full_name AS borrower_name,
                borrower.email AS borrower_email,

                b.borrow_date,
                b.due_date,
                b.status

             FROM borrowings b

             INNER JOIN resources r
                ON b.resource_id = r.resource_id

             INNER JOIN users borrower
                ON b.borrower_id = borrower.user_id

             WHERE b.owner_id = ?

             AND b.status = 'Borrowed'

             ORDER BY b.due_date ASC

             LIMIT 10`,
            [userId]
        );


        // =================================================
        // 5. RECENT REQUESTS
        // =================================================

        const [recentRequests] = await pool.execute(
            `SELECT

                br.request_id,
                br.resource_id,

                r.resource_name,
                r.category,

                requester.full_name AS requester_name,
                requester.email AS requester_email,

                br.request_date,
                br.expected_return_date,
                br.status

             FROM borrow_requests br

             INNER JOIN resources r
                ON br.resource_id = r.resource_id

             INNER JOIN users requester
                ON br.requester_id = requester.user_id

             WHERE r.owner_id = ?

             ORDER BY br.request_date DESC

             LIMIT 10`,
            [userId]
        );


        // =================================================
        // 6. MY RESOURCES
        // =================================================

        const [myResources] = await pool.execute(
            `SELECT

                resource_id,
                resource_name,
                category,
                availability,
                condition_state,
                created_at

             FROM resources

             WHERE owner_id = ?

             ORDER BY created_at DESC

             LIMIT 10`,
            [userId]
        );


        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            dashboard: {

                user: users[0],

                statistics: {

                    resources: resourceStats[0],

                    requests: requestStats[0]

                },

                my_resources: myResources,

                active_borrowings: activeBorrowings,

                recent_requests: recentRequests

            }

        });


    } catch (error) {

        console.error(
            "Owner dashboard error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Failed to load owner dashboard.",

            error: error.message

        });

    }

};


module.exports = {
    getOwnerDashboard
};