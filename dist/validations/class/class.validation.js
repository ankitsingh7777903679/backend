"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftStudentsValidator = exports.updateClassValidator = exports.createClassValidator = void 0;
const zod_1 = require("zod");
exports.createClassValidator = zod_1.z.object({
    name: zod_1.z.string().min(2, "Class name must be at least 2 characters"),
    timing: zod_1.z.string().optional(),
    shift: zod_1.z.enum(["morning", "evening"]).optional().default("morning"),
    days: zod_1.z.string().optional().default("Mon – Sat (Daily)"),
    description: zod_1.z.string().optional(),
    subjects: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.updateClassValidator = exports.createClassValidator.partial();
exports.shiftStudentsValidator = zod_1.z.object({
    sourceClassId: zod_1.z.string().min(1, "Source class required"),
    targetClassId: zod_1.z.string().min(1, "Target class required"),
    studentIds: zod_1.z.array(zod_1.z.string()).min(1, "At least one student must be selected"),
});
