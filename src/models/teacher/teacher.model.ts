import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITeacher extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  userId?: Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  subjects: string[];
  qualification?: string;
  experienceYears: number;
  employmentType: "full_time" | "part_time" | "guest";
  joiningDate?: Date;
  photo?: string;
  assignedBatchIds: Types.ObjectId[];
  status: "active" | "inactive" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const teacherSchema = new Schema<ITeacher>(
  {
    instituteId:      { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    userId:           { type: Schema.Types.ObjectId, ref: "User" },
    name:             { type: String, required: true, trim: true },
    phone:            { type: String, required: true, trim: true },
    email:            { type: String, required: true, lowercase: true, trim: true },
    subjects:         [{ type: String, trim: true }],
    qualification:    { type: String, trim: true },
    experienceYears:  { type: Number, default: 0 },
    employmentType:   { type: String, enum: ["full_time", "part_time", "guest"], default: "full_time" },
    joiningDate:      { type: Date },
    photo:            { type: String },
    assignedBatchIds: [{ type: Schema.Types.ObjectId, ref: "Batch" }],
    status:           { type: String, enum: ["active", "inactive", "deleted"], default: "active" },
  },
  { timestamps: true }
);

teacherSchema.index({ instituteId: 1, status: 1 });
teacherSchema.index({ instituteId: 1, phone: 1 });

export const Teacher = mongoose.model<ITeacher>("Teacher", teacherSchema);
