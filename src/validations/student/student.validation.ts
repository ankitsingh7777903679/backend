import { z } from "zod";

export const createStudentSchema = z.object({
  name:        z.string().min(2, "Name must be at least 2 characters").optional(),
  firstName:   z.string().optional(),
  lastName:    z.string().optional(),
  phone:       z.string().min(10, "Valid 10-digit mobile number required"),
  email:       z.string().email("Valid email address required").optional().or(z.literal("")),
  gender:      z.enum(["male", "female", "other"]).optional().default("male"),
  parentName:  z.string().optional(),
  parentPhone: z.string().optional(),
  className:   z.string().optional(),
  batchName:   z.string().optional(),
  batchId:     z.string().optional(),
  schoolName:  z.string().optional(),
  schoolClass: z.string().optional(),
  monthlyFee:  z.union([z.number(), z.string()]).optional(),
  timing:      z.string().optional(),
  address:     z.string().optional(),
});

export const updateStudentSchema = createStudentSchema.partial();
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
