"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.classService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const class_model_1 = require("../../models/class/class.model");
const student_model_1 = require("../../models/student/student.model");
const teacher_model_1 = require("../../models/teacher/teacher.model");
const AppError_1 = require("../../utils/AppError");
exports.classService = {
    create: async (data, instituteId) => {
        const existing = await class_model_1.Class.findOne({ instituteId, name: data.name, status: { $ne: "deleted" } });
        if (existing) {
            throw new AppError_1.AppError("Class with this name already exists in your institute", 400);
        }
        const newClass = await class_model_1.Class.create({
            ...data,
            instituteId,
            status: "active",
        });
        return newClass;
    },
    getAll: async (instituteId, reqUser) => {
        const filter = { instituteId, status: { $ne: "deleted" } };
        if (reqUser && reqUser.role === "teacher") {
            const teacherDoc = await teacher_model_1.Teacher.findOne({
                instituteId,
                $or: [{ userId: reqUser.userId }, { _id: reqUser.userId }],
                status: { $ne: "deleted" },
            });
            const assignedBatchIds = teacherDoc?.assignedBatchIds || [];
            filter._id = { $in: assignedBatchIds };
        }
        const classes = await class_model_1.Class.find(filter).sort({ createdAt: -1 });
        // Calculate real student counts for each class
        const classesWithCounts = await Promise.all(classes.map(async (c) => {
            const studentCount = await student_model_1.Student.countDocuments({
                instituteId,
                $or: [
                    { batchId: c._id },
                    { batchName: c.name },
                    { className: c.name },
                ],
                status: { $ne: "deleted" },
            });
            return {
                id: c._id.toString(),
                _id: c._id.toString(),
                name: c.name,
                timing: c.timing || "05:00 PM – 07:00 PM",
                shift: c.shift || "evening",
                days: c.days || "Mon – Sat (Daily)",
                studentCount,
                status: c.status,
                createdAt: c.createdAt,
            };
        }));
        return classesWithCounts;
    },
    getById: async (id, instituteId) => {
        let cls = null;
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            cls = await class_model_1.Class.findOne({ _id: id, instituteId, status: { $ne: "deleted" } });
        }
        if (!cls) {
            cls = await class_model_1.Class.findOne({ name: id, instituteId, status: { $ne: "deleted" } });
        }
        if (!cls)
            throw new AppError_1.AppError("Class not found", 404);
        return cls;
    },
    update: async (id, data, instituteId) => {
        let cls = null;
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            cls = await class_model_1.Class.findOne({ _id: id, instituteId, status: { $ne: "deleted" } });
        }
        if (!cls) {
            cls = await class_model_1.Class.findOne({ name: id, instituteId, status: { $ne: "deleted" } });
        }
        if (!cls)
            throw new AppError_1.AppError("Class not found", 404);
        if (data.name && data.name !== cls.name) {
            const duplicate = await class_model_1.Class.findOne({
                instituteId,
                name: data.name,
                _id: { $ne: cls._id },
                status: { $ne: "deleted" },
            });
            if (duplicate)
                throw new AppError_1.AppError("Another class with this name already exists", 400);
        }
        Object.assign(cls, data);
        await cls.save();
        return cls;
    },
    delete: async (id, instituteId) => {
        let cls = null;
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            cls = await class_model_1.Class.findOne({ _id: id, instituteId, status: { $ne: "deleted" } });
        }
        if (!cls) {
            cls = await class_model_1.Class.findOne({ name: id, instituteId, status: { $ne: "deleted" } });
        }
        if (!cls)
            throw new AppError_1.AppError("Class not found", 404);
        cls.status = "deleted";
        await cls.save();
        return true;
    },
    shiftStudents: async (data, instituteId) => {
        const { sourceClassId, targetClassId, studentIds } = data;
        let sourceClass = null;
        let targetClass = null;
        if (mongoose_1.default.Types.ObjectId.isValid(sourceClassId)) {
            sourceClass = await class_model_1.Class.findOne({ _id: sourceClassId, instituteId, status: { $ne: "deleted" } });
        }
        if (!sourceClass) {
            sourceClass = await class_model_1.Class.findOne({ name: sourceClassId, instituteId, status: { $ne: "deleted" } });
        }
        if (mongoose_1.default.Types.ObjectId.isValid(targetClassId)) {
            targetClass = await class_model_1.Class.findOne({ _id: targetClassId, instituteId, status: { $ne: "deleted" } });
        }
        if (!targetClass) {
            targetClass = await class_model_1.Class.findOne({ name: targetClassId, instituteId, status: { $ne: "deleted" } });
        }
        if (!sourceClass || !targetClass) {
            throw new AppError_1.AppError("Source or target class not found", 404);
        }
        if (!studentIds || studentIds.length === 0) {
            throw new AppError_1.AppError("No students selected to shift", 400);
        }
        const validStudentObjectIds = (studentIds || []).filter((sid) => mongoose_1.default.Types.ObjectId.isValid(sid));
        // Move selected students to target class — update both batchId AND batchName/className
        const updateResult = await student_model_1.Student.updateMany({
            $or: [
                { _id: { $in: validStudentObjectIds } },
                { id: { $in: studentIds } },
            ],
            instituteId,
        }, {
            $set: {
                batchId: targetClass._id,
                batchName: targetClass.name,
                className: targetClass.name,
            },
        });
        return {
            shiftedCount: updateResult.modifiedCount,
            sourceClass: sourceClass.name,
            targetClass: targetClass.name,
        };
    },
};
