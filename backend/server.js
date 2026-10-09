const express = require("express");
const cors = require("cors");
const path = require("path");

const { pool, testDatabaseConnection } = require("./config/database");

// Route imports
const authRoutes = require("./routes/authRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const requestRoutes = require("./routes/requestRoutes");
const borrowingRoutes = require("./routes/borrowingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const borrowRequestRoutes = require("./routes/borrowRequestRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// STATIC FILES & FRONTEND SERVING
// ===============================
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));
app.use("/images", express.static(path.join(frontendPath, "images")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root route serves homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "html/homepage.html"));
});

// ===============================
// HEALTH & DB STATUS ROUTES
// ===============================
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "CampusShare (ReSourceConnect) backend is running smoothly."
    });
});

app.get("/api/db-test", async (req, res) => {
    const connected = await testDatabaseConnection();
    if (connected) {
        res.json({
            success: true,
            message: "CampusShare database connection is active."
        });
    } else {
        res.status(500).json({
            success: false,
            message: "Database connection failed or MySQL is offline."
        });
    }
});

// ===============================
// API ROUTES
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/borrow-requests", borrowRequestRoutes);
app.use("/api/borrowings", borrowingRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);

// ===============================
// 404 HANDLER FOR API ROUTES
// ===============================
app.use("/api/*", (req, res) => {
    res.status(404).json({
        success: false,
        message: `API route ${req.originalUrl} not found.`
    });
});

// Fallback for HTML5 client navigation
app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "html/homepage.html"));
});

// ===============================
// ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
    console.error("Global Express Error:", err.stack);
    res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message
    });
});

// ===============================
// START SERVER
// ===============================
async function startServer() {
    console.log("==================================================");
    console.log("Starting CampusShare (ReSourceConnect) Platform...");
    console.log("==================================================");

    const databaseConnected = await testDatabaseConnection();
    if (!databaseConnected) {
        console.warn("⚠️  Warning: MySQL database is offline or not configured yet.");
        console.warn("ℹ️  The API server will continue running to serve static pages and frontend.");
    }

    const server = app.listen(PORT, () => {
        console.log("--------------------------------------------------");
        console.log("🎓 CampusShare Web Server Running!");
        console.log(`🌐 Website URL:  http://localhost:${PORT}`);
        console.log(`📦 Browse:       http://localhost:${PORT}/html/browse.html`);
        console.log(`🔑 Login:        http://localhost:${PORT}/html/login.html`);
        console.log(`📊 API Test:     http://localhost:${PORT}/api/test`);
        console.log("--------------------------------------------------");
    });

    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            console.error(`\n❌ Error: Port ${PORT} is already in use by another running process.`);
            console.log(`👉 To fix: Close any existing terminal running "node server.js", or run:`);
            console.log(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
        } else {
            console.error("Server startup error:", error);
        }
    });
}

startServer();