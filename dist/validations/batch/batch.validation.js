"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBatchSchema = exports.createBatchSchema = void 0;
const zod_1 = require("zod");
exports.createBatchSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Batch name must be at least 2 characters"),
    subject: zod_1.z.string().min(1, "Subject/Category is required"),
    teacherName: zod_1.z.string().optional(),
    startTime: zod_1.z.string().min(1, "Start time is required"),
    endTime: zod_1.z.string().min(1, "End time is required"),
    days: zod_1.z.array(zod_1.z.string()).min(1, "Select at least one day"),
    fees: zod_1.z.number().min(0, "Fees must be positive"),
    capacity: zod_1.z.number().min(1, "Capacity must be at least 1"),
    roomNo: zod_1.z.string().optional(),
});
exports.updateBatchSchema = exports.createBatchSchema.partial();
