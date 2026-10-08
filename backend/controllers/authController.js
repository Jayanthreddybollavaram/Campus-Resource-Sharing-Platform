const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");


// =====================================================
// REGISTER USER
// POST /api/auth/register
// =====================================================

const registerUser = async (req, res) => {

    try {

        const {
            full_name,
            roll_number,
            email,
            mobile,
            department,
            year,
            gender,
            password
        } = req.body;

        const normalizedEmail =
            typeof email === "string" ? email.trim().toLowerCase() : "";

        // -------------------------------------------------
        // VALIDATE REQUIRED FIELDS
        // -------------------------------------------------

        if (
            !full_name ||
            !roll_number ||
            !email ||
            !mobile ||
            !department ||
            !year ||
            !gender ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: "Please provide all required fields."
            });

        }


        // -------------------------------------------------
        // VALIDATE EMAIL
        // -------------------------------------------------

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {

            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });

        }

        if (!/^[^\s@]+@gmail\.com$/.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please register with a valid @gmail.com address."
            });
        }


        // -------------------------------------------------
        // VALIDATE PASSWORD
        // -------------------------------------------------

        if (password.length < 8) {

            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });

        }


        // -------------------------------------------------
        // CHECK DUPLICATE EMAIL OR ROLL NUMBER
        // -------------------------------------------------

        const [existingUsers] = await pool.execute(

            `SELECT
                user_id,
                email,
                roll_number
             FROM users
             WHERE email = ?
                OR roll_number = ?
             LIMIT 1`,

            [
                normalizedEmail,
                roll_number
            ]

        );


        if (existingUsers.length > 0) {

            if (
                existingUsers[0].email === normalizedEmail
            ) {

                return res.status(409).json({
                    success: false,
                    message: "Email is already registered."
                });

            }


            if (
                existingUsers[0].roll_number === roll_number
            ) {

                return res.status(409).json({
                    success: false,
                    message: "Roll number is already registered."
                });

            }

        }


        // -------------------------------------------------
        // HASH PASSWORD
        // -------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // -------------------------------------------------
        // DEFAULT ROLE
        // -------------------------------------------------

        const role = "Student";

        const status = "Active";


        // -------------------------------------------------
        // STUDENT ID
        // -------------------------------------------------

        const student_id =
            roll_number;


        // -------------------------------------------------
        // INSERT USER
        // -------------------------------------------------

        const [result] = await pool.execute(

            `INSERT INTO users
            (
                full_name,
                roll_number,
                email,
                mobile,
                department,
                year,
                gender,
                password,
                role,
                student_id,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

            [
                full_name,
                roll_number,
                normalizedEmail,
                mobile,
                department,
                year,
                gender,
                hashedPassword,
                role,
                student_id,
                status
            ]

        );


        // -------------------------------------------------
        // REGISTRATION SUCCESS
        // -------------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Registration successful. Please login.",

            user_id:
                result.insertId

        });


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Registration failed.",

            error:
                error.message

        });

    }

};



// =====================================================
// LOGIN USER
// POST /api/auth/login
// =====================================================

const loginUser = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required."

            });

        }


        // -------------------------------------------------
        // FIND USER
        // -------------------------------------------------

        const [users] = await pool.execute(

            `SELECT
                user_id,
                full_name,
                roll_number,
                email,
                mobile,
                department,
                year,
                gender,
                password,
                role,
                student_id,
                status,
                created_at
             FROM users
             WHERE email = ?
             LIMIT 1`,

            [email]

        );


        if (users.length === 0) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }


        const user =
            users[0];


        // -------------------------------------------------
        // CHECK ACCOUNT STATUS
        // -------------------------------------------------

        if (
            user.status &&
            user.status.toLowerCase() !== "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account is not active."

            });

        }


        // -------------------------------------------------
        // COMPARE PASSWORD (Supports Bcrypt & Plain Seeded Passwords)
        // -------------------------------------------------

        let passwordMatch = false;
        if (user.password === password) {
            passwordMatch = true;
        } else {
            try {
                passwordMatch = await bcrypt.compare(password, user.password);
            } catch (bcryptErr) {
                passwordMatch = false;
            }
        }

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }


        // -------------------------------------------------
        // CREATE JWT
        // -------------------------------------------------

        const token =
            jwt.sign(

                {
                    user_id: user.user_id,
                    email: user.email,
                    role: user.role
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "1d"
                }

            );


        // -------------------------------------------------
        // REMOVE PASSWORD FROM RESPONSE
        // -------------------------------------------------

        delete user.password;


        // -------------------------------------------------
        // LOGIN SUCCESS
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            token,

            user

        });


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Login failed.",

            error:
                error.message

        });

    }

};



// =====================================================
// GET CURRENT USER
// GET /api/auth/me
// =====================================================

const getCurrentUser = async (req, res) => {

    try {

        // ---------------------------------------------
        // USER ID COMES FROM JWT
        // ---------------------------------------------

        const userId =
            req.user.user_id;


        // ---------------------------------------------
        // GET USER
        // ---------------------------------------------

        const [users] = await pool.execute(

            `SELECT
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
             LIMIT 1`,

            [userId]

        );


        if (users.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        // ---------------------------------------------
        // SUCCESS
        // ---------------------------------------------

        return res.status(200).json({

            success: true,

            user: users[0]

        });


    } catch (error) {

        console.error(
            "Get current user error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve user information.",

            error:
                error.message

        });

    }

};



// =====================================================
// EXPORT
// =====================================================

module.exports = {

    registerUser,
    loginUser,
    getCurrentUser

};