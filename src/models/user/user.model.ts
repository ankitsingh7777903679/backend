import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  instituteId?: Types.ObjectId; // null for super_admin
  role: "super_admin" | "owner" | "admin" | "teacher" | "accountant" | "student" | "parent";
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  photo?: string;
  /** @deprecated Profile ownership is authoritative through Teacher.userId / Student.userId. */
  linkedId?: Types.ObjectId;
  permissions?: string[];
  status: "active" | "inactive" | "deleted";
  refreshToken?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    instituteId:  { type: Schema.Types.ObjectId, ref: "Institute", index: true },
    role:         { type: String, enum: ["super_admin", "owner", "admin", "teacher", "accountant", "student", "parent"], required: true },
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, lowercase: true, trim: true },
    phone:        { type: String, trim: true },
    passwordHash: { type: String, required: true },
    photo:        { type: String },
    linkedId:     { type: Schema.Types.ObjectId },
    permissions:  [{ type: String }],
    status:       { type: String, enum: ["active", "inactive", "deleted"], default: "active" },
    refreshToken: { type: String },
    lastLogin:    { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ instituteId: 1, role: 1 });
userSchema.index({ instituteId: 1, phone: 1 });

export const User = mongoose.model<IUser>("User", userSchema);
