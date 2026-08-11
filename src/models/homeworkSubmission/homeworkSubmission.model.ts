import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubmissionAttachmentItem {
  name: string;
  url: string;
  driveFileId?: string;
  type: "file" | "link";
  fileSizeMb?: number;
}

export interface IHomeworkSubmission extends Document {
  instituteId: Types.ObjectId;
  homeworkId: Types.ObjectId;
  studentId: Types.ObjectId;
  studentUserId: Types.ObjectId;
  studentName: string;
  batchName: string;
  driveFileId?: string;
  driveViewUrl?: string;
  driveDownloadUrl?: string;
  fileName?: string;
  fileSizeMb?: number;
  attachments?: ISubmissionAttachmentItem[];
  submittedAt?: Date;
  isLate: boolean;
  submissionStatus: "not_submitted" | "submitted" | "checked" | "returned";
  teacherRemarks?: string;
  marksObtained?: number;
  status: "active" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const homeworkSubmissionSchema = new Schema<IHomeworkSubmission>(
  {
    instituteId:      { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    homeworkId:       { type: Schema.Types.ObjectId, ref: "Homework", required: true, index: true },
    studentId:        { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentUserId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentName:      { type: String, required: true, trim: true },
    batchName:        { type: String, trim: true, default: "" },
    driveFileId:      { type: String },
    driveViewUrl:     { type: String },
    driveDownloadUrl: { type: String },
    fileName:         { type: String },
    fileSizeMb:       { type: Number },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        driveFileId: { type: String },
        type: { type: String, enum: ["file", "link"], default: "file" },
        fileSizeMb: { type: Number },
      },
    ],
    submittedAt:      { type: Date },
    isLate:           { type: Boolean, default: false },
    submissionStatus: {
      type: String,
      enum: ["not_submitted", "submitted", "checked", "returned"],
      default: "not_submitted",
    },
    teacherRemarks:   { type: String, trim: true },
    marksObtained:    { type: Number },
    status:           { type: String, enum: ["active", "deleted"], default: "active" },
  },
  { timestamps: true }
);

homeworkSubmissionSchema.index({ instituteId: 1, homeworkId: 1, studentId: 1 }, { unique: true });
homeworkSubmissionSchema.index({ instituteId: 1, studentUserId: 1 });
homeworkSubmissionSchema.index({ instituteId: 1, homeworkId: 1 });

export const HomeworkSubmission = mongoose.model<IHomeworkSubmission>("HomeworkSubmission", homeworkSubmissionSchema);
