import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudentAnswer {
  questionIndex: number;
  questionText: string;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
  marksAwarded: number;
  explanation?: string;
}

export interface IExamResult extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  examId: Types.ObjectId;
  studentId: Types.ObjectId;
  studentName: string;
  rollNo?: string;
  marksObtained: number;
  totalMarks: number;
  passingMarks: number;
  isPassed: boolean;
  rank?: number;
  remarks?: string;
  studentAnswers?: IStudentAnswer[];
  status: "active" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const studentAnswerSchema = new Schema<IStudentAnswer>({
  questionIndex: { type: Number, required: true },
  questionText: { type: String, required: true },
  selectedOption: { type: String, required: true },
  correctOption: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  marksAwarded: { type: Number, required: true, default: 0 },
  explanation: { type: String, default: "" },
});

const examResultSchema = new Schema<IExamResult>(
  {
    instituteId:   { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    examId:        { type: Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    studentId:     { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    studentName:   { type: String, required: true, trim: true },
    rollNo:        { type: String, trim: true },
    marksObtained: { type: Number, required: true, default: 0 },
    totalMarks:    { type: Number, required: true },
    passingMarks:  { type: Number, required: true },
    isPassed:      { type: Boolean, required: true },
    rank:          { type: Number, default: 1 },
    remarks:       { type: String, trim: true, default: "" },
    studentAnswers: [studentAnswerSchema],
    status:        { type: String, enum: ["active", "deleted"], default: "active" },
  },
  { timestamps: true }
);

// Compound Index: One result per student per exam in an institute
examResultSchema.index({ instituteId: 1, examId: 1, studentId: 1 }, { unique: true });
examResultSchema.index({ instituteId: 1, examId: 1 });

export const ExamResult = mongoose.model<IExamResult>("ExamResult", examResultSchema);
