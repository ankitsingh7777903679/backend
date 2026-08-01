import { z } from "zod";

export const createBatchSchema = z.object({
  name:        z.string().min(2, "Batch name must be at least 2 characters"),
  subject:     z.string().min(1, "Subject/Category is required"),
  teacherName: z.string().optional(),
  startTime:   z.string().min(1, "Start time is required"),
  endTime:     z.string().min(1, "End time is required"),
  days:        z.array(z.string()).min(1, "Select at least one day"),
  fees:        z.number().min(0, "Fees must be positive"),
  capacity:    z.number().min(1, "Capacity must be at least 1"),
  roomNo:      z.string().optional(),
});

export const updateBatchSchema = createBatchSchema.partial();
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
