import { z } from "zod";

export const createTimetableSlotSchema = z.object({
  batchName:   z.string().min(1, "Target batch is required"),
  dayOfWeek:   z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  startTime:   z.string().min(1, "Start time is required"),
  endTime:     z.string().min(1, "End time is required"),
  subject:     z.string().min(1, "Subject is required"),
  topic:       z.string().optional(),
  teacherName: z.string().min(1, "Assigned teacher name is required"),
  roomNo:      z.string().min(1, "Room number is required"),
  classStatus: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
});

export const updateTimetableSlotSchema = createTimetableSlotSchema.partial();
export type CreateTimetableSlotInput = z.infer<typeof createTimetableSlotSchema>;
