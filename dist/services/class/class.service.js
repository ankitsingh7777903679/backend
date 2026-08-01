"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classService = void 0;
const class_model_1 = require("../../models/class/class.model");
const student_model_1 = require("../../models/student/student.model");
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
    getAll: async (instituteId) => {
        const classes = await class_model_1.Class.find({ instituteId, status: { $ne: "deleted" } }).sort({ createdAt: -1 });
        // Calculate real student counts for each class
        const classesWithCounts = await Promise.all(classes.map(async (c) => {
            const studentCount = await student_model_1.Student.countDocuments({
                instituteId,
                batchId: c._id,
                status: { $ne: "deleted" },
            });
            return {
                id: c._id.toString(),
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
        const cls = await class_model_1.Class.findOne({ _id: id, instituteId, status: { $ne: "deleted" } });
        if (!cls)
            throw new AppError_1.AppError("Class not found", 404);
        return cls;
    },
    update: async (id, data, instituteId) => {
        const cls = await class_model_1.Class.findOne({ _id: id, instituteId, status: { $ne: "deleted" } });
        if (!cls)
            throw new AppError_1.AppError("Class not found", 404);
        if (data.name && data.name !== cls.name) {
            const duplicate = await class_model_1.Class.findOne({
                instituteId,
                name: data.name,
                _id: { $ne: id },
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
        const cls = await class_model_1.Class.findOne({ _id: id, instituteId, status: { $ne: "deleted" } });
        if (!cls)
            throw new AppError_1.AppError("Class not found", 404);
        cls.status = "deleted";
        await cls.save();
        return true;
    },
    shiftStudents: async (data, instituteId) => {
        const { sourceClassId, targetClassId, studentIds } = data;
        const sourceClass = await class_model_1.Class.findOne({ _id: sourceClassId, instituteId, status: { $ne: "deleted" } });
        const targetClass = await class_model_1.Class.findOne({ _id: targetClassId, instituteId, status: { $ne: "deleted" } });
        if (!sourceClass || !targetClass) {
            throw new AppError_1.AppError("Source or target class not found", 404);
        }
        if (!studentIds || studentIds.length === 0) {
            throw new AppError_1.AppError("No students selected to shift", 400);
        }
        // Move selected students to target class — update both batchId AND batchName/className
        const updateResult = await student_model_1.Student.updateMany({
            _id: { $in: studentIds },
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
