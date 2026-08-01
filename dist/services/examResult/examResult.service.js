"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.examResultService = void 0;
const mongoose_1 = require("mongoose");
const examResult_model_1 = require("../../models/examResult/examResult.model");
const exam_model_1 = require("../../models/exam/exam.model");
const AppError_1 = require("../../utils/AppError");
exports.examResultService = {
    getResultsByExam: async (examId, instituteId) => {
        if (!mongoose_1.Types.ObjectId.isValid(examId)) {
            throw new AppError_1.AppError("Invalid Exam ID format", 400);
        }
        const results = await examResult_model_1.ExamResult.find({
            examId: new mongoose_1.Types.ObjectId(examId),
            instituteId: new mongoose_1.Types.ObjectId(instituteId),
            status: { $ne: "deleted" },
        }).sort({ rollNo: 1, studentName: 1 });
        return results;
    },
    submitResults: async (examId, data, instituteId) => {
        if (!mongoose_1.Types.ObjectId.isValid(examId)) {
            throw new AppError_1.AppError("Invalid Exam ID format", 400);
        }
        const exam = await exam_model_1.Exam.findOne({ _id: examId, instituteId: new mongoose_1.Types.ObjectId(instituteId) });
        if (!exam) {
            throw new AppError_1.AppError("Exam record not found", 404);
        }
        const instIdObj = new mongoose_1.Types.ObjectId(instituteId);
        const examIdObj = new mongoose_1.Types.ObjectId(examId);
        // Process each student mark entry with upsert logic
        const operations = data.results.map((item) => {
            const studentIdObj = new mongoose_1.Types.ObjectId(item.studentId);
            const isPassed = item.marksObtained >= exam.passingMarks;
            return {
                updateOne: {
                    filter: { instituteId: instIdObj, examId: examIdObj, studentId: studentIdObj },
                    update: {
                        $set: {
                            studentName: item.studentName,
                            rollNo: item.rollNo || "",
                            marksObtained: item.marksObtained,
                            totalMarks: exam.totalMarks,
                            passingMarks: exam.passingMarks,
                            isPassed,
                            remarks: item.remarks || "",
                            status: "active",
                        },
                    },
                    upsert: true,
                },
            };
        });
        if (operations.length > 0) {
            await examResult_model_1.ExamResult.bulkWrite(operations);
        }
        // Update exam status to completed
        exam.examStatus = "completed";
        await exam.save();
        // Fetch and return saved results
        return examResult_model_1.ExamResult.find({
            examId: examIdObj,
            instituteId: instIdObj,
            status: { $ne: "deleted" },
        });
    },
};
