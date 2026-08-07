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
});

export type RecordFeeInput = z.infer<typeof recordFeeSchema>;
