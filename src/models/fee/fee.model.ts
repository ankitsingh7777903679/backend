import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFeeTransaction {
  receiptNo: string;
  amount: number;
  paymentMethod: "upi" | "cash" | "bank_transfer" | "cheque" | "razorpay";
  transactionId?: string;
  paymentDate: Date;
  remarks?: string;
  recordedByUserId?: Types.ObjectId;
}

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
  previousArrears?: number;
  discountApplied?: number;
  registrationFeeApplied?: number;
  netPayable?: number;
  paymentMethod: "upi" | "cash" | "bank_transfer" | "cheque" | "razorpay";
  transactionId?: string;
  receiptNo: string;
  paymentDate: Date;
  dueDate?: Date;
  feeStatus: "paid" | "pending" | "partial" | "overdue" | "verification_pending";
  paymentProofUrl?: string;
  studentUtrNumber?: string;
  paymentProofSubmittedAt?: Date;
  rejectionReason?: string;
  lateFeeAmount?: number;
  studentSubmittedAmount?: number;
  feeType?: "monthly" | "installment" | "lumpsum" | "registration" | "other";
  installmentNo?: number;
  installmentName?: string;
  totalInstallments?: number;
  installmentId?: Types.ObjectId;
  remarks?: string;
  recordedByUserId?: Types.ObjectId;
  transactions?: IFeeTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const feeSchema = new Schema<IFee>(
  {
    instituteId:            { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    studentId:              { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    studentName:            { type: String, required: true, trim: true },
    admissionNo:            { type: String, required: true, trim: true },
    batchName:              { type: String, required: true, trim: true },
    month:                  { type: String, required: true, trim: true },
    totalAmount:            { type: Number, required: true },
    paidAmount:             { type: Number, required: true, default: 0 },
    dueAmount:              { type: Number, required: true, default: 0 },
    previousArrears:        { type: Number, default: 0 },
    discountApplied:        { type: Number, default: 0 },
    registrationFeeApplied: { type: Number, default: 0 },
    netPayable:             { type: Number, default: 0 },
    paymentMethod:          { type: String, enum: ["upi", "cash", "bank_transfer", "cheque", "razorpay"], default: "upi" },
    transactionId:         { type: String, trim: true },
    receiptNo:              { type: String, required: true, trim: true },
    paymentDate:            { type: Date, default: Date.now },
    dueDate:                { type: Date },
    feeStatus:              { type: String, enum: ["paid", "pending", "partial", "overdue", "verification_pending"], default: "pending" },
    paymentProofUrl:        { type: String, trim: true },
    studentUtrNumber:       { type: String, trim: true },
    paymentProofSubmittedAt:{ type: Date },
    rejectionReason:        { type: String, trim: true },
    lateFeeAmount:          { type: Number, default: 0 },
    studentSubmittedAmount: { type: Number, default: 0 },
    feeType:                { type: String, enum: ["monthly", "installment", "lumpsum", "registration", "other"], default: "monthly" },
    installmentNo:          { type: Number },
    installmentName:        { type: String, trim: true },
    totalInstallments:      { type: Number },
    installmentId:          { type: Schema.Types.ObjectId },
    remarks:                { type: String, trim: true },
    recordedByUserId:       { type: Schema.Types.ObjectId, ref: "User" },
    transactions: [
      {
        receiptNo:        { type: String, required: true, trim: true },
        amount:           { type: Number, required: true },
        paymentMethod:    { type: String, enum: ["upi", "cash", "bank_transfer", "cheque", "razorpay"], default: "upi" },
        transactionId:   { type: String, trim: true },
        paymentDate:      { type: Date, default: Date.now },
        remarks:          { type: String, trim: true },
        recordedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

feeSchema.index({ instituteId: 1, feeStatus: 1 });
feeSchema.index({ instituteId: 1, receiptNo: 1 }, { unique: true });

export const Fee = mongoose.model<IFee>("Fee", feeSchema);
