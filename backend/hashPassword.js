const bcrypt = require("bcrypt");
const { pool } = require("./config/database");

async function hashExistingPasswords() {
    try {
        const [users] = await pool.execute(
            "SELECT user_id, password FROM users"
        );

        for (const user of users) {

            // Skip passwords that are already bcrypt hashes
            if (
                user.password.startsWith("$2a$") ||
                user.password.startsWith("$2b$") ||
                user.password.startsWith("$2y$")
            ) {
                console.log(
                    `User ${user.user_id}: already hashed`
                );
                continue;
            }

            const hashedPassword = await bcrypt.hash(
                user.password,
                10
            );

            await pool.execute(
                `UPDATE users
                 SET password = ?
                 WHERE user_id = ?`,
                [
                    hashedPassword,
                    user.user_id
                ]
            );

            console.log(
                `User ${user.user_id}: password hashed successfully`
            );
        }

        console.log("All passwords processed.");

    } catch (error) {

        console.error(
            "Password migration failed:",
            error
        );

    } finally {

        await pool.end();
    }
}

hashExistingPasswords();