const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({
    path: [
        path.resolve(__dirname, "..", ".env"),
        path.resolve(__dirname, "..", "..", ".env"),
        path.resolve(__dirname, "..", "..", "..", ".env")
    ]
});
const requiredConfig = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
async function testDatabaseConnection() {
    const missingConfig = requiredConfig.filter((key) => process.env[key] === undefined);
    if (missingConfig.length > 0) {
        console.error("MySQL database configuration is incomplete.");
        console.error(`Set ${missingConfig.join(", ")} in a backend or project .env file.`);
        return false;
    }
    try {
        const connection = await pool.getConnection();
        console.log("MySQL database connected successfully.");
        connection.release();
        return true;
    } catch (error) {
        console.error("MySQL database connection failed.");
        console.error(error.message);
        return false;
    }
}
module.exports = {
    pool,
    testDatabaseConnection
};