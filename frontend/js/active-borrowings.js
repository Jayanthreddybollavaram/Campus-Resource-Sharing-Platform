"use strict";

const API_BASE_URL = `${window.CAMPUSSHARE_API_BASE_URL
    || (window.location.protocol === "file:"
        ? "http://localhost:5000"
        : window.location.origin)}/api`;

document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("token") || localStorage.getItem("campusshare_token");
    if (!token) {
        alert("Please login first to view your active borrowings.");
        window.location.href = "login.html";
        return;
    }

    loadActiveBorrowings();
});

async function loadActiveBorrowings() {
    const token = localStorage.getItem("token") || localStorage.getItem("campusshare_token");
    const tbody = document.querySelector(".table-card table tbody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">Loading borrowings...</td></tr>`;

    try {
        const response = await fetch(`${API_BASE_URL}/borrowings`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        console.log("Borrowings response:", data);

        if (!response.ok || !data.success) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("campusshare_token");
                window.location.href = "login.html";
                return;
            }
            throw new Error(data.message || "Failed to load borrowings.");
        }

        const borrowings = Array.isArray(data.borrowings) ? data.borrowings : [];

        if (borrowings.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px; color: #64748b;">No active borrowings found. Visit <a href="browse.html" style="color:#2563eb; font-weight:600;">Browse Resources</a> to borrow items.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";
        borrowings.forEach(item => {
            const tr = document.createElement("tr");

            const isBorrowed = item.status === "Borrowed";
            const statusClass = item.status === "Returned" ? "status-returned" : "status-borrowed";

            tr.innerHTML = `
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="../images/${item.image || 'drawing_kit.png'}" onerror="this.src='../images/drawing_kit.png'" style="width:36px; height:36px; border-radius:6px; object-fit:cover;">
                        <strong>${escapeHTML(item.resource_name || 'Resource #' + item.resource_id)}</strong>
                    </div>
                </td>
                <td>${escapeHTML(item.owner_name || 'Resource Owner')}</td>
                <td>${formatDate(item.borrow_date)}</td>
                <td>${formatDate(item.due_date)}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${escapeHTML(item.status)}
                    </span>
                </td>
                <td>
                    ${isBorrowed ? `
                        <button class="return-btn small-btn" onclick="returnResourceItem(${item.borrowing_id})">
                            Return Resource
                        </button>
                    ` : `
                        <span style="color:#10b981; font-weight:500; font-size:13px;">✓ Completed</span>
                    `}
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error loading borrowings:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color:#ef4444;">${error.message}</td></tr>`;
    }
}

async function returnResourceItem(borrowingId) {
    if (!confirm("Are you sure you want to return this resource to its owner?")) {
        return;
    }

    const token = localStorage.getItem("token") || localStorage.getItem("campusshare_token");

    try {
        const response = await fetch(`${API_BASE_URL}/borrowings/${borrowingId}/return`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to return resource.");
        }

        alert("Resource returned successfully! The item is now marked Available for other campus peers.");
        loadActiveBorrowings();

    } catch (error) {
        console.error("Return error:", error);
        alert(error.message);
    }
}

function formatDate(dateString) {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
