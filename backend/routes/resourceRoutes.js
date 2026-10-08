const express = require("express");

const {
    createResource,
    getAllResources,
    getResourceById,
    updateResource,
    deleteResource
} = require("../controllers/resourceController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// PUBLIC ROUTES
// =====================================================

router.get(
    "/",
    getAllResources
);

router.get(
    "/:id",
    getResourceById
);


// =====================================================
// PROTECTED ROUTES
// =====================================================

router.post(
    "/",
    authMiddleware,
    createResource
);

router.put(
    "/:id",
    authMiddleware,
    updateResource
);

router.delete(
    "/:id",
    authMiddleware,
    deleteResource
);


module.exports = router;