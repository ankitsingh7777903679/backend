import { Schema, model, Document, Types } from "mongoose";

export interface IOtp extends Document {
  email: string;
  instituteId: Types.ObjectId;
  userId: Types.ObjectId;
  role: "owner" | "admin" | "accountant" | "teacher" | "student";
  otpCode: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["owner", "admin", "accountant", "teacher", "student"], required: true },
    otpCode: {
      type: String,
      required: true,
      trim: true,
    },
    attempts: { type: Number, default: 0 },
    expiresAt: {
      type: Date,
      required: true,
      expires: 300, // Auto-delete document after 5 minutes (300 seconds)
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ instituteId: 1, userId: 1, role: 1 });

export const Otp = model<IOtp>("Otp", otpSchema);
