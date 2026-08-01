import { z } from "zod";

const recordItemSchema = z.object({
  studentId:   z.string().min(1, "Student ID required"),
  studentName: z.string().min(1, "Student name required"),
  admissionNo: z.string().min(1, "Admission number required"),
  status:      z.enum(["present", "absent", "late", "leave"]),
  remarks:     z.string().optional(),
});

export const markAttendanceSchema = z.object({
  batchId:            z.string().min(1, "Batch is required"),
  batchName:          z.string().min(1, "Batch name is required"),
  dateStr:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date format must be YYYY-MM-DD"),
  records:            z.array(recordItemSchema).min(1, "At least one attendance record is required"),
  sendWhatsAppAlerts: z.boolean().default(true),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
