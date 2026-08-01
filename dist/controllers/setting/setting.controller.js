"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSetting = exports.getSetting = void 0;
const setting_service_1 = require("../../services/setting/setting.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getSetting = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const setting = await setting_service_1.settingService.get(req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(setting, "Institute settings fetched successfully"));
});
exports.updateSetting = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const setting = await setting_service_1.settingService.update(req.body, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(setting, "Institute settings updated successfully"));
});
