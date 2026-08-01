"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyAttendanceHistory = exports.markAttendance = exports.getAllAttendance = exports.getBatchAttendance = void 0;
const attendance_service_1 = require("../../services/attendance/attendance.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getBatchAttendance = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { batchId, dateStr } = req.query;
    const record = await attendance_service_1.attendanceService.getBatchAttendance(req.user.instituteId, batchId, dateStr);
    res.json(apiResponse_1.apiResponse.success(record));
});
exports.getAllAttendance = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const records = await attendance_service_1.attendanceService.getAllRecords(req.user.instituteId, req.query);
    res.json(apiResponse_1.apiResponse.success(records, "Attendance records fetched"));
});
exports.markAttendance = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await attendance_service_1.attendanceService.markAttendance(req.body, req.user.instituteId, req.user.userId, req.user.role === "owner" || req.user.role === "admin" ? "Admin" : "Teacher");
    res.status(200).json(apiResponse_1.apiResponse.success(result, "Attendance saved and WhatsApp alerts dispatched"));
});
exports.getMyAttendanceHistory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const records = await attendance_service_1.attendanceService.getStudentAttendanceHistory(req.user.instituteId, req.user.userId, req.user.email, req.user.name);
    res.json(apiResponse_1.apiResponse.success(records, "Student attendance history loaded"));
});
