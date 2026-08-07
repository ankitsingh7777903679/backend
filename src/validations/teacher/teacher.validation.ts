import { z } from "zod";

export const createTeacherSchema = z.object({
  name:            z.string().min(2, "Teacher name must be at least 2 characters"),
  phone:           z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
  email:           z.string().email("Valid email address required").optional().or(z.literal("")),
  password:        z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  subjects:        z.array(z.string()).min(1, "Select at least one subject"),
  qualification:   z.string().optional(),
  experienceYears: z.number().min(0, "Experience years must be positive"),
  employmentType:  z.enum(["full_time", "part_time", "guest"]).default("full_time"),
  photo:           z.string().optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial();
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
