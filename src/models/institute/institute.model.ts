import mongoose, { Schema, Document } from "mongoose";

export interface IInstitute extends Document {
  code: string; // Unique 8-character Institute Code (e.g. "TP849201")
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address?: string;
  logo?: string;
  gstNo?: string;
  brandColor?: string;
  whatsappNumber?: string;
  subscriptionPlan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "suspended" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const instituteSchema = new Schema<IInstitute>(
  {
    code:             { type: String, required: true, uppercase: true, trim: true },
    name:             { type: String, required: true, trim: true },
    ownerName:        { type: String, required: true, trim: true },
    phone:            { type: String, required: true },
    email:            { type: String, required: true, lowercase: true, trim: true },
    address:          { type: String, trim: true },
    logo:             { type: String },
    gstNo:            { type: String, trim: true },
    brandColor:       { type: String, default: "#4F46E5" },
    whatsappNumber:   { type: String },
    subscriptionPlan: { type: String, enum: ["free", "starter", "pro", "enterprise"], default: "free" },
    status:           { type: String, enum: ["active", "suspended", "deleted"], default: "active" },
  },
  { timestamps: true }
);

instituteSchema.index({ code: 1 }, { unique: true });
instituteSchema.index({ email: 1 }, { unique: true });
instituteSchema.index({ phone: 1 });
instituteSchema.index({ status: 1 });

export const Institute = mongoose.model<IInstitute>("Institute", instituteSchema);
