import { z } from "zod";

export const singleStudentMarkSchema = z.object({
  studentId:     z.string().min(1, "Student ID is required"),
  studentName:   z.string().min(1, "Student name is required"),
  rollNo:        z.string().optional(),
  marksObtained: z.number().min(0, "Marks obtained cannot be negative"),
  remarks:       z.string().optional(),
});

export const submitExamResultsSchema = z.object({
  results: z.array(singleStudentMarkSchema).min(1, "At least one student mark entry is required"),
});

export type SubmitExamResultsInput = z.infer<typeof submitExamResultsSchema>;
