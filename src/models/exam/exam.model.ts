import mongoose, { Schema, Document, Types } from "mongoose";

export interface IQuestion {
  _id?: Types.ObjectId;
  questionText: string;
  options: { id: "A" | "B" | "C" | "D"; text: string }[];
  correctOption: "A" | "B" | "C" | "D";
  marks: number;
  explanation?: string;
}

export interface IExam extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  title: string;
  batchId?: Types.ObjectId;
  batchName: string;
  subject?: string;
  examType: "mock_test" | "chapter_test" | "unit_test" | "term_exam";
  mode?: "offline" | "online_mcq";
  examDate: Date;
  startTime: string;
  durationMins: number;
  totalMarks: number;
  passingMarks: number;
  examStatus: "scheduled" | "evaluating" | "completed";
  questions?: IQuestion[];
  createdByUserId?: Types.ObjectId;
  status: "active" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>({
  questionText: { type: String, required: true, trim: true },
  options: [
    {
      id: { type: String, required: true, enum: ["A", "B", "C", "D"] },
      text: { type: String, required: true, trim: true },
    },
  ],
  correctOption: { type: String, required: true, enum: ["A", "B", "C", "D"] },
  marks: { type: Number, required: true, default: 4 },
  explanation: { type: String, trim: true, default: "" },
});

const examSchema = new Schema<IExam>(
  {
    instituteId:     { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    title:           { type: String, required: true, trim: true },
    batchId:         { type: Schema.Types.ObjectId, ref: "Batch" },
    batchName:       { type: String, required: true, trim: true, default: "NEET 2026 Morning Batch" },
    subject:         { type: String, trim: true, default: "Physics & Chemistry" },
    examType:        { type: String, enum: ["mock_test", "chapter_test", "unit_test", "term_exam"], default: "mock_test" },
    mode:            { type: String, enum: ["offline", "online_mcq"], default: "offline" },
    examDate:        { type: Date, required: true },
    startTime:       { type: String, required: true, default: "10:00 AM" },
    durationMins:    { type: Number, required: true, default: 180 },
    totalMarks:      { type: Number, required: true, default: 720 },
    passingMarks:    { type: Number, required: true, default: 300 },
    examStatus:      { type: String, enum: ["scheduled", "evaluating", "completed"], default: "scheduled" },
    questions:       [questionSchema],
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    status:          { type: String, enum: ["active", "deleted"], default: "active" },
  },
  { timestamps: true }
);

examSchema.index({ instituteId: 1, examStatus: 1 });
examSchema.index({ instituteId: 1, examDate: 1 });

export const Exam = mongoose.model<IExam>("Exam", examSchema);
