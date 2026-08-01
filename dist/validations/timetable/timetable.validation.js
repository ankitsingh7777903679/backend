"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTimetableSlotSchema = exports.createTimetableSlotSchema = void 0;
const zod_1 = require("zod");
exports.createTimetableSlotSchema = zod_1.z.object({
    batchName: zod_1.z.string().min(1, "Target batch is required"),
    dayOfWeek: zod_1.z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
    startTime: zod_1.z.string().min(1, "Start time is required"),
    endTime: zod_1.z.string().min(1, "End time is required"),
    subject: zod_1.z.string().min(1, "Subject is required"),
    topic: zod_1.z.string().optional(),
    teacherName: zod_1.z.string().min(1, "Assigned teacher name is required"),
    roomNo: zod_1.z.string().min(1, "Room number is required"),
    classStatus: zod_1.z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
});
exports.updateTimetableSlotSchema = exports.createTimetableSlotSchema.partial();
