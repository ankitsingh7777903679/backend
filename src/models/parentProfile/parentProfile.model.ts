import mongoose, { Schema, Document, Types } from "mongoose";

export interface IParentProfile extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  userId?: Types.ObjectId;
  portalAccess: "disabled" | "invited" | "active";
  name: string;
  phone: string;
  email?: string;
  address?: string;
  status: "active" | "inactive" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const parentProfileSchema = new Schema<IParentProfile>(
  {
    instituteId:  { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    userId:       { type: Schema.Types.ObjectId, ref: "User" },
    portalAccess: { type: String, enum: ["disabled", "invited", "active"], default: "disabled" },
    name:         { type: String, required: true, trim: true },
    phone:        { type: String, required: true, trim: true },
    email:        { type: String, lowercase: true, trim: true },
    address:      { type: String, trim: true },
    status:       { type: String, enum: ["active", "inactive", "deleted"], default: "active" },
  },
  { timestamps: true }
);

parentProfileSchema.index({ instituteId: 1, status: 1 });
parentProfileSchema.index({ instituteId: 1, phone: 1 });
parentProfileSchema.index({ instituteId: 1, email: 1 });
parentProfileSchema.index({ userId: 1 }, { unique: true, sparse: true });

export const ParentProfile = mongoose.model<IParentProfile>("ParentProfile", parentProfileSchema);
