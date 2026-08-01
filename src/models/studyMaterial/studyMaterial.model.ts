import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudyMaterial extends Document {
  instituteId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  chapter: string;
  topic: string;
  batchName: string;
  batchNames: string[];
  fileType: "pdf" | "image" | "doc" | "ppt" | "video" | "other";
  driveFileId: string;
  driveViewUrl: string;
  driveDownloadUrl: string;
  fileName: string;
  fileSizeMb: number;
  downloadCount: number;
  expiryDate?: Date;
  tags: string[];
  status: "active" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const studyMaterialSchema = new Schema<IStudyMaterial>(
  {
    instituteId:      { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    uploadedBy:       { type: Schema.Types.ObjectId, ref: "User", required: true },
    title:            { type: String, required: true, trim: true },
    description:      { type: String, trim: true, default: "" },
    subject:          { type: String, required: true, trim: true },
    chapter:          { type: String, trim: true, default: "" },
    topic:            { type: String, trim: true, default: "" },
    batchName:        { type: String, trim: true, default: "All Batches" },
    batchNames:       [{ type: String, trim: true }],
    fileType:         { type: String, enum: ["pdf", "image", "doc", "ppt", "video", "other"], default: "pdf" },
    driveFileId:      { type: String, required: true },
    driveViewUrl:     { type: String, required: true },
    driveDownloadUrl: { type: String, required: true },
    fileName:         { type: String, required: true },
    fileSizeMb:       { type: Number, default: 0 },
    downloadCount:    { type: Number, default: 0 },
    expiryDate:       { type: Date },
    tags:             [{ type: String, trim: true }],
    status:           { type: String, enum: ["active", "deleted"], default: "active" },
  },
  { timestamps: true }
);

studyMaterialSchema.index({ instituteId: 1, status: 1 });
studyMaterialSchema.index({ instituteId: 1, subject: 1 });
studyMaterialSchema.index({ instituteId: 1, batchNames: 1 });

export const StudyMaterial = mongoose.model<IStudyMaterial>("StudyMaterial", studyMaterialSchema);
