import { z } from "zod";

export const createNoticeSchema = z.object({
  title:           z.string().min(2, "Notice title is required"),
  body:            z.string().min(5, "Notice body content is required"),
  targetAudience:  z.enum(["all", "students", "teachers", "parents", "batch_specific"]).default("all"),
  targetBatchName: z.string().optional(),
  priority:        z.enum(["high", "medium", "normal"]).default("normal"),
  sendWhatsApp:    z.boolean().default(true),
  sendInApp:       z.boolean().default(true),
  attachmentName:  z.string().optional(),
});

export const updateNoticeSchema = createNoticeSchema.partial();
export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
