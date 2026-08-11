import mongoose, { Schema, Document, Types } from "mongoose";

export interface IParentStudent extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  parentUserId: Types.ObjectId;
  studentId: Types.ObjectId;
  relationship?: string; // e.g. "father", "mother", "guardian"
  isPrimary: boolean;
  status: "active" | "inactive" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const parentStudentSchema = new Schema<IParentStudent>(
  {
    instituteId:  { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    parentUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId:    { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    relationship: { type: String, trim: true },
    isPrimary:    { type: Boolean, default: false },
    status:       { type: String, enum: ["active", "inactive", "deleted"], default: "active" },
  },
  { timestamps: true }
);

parentStudentSchema.index({ instituteId: 1, parentUserId: 1, studentId: 1 }, { unique: true });
parentStudentSchema.index({ instituteId: 1, studentId: 1 });

export const ParentStudent = mongoose.model<IParentStudent>("ParentStudent", parentStudentSchema);
