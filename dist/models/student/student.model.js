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
exports.Student = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const studentSchema = new mongoose_1.Schema({
    instituteId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    admissionNo: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    dob: { type: Date },
    parentName: { type: String, required: true, trim: true },
    parentPhone: { type: String, required: true, trim: true },
    batchId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Batch" },
    batchName: { type: String, trim: true, default: "General Class" },
    schoolName: { type: String, trim: true, default: "" },
    schoolClass: { type: String, trim: true, default: "" },
    monthlyFee: { type: Number, default: 1500 },
    timing: { type: String, trim: true, default: "05:00 PM" },
    address: { type: String, trim: true },
    photo: { type: String },
    feeStatus: { type: String, enum: ["paid", "pending", "overdue"], default: "paid" },
    attendancePercentage: { type: Number, default: 95 },
    status: { type: String, enum: ["active", "inactive", "alumni", "deleted"], default: "active" },
}, { timestamps: true });
studentSchema.index({ instituteId: 1, status: 1 });
studentSchema.index({ instituteId: 1, phone: 1 });
studentSchema.index({ instituteId: 1, admissionNo: 1 }, { unique: true });
exports.Student = mongoose_1.default.model("Student", studentSchema);
