const express = require("express");

const router = express.Router();

const { pool } = require("../config/database");

const authMiddleware =
    require("../middleware/authMiddleware");


// =====================================================
// STUDENT DASHBOARD
// GET /api/student/dashboard
// =====================================================

router.get(
    "/dashboard",
    authMiddleware,
    async (req, res) => {

        try {

            const userId =
                req.user.user_id;


            // -----------------------------------------
            // USER DETAILS
            // -----------------------------------------

            const [users] = await pool.execute(
                `
                SELECT
                    user_id,
                    full_name,
                    roll_number,
                    email,
                    mobile,
                    department,
                    year,
                    gender,
                    role,
                    student_id,
                    status,
                    created_at
                FROM users
                WHERE user_id = ?
                `,
                [userId]
            );


            if (users.length === 0) {

                return res.status(404).json({

                    success: false,

                    message: "User not found."

                });

            }


            // -----------------------------------------
            // MY REQUESTS COUNT
            // -----------------------------------------

            const [requestCount] =
                await pool.execute(
                    `
                    SELECT COUNT(*) AS total
                    FROM borrow_requests
                    WHERE requester_id = ?
                    `,
                    [userId]
                );


            // -----------------------------------------
            // PENDING REQUESTS COUNT
            // -----------------------------------------

            const [pendingCount] =
                await pool.execute(
                    `
                    SELECT COUNT(*) AS total
                    FROM borrow_requests
                    WHERE requester_id = ?
                    AND status = 'Pending'
                    `,
                    [userId]
                );


            // -----------------------------------------
            // ACTIVE BORROWINGS COUNT
            // -----------------------------------------

            const [borrowingCount] =
                await pool.execute(
                    `
                    SELECT COUNT(*) AS total
                    FROM borrowings
                    WHERE borrower_id = ?
                    AND status = 'Borrowed'
                    `,
                    [userId]
                );


            // -----------------------------------------
            // RETURNED BORROWINGS COUNT
            // -----------------------------------------

            const [returnedCount] =
                await pool.execute(
                    `
                    SELECT COUNT(*) AS total
                    FROM borrowings
                    WHERE borrower_id = ?
                    AND status = 'Returned'
                    `,
                    [userId]
                );


            // -----------------------------------------
            // AVAILABLE RESOURCES COUNT
            // -----------------------------------------

            const [resourceCount] =
                await pool.execute(
                    `
                    SELECT COUNT(*) AS total
                    FROM resources
                    WHERE availability = 'Available'
                    `
                );


            // -----------------------------------------
            // RECENT REQUESTS
            // -----------------------------------------

            const [recentRequests] =
                await pool.execute(
                    `
                    SELECT
                        br.request_id,
                        br.resource_id,
                        br.request_date,
                        br.expected_return_date,
                        br.message,
                        br.status,
                        r.resource_name,
                        r.category,
                        r.image
                    FROM borrow_requests br
                    LEFT JOIN resources r
                        ON br.resource_id = r.resource_id
                    WHERE br.requester_id = ?
                    ORDER BY br.request_date DESC
                    LIMIT 5
                    `,
                    [userId]
                );


            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            res.json({

                success: true,

                user: users[0],

                statistics: {

                    total_requests:
                        requestCount[0].total,

                    pending_requests:
                        pendingCount[0].total,

                    active_borrowings:
                        borrowingCount[0].total,

                    returned_borrowings:
                        returnedCount[0].total,

                    available_resources:
                        resourceCount[0].total

                },

                recent_requests:
                    recentRequests

            });

        }

        catch (error) {

            console.error(
                "Student dashboard error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load student dashboard.",

                error:
                    error.message

            });

        }

    }
);


module.exports = router;