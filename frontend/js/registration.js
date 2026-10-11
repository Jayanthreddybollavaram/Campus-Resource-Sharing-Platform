"use strict";

const API_BASE_URL = window.CAMPUSSHARE_API_BASE_URL
    || (window.location.protocol === "file:"
        ? "http://localhost:5000"
        : window.location.origin);

document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
    const msgBanner = document.getElementById("msgBanner");
    const registerButton = document.getElementById("registerButton");

    if (!registerForm) return;

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const rollNumber = document.getElementById("rollNumber").value.trim();
        const email = document.getElementById("email").value.trim().toLowerCase();
        const mobile = document.getElementById("mobile").value.trim();
        const department = document.getElementById("department").value;
        const year = document.getElementById("year").value;
        const gender = document.getElementById("gender").value;
        const password = document.getElementById("password").value;

        if (!fullName || !rollNumber || !email || !mobile || !department || !year || !gender || !password) {
            showBanner("Please fill all required fields.", true);
            return;
        }

        if (!/^[^\s@]+@gmail\.com$/.test(email)) {
            showBanner("Please register with a valid @gmail.com address.", true);
            return;
        }

        if (password.length < 8) {
            showBanner("Password must be at least 8 characters long.", true);
            return;
        }

        registerButton.disabled = true;
        registerButton.textContent = "Creating Account...";
        showBanner("Registering your student account...", false);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    full_name: fullName,
                    roll_number: rollNumber,
                    email: email,
                    mobile: mobile,
                    department: department,
                    year: year,
                    gender: gender,
                    password: password
                })
            });

            const data = await response.json().catch(() => ({
                success: false,
                message: "The server returned an invalid response. Please try again."
            }));

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Registration failed.");
            }

            showBanner("Account created successfully! Redirecting to login...", false);
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (error) {
            console.error("Registration error:", error);
            showBanner(
                error instanceof TypeError
                    ? "Unable to reach the server. Check that the backend is running and try again."
                    : error.message,
                true
            );
            registerButton.disabled = false;
            registerButton.textContent = "Register Account";
        }
    });

    function showBanner(message, isError) {
        if (!msgBanner) {
            alert(message);
            return;
        }
        msgBanner.textContent = message;
        msgBanner.className = isError ? "msg-banner error" : "msg-banner success";
    }
});
