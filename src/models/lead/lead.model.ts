import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILead extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  name: string;
  phone: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  courseInterested: string;
  leadSource: "walk_in" | "google_ads" | "facebook_ads" | "whatsapp" | "website" | "referral";
  pipelineStage: "new" | "contacted" | "demo_scheduled" | "follow_up" | "converted" | "lost";
  followUpDate?: Date;
  notes?: string;
  convertedStudentId?: Types.ObjectId;
  status: "active" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    instituteId:        { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    name:               { type: String, required: true, trim: true },
    phone:              { type: String, required: true, trim: true },
    email:              { type: String, lowercase: true, trim: true },
    parentName:         { type: String, trim: true },
    parentPhone:        { type: String, trim: true },
    courseInterested:   { type: String, required: true, trim: true, default: "NEET 2026 Morning Batch" },
    leadSource:         { type: String, enum: ["walk_in", "google_ads", "facebook_ads", "whatsapp", "website", "referral"], default: "walk_in" },
    pipelineStage:      { type: String, enum: ["new", "contacted", "demo_scheduled", "follow_up", "converted", "lost"], default: "new" },
    followUpDate:       { type: Date },
    notes:              { type: String, trim: true },
    convertedStudentId: { type: Schema.Types.ObjectId, ref: "Student" },
    status:             { type: String, enum: ["active", "deleted"], default: "active" },
  },
  { timestamps: true }
);

leadSchema.index({ instituteId: 1, pipelineStage: 1 });
leadSchema.index({ instituteId: 1, phone: 1 });

export const Lead = mongoose.model<ILead>("Lead", leadSchema);
