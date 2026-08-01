import { z } from "zod";

const questionOptionSchema = z.object({
  id: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1, "Option text required"),
});

const questionItemSchema = z.object({
  questionText: z.string().min(1, "Question text required"),
  options: z.array(questionOptionSchema).min(2),
  correctOption: z.enum(["A", "B", "C", "D"]),
  marks: z.number().default(4),
  explanation: z.string().optional(),
});

export const createExamSchema = z.object({
  title:        z.string().min(2, "Exam title is required"),
  batchName:    z.string().min(1, "Batch name is required"),
  subject:      z.string().optional(),
  examType:     z.enum(["mock_test", "chapter_test", "unit_test", "term_exam"]).default("mock_test"),
  mode:         z.enum(["offline", "online_mcq"]).default("offline"),
  examDate:     z.string().min(1, "Exam date is required"),
  startTime:    z.string().default("10:00 AM"),
  durationMins: z.number().min(5, "Duration must be at least 5 minutes"),
  totalMarks:   z.number().min(1, "Total marks required"),
  passingMarks: z.number().min(1, "Passing marks required"),
  examStatus:   z.enum(["scheduled", "evaluating", "completed"]).default("scheduled"),
  questions:    z.array(questionItemSchema).optional(),
});

export const updateExamSchema = createExamSchema.partial();
export type CreateExamInput = z.infer<typeof createExamSchema>;

export const submitLiveExamSchema = z.object({
  answers: z.array(
    z.object({
      questionIndex: z.number(),
      selectedOption: z.enum(["A", "B", "C", "D"]),
    })
  ),
});
export type SubmitLiveExamInput = z.infer<typeof submitLiveExamSchema>;
