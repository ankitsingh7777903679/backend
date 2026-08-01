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

  recordPayment: async (data: RecordFeeInput, instituteId: string, userId?: string) => {
    const receiptNo = await generateReceiptNo(instituteId);
    const dueAmount = Math.max(0, data.totalAmount - data.paidAmount);

    let feeStatus: "paid" | "pending" | "overdue";
    if (dueAmount === 0) {
      feeStatus = "paid";
    } else if (data.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const feeDueDate = new Date(data.dueDate);
      feeStatus = feeDueDate < today ? "overdue" : "pending";
    } else {
      feeStatus = "pending";
    }

    const safeUserId = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    const fee = await Fee.create({
      ...data,
      instituteId,
      receiptNo,
      dueAmount,
      feeStatus,
      recordedByUserId: safeUserId,
    });

    // Also update Student feeStatus & Trigger Notification
    if (Types.ObjectId.isValid(data.studentId)) {
      const studentDoc = await Student.findByIdAndUpdate(data.studentId, { feeStatus }, { new: true });
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
