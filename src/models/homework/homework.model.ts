import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAttachmentItem {
  name: string;
  url: string;
  driveFileId?: string;
  type: "file" | "link";
  fileSizeMb?: number;
}

export interface IHomework extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  title: string;
  batchId?: Types.ObjectId;
  batchName: string;
  subject: string;
  description?: string;
  dueDate: Date;
  attachmentUrl?: string;
  attachmentName?: string;
  driveFileId?: string;
  attachments?: IAttachmentItem[];
  totalSubmissions: number;
  totalEnrolled: number;
  homeworkStatus: "active" | "grading_pending" | "completed";
  createdByUserId?: Types.ObjectId;
  status: "active" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const homeworkSchema = new Schema<IHomework>(
  {
    instituteId:      { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    title:            { type: String, required: true, trim: true },
    batchId:          { type: Schema.Types.ObjectId, ref: "Batch" },
    batchName:        { type: String, required: true, trim: true, default: "NEET 2026 Morning Batch" },
    subject:          { type: String, required: true, trim: true, default: "Chemistry" },
    description:      { type: String, trim: true },
    dueDate:          { type: Date, required: true },
    attachmentUrl:    { type: String },
    attachmentName:   { type: String },
    driveFileId:      { type: String },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        driveFileId: { type: String },
        type: { type: String, enum: ["file", "link"], default: "file" },
        fileSizeMb: { type: Number },
      },
    ],
    totalSubmissions: { type: Number, default: 0 },
    totalEnrolled:    { type: Number, default: 0 },
    homeworkStatus:   { type: String, enum: ["active", "grading_pending", "completed"], default: "active" },
    createdByUserId:  { type: Schema.Types.ObjectId, ref: "User" },
    status:           { type: String, enum: ["active", "deleted"], default: "active" },
  },
  { timestamps: true }
);

homeworkSchema.index({ instituteId: 1, homeworkStatus: 1 });
homeworkSchema.index({ instituteId: 1, dueDate: 1 });

export const Homework = mongoose.model<IHomework>("Homework", homeworkSchema);
