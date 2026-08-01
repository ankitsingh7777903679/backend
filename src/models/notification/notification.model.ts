import mongoose, { Schema, Document, Types } from "mongoose";

export type NotificationType =
  | "welcome"
  | "batch_enrolled"
  | "batch_changed"
  | "fee_due"
  | "fee_paid"
  | "test_scheduled"
  | "test_completed"
  | "test_evaluated";

export interface INotification extends Document {
  instituteId: Types.ObjectId;
  recipientUserId: Types.ObjectId;
  recipientStudentId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    recipientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipientStudentId: { type: Schema.Types.ObjectId, ref: "Student", index: true },
    type: {
      type: String,
      enum: [
        "welcome",
        "batch_enrolled",
        "batch_changed",
        "fee_due",
        "fee_paid",
        "test_scheduled",
        "test_completed",
        "test_evaluated",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    metadata: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
