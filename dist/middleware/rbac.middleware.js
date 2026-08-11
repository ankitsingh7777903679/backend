"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = exports.checkRole = void 0;
const AppError_1 = require("../utils/AppError");
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            throw new AppError_1.AppError("Access denied. You do not have permission for this action.", 403);
        }
        next();
    };
};
exports.checkRole = checkRole;
const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError_1.AppError("Authentication required.", 401);
        }
        // Owner, Admin, and Super Admin bypass granular permission checks
        if (req.user.role === "owner" || req.user.role === "admin" || req.user.role === "super_admin") {
            return next();
        }
        const userPermissions = req.user.permissions || [];
        if (!userPermissions.includes(requiredPermission)) {
            throw new AppError_1.AppError(`Access denied. Missing permission '${requiredPermission}'.`, 403);
        }
        next();
    };
};
exports.checkPermission = checkPermission;
