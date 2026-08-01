"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitLiveExamSchema = exports.updateExamSchema = exports.createExamSchema = void 0;
const zod_1 = require("zod");
const questionOptionSchema = zod_1.z.object({
    id: zod_1.z.enum(["A", "B", "C", "D"]),
    text: zod_1.z.string().min(1, "Option text required"),
});
const questionItemSchema = zod_1.z.object({
    questionText: zod_1.z.string().min(1, "Question text required"),
    options: zod_1.z.array(questionOptionSchema).min(2),
    correctOption: zod_1.z.enum(["A", "B", "C", "D"]),
    marks: zod_1.z.number().default(4),
    explanation: zod_1.z.string().optional(),
});
exports.createExamSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, "Exam title is required"),
    batchName: zod_1.z.string().min(1, "Batch name is required"),
    subject: zod_1.z.string().optional(),
    examType: zod_1.z.enum(["mock_test", "chapter_test", "unit_test", "term_exam"]).default("mock_test"),
    mode: zod_1.z.enum(["offline", "online_mcq"]).default("offline"),
    examDate: zod_1.z.string().min(1, "Exam date is required"),
    startTime: zod_1.z.string().default("10:00 AM"),
    durationMins: zod_1.z.number().min(5, "Duration must be at least 5 minutes"),
    totalMarks: zod_1.z.number().min(1, "Total marks required"),
    passingMarks: zod_1.z.number().min(1, "Passing marks required"),
    examStatus: zod_1.z.enum(["scheduled", "evaluating", "completed"]).default("scheduled"),
    questions: zod_1.z.array(questionItemSchema).optional(),
});
exports.updateExamSchema = exports.createExamSchema.partial();
exports.submitLiveExamSchema = zod_1.z.object({
    answers: zod_1.z.array(zod_1.z.object({
        questionIndex: zod_1.z.number(),
        selectedOption: zod_1.z.enum(["A", "B", "C", "D"]),
    })),
});
