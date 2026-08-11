import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAttendanceRecord {
  studentId: Types.ObjectId;
  studentName: string;
  admissionNo: string;
  status: "present" | "absent" | "late" | "leave";
  remarks?: string;
}

export interface IAttendance extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  batchId: Types.ObjectId;
  batchName: string;
  date: Date;
  dateStr: string; // YYYY-MM-DD for fast index lookup
  markedByUserId?: Types.ObjectId;
  markedByName?: string;
  records: IAttendanceRecord[];
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalLeave: number;
  whatsappAlertsSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    studentId:   { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true },
    admissionNo: { type: String, required: true },
    status:      { type: String, enum: ["present", "absent", "late", "leave"], required: true },
    remarks:     { type: String },
  },
  { _id: false }
);

const attendanceSchema = new Schema<IAttendance>(
  {
    instituteId:        { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    batchId:            { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    batchName:          { type: String, required: true },
    date:               { type: Date, required: true },
    dateStr:            { type: String, required: true, index: true },
    markedByUserId:     { type: Schema.Types.ObjectId, ref: "User" },
    markedByName:       { type: String, default: "Admin Teacher" },
    records:            [attendanceRecordSchema],
    totalPresent:       { type: Number, default: 0 },
    totalAbsent:        { type: Number, default: 0 },
    totalLate:          { type: Number, default: 0 },
    totalLeave:         { type: Number, default: 0 },
    whatsappAlertsSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

attendanceSchema.index({ instituteId: 1, batchId: 1, dateStr: 1 }, { unique: true });
attendanceSchema.index({ instituteId: 1, dateStr: 1 });

export const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);
