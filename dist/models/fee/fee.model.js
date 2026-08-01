"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fee = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const feeSchema = new mongoose_1.Schema({
    instituteId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    admissionNo: { type: String, required: true, trim: true },
    batchName: { type: String, required: true, trim: true },
    month: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, required: true, default: 0 },
    dueAmount: { type: Number, required: true, default: 0 },
    paymentMethod: { type: String, enum: ["upi", "cash", "bank_transfer", "cheque", "razorpay"], default: "upi" },
    transactionId: { type: String, trim: true },
    receiptNo: { type: String, required: true, trim: true },
    paymentDate: { type: Date, default: Date.now },
    feeStatus: { type: String, enum: ["paid", "pending", "overdue"], default: "paid" },
    remarks: { type: String, trim: true },
    recordedByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
feeSchema.index({ instituteId: 1, feeStatus: 1 });
feeSchema.index({ instituteId: 1, receiptNo: 1 }, { unique: true });
exports.Fee = mongoose_1.default.model("Fee", feeSchema);
