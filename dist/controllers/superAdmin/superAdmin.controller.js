"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleInstituteStatus = exports.getOverview = void 0;
const superAdmin_service_1 = require("../../services/superAdmin/superAdmin.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getOverview = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const data = await superAdmin_service_1.superAdminService.getOverview();
    res.json(apiResponse_1.apiResponse.success(data, "Super admin master overview fetched successfully"));
});
exports.toggleInstituteStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { status } = req.body;
    const inst = await superAdmin_service_1.superAdminService.toggleInstituteStatus(req.params.id, status);
    res.json(apiResponse_1.apiResponse.success(inst, `Institute status updated to ${status}`));
});
