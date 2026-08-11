"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentProgressReport = exports.getFinancialSummary = void 0;
const report_service_1 = require("../../services/report/report.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getFinancialSummary = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const monthFilter = typeof req.query.month === "string" ? req.query.month : undefined;
    const summary = await report_service_1.reportService.getFinancialSummary(String(req.user.instituteId), monthFilter);
    res.json(apiResponse_1.apiResponse.success(summary, "Financial and academic summary reports generated successfully"));
});
exports.getStudentProgressReport = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const studentId = String(req.params.studentId);
    const monthFilter = typeof req.query.month === "string" ? req.query.month : undefined;
    const report = await report_service_1.reportService.getStudentProgressReport(String(req.user.instituteId), studentId, monthFilter);
    res.json(apiResponse_1.apiResponse.success(report, "Student progress report card generated successfully"));
});
