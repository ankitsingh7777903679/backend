import { z } from "zod";

export const recordFeeSchema = z.object({
  studentId:     z.string().min(1, "Student is required"),
  studentName:   z.string().min(1, "Student name is required"),
  admissionNo:   z.string().min(1, "Admission number is required"),
  batchName:     z.string().min(1, "Batch name is required"),
  month:         z.string().default("July 2026"),
  totalAmount:   z.number().min(0, "Total amount must be positive"),
  paidAmount:    z.number().min(0, "Paid amount must be positive"),
  paymentMethod: z.enum(["upi", "cash", "bank_transfer", "cheque", "razorpay"]).default("upi"),
  previousArrears: z.number().optional(),
  discountApplied: z.number().optional(),
  registrationFeeApplied: z.number().optional(),
  dueDate:       z.string().optional(),
  transactionId: z.string().optional(),
  remarks:       z.string().optional(),
  feeType:       z.enum(["monthly", "installment", "lumpsum", "registration", "other"]).optional(),
  installmentNo: z.number().optional(),
  installmentName: z.string().optional(),
  totalInstallments: z.number().optional(),
});

export type RecordFeeInput = z.infer<typeof recordFeeSchema>;

export const setupInstallmentPlanSchema = z.object({
  totalCourseFee: z.number().min(0, "Total course fee must be positive"),
  numberOfInstallments: z.number().int().min(2).max(10),
  installmentPlan: z.array(
    z.object({
      installmentNo: z.number().int().min(1),
      title: z.string().min(1, "Title is required"),
      amount: z.number().min(0, "Amount must be positive"),
      dueDate: z.string().or(z.date()),
      remarks: z.string().optional(),
    })
  ).min(2),
});

export type SetupInstallmentPlanInput = z.infer<typeof setupInstallmentPlanSchema>;
