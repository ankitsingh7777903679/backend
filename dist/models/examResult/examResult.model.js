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
exports.ExamResult = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const studentAnswerSchema = new mongoose_1.Schema({
    questionIndex: { type: Number, required: true },
    questionText: { type: String, required: true },
    selectedOption: { type: String, required: true },
    correctOption: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    marksAwarded: { type: Number, required: true, default: 0 },
    explanation: { type: String, default: "" },
});
const examResultSchema = new mongoose_1.Schema({
    instituteId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    examId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    rollNo: { type: String, trim: true },
    marksObtained: { type: Number, required: true, default: 0 },
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    isPassed: { type: Boolean, required: true },
    rank: { type: Number, default: 1 },
    remarks: { type: String, trim: true, default: "" },
    studentAnswers: [studentAnswerSchema],
    status: { type: String, enum: ["active", "deleted"], default: "active" },
}, { timestamps: true });
// Compound Index: One result per student per exam in an institute
examResultSchema.index({ instituteId: 1, examId: 1, studentId: 1 }, { unique: true });
examResultSchema.index({ instituteId: 1, examId: 1 });
exports.ExamResult = mongoose_1.default.model("ExamResult", examResultSchema);
