"use strict";

const API_BASE_URL = "http://localhost:5000/api";

let allResources = [];


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    loadResources();

    setupSearch();

    setupLogout();

});


// =====================================================
// LOAD RESOURCES
// PUBLIC API - NO TOKEN REQUIRED
// =====================================================

async function loadResources() {

    const loadingMessage =
        document.getElementById("loadingMessage");

    try {

        const response = await fetch(
            `${API_BASE_URL}/resources`,
            {
                method: "GET"
            }
        );

        const data =
            await response.json();

        console.log(
            "Resources response:",
            data
        );


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load resources."
            );

        }


        allResources =
            Array.isArray(data.resources)
                ? data.resources
                : [];


        loadingMessage.style.display =
            "none";


        displayResources(
            allResources
        );


        populateCategories(
            allResources
        );

    }

    catch (error) {

        console.error(
            "Resource loading error:",
            error
        );

        loadingMessage.textContent =
            "Unable to load resources. Please try again.";

    }

}


// =====================================================
// DISPLAY RESOURCES
// =====================================================

function displayResources(resources) {

    const container =
        document.getElementById(
            "resourceContainer"
        );

    const emptyMessage =
        document.getElementById(
            "emptyMessage"
        );


    container.innerHTML = "";


    if (!resources || resources.length === 0) {

        emptyMessage.style.display =
            "block";

        return;
    }


    emptyMessage.style.display =
        "none";


    resources.forEach(function (resource) {

        const card =
            createResourceCard(resource);

        container.appendChild(card);

    });

}


// =====================================================
// CREATE RESOURCE CARD
// =====================================================

function createResourceCard(resource) {

    const card =
        document.createElement("div");

    card.className =
        "resource-card";


    const name =
        resource.resource_name ||
        "Unnamed Resource";


    const category =
        resource.category ||
        "General";


    const condition =
        resource.condition_state ||
        "Not specified";


    const status =
        resource.availability ||
        "Available";


    const image = getResourceImage(resource);


    card.innerHTML = `

        <div class="resource-card-image">

            <img
                src="../images/${escapeHTML(image)}"
                alt="${escapeHTML(name)}"
                onerror="this.onerror=null; this.src='../images/calc.png'"
            >

        </div>


        <div class="resource-card-content">

            <span class="resource-category">
                ${escapeHTML(category)}
            </span>


            <h2>
                ${escapeHTML(name)}
            </h2>


            <p>
                Condition:
                ${escapeHTML(condition)}
            </p>


            <p>
                Status:
                ${escapeHTML(status)}
            </p>


            <button
                class="details-button"
                data-resource-id="${resource.resource_id}"
            >
                View Details
            </button>

        </div>

    `;


    const button =
        card.querySelector(
            ".details-button"
        );


    button.addEventListener(
        "click",
        function () {

            const resourceId =
                this.dataset.resourceId;


            window.location.href =
                `resource-details.html?id=${resourceId}`;

        }
    );


    return card;

}


function getResourceImage(resource) {

    const availableImages = new Set([
        "arduino.png",
        "calc.png",
        "drawing_kit.png",
        "dsa_book.png",
        "java.png",
        "raspberry.png"
    ]);

    const imageAliases = {
        "multimeter.png": "calc.png",
        "micro_manual.png": "dsa_book.png",
        "default_resource.png": "dsa_book.png"
    };

    const imageName =
        String(resource.image || "")
            .split(/[\\/]/)
            .pop()
            .toLowerCase();

    if (availableImages.has(imageName)) {
        return imageName;
    }

    if (imageAliases[imageName]) {
        return imageAliases[imageName];
    }

    const category =
        String(resource.category || "").toLowerCase();

    if (category.includes("book")) {
        return "dsa_book.png";
    }

    if (category.includes("academic")) {
        return "drawing_kit.png";
    }

    if (category.includes("calculator") || category.includes("lab")) {
        return "calc.png";
    }

    if (category.includes("electronic")) {
        return "arduino.png";
    }

    return "arduino.png";

}


// =====================================================
// SEARCH
// =====================================================

function setupSearch() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterResources
        );

    }


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            filterResources
        );

    }

}


// =====================================================
// FILTER
// =====================================================

function filterResources() {

    const searchText =
        document
            .getElementById("searchInput")
            .value
            .toLowerCase()
            .trim();


    const category =
        document
            .getElementById("categoryFilter")
            .value;


    const filtered =
        allResources.filter(
            function (resource) {

                const name =
                    (
                        resource.resource_name ||
                        ""
                    ).toLowerCase();


                const resourceCategory =
                    resource.category ||
                    "";


                const matchesSearch =
                    name.includes(searchText);


                const matchesCategory =
                    !category ||
                    resourceCategory === category;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    displayResources(filtered);

}


// =====================================================
// CATEGORY DROPDOWN
// =====================================================

function populateCategories(resources) {

    const select =
        document.getElementById(
            "categoryFilter"
        );


    if (!select) {
        return;
    }


    const categories =
        new Set();


    resources.forEach(
        function (resource) {

            const category =
                resource.category;


            if (category) {

                categories.add(category);

            }

        }
    );


    categories.forEach(
        function (category) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category;


            option.textContent =
                category;


            select.appendChild(option);

        }
    );

}


// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "campusshare_token"
            );

            localStorage.removeItem(
                "campusshare_user"
            );


            window.location.href =
                "login.html";

        }
    );

}


// =====================================================
// HTML SAFETY
// =====================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value ?? "";


    return div.innerHTML;

}