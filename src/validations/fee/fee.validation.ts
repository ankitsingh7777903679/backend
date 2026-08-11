import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Valid ObjectId is required");
const money = z.number({ invalid_type_error: "Amount must be a number" }).finite("Amount must be a valid number").min(0, "Amount must be non-negative");
const paymentMethod = z.enum(["upi", "cash", "bank_transfer", "cheque", "razorpay"]).default("upi");
const feeType = z.enum(["monthly", "installment", "lumpsum", "registration", "other"]).optional();

export const recordFeeSchema = z.object({
  studentId:     objectId,
  studentName:   z.string().min(1, "Student name is required"),
  admissionNo:   z.string().min(1, "Admission number is required"),
  batchName:     z.string().min(1, "Batch name is required"),
  month:         z.string().default("July 2026"),
  totalAmount:   money,
  paidAmount:    money,
  paymentMethod,
  previousArrears: money.optional(),
  discountApplied: money.optional(),
  registrationFeeApplied: money.optional(),
  dueDate:       z.string().optional(),
  transactionId: z.string().optional(),
  remarks:       z.string().optional(),
  feeType,
  installmentNo: z.number().int("Installment number must be an integer").positive().optional(),
  installmentName: z.string().optional(),
  totalInstallments: z.number().int("Total installments must be an integer").positive().optional(),
});

export type RecordFeeInput = z.infer<typeof recordFeeSchema>;

export const setupInstallmentPlanSchema = z.object({
  totalCourseFee: money,
  numberOfInstallments: z.number().int().min(2).max(10),
  installmentPlan: z.array(
    z.object({
      installmentNo: z.number().int().min(1),
      title: z.string().min(1, "Title is required"),
      amount: money,
      dueDate: z.string().or(z.date()),
      remarks: z.string().optional(),
    })
  ).min(2),
});

export const submitPaymentProofSchema = z.object({
  feeId: objectId,
  paymentProofUrl: z.string().url("A valid payment proof URL is required"),
  studentUtrNumber: z.string().trim().min(4).max(100),
  lateFeeAmount: money.optional(),
  studentSubmittedAmount: money.positive().optional(),
});

export const approvePaymentProofSchema = z.object({ approvedAmount: money.positive().optional() });
export const rejectPaymentProofSchema = z.object({ rejectionReason: z.string().trim().min(3).max(500) });

export type SetupInstallmentPlanInput = z.infer<typeof setupInstallmentPlanSchema>;
