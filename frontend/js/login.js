"use strict";

const API_BASE_URL = window.CAMPUSSHARE_API_BASE_URL
    || (window.location.protocol === "file:"
        ? "http://localhost:5000"
        : window.location.origin);

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const loginButton = document.getElementById("loginButton");
    const loginStatus = document.getElementById("loginStatus");
    const chipStudent = document.getElementById("chipStudent");
    const chipAdmin = document.getElementById("chipAdmin");

    // Quick Fill Chips
    if (chipStudent) {
        chipStudent.addEventListener("click", function () {
            document.getElementById("email").value = "rahul.cse@campusshare.edu";
            document.getElementById("password").value = "password123";
            const roleStudent = document.getElementById("roleStudent");
            if (roleStudent) roleStudent.checked = true;
            showStatus("Filled Student credentials (Rahul Sharma). Click Login.", "info");
        });
    }

    if (chipAdmin) {
        chipAdmin.addEventListener("click", function () {
            document.getElementById("email").value = "admin@campusshare.edu";
            document.getElementById("password").value = "admin123";
            const roleAdmin = document.getElementById("roleAdmin");
            if (roleAdmin) roleAdmin.checked = true;
            showStatus("Filled Administrator credentials. Click Login.", "info");
        });
    }

    if (!loginForm) return;

    loginForm.addEventListener("submit", handleLoginSubmit);

    async function handleLoginSubmit(event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const roleSelected = document.querySelector('input[name="role"]:checked')?.value || "Student";

        if (!email) {
            showStatus("Please enter your college email address.", "error");
            document.getElementById("email").focus();
            return;
        }

        if (!password) {
            showStatus("Please enter your password.", "error");
            document.getElementById("password").focus();
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";
        showStatus("Authenticating credentials...", "info");

        try {
            console.log("Sending login request to:", `${API_BASE_URL}/api/auth/login`);

            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();
            console.log("Login response:", data);

            if (!response.ok || !data.success) {
                showStatus(data.message || "Invalid email or password. Please check your credentials.", "error");
                loginButton.disabled = false;
                loginButton.textContent = "Login";
                return;
            }

            if (!data.token) {
                showStatus("Login succeeded but no token received. Please try again.", "error");
                loginButton.disabled = false;
                loginButton.textContent = "Login";
                return;
            }

            // Save tokens and user profile
            localStorage.setItem("token", data.token);
            localStorage.setItem("campusshare_token", data.token);

            if (data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("campusshare_user", JSON.stringify(data.user));
            }

            const userRole = (data.user && data.user.role) ? data.user.role : roleSelected;
            showStatus(`✓ Login successful! Welcome ${data.user?.full_name || ''}. Redirecting...`, "success");

            setTimeout(() => {
                if (userRole === "Administrator") {
                    window.location.href = "admin-dashboard.html";
                } else {
                    window.location.href = "student-dashboard.html";
                }
            }, 600);

        } catch (error) {
            console.error("Login fetch error:", error);
            showStatus(`⚠️ Connection failed. Backend server at ${API_BASE_URL} is not responding. Please make sure "node server.js" is running.`, "error");
            loginButton.disabled = false;
            loginButton.textContent = "Login";
        }
    }

    function showStatus(msg, type) {
        if (!loginStatus) {
            alert(msg);
            return;
        }
        loginStatus.textContent = msg;
        loginStatus.className = `login-alert show-${type}`;
    }
});