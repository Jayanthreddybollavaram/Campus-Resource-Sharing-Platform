const API_BASE_URL = "http://localhost:5000";


// =====================================================
// CHECK LOGIN
// =====================================================

const token = localStorage.getItem("token");

if (!token) {

    window.location.href = "login.html";

}


// =====================================================
// LOAD STUDENT DASHBOARD
// =====================================================

async function loadStudentDashboard() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/student/dashboard`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );


        const data = await response.json();

        console.log("Student dashboard:", data);


        if (!response.ok || !data.success) {

            alert(
                data.message ||
                "Failed to load student dashboard."
            );

            return;
        }


        // =============================================
        // USER INFORMATION
        // =============================================

        const user = data.user;

        const welcomeMessage =
            document.getElementById("welcomeMessage");


        if (welcomeMessage && user) {

            welcomeMessage.textContent =
                `Welcome back, ${user.full_name}!`;

        }

        const profileFields = {
            studentId: user.student_id || "Not provided",
            studentRollNumber: user.roll_number || "Not provided",
            studentDepartment: user.department || "Not provided",
            studentYear: user.year || "Not provided"
        };

        Object.entries(profileFields).forEach(([id, value]) => {
            const field = document.getElementById(id);

            if (field) {
                field.textContent = value;
            }
        });

        const studentInfo = document.getElementById("studentInfo");

        if (studentInfo && user) {
            studentInfo.textContent = [
                user.roll_number,
                user.department,
                user.year
            ].filter(Boolean).join(" · ");
        }


        // =============================================
        // STATISTICS
        // =============================================

        const statistics = data.statistics || {};

        const statisticFields = {
            totalRequests: statistics.total_requests,
            pendingRequests: statistics.pending_requests,
            activeBorrowings: statistics.active_borrowings,
            availableResources: statistics.available_resources
        };

        Object.entries(statisticFields).forEach(([id, value]) => {
            const field = document.getElementById(id);

            if (field) {
                field.textContent = value ?? 0;
            }
        });


        // =============================================
        // RECENT REQUESTS
        // =============================================

        loadRecentRequests(
            data.recent_requests
        );


    }

    catch (error) {

        console.error(
            "Student dashboard error:",
            error
        );

        alert(
            "Unable to connect to CampusShare backend."
        );

    }

}


// =====================================================
// RECENT REQUESTS
// =====================================================

function loadRecentRequests(requests) {

    const section =
        document.getElementById("recentRequests");


    if (!section) {
        return;
    }


    section.replaceChildren();


    if (!requests || requests.length === 0) {

        const message =
            document.createElement("p");

        message.textContent =
            "No recent requests.";

        section.appendChild(message);

        return;
    }


    requests.forEach(request => {

        const row =
            document.createElement("div");

        row.className = "item-row";


        const icon =
            document.createElement("div");

        icon.className = "item-icon";

        icon.textContent = "📚";


        const info =
            document.createElement("div");

        info.className = "item-info";


        const title =
            document.createElement("h3");

        title.textContent =
            request.resource_name;


        const details =
            document.createElement("p");

        details.textContent =
            `${request.category} • ${request.status}`;


        info.appendChild(title);

        info.appendChild(details);


        const status =
            document.createElement("span");

        status.className =
            "request-count";

        status.textContent =
            request.status;


        row.appendChild(icon);

        row.appendChild(info);

        row.appendChild(status);


        section.appendChild(row);

    });

}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    window.location.href =
        "login.html";

}


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    loadStudentDashboard
);