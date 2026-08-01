import { z } from "zod";

export const createLeadSchema = z.object({
  name:             z.string().min(2, "Lead name must be at least 2 characters"),
  phone:            z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
  email:            z.string().email("Valid email address required").optional().or(z.literal("")),
  parentName:       z.string().optional(),
  parentPhone:      z.string().optional(),
  courseInterested: z.string().min(1, "Interested course is required"),
  leadSource:       z.enum(["walk_in", "google_ads", "facebook_ads", "whatsapp", "website", "referral"]).default("walk_in"),
  pipelineStage:    z.enum(["new", "contacted", "demo_scheduled", "follow_up", "converted", "lost"]).default("new"),
  followUpDate:     z.string().optional(),
  notes:            z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
