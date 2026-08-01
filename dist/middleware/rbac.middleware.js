"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = void 0;
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
