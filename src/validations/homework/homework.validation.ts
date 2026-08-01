import { z } from "zod";

export const createHomeworkSchema = z.object({
  title:          z.string().min(2, "Homework title is required"),
  batchName:      z.string().min(1, "Batch name is required"),
  subject:        z.string().min(1, "Subject is required"),
  description:    z.string().optional(),
  dueDate:        z.string().min(1, "Due date is required"),
  attachmentName: z.string().optional(),
  attachmentUrl:  z.string().optional(),
  driveFileId:     z.string().optional(),
  homeworkStatus: z.enum(["active", "grading_pending", "completed"]).optional().default("active"),
});

export const updateHomeworkSchema = createHomeworkSchema.partial();
export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>;
