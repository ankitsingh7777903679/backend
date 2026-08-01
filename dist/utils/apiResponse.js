"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiResponse = void 0;
exports.apiResponse = {
    success: (data = null, message = "Success", pagination) => ({
        success: true,
        message,
        data,
        ...(pagination ? { pagination } : {}),
    }),
    error: (message, errors) => ({
        success: false,
        message,
        ...(errors ? { errors } : {}),
    }),
};
