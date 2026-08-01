"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftStudents = exports.deleteClass = exports.updateClass = exports.getClassById = exports.getAllClasses = exports.createClass = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
const class_service_1 = require("../../services/class/class.service");
exports.createClass = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const newClass = await class_service_1.classService.create(req.body, req.user.instituteId);
    res.status(201).json(apiResponse_1.apiResponse.success(newClass, "Class created successfully"));
});
exports.getAllClasses = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const classes = await class_service_1.classService.getAll(req.user.instituteId);
    res.status(200).json(apiResponse_1.apiResponse.success(classes, "Classes fetched successfully"));
});
exports.getClassById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const cls = await class_service_1.classService.getById(req.params.id, req.user.instituteId);
    res.status(200).json(apiResponse_1.apiResponse.success(cls, "Class details fetched"));
});
exports.updateClass = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const updated = await class_service_1.classService.update(req.params.id, req.body, req.user.instituteId);
    res.status(200).json(apiResponse_1.apiResponse.success(updated, "Class updated successfully"));
});
exports.deleteClass = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await class_service_1.classService.delete(req.params.id, req.user.instituteId);
    res.status(200).json(apiResponse_1.apiResponse.success(null, "Class deleted successfully"));
});
exports.shiftStudents = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await class_service_1.classService.shiftStudents(req.body, req.user.instituteId);
    res.status(200).json(apiResponse_1.apiResponse.success(result, `${result.shiftedCount} students shifted to ${result.targetClass}`));
});
