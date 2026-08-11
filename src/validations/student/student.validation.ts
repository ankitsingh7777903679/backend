import { z } from "zod";

export const createStudentSchema = z.object({
  name:                  z.string().min(2, "Name must be at least 2 characters").optional(),
  firstName:             z.string().optional(),
  lastName:              z.string().optional(),
  phone:                 z.string().min(10, "Valid 10-digit mobile number required"),
  email:                 z.string().email("Valid email address required").optional().or(z.literal("")),
  gender:                z.enum(["male", "female", "other"]).optional().default("male"),
  parentName:            z.string().optional(),
  parentPhone:           z.string().optional(),
  className:             z.string().optional(),
  batchName:             z.string().optional(),
  batchId:               z.string().optional(),
  schoolName:            z.string().optional(),
  schoolClass:           z.string().optional(),
  monthlyFee:            z.union([z.number(), z.string()]).optional(),
  timing:                z.string().optional(),
  address:               z.string().optional(),
  feeBillingType:        z.enum(["monthly", "installment", "lumpsum"]).optional(),
  billingCycleType:      z.enum(["monthly", "installment", "lumpsum"]).optional(),
  totalCourseFee:        z.number().optional(),
  numberOfInstallments:  z.number().optional(),
  installmentPlan:       z.array(
    z.object({
      installmentNo: z.number(),
      title: z.string(),
      amount: z.number(),
      dueDate: z.string().or(z.date()),
      paidAmount: z.number().optional(),
      dueAmount: z.number().optional(),
      feeStatus: z.enum(["paid", "pending", "partial", "overdue", "verification_pending"]).optional(),
    })
  ).optional(),
  portalAccessEnabled:   z.boolean().optional().default(false),
});

export const updateStudentSchema = createStudentSchema.partial();
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
