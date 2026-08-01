"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherService = void 0;
const teacher_model_1 = require("../../models/teacher/teacher.model");
const user_model_1 = require("../../models/user/user.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
const AppError_1 = require("../../utils/AppError");
exports.teacherService = {
    getAll: async (instituteId, query) => {
        const filter = {
            instituteId,
            status: { $ne: "deleted" },
        };
        if (query.type && query.type !== "all") {
            filter.employmentType = query.type;
        }
        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: "i" } },
                { subjects: { $regex: query.search, $options: "i" } },
                { phone: { $regex: query.search, $options: "i" } },
            ];
        }
        const teachers = await teacher_model_1.Teacher.find(filter).sort({ createdAt: -1 });
        return teachers;
    },
    getById: async (id, instituteId) => {
        const teacher = await teacher_model_1.Teacher.findOne({ _id: id, instituteId });
        if (!teacher)
            throw new AppError_1.AppError("Teacher record not found", 404);
        return teacher;
    },
    create: async (data, instituteId) => {
        const existing = await teacher_model_1.Teacher.findOne({ phone: data.phone, instituteId, status: { $ne: "deleted" } });
        if (existing) {
            throw new AppError_1.AppError("A teacher with this mobile number already exists", 409);
        }
        // Auto-create login User credentials for Teacher
        const defaultPassword = "Teacher@123";
        const passwordHash = await bcrypt_1.default.hash(defaultPassword, 10);
        const user = await user_model_1.User.create({
            instituteId,
            role: "teacher",
            name: data.name,
            email: data.email || `${data.phone}@teacher.local`,
            phone: data.phone,
            passwordHash,
        });
        const teacher = await teacher_model_1.Teacher.create({
            ...data,
            instituteId,
            userId: user._id,
        });
        user.linkedId = teacher._id;
        await user.save();
        return teacher;
    },
    update: async (id, data, instituteId) => {
        const teacher = await teacher_model_1.Teacher.findOneAndUpdate({ _id: id, instituteId }, { $set: data }, { new: true, runValidators: true });
        if (!teacher)
            throw new AppError_1.AppError("Teacher not found", 404);
        return teacher;
    },
    delete: async (id, instituteId) => {
        const teacher = await teacher_model_1.Teacher.findOneAndUpdate({ _id: id, instituteId }, { $set: { status: "deleted" } }, { new: true });
        if (!teacher)
            throw new AppError_1.AppError("Teacher not found", 404);
        return teacher;
    },
};
