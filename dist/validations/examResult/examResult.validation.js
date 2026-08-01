"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitExamResultsSchema = exports.singleStudentMarkSchema = void 0;
const zod_1 = require("zod");
exports.singleStudentMarkSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, "Student ID is required"),
    studentName: zod_1.z.string().min(1, "Student name is required"),
    rollNo: zod_1.z.string().optional(),
    marksObtained: zod_1.z.number().min(0, "Marks obtained cannot be negative"),
    remarks: zod_1.z.string().optional(),
});
exports.submitExamResultsSchema = zod_1.z.object({
    results: zod_1.z.array(exports.singleStudentMarkSchema).min(1, "At least one student mark entry is required"),
});
