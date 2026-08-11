"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeworkService = void 0;
const homework_model_1 = require("../../models/homework/homework.model");
const homeworkSubmission_model_1 = require("../../models/homeworkSubmission/homeworkSubmission.model");
const teacher_model_1 = require("../../models/teacher/teacher.model");
const AppError_1 = require("../../utils/AppError");
const mongoose_1 = require("mongoose");
exports.homeworkService = {
    getAll: async (instituteId, query, reqUser) => {
        const filter = { instituteId, status: { $ne: "deleted" } };
        if (reqUser && reqUser.role === "teacher") {
            const teacherDoc = await teacher_model_1.Teacher.findOne({
                instituteId,
                $or: [{ userId: reqUser.userId }, { _id: reqUser.userId }],
                status: { $ne: "deleted" },
            });
            const assignedBatchIds = teacherDoc?.assignedBatchIds || [];
            filter.batchId = { $in: assignedBatchIds };
        }
        if (query.status && query.status !== "all") {
            filter.homeworkStatus = query.status;
        }
        if (query.search) {
            filter.$or = [
                { title: { $regex: query.search, $options: "i" } },
                { batchName: { $regex: query.search, $options: "i" } },
                { subject: { $regex: query.search, $options: "i" } },
            ];
        }
        const homeworks = await homework_model_1.Homework.find(filter).sort({ createdAt: -1 }).lean();
        // Dynamically calculate real active submissions for each homework
        const homeworksWithRealCounts = await Promise.all(homeworks.map(async (hw) => {
            const realSubmissionCount = await homeworkSubmission_model_1.HomeworkSubmission.countDocuments({
                homeworkId: hw._id,
                status: "active",
            });
            return {
                ...hw,
                totalSubmissions: realSubmissionCount,
            };
        }));
        return homeworksWithRealCounts;
    },
    getById: async (id, instituteId) => {
        const homework = await homework_model_1.Homework.findOne({ _id: id, instituteId }).lean();
        if (!homework)
            throw new AppError_1.AppError("Homework record not found", 404);
        const realSubmissionCount = await homeworkSubmission_model_1.HomeworkSubmission.countDocuments({
            homeworkId: homework._id,
            status: "active",
        });
        return { ...homework, totalSubmissions: realSubmissionCount };
    },
    create: async (data, instituteId, userId) => {
        const homework = await homework_model_1.Homework.create({
            ...data,
            instituteId,
            dueDate: new Date(data.dueDate),
            totalSubmissions: 0,
            totalEnrolled: 0,
            createdByUserId: userId ? new mongoose_1.Types.ObjectId(userId) : undefined,
        });
        return homework;
    },
    update: async (id, data, instituteId) => {
        const updateData = { ...data };
        if (data.dueDate) {
            updateData.dueDate = new Date(data.dueDate);
        }
        const homework = await homework_model_1.Homework.findOneAndUpdate({ _id: id, instituteId }, { $set: updateData }, { new: true, runValidators: true });
        if (!homework)
            throw new AppError_1.AppError("Homework not found", 404);
        return homework;
    },
    delete: async (id, instituteId) => {
        const homework = await homework_model_1.Homework.findOneAndUpdate({ _id: id, instituteId }, { $set: { status: "deleted" } }, { new: true });
        if (!homework)
            throw new AppError_1.AppError("Homework not found", 404);
        return homework;
    },
};
