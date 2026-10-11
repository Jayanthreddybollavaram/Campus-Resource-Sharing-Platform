"use strict";

const API_BASE_URL = `${window.CAMPUSSHARE_API_BASE_URL
    || (window.location.protocol === "file:"
        ? "http://localhost:5000"
        : window.location.origin)}/api`;

let allSentRequests = [];
let allReceivedRequests = [];
let currentTab = "sent"; // "sent" or "received"

document.addEventListener("DOMContentLoaded", function () {
    const authenticated = checkAuthentication();
    if (!authenticated) {
        return;
    }

    setupTabs();
    loadMyRequests();
    loadReceivedRequests();
    setupStatusFilter();
    setupLogout();
});

function checkAuthentication() {
    const token = localStorage.getItem("token") || localStorage.getItem("campusshare_token");
    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return false;
    }
    return true;
}

function setupTabs() {
    const filterSection = document.querySelector(".filter-section");
    if (!filterSection) return;

    const tabContainer = document.createElement("div");
    tabContainer.className = "tab-container";
    tabContainer.style.display = "flex";
    tabContainer.style.gap = "12px";
    tabContainer.style.marginBottom = "16px";

    tabContainer.innerHTML = `
        <button id="tabSent" class="tab-btn active-tab" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #2563eb; background: #2563eb; color: #fff; cursor: pointer; font-weight: 600;">
            📤 Requests Sent by Me
        </button>
        <button id="tabReceived" class="tab-btn" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; cursor: pointer; font-weight: 600;">
            📥 Incoming Requests for My Items
        </button>
    `;

    filterSection.parentNode.insertBefore(tabContainer, filterSection);

    document.getElementById("tabSent").addEventListener("click", function () {
        currentTab = "sent";
        this.style.background = "#2563eb";
        this.style.color = "#fff";
        this.style.borderColor = "#2563eb";
        const recvBtn = document.getElementById("tabReceived");
        recvBtn.style.background = "#f8fafc";
        recvBtn.style.color = "#475569";
        recvBtn.style.borderColor = "#cbd5e1";
        filterAndDisplay();
    });

    document.getElementById("tabReceived").addEventListener("click", function () {
        currentTab = "received";
        this.style.background = "#2563eb";
        this.style.color = "#fff";
        this.style.borderColor = "#2563eb";
        const sentBtn = document.getElementById("tabSent");
        sentBtn.style.background = "#f8fafc";
        sentBtn.style.color = "#475569";
        sentBtn.style.borderColor = "#cbd5e1";
        filterAndDisplay();
    });
}

async function loadMyRequests() {
    const token = localStorage.getItem("token") || localStorage.getItem("campusshare_token");
    const loadingMessage = document.getElementById("loadingMessage");

    try {
        const response = await fetch(`${API_BASE_URL}/requests`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            if (response.status === 401) {
                localStorage.clear();
                window.location.href = "login.html";
                return;
            }
            throw new Error(data.message || "Failed to load requests.");
        }

        allSentRequests = Array.isArray(data.requests) ? data.requests : [];
        if (loadingMessage) loadingMessage.style.display = "none";
        filterAndDisplay();
    } catch (error) {
        console.error("My requests error:", error);
        if (loadingMessage) loadingMessage.textContent = error.message;
    }
}

async function loadReceivedRequests() {
    const token = localStorage.getItem("token") || localStorage.getItem("campusshare_token");

    try {
        const response = await fetch(`${API_BASE_URL}/requests/received`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        if (response.ok && data.success) {
            allReceivedRequests = Array.isArray(data.requests) ? data.requests : [];
            filterAndDisplay();
        }
    } catch (error) {
        console.error("Received requests error:", error);
    }
}

function setupStatusFilter() {
    const filter = document.getElementById("statusFilter");
    if (!filter) return;
    filter.addEventListener("change", filterAndDisplay);
}

function filterAndDisplay() {
    const status = document.getElementById("statusFilter") ? document.getElementById("statusFilter").value : "";
    const list = currentTab === "sent" ? allSentRequests : allReceivedRequests;

    const filtered = status
        ? list.filter(r => r.status && r.status.toLowerCase() === status.toLowerCase())
        : list;

    displayRequests(filtered, currentTab);
}

function displayRequests(requests, tab) {
    const container = document.getElementById("requestsContainer") || document.getElementById("requestsList") || document.querySelector(".requests-grid") || document.querySelector(".table-card");
    if (!container) return;

    if (requests.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color:#64748b;">No ${tab === 'sent' ? 'sent requests' : 'incoming requests'} found.</div>`;
        return;
    }

    let html = `<div style="display: grid; gap: 16px; margin-top: 16px;">`;

    requests.forEach(req => {
        const isPending = req.status === "Pending";
        const statusColors = {
            Pending: "background:#fef3c7; color:#d97706;",
            Approved: "background:#dcfce7; color:#16a34a;",
            Rejected: "background:#fee2e2; color:#dc2626;",
            Cancelled: "background:#f1f5f9; color:#64748b;",
            Returned: "background:#e0e7ff; color:#4338ca;"
        };

        const badgeStyle = statusColors[req.status] || "background:#f1f5f9; color:#334155;";

        html += `
            <div style="background:#fff; border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06); border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                <div style="flex:1; min-width:250px;">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                        <h3 style="margin:0; font-size:18px; color:#0f172a;">${escapeHTML(req.resource_name || 'Resource #' + req.resource_id)}</h3>
                        <span style="display:inline-block; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:600; ${badgeStyle}">
                            ${escapeHTML(req.status)}
                        </span>
                    </div>
                    <p style="margin:4px 0; color:#475569; font-size:14px;">
                        ${tab === 'sent' ? `Owner: <strong>${escapeHTML(req.owner_name || 'Resource Sharer')}</strong>` : `Requester: <strong>${escapeHTML(req.requester_name || req.requester_email || 'Student')}</strong>`}
                    </p>
                    <p style="margin:4px 0; color:#64748b; font-size:13px;">
                        Expected Return: <strong>${formatDate(req.expected_return_date)}</strong>
                    </p>
                    ${req.message ? `<p style="margin:6px 0 0 0; background:#f8fafc; padding:8px 12px; border-radius:6px; font-size:13px; color:#334155;"><em>"${escapeHTML(req.message)}"</em></p>` : ''}
                </div>

                <div style="display:flex; gap:10px; align-items:center;">
                    ${tab === 'sent' && isPending ? `
                        <button onclick="cancelRequestItem(${req.request_id})" style="background:#ef4444; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer;">
                            Cancel Request
                        </button>
                    ` : ''}

                    ${tab === 'received' && isPending ? `
                        <button onclick="approveRequestItem(${req.request_id})" style="background:#16a34a; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer;">
                            ✓ Approve
                        </button>
                        <button onclick="rejectRequestItem(${req.request_id})" style="background:#ef4444; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer;">
                            ✕ Reject
                        </button>
                    ` : ''}

                    ${req.status === 'Approved' ? `
                        <a href="active-borrowings.html" style="background:#2563eb; color:#fff; text-decoration:none; padding:8px 16px; border-radius:6px; font-weight:600; font-size:13px;">
                            View in Active Borrowings →
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

async function approveRequestItem(requestId) {
    if (!confirm("Approve this borrow request? The item will be marked Borrowed.")) return;
    const token = localStorage.getItem("token") || localStorage.getItem("campusshare_token");

    try {
        const res = await fetch(`${API_BASE_URL}/requests/${requestId}/approve`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Approval failed.");

        alert("Request approved successfully! Borrowing record created.");
        loadReceivedRequests();
        loadMyRequests();
    } catch (e) {
        alert(e.message);
    }
}

async function rejectRequestItem(requestId) {
    if (!confirm("Decline this borrow request?")) return;
    const token = localStorage.getItem("token") || localStorage.getItem("campusshare_token");

    try {
        const res = await fetch(`${API_BASE_URL}/requests/${requestId}/reject`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Rejection failed.");

        alert("Request declined.");
        loadReceivedRequests();
    } catch (e) {
        alert(e.message);
    }
}

async function cancelRequestItem(requestId) {
    if (!confirm("Cancel this request?")) return;
    const token = localStorage.getItem("token") || localStorage.getItem("campusshare_token");

    try {
        const res = await fetch(`${API_BASE_URL}/requests/${requestId}/cancel`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Cancellation failed.");

        alert("Request cancelled.");
        loadMyRequests();
    } catch (e) {
        alert(e.message);
    }
}

function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
}

function setupLogout() {
    const btn = document.getElementById("logoutButton");
    if (btn) {
        btn.addEventListener("click", () => {
            localStorage.clear();
            window.location.href = "login.html";
        });
    }
}

function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}