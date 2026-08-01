"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHomework = exports.updateHomework = exports.createHomework = exports.getHomework = exports.getAllHomework = void 0;
const homework_service_1 = require("../../services/homework/homework.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getAllHomework = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const list = await homework_service_1.homeworkService.getAll(req.user.instituteId, req.query);
    res.json(apiResponse_1.apiResponse.success(list, "Homework records fetched successfully"));
});
exports.getHomework = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const item = await homework_service_1.homeworkService.getById(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(item));
});
exports.createHomework = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const item = await homework_service_1.homeworkService.create(req.body, req.user.instituteId, req.user.userId);
    res.status(201).json(apiResponse_1.apiResponse.success(item, "Homework assignment created successfully"));
});
exports.updateHomework = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const item = await homework_service_1.homeworkService.update(req.params.id, req.body, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(item, "Homework assignment updated successfully"));
});
exports.deleteHomework = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await homework_service_1.homeworkService.delete(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(null, "Homework record removed successfully"));
});
