import { z } from "zod";

export const createClassValidator = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters"),
  timing: z.string().optional(),
  shift: z.enum(["morning", "evening"]).optional().default("morning"),
  days: z.string().optional().default("Mon – Sat (Daily)"),
  description: z.string().optional(),
  subjects: z.array(z.string()).optional(),
});

export const updateClassValidator = createClassValidator.partial();

export const shiftStudentsValidator = z.object({
  sourceClassId: z.string().min(1, "Source class required"),
  targetClassId: z.string().min(1, "Target class required"),
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
});

export type CreateClassInput = z.infer<typeof createClassValidator>;
export type UpdateClassInput = z.infer<typeof updateClassValidator>;
export type ShiftStudentsInput = z.infer<typeof shiftStudentsValidator>;
