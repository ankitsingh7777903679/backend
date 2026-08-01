import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGoogleDriveToken extends Document {
  instituteId: Types.ObjectId;
  userId: Types.ObjectId;
  userType: "institute" | "student";
  studentId?: Types.ObjectId;
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  folderId: string;
  folderUrl: string;
  connectedEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const googleDriveTokenSchema = new Schema<IGoogleDriveToken>(
  {
    instituteId:    { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    userId:         { type: Schema.Types.ObjectId, ref: "User", required: true },
    userType:       { type: String, enum: ["institute", "student"], default: "institute" },
    studentId:      { type: Schema.Types.ObjectId, ref: "Student" },
    accessToken:    { type: String, required: true },
    refreshToken:   { type: String, required: true },
    expiryDate:     { type: Number, required: true },
    folderId:       { type: String, required: true },
    folderUrl:      { type: String, required: true },
    connectedEmail: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// Compound unique index: one token per (institute + user)
googleDriveTokenSchema.index({ instituteId: 1, userId: 1 }, { unique: true });

export const GoogleDriveToken = mongoose.model<IGoogleDriveToken>("GoogleDriveToken", googleDriveTokenSchema);

