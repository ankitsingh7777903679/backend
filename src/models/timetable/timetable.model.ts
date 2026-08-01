import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITimetableSlot extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  batchId?: Types.ObjectId;
  batchName: string;
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string;
  endTime: string;
  subject: string;
  topic?: string;
  teacherId?: Types.ObjectId;
  teacherName: string;
  roomNo: string;
  classStatus: "scheduled" | "in_progress" | "completed" | "cancelled";
  status: "active" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const timetableSchema = new Schema<ITimetableSlot>(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    batchId:     { type: Schema.Types.ObjectId, ref: "Batch" },
    batchName:   { type: String, required: true, trim: true, default: "NEET 2026 Morning Batch" },
    dayOfWeek:   { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], required: true },
    startTime:   { type: String, required: true, default: "08:00 AM" },
    endTime:     { type: String, required: true, default: "09:30 AM" },
    subject:     { type: String, required: true, trim: true, default: "Physics" },
    topic:       { type: String, trim: true, default: "Electrostatics & Potential" },
    teacherId:   { type: Schema.Types.ObjectId, ref: "Teacher" },
    teacherName: { type: String, required: true, trim: true, default: "Prof. Rahul Sharma" },
    roomNo:      { type: String, required: true, trim: true, default: "Room 102" },
    classStatus: { type: String, enum: ["scheduled", "in_progress", "completed", "cancelled"], default: "scheduled" },
    status:      { type: String, enum: ["active", "deleted"], default: "active" },
  },
  { timestamps: true }
);

timetableSchema.index({ instituteId: 1, dayOfWeek: 1 });
timetableSchema.index({ instituteId: 1, batchName: 1 });

export const Timetable = mongoose.model<ITimetableSlot>("Timetable", timetableSchema);
