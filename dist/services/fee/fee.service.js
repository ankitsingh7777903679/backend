"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feeService = void 0;
const fee_model_1 = require("../../models/fee/fee.model");
const student_model_1 = require("../../models/student/student.model");
const generateReceiptNo_1 = require("../../utils/generateReceiptNo");
const mongoose_1 = require("mongoose");
exports.feeService = {
    getAll: async (instituteId, query) => {
        const filter = { instituteId };
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
        const fees = await fee_model_1.Fee.find(filter).sort({ createdAt: -1 });
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
    recordPayment: async (data, instituteId, userId) => {
        const receiptNo = await (0, generateReceiptNo_1.generateReceiptNo)(instituteId);
        const dueAmount = Math.max(0, data.totalAmount - data.paidAmount);
        let feeStatus;
        if (dueAmount === 0) {
            feeStatus = "paid";
        }
        else if (data.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const feeDueDate = new Date(data.dueDate);
            feeStatus = feeDueDate < today ? "overdue" : "pending";
        }
        else {
            feeStatus = "pending";
        }
        const safeUserId = userId && mongoose_1.Types.ObjectId.isValid(userId) ? new mongoose_1.Types.ObjectId(userId) : undefined;
        const fee = await fee_model_1.Fee.create({
            ...data,
            instituteId,
            receiptNo,
            dueAmount,
            feeStatus,
            recordedByUserId: safeUserId,
        });
        // Also update Student feeStatus
        if (mongoose_1.Types.ObjectId.isValid(data.studentId)) {
            await student_model_1.Student.findByIdAndUpdate(data.studentId, { feeStatus });
        }
        return fee;
    },
};
