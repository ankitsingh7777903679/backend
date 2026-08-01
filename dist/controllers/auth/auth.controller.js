"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.login = exports.registerInstitute = void 0;
const auth_service_1 = require("../../services/auth/auth.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.registerInstitute = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await auth_service_1.authService.registerInstitute(req.body);
    res.status(201).json(apiResponse_1.apiResponse.success(result, "Institute registered successfully"));
});
exports.login = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await auth_service_1.authService.login(req.body);
    res.json(apiResponse_1.apiResponse.success(result, "Login successful"));
});
exports.refreshToken = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const tokens = await auth_service_1.authService.refreshAccessToken(req.body.refreshToken);
    res.json(apiResponse_1.apiResponse.success(tokens, "Token refreshed successfully"));
});
exports.logout = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await auth_service_1.authService.logout(req.user.userId);
    res.json(apiResponse_1.apiResponse.success(null, "Logged out successfully"));
});
