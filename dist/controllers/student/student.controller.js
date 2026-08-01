"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyProfile = exports.getMyExamResults = exports.getStudentExamResults = exports.deleteStudent = exports.updateStudent = exports.createStudent = exports.getStudent = exports.getAllStudents = void 0;
const student_service_1 = require("../../services/student/student.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getAllStudents = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const students = await student_service_1.studentService.getAll(req.user.instituteId, req.query);
    res.json(apiResponse_1.apiResponse.success(students, "Students fetched successfully"));
});
exports.getStudent = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const student = await student_service_1.studentService.getById(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(student));
});
exports.createStudent = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const student = await student_service_1.studentService.create(req.body, req.user.instituteId);
    res.status(201).json(apiResponse_1.apiResponse.success(student, "Student admitted successfully"));
});
exports.updateStudent = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const student = await student_service_1.studentService.update(req.params.id, req.body, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(student, "Student updated successfully"));
});
exports.deleteStudent = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await student_service_1.studentService.delete(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(null, "Student record removed successfully"));
});
exports.getStudentExamResults = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const data = await student_service_1.studentService.getExamResults(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(data, "Student exam history fetched successfully"));
});
// Student self-service: uses JWT userId to find their own results
exports.getMyExamResults = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const data = await student_service_1.studentService.getExamResults(req.user.userId, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(data, "Your exam history fetched successfully"));
});
// Student self-service: uses JWT userId to find their own profile
exports.getMyProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const student = await student_service_1.studentService.getById(req.user.userId, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(student, "Your profile fetched successfully"));
});
