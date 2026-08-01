"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAttendanceSchema = void 0;
const zod_1 = require("zod");
const recordItemSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, "Student ID required"),
    studentName: zod_1.z.string().min(1, "Student name required"),
    admissionNo: zod_1.z.string().min(1, "Admission number required"),
    status: zod_1.z.enum(["present", "absent", "late", "leave"]),
    remarks: zod_1.z.string().optional(),
});
exports.markAttendanceSchema = zod_1.z.object({
    batchId: zod_1.z.string().min(1, "Batch is required"),
    batchName: zod_1.z.string().min(1, "Batch name is required"),
    dateStr: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date format must be YYYY-MM-DD"),
    records: zod_1.z.array(recordItemSchema).min(1, "At least one attendance record is required"),
    sendWhatsAppAlerts: zod_1.z.boolean().default(true),
});
