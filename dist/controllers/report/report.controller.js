"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialSummary = void 0;
const report_service_1 = require("../../services/report/report.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getFinancialSummary = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const summary = await report_service_1.reportService.getFinancialSummary(req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(summary, "Financial summary reports generated successfully"));
});
