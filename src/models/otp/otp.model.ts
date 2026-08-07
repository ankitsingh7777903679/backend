import { Schema, model, Document } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otpCode: string;
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
    otpCode: {
      type: String,
      required: true,
      trim: true,
    },
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

export const Otp = model<IOtp>("Otp", otpSchema);
