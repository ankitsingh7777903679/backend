"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitResults = exports.getResultsByExam = void 0;
const examResult_service_1 = require("../../services/examResult/examResult.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getResultsByExam = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const results = await examResult_service_1.examResultService.getResultsByExam(req.params.examId, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(results, "Exam results retrieved successfully"));
});
exports.submitResults = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const results = await examResult_service_1.examResultService.submitResults(req.params.examId, req.body, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(results, "Exam marks saved and evaluation completed successfully"));
});
