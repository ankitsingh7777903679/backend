"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHomeworkSchema = exports.createHomeworkSchema = void 0;
const zod_1 = require("zod");
exports.createHomeworkSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, "Homework title is required"),
    batchName: zod_1.z.string().min(1, "Batch name is required"),
    subject: zod_1.z.string().min(1, "Subject is required"),
    description: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().min(1, "Due date is required"),
    attachmentName: zod_1.z.string().optional(),
    homeworkStatus: zod_1.z.enum(["active", "grading_pending", "completed"]).default("active"),
});
exports.updateHomeworkSchema = exports.createHomeworkSchema.partial();
