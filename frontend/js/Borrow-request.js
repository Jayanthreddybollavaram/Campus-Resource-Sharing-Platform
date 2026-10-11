const API_BASE_URL = `${window.CAMPUSSHARE_API_BASE_URL
    || (window.location.protocol === "file:"
        || window.location.hostname === "localhost"
        || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000"
        : "https://campus-resource-sharing-platform-nglx.onrender.com")}/api`;

let resourceId = null;


document.addEventListener("DOMContentLoaded", loadPage);

function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function setReturnDateLimits() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestReturnDate = new Date(today);
    latestReturnDate.setDate(latestReturnDate.getDate() + 30);

    const returnDateInput = document.getElementById("returnDate");
    returnDateInput.min = formatDateInput(today);
    returnDateInput.max = formatDateInput(latestReturnDate);
}


async function loadPage() {

    setReturnDateLimits();

    const params =
        new URLSearchParams(window.location.search);

    resourceId = params.get("resource_id");


    if (!resourceId) {

        showMessage(
            "Resource ID is missing.",
            true
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/resources/${resourceId}`
            );

        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load resource."
            );
        }


        document.getElementById("resourceName")
            .textContent =
            data.resource.resource_name;


        document.getElementById("resourceCategory")
            .textContent =
            data.resource.category;


    } catch (error) {

        console.error(error);

        showMessage(
            "Failed to load resource.",
            true
        );
    }


    document.getElementById("borrowForm")
        .addEventListener(
            "submit",
            submitBorrowRequest
        );
}


async function submitBorrowRequest(event) {

    event.preventDefault();


    const token =
        localStorage.getItem("token");


    if (!token) {

        showMessage(
            "Please login before submitting a borrow request.",
            true
        );

        return;
    }


    const expectedReturnDate =
        document.getElementById("returnDate").value;


    const message =
        document.getElementById("message").value.trim();


    if (!expectedReturnDate || !message) {

        showMessage(
            "Please fill all fields.",
            true
        );

        return;
    }


    const submitButton =
        document.getElementById("submitButton");


    submitButton.disabled = true;

    submitButton.textContent =
        "Submitting...";


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/requests`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        resource_id:
                            Number(resourceId),

                        expected_return_date:
                            expectedReturnDate,

                        message:
                            message

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to submit request."
            );
        }


        showMessage(
            `Borrow request submitted successfully. Request ID: ${data.request_id}`,
            false
        );


        setTimeout(
            () => {

                window.location.href =
                    "my_requests.html";

            },
            1500
        );


    } catch (error) {

        console.error(
            "Borrow request error:",
            error
        );


        showMessage(
            error.message,
            true
        );


        submitButton.disabled = false;

        submitButton.textContent =
            "Submit Borrow Request";
    }
}


function showMessage(message, error) {

    const box =
        document.getElementById("messageBox");

    box.textContent = message;

    box.className =
        error ? "error" : "success";
}