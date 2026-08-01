import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBatch extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  classId?: Types.ObjectId;
  teacherId?: Types.ObjectId;
  teacherName?: string;
  name: string;
  subject: string;
  days: string[]; // e.g. ["Mon", "Wed", "Fri"]
  startTime: string; // e.g. "08:00 AM"
  endTime: string; // e.g. "10:30 AM"
  roomNo?: string;
  fees: number;
  capacity: number;
  enrolledCount: number;
  status: "active" | "inactive" | "completed" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    instituteId:   { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    classId:       { type: Schema.Types.ObjectId, ref: "Class" },
    teacherId:     { type: Schema.Types.ObjectId, ref: "User" },
    teacherName:   { type: String, trim: true, default: "Prof. Rahul Sharma" },
    name:          { type: String, required: true, trim: true },
    subject:       { type: String, required: true, trim: true },
    days:          [{ type: String }],
    startTime:     { type: String, required: true },
    endTime:       { type: String, required: true },
    roomNo:        { type: String, trim: true },
    fees:          { type: Number, required: true, default: 0 },
    capacity:      { type: Number, required: true, default: 30 },
    enrolledCount: { type: Number, default: 0 },
    status:        { type: String, enum: ["active", "inactive", "completed", "deleted"], default: "active" },
  },
  { timestamps: true }
);

batchSchema.index({ instituteId: 1, status: 1 });
batchSchema.index({ instituteId: 1, classId: 1 });

export const Batch = mongoose.model<IBatch>("Batch", batchSchema);
