"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timetableService = void 0;
const timetable_model_1 = require("../../models/timetable/timetable.model");
const AppError_1 = require("../../utils/AppError");
exports.timetableService = {
    getAll: async (instituteId, query) => {
        const filter = { instituteId, status: { $ne: "deleted" } };
        if (query.day && query.day !== "all") {
            filter.dayOfWeek = query.day;
        }
        if (query.batch && query.batch !== "all") {
            filter.batchName = { $regex: query.batch, $options: "i" };
        }
        const slots = await timetable_model_1.Timetable.find(filter).sort({ startTime: 1 });
        return slots;
    },
    getById: async (id, instituteId) => {
        const slot = await timetable_model_1.Timetable.findOne({ _id: id, instituteId });
        if (!slot)
            throw new AppError_1.AppError("Class slot not found", 404);
        return slot;
    },
    create: async (data, instituteId) => {
        const slot = await timetable_model_1.Timetable.create({
            ...data,
            instituteId,
        });
        return slot;
    },
    update: async (id, data, instituteId) => {
        const slot = await timetable_model_1.Timetable.findOneAndUpdate({ _id: id, instituteId }, { $set: data }, { new: true, runValidators: true });
        if (!slot)
            throw new AppError_1.AppError("Class slot not found", 404);
        return slot;
    },
    delete: async (id, instituteId) => {
        const slot = await timetable_model_1.Timetable.findOneAndUpdate({ _id: id, instituteId }, { $set: { status: "deleted" } }, { new: true });
        if (!slot)
            throw new AppError_1.AppError("Class slot not found", 404);
        return slot;
    },
};
