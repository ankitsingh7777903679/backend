"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordFeeSchema = void 0;
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
    dueDate: zod_1.z.string().optional(),
    transactionId: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
});
