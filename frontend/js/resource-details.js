const API_BASE_URL = "http://localhost:5000";


// =====================================================
// GET RESOURCE ID
// =====================================================

const params = new URLSearchParams(
    window.location.search
);

const resourceId = params.get("id");

console.log("Resource ID:", resourceId);


// =====================================================
// PAGE ELEMENTS
// =====================================================

const loading =
    document.getElementById("loading");

const resourceContainer =
    document.getElementById("resourceContainer");


// =====================================================
// CHECK RESOURCE ID
// =====================================================

if (!resourceId) {

    loading.textContent =
        "Resource ID was not provided.";

} else {

    loadResource();

}


// =====================================================
// LOAD RESOURCE
// PUBLIC API
// =====================================================

async function loadResource() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/resources/${resourceId}`
        );


        const data = await response.json();


        console.log(
            "Resource details response:",
            data
        );


        if (!response.ok || !data.success) {

            loading.textContent =
                data.message ||
                "Resource not found.";

            return;

        }


        displayResource(
            data.resource
        );


    } catch (error) {

        console.error(
            "Resource details error:",
            error
        );


        loading.textContent =
            "Unable to connect to CampusShare backend.";

    }

}


// =====================================================
// DISPLAY RESOURCE
// =====================================================

function displayResource(resource) {

    loading.style.display =
        "none";


    resourceContainer.style.display =
        "grid";


    document.getElementById(
        "resourceName"
    ).textContent =
        resource.resource_name;


    document.getElementById(
        "resourceCategory"
    ).textContent =
        resource.category;


    document.getElementById(
        "resourceDescription"
    ).textContent =
        resource.description ||
        "No description available.";


    document.getElementById(
        "resourceCondition"
    ).textContent =
        resource.condition_state ||
        "Not specified";


    document.getElementById(
        "resourceAvailability"
    ).textContent =
        resource.availability ||
        "Unknown";


    document.getElementById(
        "borrowDuration"
    ).textContent =
        resource.borrow_duration ||
        "Not specified";


    document.getElementById(
        "ownerName"
    ).textContent =
        resource.owner_name ||
        "Unknown";


    // =================================================
    // IMAGE
    // =================================================

    const image =
        document.getElementById(
            "resourceImage"
        );


    if (resource.image) {

        image.src =
            `../images/${resource.image}`;

        image.onerror =
            function () {

                this.src =
                    "../images/default.png";

            };

    } else {

        image.src =
            "../images/default.png";

    }


    // =================================================
    // REQUEST BUTTON
    // =================================================

    const requestButton =
        document.getElementById(
            "requestButton"
        );


    if (!requestButton) {
        return;
    }


    // Resource unavailable

    if (
        resource.availability &&
        resource.availability.toLowerCase() !==
        "available"
    ) {

        requestButton.disabled =
            true;

        requestButton.textContent =
            "Currently Unavailable";

        return;

    }


    // =================================================
    // CHECK LOGIN ONLY WHEN REQUESTING
    // =================================================

    requestButton.addEventListener(
        "click",
        function () {

            const token =
                localStorage.getItem(
                    "token"
                );


            if (!token) {

                alert(
                    "Please login to request this resource."
                );

                window.location.href =
                    "login.html";

                return;

            }


            requestResource(
                resource.resource_id,
                resource.owner_id
            );

        }
    );

}


// =====================================================
// REQUEST RESOURCE
// =====================================================

function requestResource(
    resourceId,
    ownerId
) {

    window.location.href =
        `borrow-request.html?resource_id=${resourceId}&owner_id=${ownerId}`;

}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "user"
    );


    window.location.href =
        "login.html";

}