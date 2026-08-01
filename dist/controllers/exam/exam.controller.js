"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExamLeaderboard = exports.submitLiveExam = exports.deleteExam = exports.updateExam = exports.createExam = exports.getExam = exports.getAllExams = void 0;
const exam_service_1 = require("../../services/exam/exam.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getAllExams = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const exams = await exam_service_1.examService.getAll(req.user.instituteId, req.query);
    res.json(apiResponse_1.apiResponse.success(exams, "Exams fetched successfully"));
});
exports.getExam = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const exam = await exam_service_1.examService.getById(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(exam));
});
exports.createExam = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const exam = await exam_service_1.examService.create(req.body, req.user.instituteId, req.user.userId);
    res.status(201).json(apiResponse_1.apiResponse.success(exam, "Exam scheduled successfully"));
});
exports.updateExam = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const exam = await exam_service_1.examService.update(req.params.id, req.body, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(exam, "Exam updated successfully"));
});
exports.deleteExam = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await exam_service_1.examService.delete(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(null, "Exam record removed successfully"));
});
exports.submitLiveExam = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await exam_service_1.examService.submitLiveExam(req.params.id, req.user.userId, req.user.instituteId, req.body.answers || []);
    res.json(apiResponse_1.apiResponse.success(result, "Test submitted and evaluated successfully"));
});
exports.getExamLeaderboard = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const data = await exam_service_1.examService.getExamLeaderboard(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(data, "Exam leaderboard fetched successfully"));
});
