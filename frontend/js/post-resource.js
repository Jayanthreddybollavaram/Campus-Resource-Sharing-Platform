const API_BASE_URL = window.CAMPUSSHARE_API_BASE_URL
    || (window.location.protocol === "file:"
        || window.location.hostname === "localhost"
        || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000"
        : "https://campus-resource-sharing-platform-nglx.onrender.com");


// =====================================================
// CHECK LOGIN
// =====================================================

const token = localStorage.getItem("token");

if (!token) {

    alert("Please login before posting a resource.");

    window.location.href = "login.html";

}


// =====================================================
// GET ELEMENTS
// =====================================================

const resourceForm =
    document.getElementById("resourceForm");

const imageInput =
    document.getElementById("resourceImage");

const imagePreview =
    document.getElementById("imagePreview");

const submitButton =
    document.getElementById("submitButton");

const messageBox =
    document.getElementById("messageBox");


// =====================================================
// IMAGE PREVIEW
// =====================================================

imageInput.addEventListener(
    "change",
    function () {

        const file = this.files[0];

        imagePreview.innerHTML = "";

        if (!file) {
            return;
        }


        // Check image type

        if (!file.type.startsWith("image/")) {

            showMessage(
                "Please select a valid image file.",
                true
            );

            imageInput.value = "";

            return;
        }


        // Check image size - maximum 5 MB

        if (file.size > 5 * 1024 * 1024) {

            showMessage(
                "Image size must be less than 5 MB.",
                true
            );

            imageInput.value = "";

            return;
        }


        // Preview image

        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                const image =
                    document.createElement("img");

                image.src =`../images/${resource.image}`;

                image.alt =
                    "Resource Preview";

                imagePreview.appendChild(
                    image
                );

            };


        reader.readAsDataURL(file);

    }
);


// =====================================================
// SUBMIT RESOURCE
// =====================================================

resourceForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        // ---------------------------------------------
        // GET FORM VALUES
        // ---------------------------------------------

        const resourceName =
            document
                .getElementById("resourceName")
                .value
                .trim();


        const category =
            document
                .getElementById("category")
                .value;


        const description =
            document
                .getElementById("description")
                .value
                .trim();


        const conditionState =
            document
                .getElementById("condition")
                .value;


        const borrowDuration =
            document
                .getElementById("borrowDuration")
                .value;


        const imageFile =
            imageInput.files[0];


        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (
            !resourceName ||
            !category ||
            !description ||
            !conditionState ||
            !borrowDuration
        ) {

            showMessage(
                "Please fill all required fields.",
                true
            );

            return;

        }


        // ---------------------------------------------
        // IMAGE VALIDATION
        // ---------------------------------------------

        let imageName = null;


        if (imageFile) {

            if (!imageFile.type.startsWith("image/")) {

                showMessage(
                    "Please select a valid image.",
                    true
                );

                return;

            }


            if (imageFile.size > 5 * 1024 * 1024) {

                showMessage(
                    "Image size must be less than 5 MB.",
                    true
                );

                return;

            }


            /*
             * IMPORTANT:
             *
             * At the current stage of the project,
             * we save the image filename in MySQL.
             *
             * The actual image must already exist
             * inside:
             *
             * frontend/images/
             */

            imageName =
                imageFile.name;

        }


        // ---------------------------------------------
        // DATA TO BACKEND
        // ---------------------------------------------

        const resourceData = {

            resource_name:
                resourceName,

            category:
                category,

            description:
                description,

            condition_state:
                conditionState,

            borrow_duration:
                borrowDuration,

            image:
                imageName

        };


        console.log(
            "Resource data:",
            resourceData
        );


        // ---------------------------------------------
        // DISABLE BUTTON
        // ---------------------------------------------

        submitButton.disabled = true;

        submitButton.textContent =
            "Posting...";


        showMessage(
            "Posting your resource...",
            false
        );


        // ---------------------------------------------
        // SEND TO BACKEND
        // ---------------------------------------------

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/resources`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        },

                        body:
                            JSON.stringify(
                                resourceData
                            )

                    }
                );


            // -----------------------------------------
            // READ RESPONSE
            // -----------------------------------------

            const data =
                await response.json();


            console.log(
                "Post resource response:",
                data
            );


            // -----------------------------------------
            // HANDLE ERROR
            // -----------------------------------------

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Failed to post resource."
                );

            }


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            showMessage(
                "Resource posted successfully!",
                false
            );


            // Reset form

            resourceForm.reset();

            imagePreview.innerHTML = "";


            // Redirect to Browse Resources

            setTimeout(
                function () {

                    window.location.href =
                        "browse.html";

                },
                1200
            );


        } catch (error) {

            console.error(
                "Post resource error:",
                error
            );


            // -----------------------------------------
            // TOKEN ERROR
            // -----------------------------------------

            if (
                error.message
                    .toLowerCase()
                    .includes("token")
            ) {

                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );


                alert(
                    "Your login session has expired. Please login again."
                );


                window.location.href =
                    "login.html";

                return;

            }


            // -----------------------------------------
            // NORMAL ERROR
            // -----------------------------------------

            showMessage(
                error.message,
                true
            );


            submitButton.disabled =
                false;

            submitButton.textContent =
                "Post Resource";

        }

    }
);


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(
    message,
    isError
) {

    messageBox.textContent =
        message;


    messageBox.className =
        isError
            ? "error"
            : "success";

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