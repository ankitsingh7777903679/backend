"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherService = void 0;
const teacher_model_1 = require("../../models/teacher/teacher.model");
const user_model_1 = require("../../models/user/user.model");
const AppError_1 = require("../../utils/AppError");
const portalAccess_service_1 = require("../portalAccess/portalAccess.service");
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
    create: async (data, instituteId, actorId) => {
        const existing = await teacher_model_1.Teacher.findOne({ phone: data.phone, instituteId, status: { $ne: "deleted" } });
        if (existing) {
            throw new AppError_1.AppError("A teacher with this mobile number already exists", 409);
        }
        const defaultPermissions = [
            "manage_students",
            "mark_attendance",
            "manage_classes",
            "manage_homework",
            "manage_materials",
            "manage_tests",
            "view_student_reports",
        ];
        const { portalAccessEnabled, password: _ignoredPassword, ...teacherData } = data;
        const permissionsToSet = data.permissions && data.permissions.length > 0 ? data.permissions : defaultPermissions;
        const teacher = await teacher_model_1.Teacher.create({
            ...teacherData,
            email: data.email?.trim().toLowerCase() || undefined,
            instituteId,
            permissions: permissionsToSet,
            portalAccess: "disabled",
        });
        if (portalAccessEnabled)
            await portalAccess_service_1.portalAccessService.createInvitation("teacher", teacher._id.toString(), instituteId, actorId);
        return teacher_model_1.Teacher.findById(teacher._id);
    },
    update: async (id, data, instituteId) => {
        const teacher = await teacher_model_1.Teacher.findOneAndUpdate({ _id: id, instituteId }, { $set: data }, { new: true, runValidators: true });
        if (!teacher)
            throw new AppError_1.AppError("Teacher not found", 404);
        // Sync updates to linked User account (or create if missing)
        if (teacher.userId) {
            const userUpdate = {};
            if (data.name)
                userUpdate.name = data.name;
            if (data.phone)
                userUpdate.phone = data.phone;
            if (data.email)
                userUpdate.email = data.email.trim().toLowerCase();
            if (data.permissions)
                userUpdate.permissions = data.permissions;
            if (Object.keys(userUpdate).length > 0) {
                await user_model_1.User.updateOne({ _id: teacher.userId }, { $set: userUpdate });
            }
        }
        return teacher;
    },
    delete: async (id, instituteId) => {
        const teacher = await teacher_model_1.Teacher.findOneAndUpdate({ _id: id, instituteId }, { $set: { status: "deleted" } }, { new: true });
        if (!teacher)
            throw new AppError_1.AppError("Teacher not found", 404);
        if (teacher.userId) {
            await user_model_1.User.findOneAndUpdate({ _id: teacher.userId, instituteId }, { $set: { status: "deleted" } });
        }
        return teacher;
    },
};
