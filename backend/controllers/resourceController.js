const { pool } = require("../config/database");

// =====================================================
// CREATE RESOURCE
// POST /api/resources
// =====================================================
// =====================================================
// CREATE RESOURCE
// POST /api/resources
// =====================================================

const createResource = async (req, res) => {

    try {

        const {
            resource_name,
            category,
            description,
            condition_state,
            borrow_duration,
            image
        } = req.body;


        // Get owner from JWT
        const owner_id = req.user.user_id;


        // Validate required fields
        if (
            !resource_name ||
            !category ||
            !description ||
            !condition_state ||
            !borrow_duration
        ) {

            return res.status(400).json({
                success: false,
                message: "Please provide all required resource fields."
            });

        }


        const [result] = await pool.execute(

            `INSERT INTO resources
            (
                resource_name,
                category,
                description,
                condition_state,
                owner_id,
                availability,
                borrow_duration,
                image
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,

            [
                resource_name,
                category,
                description,
                condition_state,
                owner_id,
                "Available",
                borrow_duration,
                image || null
            ]

        );


        return res.status(201).json({

            success: true,

            message: "Resource added successfully.",

            resource_id: result.insertId

        });


    } catch (error) {

        console.error(
            "Create resource error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to add resource.",

            error: error.message

        });

    }

};


// =====================================================
// GET ALL RESOURCES
// GET /api/resources
// =====================================================

const getAllResources = async (req, res) => {
    try {

        const [resources] = await pool.execute(
            `SELECT
                r.resource_id,
                r.resource_name,
                r.category,
                r.description,
                r.condition_state,
                r.owner_id,
                u.full_name AS owner_name,
                r.availability,
                r.borrow_duration,
                r.image,
                r.created_at
             FROM resources r
             LEFT JOIN users u
                ON r.owner_id = u.user_id
             ORDER BY r.created_at DESC`
        );

        return res.status(200).json({
            success: true,
            count: resources.length,
            resources
        });

    } catch (error) {
        console.error("Get resources error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve resources.",
            error: error.message
        });
    }
};


// =====================================================
// GET SINGLE RESOURCE
// GET /api/resources/:id
// =====================================================

const getResourceById = async (req, res) => {
    try {

        const resourceId = req.params.id;

        const [resources] = await pool.execute(
            `SELECT
                r.resource_id,
                r.resource_name,
                r.category,
                r.description,
                r.condition_state,
                r.owner_id,
                u.full_name AS owner_name,
                r.availability,
                r.borrow_duration,
                r.image,
                r.created_at
             FROM resources r
             LEFT JOIN users u
                ON r.owner_id = u.user_id
             WHERE r.resource_id = ?
             LIMIT 1`,
            [resourceId]
        );

        if (resources.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });
        }

        return res.status(200).json({
            success: true,
            resource: resources[0]
        });

    } catch (error) {
        console.error("Get resource error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve resource.",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE RESOURCE
// PUT /api/resources/:id
// =====================================================

const updateResource = async (req, res) => {
    try {

        const resourceId = req.params.id;
        const userId = req.user.user_id;

        const {
            resource_name,
            category,
            description,
            condition_state,
            availability,
            borrow_duration
        } = req.body;

        // Check resource
        const [resources] = await pool.execute(
            `SELECT owner_id
             FROM resources
             WHERE resource_id = ?
             LIMIT 1`,
            [resourceId]
        );

        if (resources.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });
        }

        // Check owner
        if (resources[0].owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own resources."
            });
        }

        await pool.execute(
            `UPDATE resources
             SET
                resource_name = ?,
                category = ?,
                description = ?,
                condition_state = ?,
                availability = ?,
                borrow_duration = ?
             WHERE resource_id = ?`,
            [
                resource_name,
                category,
                description,
                condition_state,
                availability || "Available",
                borrow_duration,
                resourceId
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Resource updated successfully."
        });

    } catch (error) {
        console.error("Update resource error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update resource.",
            error: error.message
        });
    }
};


// =====================================================
// DELETE RESOURCE
// DELETE /api/resources/:id
// =====================================================

const deleteResource = async (req, res) => {
    try {

        const resourceId = req.params.id;
        const userId = req.user.user_id;

        // Check resource
        const [resources] = await pool.execute(
            `SELECT owner_id
             FROM resources
             WHERE resource_id = ?
             LIMIT 1`,
            [resourceId]
        );

        if (resources.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });
        }

        // Check owner
        if (resources[0].owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own resources."
            });
        }

        await pool.execute(
            `DELETE FROM resources
             WHERE resource_id = ?`,
            [resourceId]
        );

        return res.status(200).json({
            success: true,
            message: "Resource deleted successfully."
        });

    } catch (error) {
        console.error("Delete resource error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete resource.",
            error: error.message
        });
    }
};


module.exports = {
    createResource,
    getAllResources,
    getResourceById,
    updateResource,
    deleteResource
};