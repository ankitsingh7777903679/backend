"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectPaymentProofSchema = exports.approvePaymentProofSchema = exports.submitPaymentProofSchema = exports.setupInstallmentPlanSchema = exports.recordFeeSchema = void 0;
const zod_1 = require("zod");
exports.recordFeeSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, "Student is required"),
    studentName: zod_1.z.string().min(1, "Student name is required"),
    admissionNo: zod_1.z.string().min(1, "Admission number is required"),
    batchName: zod_1.z.string().min(1, "Batch name is required"),
    month: zod_1.z.string().default("July 2026"),
    totalAmount: zod_1.z.number().min(0, "Total amount must be positive"),
    paidAmount: zod_1.z.number().min(0, "Paid amount must be positive"),
    paymentMethod: zod_1.z.enum(["upi", "cash", "bank_transfer", "cheque", "razorpay"]).default("upi"),
    previousArrears: zod_1.z.number().optional(),
    discountApplied: zod_1.z.number().optional(),
    registrationFeeApplied: zod_1.z.number().optional(),
    dueDate: zod_1.z.string().optional(),
    transactionId: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
    feeType: zod_1.z.enum(["monthly", "installment", "lumpsum", "registration", "other"]).optional(),
    installmentNo: zod_1.z.number().optional(),
    installmentName: zod_1.z.string().optional(),
    totalInstallments: zod_1.z.number().optional(),
});
exports.setupInstallmentPlanSchema = zod_1.z.object({
    totalCourseFee: zod_1.z.number().min(0, "Total course fee must be positive"),
    numberOfInstallments: zod_1.z.number().int().min(2).max(10),
    installmentPlan: zod_1.z.array(zod_1.z.object({
        installmentNo: zod_1.z.number().int().min(1),
        title: zod_1.z.string().min(1, "Title is required"),
        amount: zod_1.z.number().min(0, "Amount must be positive"),
        dueDate: zod_1.z.string().or(zod_1.z.date()),
        remarks: zod_1.z.string().optional(),
    })).min(2),
});
exports.submitPaymentProofSchema = zod_1.z.object({
    feeId: zod_1.z.string().regex(/^[a-f\d]{24}$/i, "Valid fee ID is required"),
    paymentProofUrl: zod_1.z.string().url("A valid payment proof URL is required"),
    studentUtrNumber: zod_1.z.string().trim().min(4).max(100),
    lateFeeAmount: zod_1.z.number().min(0).optional(),
    studentSubmittedAmount: zod_1.z.number().positive().optional(),
});
exports.approvePaymentProofSchema = zod_1.z.object({ approvedAmount: zod_1.z.number().positive().optional() });
exports.rejectPaymentProofSchema = zod_1.z.object({ rejectionReason: zod_1.z.string().trim().min(3).max(500) });
