import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotice extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  title: string;
  body: string;
  targetAudience: "all" | "students" | "teachers" | "parents" | "batch_specific";
  targetBatchName?: string;
  priority: "high" | "medium" | "normal";
  sendWhatsApp: boolean;
  sendInApp: boolean;
  attachmentName?: string;
  attachmentUrl?: string;
  publishedByName?: string;
  publishedByUserId?: Types.ObjectId;
  status: "active" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const noticeSchema = new Schema<INotice>(
  {
    instituteId:       { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    title:             { type: String, required: true, trim: true },
    body:              { type: String, required: true, trim: true },
    targetAudience:    { type: String, enum: ["all", "students", "teachers", "parents", "batch_specific"], default: "all" },
    targetBatchName:   { type: String, trim: true },
    priority:          { type: String, enum: ["high", "medium", "normal"], default: "normal" },
    sendWhatsApp:      { type: Boolean, default: true },
    sendInApp:         { type: Boolean, default: true },
    attachmentName:    { type: String, trim: true },
    attachmentUrl:     { type: String },
    publishedByName:   { type: String, default: "Institute Admin" },
    publishedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    status:            { type: String, enum: ["active", "deleted"], default: "active" },
  },
  { timestamps: true }
);

noticeSchema.index({ instituteId: 1, priority: 1 });
noticeSchema.index({ instituteId: 1, targetAudience: 1 });

export const Notice = mongoose.model<INotice>("Notice", noticeSchema);
