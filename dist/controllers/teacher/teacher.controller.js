"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTeacher = exports.updateTeacher = exports.createTeacher = exports.getTeacher = exports.getAllTeachers = void 0;
const teacher_service_1 = require("../../services/teacher/teacher.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getAllTeachers = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const teachers = await teacher_service_1.teacherService.getAll(req.user.instituteId, req.query);
    res.json(apiResponse_1.apiResponse.success(teachers, "Teachers fetched successfully"));
});
exports.getTeacher = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const teacher = await teacher_service_1.teacherService.getById(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(teacher));
});
exports.createTeacher = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const teacher = await teacher_service_1.teacherService.create(req.body, req.user.instituteId);
    res.status(201).json(apiResponse_1.apiResponse.success(teacher, "Teacher created successfully"));
});
exports.updateTeacher = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const teacher = await teacher_service_1.teacherService.update(req.params.id, req.body, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(teacher, "Teacher updated successfully"));
});
exports.deleteTeacher = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await teacher_service_1.teacherService.delete(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(null, "Teacher record removed successfully"));
});
