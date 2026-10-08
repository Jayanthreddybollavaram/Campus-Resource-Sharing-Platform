// Administrator middleware
// This will verify administrator permissions later.

const adminMiddleware = (req, res, next) => {
    next();
};

module.exports = adminMiddleware;