"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeacherSchema = exports.createTeacherSchema = void 0;
const zod_1 = require("zod");
exports.createTeacherSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Teacher name must be at least 2 characters"),
    phone: zod_1.z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
    email: zod_1.z.string().email("Valid email address required").optional().or(zod_1.z.literal("")),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters").optional().or(zod_1.z.literal("")),
    subjects: zod_1.z.array(zod_1.z.string()).min(1, "Select at least one subject"),
    qualification: zod_1.z.string().optional(),
    experienceYears: zod_1.z.number().min(0, "Experience years must be positive"),
    employmentType: zod_1.z.enum(["full_time", "part_time", "guest"]).default("full_time"),
    teachingType: zod_1.z.enum(["coaching", "home_tuition", "both"]).default("coaching"),
    portalAccessEnabled: zod_1.z.boolean().optional().default(false),
    photo: zod_1.z.string().optional(),
    assignedBatchIds: zod_1.z.array(zod_1.z.string()).optional(),
    permissions: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.updateTeacherSchema = exports.createTeacherSchema.partial();
