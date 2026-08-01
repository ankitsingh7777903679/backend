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
exports.Attendance = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const attendanceRecordSchema = new mongoose_1.Schema({
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true },
    admissionNo: { type: String, required: true },
    status: { type: String, enum: ["present", "absent", "late", "leave"], required: true },
    remarks: { type: String },
}, { _id: false });
const attendanceSchema = new mongoose_1.Schema({
    instituteId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    batchId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    batchName: { type: String, required: true },
    date: { type: Date, required: true },
    dateStr: { type: String, required: true, index: true },
    markedByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    markedByName: { type: String, default: "Admin Teacher" },
    records: [attendanceRecordSchema],
    totalPresent: { type: Number, default: 0 },
    totalAbsent: { type: Number, default: 0 },
    totalLate: { type: Number, default: 0 },
    totalLeave: { type: Number, default: 0 },
    whatsappAlertsSent: { type: Boolean, default: false },
}, { timestamps: true });
attendanceSchema.index({ instituteId: 1, batchId: 1, dateStr: 1 }, { unique: true });
attendanceSchema.index({ instituteId: 1, dateStr: 1 });
exports.Attendance = mongoose_1.default.model("Attendance", attendanceSchema);
