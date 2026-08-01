"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exam = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const questionSchema = new mongoose_1.Schema({
    questionText: { type: String, required: true, trim: true },
    options: [
        {
            id: { type: String, required: true, enum: ["A", "B", "C", "D"] },
            text: { type: String, required: true, trim: true },
        },
    ],
    correctOption: { type: String, required: true, enum: ["A", "B", "C", "D"] },
    marks: { type: Number, required: true, default: 4 },
    explanation: { type: String, trim: true, default: "" },
});
const examSchema = new mongoose_1.Schema({
    instituteId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    title: { type: String, required: true, trim: true },
    batchId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Batch" },
    batchName: { type: String, required: true, trim: true, default: "NEET 2026 Morning Batch" },
    subject: { type: String, trim: true, default: "Physics & Chemistry" },
    examType: { type: String, enum: ["mock_test", "chapter_test", "unit_test", "term_exam"], default: "mock_test" },
    mode: { type: String, enum: ["offline", "online_mcq"], default: "offline" },
    examDate: { type: Date, required: true },
    startTime: { type: String, required: true, default: "10:00 AM" },
    durationMins: { type: Number, required: true, default: 180 },
    totalMarks: { type: Number, required: true, default: 720 },
    passingMarks: { type: Number, required: true, default: 300 },
    examStatus: { type: String, enum: ["scheduled", "evaluating", "completed"], default: "scheduled" },
    questions: [questionSchema],
    createdByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["active", "deleted"], default: "active" },
}, { timestamps: true });
examSchema.index({ instituteId: 1, examStatus: 1 });
examSchema.index({ instituteId: 1, examDate: 1 });
exports.Exam = mongoose_1.default.model("Exam", examSchema);
