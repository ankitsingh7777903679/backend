import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFee extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  studentId: Types.ObjectId;
  studentName: string;
  admissionNo: string;
  batchName: string;
  month: string; // e.g. "July 2026"
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: "upi" | "cash" | "bank_transfer" | "cheque" | "razorpay";
  transactionId?: string;
  receiptNo: string;
  paymentDate: Date;
  dueDate?: Date;
  feeStatus: "paid" | "pending" | "overdue";
  remarks?: string;
  recordedByUserId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const feeSchema = new Schema<IFee>(
  {
    instituteId:      { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    studentId:        { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    studentName:      { type: String, required: true, trim: true },
    admissionNo:      { type: String, required: true, trim: true },
    batchName:        { type: String, required: true, trim: true },
    month:            { type: String, required: true, trim: true },
    totalAmount:      { type: Number, required: true },
    paidAmount:       { type: Number, required: true, default: 0 },
    dueAmount:        { type: Number, required: true, default: 0 },
    paymentMethod:    { type: String, enum: ["upi", "cash", "bank_transfer", "cheque", "razorpay"], default: "upi" },
    transactionId:   { type: String, trim: true },
    receiptNo:        { type: String, required: true, trim: true },
    paymentDate:      { type: Date, default: Date.now },
    feeStatus:        { type: String, enum: ["paid", "pending", "overdue"], default: "paid" },
    remarks:          { type: String, trim: true },
    recordedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

feeSchema.index({ instituteId: 1, feeStatus: 1 });
feeSchema.index({ instituteId: 1, receiptNo: 1 }, { unique: true });

export const Fee = mongoose.model<IFee>("Fee", feeSchema);
