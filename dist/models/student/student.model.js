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
    portalAccess: { type: String, enum: ["disabled", "invited", "active"], default: "disabled" },
    admissionNo: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    dob: { type: Date },
    joiningDate: { type: Date, default: Date.now },
    billingCycleType: { type: String, enum: ["monthly", "installment", "lumpsum"], default: "monthly" },
    feeBillingType: { type: String, enum: ["monthly", "installment", "lumpsum"], default: "monthly" },
    totalCourseFee: { type: Number, default: 0 },
    numberOfInstallments: { type: Number, default: 1 },
    installmentPlan: [
        {
            installmentNo: { type: Number, required: true },
            title: { type: String, required: true, trim: true },
            amount: { type: Number, required: true },
            dueDate: { type: Date, required: true },
            paidAmount: { type: Number, default: 0 },
            dueAmount: { type: Number, default: 0 },
            feeStatus: { type: String, enum: ["paid", "pending", "partial", "overdue", "verification_pending"], default: "pending" },
            paidDate: { type: Date },
            receiptNo: { type: String, trim: true },
            transactionId: { type: String, trim: true },
        },
    ],
    oneTimeRegistrationFee: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountReason: { type: String, trim: true },
    parentName: { type: String, required: true, trim: true },
    parentPhone: { type: String, required: true, trim: true },
    batchId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Class" },
    batchName: { type: String, trim: true, default: "General Class" },
    schoolName: { type: String, trim: true, default: "" },
    schoolClass: { type: String, trim: true, default: "" },
    monthlyFee: { type: Number, default: 0 },
    timing: { type: String, trim: true, default: "" },
    address: { type: String, trim: true },
    photo: { type: String },
    feeStatus: { type: String, enum: ["paid", "pending", "partial", "overdue", "verification_pending"], default: "pending" },
    attendancePercentage: { type: Number, default: 100 },
    status: { type: String, enum: ["active", "inactive", "alumni", "deleted"], default: "active" },
}, { timestamps: true });
studentSchema.index({ instituteId: 1, status: 1 });
studentSchema.index({ instituteId: 1, phone: 1 });
studentSchema.index({ instituteId: 1, admissionNo: 1 }, { unique: true });
studentSchema.index({ userId: 1 }, { unique: true, sparse: true });
exports.Student = mongoose_1.default.model("Student", studentSchema);
