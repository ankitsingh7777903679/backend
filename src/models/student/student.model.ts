import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudent extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  userId?: Types.ObjectId;
  admissionNo: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email?: string;
  gender: "male" | "female" | "other";
  dob?: Date;
  parentName: string;
  parentPhone: string;
  batchId?: Types.ObjectId;
  batchName?: string;
  schoolName?: string;
  schoolClass?: string;
  joiningDate?: Date;
  billingCycleType?: "monthly" | "installment" | "lumpsum";
  oneTimeRegistrationFee?: number;
  discountAmount?: number;
  discountReason?: string;
  monthlyFee?: number;
  timing?: string;
  address?: string;
  photo?: string;
  feeStatus: "paid" | "pending" | "overdue";
  attendancePercentage: number;
  status: "active" | "inactive" | "alumni" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    instituteId:          { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    userId:               { type: Schema.Types.ObjectId, ref: "User" },
    admissionNo:          { type: String, required: true, trim: true },
    firstName:            { type: String, required: true, trim: true },
    lastName:             { type: String, required: true, trim: true },
    name:                 { type: String, required: true, trim: true },
    phone:                { type: String, required: true, trim: true },
    email:                { type: String, lowercase: true, trim: true },
    gender:               { type: String, enum: ["male", "female", "other"], default: "male" },
    dob:                  { type: Date },
    joiningDate:          { type: Date, default: Date.now },
    billingCycleType:     { type: String, enum: ["monthly", "installment", "lumpsum"], default: "monthly" },
    oneTimeRegistrationFee:{ type: Number, default: 0 },
    discountAmount:       { type: Number, default: 0 },
    discountReason:       { type: String, trim: true },
    parentName:           { type: String, required: true, trim: true },
    parentPhone:          { type: String, required: true, trim: true },
    batchId:              { type: Schema.Types.ObjectId, ref: "Batch" },
    batchName:            { type: String, trim: true, default: "General Class" },
    schoolName:           { type: String, trim: true, default: "" },
    schoolClass:          { type: String, trim: true, default: "" },
    monthlyFee:           { type: Number, default: 0 },
    timing:               { type: String, trim: true, default: "" },
    address:              { type: String, trim: true },
    photo:                { type: String },
    feeStatus:            { type: String, enum: ["paid", "pending", "overdue"], default: "pending" },
    attendancePercentage: { type: Number, default: 100 },
    status:               { type: String, enum: ["active", "inactive", "alumni", "deleted"], default: "active" },
  },
  { timestamps: true }
);

studentSchema.index({ instituteId: 1, status: 1 });
studentSchema.index({ instituteId: 1, phone: 1 });
studentSchema.index({ instituteId: 1, admissionNo: 1 }, { unique: true });

export const Student = mongoose.model<IStudent>("Student", studentSchema);
