"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentSchema = exports.createStudentSchema = void 0;
const zod_1 = require("zod");
exports.createStudentSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters").optional(),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    phone: zod_1.z.string().min(10, "Valid 10-digit mobile number required"),
    email: zod_1.z.string().email("Valid email address required").optional().or(zod_1.z.literal("")),
    gender: zod_1.z.enum(["male", "female", "other"]).optional().default("male"),
    parentName: zod_1.z.string().optional(),
    parentPhone: zod_1.z.string().optional(),
    className: zod_1.z.string().optional(),
    batchName: zod_1.z.string().optional(),
    batchId: zod_1.z.string().optional(),
    schoolName: zod_1.z.string().optional(),
    schoolClass: zod_1.z.string().optional(),
    monthlyFee: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    timing: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    feeBillingType: zod_1.z.enum(["monthly", "installment", "lumpsum"]).optional(),
    billingCycleType: zod_1.z.enum(["monthly", "installment", "lumpsum"]).optional(),
    totalCourseFee: zod_1.z.number().optional(),
    numberOfInstallments: zod_1.z.number().optional(),
    installmentPlan: zod_1.z.array(zod_1.z.object({
        installmentNo: zod_1.z.number(),
        title: zod_1.z.string(),
        amount: zod_1.z.number(),
        dueDate: zod_1.z.string().or(zod_1.z.date()),
        paidAmount: zod_1.z.number().optional(),
        dueAmount: zod_1.z.number().optional(),
        feeStatus: zod_1.z.enum(["paid", "pending", "partial", "overdue", "verification_pending"]).optional(),
    })).optional(),
    portalAccessEnabled: zod_1.z.boolean().optional().default(false),
});
exports.updateStudentSchema = exports.createStudentSchema.partial();
