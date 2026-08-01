"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeacherSchema = exports.createTeacherSchema = void 0;
const zod_1 = require("zod");
exports.createTeacherSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Teacher name must be at least 2 characters"),
    phone: zod_1.z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
    email: zod_1.z.string().email("Valid email address required"),
    subjects: zod_1.z.array(zod_1.z.string()).min(1, "Select at least one subject"),
    qualification: zod_1.z.string().optional(),
    experienceYears: zod_1.z.number().min(0, "Experience years must be positive"),
    employmentType: zod_1.z.enum(["full_time", "part_time", "guest"]).default("full_time"),
    photo: zod_1.z.string().optional(),
});
exports.updateTeacherSchema = exports.createTeacherSchema.partial();
