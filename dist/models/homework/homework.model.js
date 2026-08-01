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
exports.Homework = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const homeworkSchema = new mongoose_1.Schema({
    instituteId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    title: { type: String, required: true, trim: true },
    batchId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Batch" },
    batchName: { type: String, required: true, trim: true, default: "NEET 2026 Morning Batch" },
    subject: { type: String, required: true, trim: true, default: "Chemistry" },
    description: { type: String, trim: true },
    dueDate: { type: Date, required: true },
    attachmentUrl: { type: String },
    attachmentName: { type: String, default: "reaction_sheet.pdf" },
    totalSubmissions: { type: Number, default: 0 },
    totalEnrolled: { type: Number, default: 28 },
    homeworkStatus: { type: String, enum: ["active", "grading_pending", "completed"], default: "active" },
    createdByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["active", "deleted"], default: "active" },
}, { timestamps: true });
homeworkSchema.index({ instituteId: 1, homeworkStatus: 1 });
homeworkSchema.index({ instituteId: 1, dueDate: 1 });
exports.Homework = mongoose_1.default.model("Homework", homeworkSchema);
