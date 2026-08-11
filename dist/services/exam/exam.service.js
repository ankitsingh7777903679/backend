"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.examService = void 0;
const exam_model_1 = require("../../models/exam/exam.model");
const student_model_1 = require("../../models/student/student.model");
const teacher_model_1 = require("../../models/teacher/teacher.model");
const examResult_model_1 = require("../../models/examResult/examResult.model");
const AppError_1 = require("../../utils/AppError");
const mongoose_1 = require("mongoose");
const notification_service_1 = require("../notification/notification.service");
exports.examService = {
    getAll: async (instituteId, query, userRole, userId) => {
        const filter = { instituteId, status: { $ne: "deleted" } };
        if (query.type && query.type !== "all") {
            filter.examType = query.type;
        }
        if (query.search) {
            filter.$or = [
                { title: { $regex: query.search, $options: "i" } },
                { batchName: { $regex: query.search, $options: "i" } },
                { subject: { $regex: query.search, $options: "i" } },
            ];
        }
        // If user is a Staff Teacher, filter exams by their assigned batches
        if (userRole === "teacher" && userId && mongoose_1.Types.ObjectId.isValid(userId)) {
            const teacherDoc = await teacher_model_1.Teacher.findOne({
                instituteId: new mongoose_1.Types.ObjectId(instituteId),
                $or: [{ userId: new mongoose_1.Types.ObjectId(userId) }, { _id: new mongoose_1.Types.ObjectId(userId) }],
                status: { $ne: "deleted" },
            });
            const assignedBatchIds = teacherDoc?.assignedBatchIds || [];
            filter.batchId = { $in: assignedBatchIds };
        }
        // If user is a Student or Parent, strictly filter exams by their assigned batch!
        if (userRole === "student" || userRole === "parent") {
            let studentBatchName = "";
            if (userId && mongoose_1.Types.ObjectId.isValid(userId)) {
                const student = await student_model_1.Student.findOne({
                    instituteId: new mongoose_1.Types.ObjectId(instituteId),
                    $or: [{ _id: new mongoose_1.Types.ObjectId(userId) }, { userId: new mongoose_1.Types.ObjectId(userId) }],
                    status: { $ne: "deleted" },
                });
                if (student && student.batchName) {
                    studentBatchName = student.batchName.trim();
                }
            }
            if (studentBatchName) {
                const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const batchRegex = new RegExp(`^${escapeRegExp(studentBatchName)}$`, "i");
                // Student can only see exams matching their batch, or marked 'all' / 'All Batches'
                const batchConditions = [
                    { batchName: batchRegex },
                    { batchName: { $regex: /^all$/i } },
                    { batchName: { $regex: /^all batches$/i } },
                    { batchName: { $exists: false } },
                    { batchName: "" },
                ];
                if (filter.$or) {
                    filter.$and = [{ $or: filter.$or }, { $or: batchConditions }];
                    delete filter.$or;
                }
                else {
                    filter.$or = batchConditions;
                }
            }
        }
        const exams = await exam_model_1.Exam.find(filter).sort({ examDate: -1 });
        return exams;
    },
    getById: async (id, instituteId) => {
        const exam = await exam_model_1.Exam.findOne({ _id: id, instituteId });
        if (!exam)
            throw new AppError_1.AppError("Exam record not found", 404);
        return exam;
    },
    create: async (data, instituteId, userId) => {
        const safeUserId = userId && mongoose_1.Types.ObjectId.isValid(userId) ? new mongoose_1.Types.ObjectId(userId) : undefined;
        const exam = await exam_model_1.Exam.create({
            ...data,
            instituteId,
            examDate: new Date(data.examDate),
            createdByUserId: safeUserId,
        });
        // Trigger Test Scheduled Notification to batch students
        notification_service_1.notificationService
            .sendTestScheduledNotification(instituteId, exam.batchName, exam.title, exam.examDate, exam.startTime, exam.mode)
            .catch(() => { });
        return exam;
    },
    update: async (id, data, instituteId) => {
        const updateData = { ...data };
        if (data.examDate) {
            updateData.examDate = new Date(data.examDate);
        }
        const exam = await exam_model_1.Exam.findOneAndUpdate({ _id: id, instituteId }, { $set: updateData }, { new: true, runValidators: true });
        if (!exam)
            throw new AppError_1.AppError("Exam not found", 404);
        return exam;
    },
    delete: async (id, instituteId) => {
        const exam = await exam_model_1.Exam.findOneAndUpdate({ _id: id, instituteId }, { $set: { status: "deleted" } }, { new: true });
        if (!exam)
            throw new AppError_1.AppError("Exam not found", 404);
        return exam;
    },
    submitLiveExam: async (examId, userOrStudentId, instituteId, answers) => {
        if (!mongoose_1.Types.ObjectId.isValid(examId))
            throw new AppError_1.AppError("Invalid Exam ID", 400);
        const instIdObj = new mongoose_1.Types.ObjectId(instituteId);
        const examIdObj = new mongoose_1.Types.ObjectId(examId);
        const exam = await exam_model_1.Exam.findOne({ _id: examIdObj, instituteId: instIdObj, status: { $ne: "deleted" } });
        if (!exam)
            throw new AppError_1.AppError("Exam not found", 404);
        // Find student document
        let student = null;
        if (mongoose_1.Types.ObjectId.isValid(userOrStudentId)) {
            const targetObjId = new mongoose_1.Types.ObjectId(userOrStudentId);
            student = await student_model_1.Student.findOne({
                instituteId: instIdObj,
                $or: [{ _id: targetObjId }, { userId: targetObjId }],
                status: { $ne: "deleted" },
            });
        }
        // STRICT BATCH ENFORCEMENT GUARD FOR LIVE EXAM SUBMISSION:
        if (student && student.batchName && exam.batchName) {
            const examBatch = exam.batchName.trim().toLowerCase();
            const studentBatch = student.batchName.trim().toLowerCase();
            const isUniversalBatch = examBatch === "all" ||
                examBatch === "all batches" ||
                examBatch === "" ||
                !exam.batchName;
            if (!isUniversalBatch && examBatch !== studentBatch) {
                throw new AppError_1.AppError(`Access Denied: You belong to the '${student.batchName}' batch, but this exam is restricted to the '${exam.batchName}' batch.`, 403);
            }
        }
        const studentIdObj = student ? student._id : (mongoose_1.Types.ObjectId.isValid(userOrStudentId) ? new mongoose_1.Types.ObjectId(userOrStudentId) : new mongoose_1.Types.ObjectId());
        const studentName = student ? (student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim()) : "Student";
        const rollNo = student?.admissionNo || "";
        // Check if student has already submitted this exam (Strict 1-Attempt Policy)
        const existingResult = await examResult_model_1.ExamResult.findOne({
            instituteId: instIdObj,
            examId: examIdObj,
            studentId: studentIdObj,
            status: { $ne: "deleted" },
        });
        if (existingResult) {
            throw new AppError_1.AppError("You have already submitted this exam. Re-attempts are not allowed.", 400);
        }
        // Grade questions
        const questions = exam.questions || [];
        let totalScore = 0;
        const gradedAnswers = questions.map((q, idx) => {
            const studentAns = answers.find((a) => a.questionIndex === idx);
            const selected = studentAns ? studentAns.selectedOption : "";
            const isCorrect = selected === q.correctOption;
            const marksAwarded = isCorrect ? (q.marks || 4) : 0;
            totalScore += marksAwarded;
            return {
                questionIndex: idx,
                questionText: q.questionText,
                selectedOption: selected,
                correctOption: q.correctOption,
                isCorrect,
                marksAwarded,
                explanation: q.explanation || "",
            };
        });
        const isPassed = totalScore >= exam.passingMarks;
        // Save/Update ExamResult
        const examResult = await examResult_model_1.ExamResult.findOneAndUpdate({ instituteId: instIdObj, examId: examIdObj, studentId: studentIdObj }, {
            $set: {
                studentName,
                rollNo,
                marksObtained: totalScore,
                totalMarks: exam.totalMarks,
                passingMarks: exam.passingMarks,
                isPassed,
                studentAnswers: gradedAnswers,
                status: "active",
            },
        }, { upsert: true, new: true });
        // Recalculate ranks for all submissions of this exam
        const allResults = await examResult_model_1.ExamResult.find({
            instituteId: instIdObj,
            examId: examIdObj,
            status: { $ne: "deleted" },
        }).sort({ marksObtained: -1, createdAt: 1 });
        let calculatedRank = 1;
        for (let i = 0; i < allResults.length; i++) {
            allResults[i].rank = i + 1;
            await allResults[i].save();
            if (allResults[i]._id.toString() === examResult._id.toString()) {
                calculatedRank = i + 1;
            }
        }
        // Trigger Test Submitted & Test Evaluated Score & Rank Notifications to Student
        const studentUserId = student?.userId || (mongoose_1.Types.ObjectId.isValid(userOrStudentId) ? userOrStudentId : undefined);
        if (studentUserId) {
            notification_service_1.notificationService
                .sendTestSubmittedNotification(instituteId, studentIdObj, studentUserId, exam.title)
                .catch(() => { });
            notification_service_1.notificationService
                .sendTestEvaluatedNotification(instituteId, studentIdObj, studentUserId, exam.title, totalScore, exam.totalMarks, calculatedRank)
                .catch(() => { });
        }
        return {
            examResultId: examResult._id.toString(),
            marksObtained: totalScore,
            totalMarks: exam.totalMarks,
            passingMarks: exam.passingMarks,
            isPassed,
            rank: calculatedRank,
            totalStudents: allResults.length,
            studentAnswers: gradedAnswers,
        };
    },
    getExamLeaderboard: async (examId, instituteId) => {
        if (!mongoose_1.Types.ObjectId.isValid(examId))
            throw new AppError_1.AppError("Invalid Exam ID", 400);
        const instIdObj = new mongoose_1.Types.ObjectId(instituteId);
        const examIdObj = new mongoose_1.Types.ObjectId(examId);
        const exam = await exam_model_1.Exam.findOne({ _id: examIdObj, instituteId: instIdObj });
        if (!exam)
            throw new AppError_1.AppError("Exam not found", 404);
        const results = await examResult_model_1.ExamResult.find({
            instituteId: instIdObj,
            examId: examIdObj,
            status: { $ne: "deleted" },
        }).sort({ marksObtained: -1, createdAt: 1 });
        const totalSubmitted = results.length;
        const topperScore = totalSubmitted > 0 ? results[0].marksObtained : 0;
        const totalMarksSum = results.reduce((acc, r) => acc + (r.marksObtained || 0), 0);
        const classAverage = totalSubmitted > 0 ? Math.round(totalMarksSum / totalSubmitted) : 0;
        const leaderboard = results.map((r, index) => ({
            id: r._id.toString(),
            studentId: r.studentId.toString(),
            studentName: r.studentName,
            rollNo: r.rollNo || "",
            marksObtained: r.marksObtained,
            totalMarks: r.totalMarks,
            rank: r.rank || index + 1,
            isPassed: r.isPassed,
            submittedAt: r.createdAt,
        }));
        return {
            exam: {
                id: exam._id.toString(),
                title: exam.title,
                batchName: exam.batchName,
                subject: exam.subject,
                totalMarks: exam.totalMarks,
                passingMarks: exam.passingMarks,
            },
            stats: {
                topperScore,
                classAverage,
                totalSubmitted,
            },
            leaderboard,
        };
    },
};
