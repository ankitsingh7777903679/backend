import { z } from "zod";

export const createTemplateSchema = z.object({
  name:       z.string().min(2, "Template name is required"),
  category:   z.enum(["attendance", "fee", "exam", "announcement"]).default("attendance"),
  templateId: z.string().min(1, "Template ID / Code required"),
  bodyText:   z.string().min(5, "Template body text required"),
  variables:  z.array(z.string()).default([]),
});

export const sendBroadcastSchema = z.object({
  templateId:   z.string().min(1, "Template ID required"),
  phoneNumbers: z.array(z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile required")).min(1, "At least 1 phone number required"),
  params:       z.record(z.string(), z.string()).optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type SendBroadcastInput = z.infer<typeof sendBroadcastSchema>;
