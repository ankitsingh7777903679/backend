import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISetting extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  academicYear: string;
  language: string;
  timezone: string;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  attendanceReminderTime: string;
  feeReminderDaysBefore: number;
  upiId?: string;
  payeeName?: string;
  upiNote?: string;
  lateFeePerDay?: number;
  dueDayOfMonth?: number;
  graceDays?: number;
  status: "active" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    instituteId:             { type: Schema.Types.ObjectId, ref: "Institute", required: true, unique: true, index: true },
    academicYear:            { type: String, default: "2026-2027" },
    language:                { type: String, default: "en" },
    timezone:                { type: String, default: "Asia/Kolkata" },
    whatsappEnabled:         { type: Boolean, default: true },
    emailEnabled:            { type: Boolean, default: true },
    smsEnabled:              { type: Boolean, default: false },
    attendanceReminderTime:  { type: String, default: "10:30 AM" },
    feeReminderDaysBefore:   { type: Number, default: 5 },
    upiId:                   { type: String, trim: true },
    payeeName:               { type: String, trim: true },
    upiNote:                 { type: String, trim: true, default: "Monthly Tuition Fee" },
    lateFeePerDay:           { type: Number, default: 10 },
    dueDayOfMonth:           { type: Number, default: 5 },
    graceDays:               { type: Number, default: 2 },
    status:                  { type: String, enum: ["active", "deleted"], default: "active" },
  },
  { timestamps: true }
);

export const Setting = mongoose.model<ISetting>("Setting", settingSchema);
