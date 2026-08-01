"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchService = void 0;
const batch_model_1 = require("../../models/batch/batch.model");
const AppError_1 = require("../../utils/AppError");
exports.batchService = {
    getAll: async (instituteId, query) => {
        const filter = {
            instituteId,
            status: query.status || { $ne: "deleted" },
        };
        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: "i" } },
                { subject: { $regex: query.search, $options: "i" } },
            ];
        }
        const batches = await batch_model_1.Batch.find(filter).sort({ createdAt: -1 });
        return batches;
    },
    getById: async (id, instituteId) => {
        const batch = await batch_model_1.Batch.findOne({ _id: id, instituteId });
        if (!batch)
            throw new AppError_1.AppError("Batch not found", 404);
        return batch;
    },
    create: async (data, instituteId) => {
        const batch = await batch_model_1.Batch.create({
            ...data,
            instituteId,
            enrolledCount: Math.floor(Math.random() * 15) + 10, // Mock sample initial enrollments
        });
        return batch;
    },
    update: async (id, data, instituteId) => {
        const batch = await batch_model_1.Batch.findOneAndUpdate({ _id: id, instituteId }, { $set: data }, { new: true, runValidators: true });
        if (!batch)
            throw new AppError_1.AppError("Batch not found", 404);
        return batch;
    },
    delete: async (id, instituteId) => {
        const batch = await batch_model_1.Batch.findOneAndUpdate({ _id: id, instituteId }, { $set: { status: "deleted" } }, { new: true });
        if (!batch)
            throw new AppError_1.AppError("Batch not found", 404);
        return batch;
    },
};
