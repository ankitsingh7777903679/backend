import { Fee } from "../../models/fee/fee.model";
import { Student } from "../../models/student/student.model";
import { generateReceiptNo } from "../../utils/generateReceiptNo";
import { AppError } from "../../utils/AppError";
import { RecordFeeInput } from "../../validations/fee/fee.validation";
import { Types } from "mongoose";
import { notificationService } from "../notification/notification.service";

export const feeService = {
  getAll: async (
    instituteId: string,
    query: { search?: string; status?: string; month?: string; batch?: string }
  ) => {
    const filter: Record<string, unknown> = { instituteId };

    if (query.status && query.status !== "all") {
      filter.feeStatus = query.status;
    }

    if (query.month && query.month !== "all") {
      filter.month = query.month;
    }

    if (query.batch && query.batch !== "all") {
      const escaped = query.batch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.batchName = { $regex: `^${escaped}$`, $options: "i" };
    }

    if (query.search) {
      filter.$or = [
        { studentName: { $regex: query.search, $options: "i" } },
        { admissionNo: { $regex: query.search, $options: "i" } },
        { receiptNo: { $regex: query.search, $options: "i" } },
      ];
    }

    const fees = await Fee.find(filter).sort({ createdAt: -1 });

    const totalDue = fees.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const totalCollected = fees.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
    const totalPending = fees.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0);

    return {
      fees,
      summary: {
        totalDue,
        totalCollected,
        totalPending,
      },
    };
  },

  getStudentLedger: async (studentId: string, instituteId: string) => {
    const student = await Student.findOne({ _id: studentId, instituteId });
    if (!student) throw new AppError("Student profile not found", 404);

    const pastFees = await Fee.find({ studentId: student._id, instituteId }).sort({ createdAt: -1 });
    // Use the latest past fee document's dueAmount as current carried-forward arrears to prevent double-counting
    const previousArrears = pastFees.length > 0 ? (pastFees[0].dueAmount || 0) : 0;

    const monthlyFee = student.monthlyFee || 0;
    const oneTimeRegistrationFee = student.oneTimeRegistrationFee || 0;
    const discountAmount = student.discountAmount || 0;

    const netPayable = Math.max(0, monthlyFee + previousArrears + oneTimeRegistrationFee - discountAmount);

    return {
      student: {
        id: student._id,
        name: student.name,
        admissionNo: student.admissionNo,
        batchName: student.batchName || student.schoolClass || "General Class",
        joiningDate: student.joiningDate || student.createdAt,
        monthlyFee,
        oneTimeRegistrationFee,
        discountAmount,
        discountReason: student.discountReason,
      },
      previousArrears,
      netPayable,
      pastFeeRecords: pastFees,
    };
  },

  recordPayment: async (data: RecordFeeInput, instituteId: string, userId?: string) => {
    const receiptNo = await generateReceiptNo(instituteId);
    const safeUserId = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    const newTransaction = {
      receiptNo,
      amount: data.paidAmount,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId,
      paymentDate: new Date(),
      remarks: data.remarks,
      recordedByUserId: safeUserId,
    };

    let existingFee = await Fee.findOne({
      studentId: data.studentId,
      month: data.month,
      instituteId,
    });

    let fee;

    if (existingFee) {
      const updatedPaid = (existingFee.paidAmount || 0) + data.paidAmount;
      const totalAmount = data.totalAmount || existingFee.totalAmount;
      const previousArrears = data.previousArrears ?? existingFee.previousArrears ?? 0;
      const discountApplied = data.discountApplied ?? existingFee.discountApplied ?? 0;
      const netPayable = Math.max(0, totalAmount + previousArrears - discountApplied);
      const dueAmount = Math.max(0, netPayable - updatedPaid);

      let feeStatus: "paid" | "partial" | "pending" | "overdue";
      if (dueAmount === 0) {
        feeStatus = "paid";
      } else if (updatedPaid > 0) {
        feeStatus = "partial";
      } else {
        feeStatus = "pending";
      }

      existingFee.paidAmount = updatedPaid;
      existingFee.dueAmount = dueAmount;
      existingFee.feeStatus = feeStatus;
      existingFee.netPayable = netPayable;
      if (!existingFee.transactions) existingFee.transactions = [];
      existingFee.transactions.push(newTransaction);
      existingFee.receiptNo = receiptNo; // Latest receipt
      existingFee.paymentMethod = data.paymentMethod;

      fee = await existingFee.save();
    } else {
      const previousArrears = data.previousArrears || 0;
      const discountApplied = data.discountApplied || 0;
      const registrationFeeApplied = data.registrationFeeApplied || 0;
      const netPayable = Math.max(0, data.totalAmount + previousArrears + registrationFeeApplied - discountApplied);
      const dueAmount = Math.max(0, netPayable - data.paidAmount);

      let feeStatus: "paid" | "partial" | "pending" | "overdue";
      if (dueAmount === 0) {
        feeStatus = "paid";
      } else if (data.paidAmount > 0) {
        feeStatus = "partial";
      } else {
        feeStatus = "pending";
      }

      fee = await Fee.create({
        ...data,
        instituteId,
        receiptNo,
        previousArrears,
        discountApplied,
        registrationFeeApplied,
        netPayable,
        dueAmount,
        feeStatus,
        recordedByUserId: safeUserId,
        transactions: [newTransaction],
      });
    }

    // Also update Student feeStatus & Trigger Notification
    if (Types.ObjectId.isValid(data.studentId)) {
      const studentDoc = await Student.findOneAndUpdate({ _id: data.studentId, instituteId }, { feeStatus: fee.feeStatus }, { new: true });
      if (studentDoc && studentDoc.userId) {
        notificationService
          .sendFeePaidNotification(
            instituteId,
            studentDoc._id,
            studentDoc.userId,
            data.paidAmount,
            receiptNo,
            data.month
          )
          .catch(() => {});
      }
    }

    return fee;
  },
};
