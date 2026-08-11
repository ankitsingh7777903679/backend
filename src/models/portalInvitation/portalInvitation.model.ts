import { Document, model, Schema, Types } from "mongoose";

export type PortalProfileType = "teacher" | "student";
export type PortalInvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface IPortalInvitation extends Document {
  instituteId: Types.ObjectId;
  profileType: PortalProfileType;
  profileId: Types.ObjectId;
  email: string;
  role: "teacher" | "student";
  tokenHash: string;
  status: PortalInvitationStatus;
  expiresAt: Date;
  sentAt: Date;
  acceptedAt?: Date;
  revokedAt?: Date;
  createdByUserId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const portalInvitationSchema = new Schema<IPortalInvitation>(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    profileType: { type: String, enum: ["teacher", "student"], required: true },
    profileId: { type: Schema.Types.ObjectId, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["teacher", "student"], required: true },
    tokenHash: { type: String, required: true, select: false },
    status: { type: String, enum: ["pending", "accepted", "revoked", "expired"], default: "pending", index: true },
    expiresAt: { type: Date, required: true, index: true },
    sentAt: { type: Date, required: true, default: Date.now },
    acceptedAt: { type: Date },
    revokedAt: { type: Date },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

portalInvitationSchema.index({ instituteId: 1, profileType: 1, profileId: 1, status: 1 });

export const PortalInvitation = model<IPortalInvitation>("PortalInvitation", portalInvitationSchema);
