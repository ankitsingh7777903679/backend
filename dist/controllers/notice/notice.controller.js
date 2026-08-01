"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotice = exports.resendWhatsAppBroadcast = exports.updateNotice = exports.createNotice = exports.getNotice = exports.getAllNotices = void 0;
const notice_service_1 = require("../../services/notice/notice.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getAllNotices = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const list = await notice_service_1.noticeService.getAll(req.user.instituteId, req.query);
    res.json(apiResponse_1.apiResponse.success(list, "Notices fetched successfully"));
});
exports.getNotice = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const item = await notice_service_1.noticeService.getById(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(item));
});
exports.createNotice = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const item = await notice_service_1.noticeService.create(req.body, req.user.instituteId, req.user.userId, req.user.role === "owner" || req.user.role === "admin" ? "Institute Admin" : "Teacher");
    res.status(201).json(apiResponse_1.apiResponse.success(item, "Notice published and broadcasted successfully"));
});
exports.updateNotice = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const item = await notice_service_1.noticeService.update(req.params.id, req.body, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(item, "Notice updated successfully"));
});
exports.resendWhatsAppBroadcast = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const item = await notice_service_1.noticeService.resendWhatsAppBroadcast(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(item, "WhatsApp broadcast re-sent successfully!"));
});
exports.deleteNotice = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await notice_service_1.noticeService.delete(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(null, "Notice record removed successfully"));
});
