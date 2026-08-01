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
exports.Timetable = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const timetableSchema = new mongoose_1.Schema({
    instituteId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    batchId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Batch" },
    batchName: { type: String, required: true, trim: true, default: "NEET 2026 Morning Batch" },
    dayOfWeek: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], required: true },
    startTime: { type: String, required: true, default: "08:00 AM" },
    endTime: { type: String, required: true, default: "09:30 AM" },
    subject: { type: String, required: true, trim: true, default: "Physics" },
    topic: { type: String, trim: true, default: "Electrostatics & Potential" },
    teacherId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Teacher" },
    teacherName: { type: String, required: true, trim: true, default: "Prof. Rahul Sharma" },
    roomNo: { type: String, required: true, trim: true, default: "Room 102" },
    classStatus: { type: String, enum: ["scheduled", "in_progress", "completed", "cancelled"], default: "scheduled" },
    status: { type: String, enum: ["active", "deleted"], default: "active" },
}, { timestamps: true });
timetableSchema.index({ instituteId: 1, dayOfWeek: 1 });
timetableSchema.index({ instituteId: 1, batchName: 1 });
exports.Timetable = mongoose_1.default.model("Timetable", timetableSchema);
