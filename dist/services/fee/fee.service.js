"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feeService = void 0;
const fee_model_1 = require("../../models/fee/fee.model");
const student_model_1 = require("../../models/student/student.model");
const generateReceiptNo_1 = require("../../utils/generateReceiptNo");
const AppError_1 = require("../../utils/AppError");
const mongoose_1 = require("mongoose");
const notification_service_1 = require("../notification/notification.service");
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
    getStudentLedger: async (studentId, instituteId) => {
        const student = await student_model_1.Student.findOne({ _id: studentId, instituteId });
        if (!student)
            throw new AppError_1.AppError("Student profile not found", 404);
        const pastFees = await fee_model_1.Fee.find({ studentId: student._id, instituteId }).sort({ createdAt: -1 });
        // Use the latest past fee document's dueAmount as current carried-forward arrears to prevent double-counting
        const previousArrears = pastFees.length > 0 ? (pastFees[0].dueAmount || 0) : 0;
        const monthlyFee = student.monthlyFee || 0;
        const registrationAlreadyBilled = pastFees.some((fee) => fee.feeType === "registration" || (fee.registrationFeeApplied || 0) > 0);
        const oneTimeRegistrationFee = registrationAlreadyBilled ? 0 : (student.oneTimeRegistrationFee || 0);
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
    recordPayment: async (data, instituteId, userId) => {
        const student = await student_model_1.Student.findOne({ _id: data.studentId, instituteId, status: { $ne: "deleted" } });
        if (!student)
            throw new AppError_1.AppError("Student profile not found", 404);
        // Receipt identity fields are server-owned snapshots, never browser input.
        data = {
            ...data,
            studentName: student.name,
            admissionNo: student.admissionNo,
            batchName: student.batchName || student.schoolClass || "General Class",
        };
        const receiptNo = await (0, generateReceiptNo_1.generateReceiptNo)(instituteId);
        const safeUserId = userId && mongoose_1.Types.ObjectId.isValid(userId) ? new mongoose_1.Types.ObjectId(userId) : undefined;
        const newTransaction = {
            receiptNo,
            amount: data.paidAmount,
            paymentMethod: data.paymentMethod,
            transactionId: data.transactionId,
            paymentDate: new Date(),
            remarks: data.remarks,
            recordedByUserId: safeUserId,
        };
        let existingFee = await fee_model_1.Fee.findOne({
            studentId: data.studentId,
            month: data.month,
            instituteId,
            feeType: data.feeType || "monthly",
            installmentNo: data.installmentNo ?? null,
        });
        let fee;
        if (existingFee) {
            const updatedPaid = (existingFee.paidAmount || 0) + data.paidAmount;
            // A payment must not alter a previously issued invoice total.
            const totalAmount = existingFee.totalAmount;
            const previousArrears = data.previousArrears ?? existingFee.previousArrears ?? 0;
            const discountApplied = data.discountApplied ?? existingFee.discountApplied ?? 0;
            const netPayable = Math.max(0, totalAmount + previousArrears - discountApplied);
            const dueAmount = Math.max(0, netPayable - updatedPaid);
            if (updatedPaid > netPayable)
                throw new AppError_1.AppError("Payment exceeds the outstanding balance", 400);
            let feeStatus;
            if (dueAmount === 0) {
                feeStatus = "paid";
            }
            else if (updatedPaid > 0) {
                feeStatus = "partial";
            }
            else {
                feeStatus = "pending";
            }
            existingFee.paidAmount = updatedPaid;
            existingFee.dueAmount = dueAmount;
            existingFee.feeStatus = feeStatus;
            existingFee.netPayable = netPayable;
            if (!existingFee.transactions)
                existingFee.transactions = [];
            existingFee.transactions.push(newTransaction);
            existingFee.receiptNo = receiptNo; // Latest receipt
            existingFee.paymentMethod = data.paymentMethod;
            fee = await existingFee.save();
        }
        else {
            const previousArrears = data.previousArrears || 0;
            const discountApplied = data.discountApplied || 0;
            const registrationFeeApplied = data.registrationFeeApplied || 0;
            const netPayable = Math.max(0, data.totalAmount + previousArrears + registrationFeeApplied - discountApplied);
            const dueAmount = Math.max(0, netPayable - data.paidAmount);
            if (data.paidAmount > netPayable)
                throw new AppError_1.AppError("Payment exceeds the invoice balance", 400);
            let feeStatus;
            if (dueAmount === 0) {
                feeStatus = "paid";
            }
            else if (data.paidAmount > 0) {
                feeStatus = "partial";
            }
            else {
                feeStatus = "pending";
            }
            fee = await fee_model_1.Fee.create({
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
        // Also update Student feeStatus, installmentPlan & Trigger Notification
        if (mongoose_1.Types.ObjectId.isValid(data.studentId)) {
            const studentDoc = await student_model_1.Student.findOne({ _id: data.studentId, instituteId });
            if (studentDoc) {
                studentDoc.feeStatus = fee.feeStatus;
                if (studentDoc.installmentPlan && studentDoc.installmentPlan.length > 0 && (data.feeType === "installment" || data.installmentNo)) {
                    const instNo = data.installmentNo || 1;
                    const instIndex = studentDoc.installmentPlan.findIndex((i) => i.installmentNo === instNo);
                    if (instIndex !== -1) {
                        const inst = studentDoc.installmentPlan[instIndex];
                        const updatedInstPaid = (inst.paidAmount || 0) + data.paidAmount;
                        const updatedInstDue = Math.max(0, inst.amount - updatedInstPaid);
                        inst.paidAmount = updatedInstPaid;
                        inst.dueAmount = updatedInstDue;
                        inst.feeStatus = updatedInstDue === 0 ? "paid" : updatedInstPaid > 0 ? "partial" : "pending";
                    }
                }
                await studentDoc.save();
                if (studentDoc.userId) {
                    notification_service_1.notificationService
                        .sendFeePaidNotification(instituteId, studentDoc._id, studentDoc.userId, data.paidAmount, receiptNo, data.month)
                        .catch(() => { });
                }
            }
        }
        return fee;
    },
    submitPaymentProof: async (feeId, data, studentUserId, instituteId, requireOwnership = false) => {
        let fee = await fee_model_1.Fee.findOne({ _id: feeId, instituteId });
        if (!fee) {
            throw new AppError_1.AppError("Fee record not found", 404);
        }
        if (requireOwnership) {
            const ownsFee = await student_model_1.Student.exists({ _id: fee.studentId, instituteId, userId: studentUserId, status: { $ne: "deleted" } });
            if (!ownsFee)
                throw new AppError_1.AppError("You can submit payment proof only for your own fee record", 403);
        }
        fee.paymentProofUrl = data.paymentProofUrl;
        fee.studentUtrNumber = data.studentUtrNumber;
        fee.paymentProofSubmittedAt = new Date();
        fee.feeStatus = "verification_pending";
        if (data.studentSubmittedAmount && data.studentSubmittedAmount > 0) {
            fee.studentSubmittedAmount = data.studentSubmittedAmount;
        }
        if (data.lateFeeAmount) {
            fee.lateFeeAmount = data.lateFeeAmount;
            fee.totalAmount = (fee.totalAmount || 1500) + data.lateFeeAmount;
            fee.netPayable = fee.totalAmount;
            fee.dueAmount = Math.max(0, fee.netPayable - (fee.paidAmount || 0));
        }
        await fee.save();
        return fee;
    },
    approvePaymentProof: async (feeId, teacherUserId, instituteId, approvedAmountInput) => {
        const fee = await fee_model_1.Fee.findOne({ _id: feeId, instituteId });
        if (!fee)
            throw new AppError_1.AppError("Fee record not found", 404);
        if (fee.feeStatus !== "verification_pending") {
            throw new AppError_1.AppError("Fee is not pending verification", 400);
        }
        const receiptNo = await (0, generateReceiptNo_1.generateReceiptNo)(instituteId);
        // Determine exact amount being approved (custom approved amount > student submitted amount > remaining due amount > total amount)
        const amountToApprove = approvedAmountInput && approvedAmountInput > 0
            ? approvedAmountInput
            : fee.studentSubmittedAmount && fee.studentSubmittedAmount > 0
                ? fee.studentSubmittedAmount
                : fee.dueAmount > 0
                    ? fee.dueAmount
                    : fee.totalAmount;
        const newPaidAmount = (fee.paidAmount || 0) + amountToApprove;
        const netTotal = fee.netPayable || fee.totalAmount;
        const newDueAmount = Math.max(0, netTotal - newPaidAmount);
        const newStatus = newDueAmount === 0 ? "paid" : "partial";
        fee.paidAmount = newPaidAmount;
        fee.dueAmount = newDueAmount;
        fee.feeStatus = newStatus;
        fee.receiptNo = receiptNo;
        fee.paymentMethod = "upi";
        fee.transactionId = fee.studentUtrNumber;
        fee.paymentDate = new Date();
        fee.recordedByUserId = mongoose_1.Types.ObjectId.isValid(teacherUserId) ? new mongoose_1.Types.ObjectId(teacherUserId) : undefined;
        const newTransaction = {
            receiptNo,
            amount: amountToApprove,
            paymentMethod: "upi",
            transactionId: fee.studentUtrNumber,
            paymentDate: new Date(),
            remarks: newStatus === "paid" ? "Approved online UPI payment proof (Full)" : `Approved online UPI payment proof (Partial ₹${amountToApprove})`,
            recordedByUserId: fee.recordedByUserId,
        };
        if (!fee.transactions)
            fee.transactions = [];
        fee.transactions.push(newTransaction);
        await fee.save();
        // Update Student feeStatus
        await student_model_1.Student.findOneAndUpdate({ _id: fee.studentId, instituteId }, { feeStatus: newStatus });
        return fee;
    },
    rejectPaymentProof: async (feeId, rejectionReason, instituteId) => {
        const fee = await fee_model_1.Fee.findOne({ _id: feeId, instituteId });
        if (!fee)
            throw new AppError_1.AppError("Fee record not found", 404);
        const prevPaid = fee.paidAmount || 0;
        fee.feeStatus = prevPaid > 0 ? "partial" : "pending";
        fee.rejectionReason = rejectionReason || "Payment proof rejected by institute";
        await fee.save();
        return fee;
    },
    getPendingProofs: async (instituteId) => {
        const pendingProofs = await fee_model_1.Fee.find({ instituteId, feeStatus: "verification_pending" }).sort({ paymentProofSubmittedAt: -1 });
        return pendingProofs;
    },
    setupInstallmentPlan: async (studentId, instituteId, data) => {
        const student = await student_model_1.Student.findOne({ _id: studentId, instituteId });
        if (!student)
            throw new AppError_1.AppError("Student profile not found", 404);
        const formattedPlan = data.installmentPlan.map((item) => ({
            installmentNo: item.installmentNo,
            title: item.title,
            amount: item.amount,
            dueDate: new Date(item.dueDate),
            paidAmount: 0,
            dueAmount: item.amount,
            feeStatus: "pending",
            remarks: item.remarks,
        }));
        student.feeBillingType = "installment";
        student.billingCycleType = "installment";
        student.totalCourseFee = data.totalCourseFee;
        student.numberOfInstallments = data.numberOfInstallments;
        student.installmentPlan = formattedPlan;
        await student.save();
        return student;
    },
    getInstallmentPlan: async (studentId, instituteId) => {
        const student = await student_model_1.Student.findOne({ _id: studentId, instituteId });
        if (!student)
            throw new AppError_1.AppError("Student profile not found", 404);
        const pastFees = await fee_model_1.Fee.find({ studentId: student._id, instituteId, feeType: "installment" }).sort({ createdAt: -1 });
        const totalCourseFee = student.totalCourseFee || 0;
        const plan = student.installmentPlan || [];
        const totalPaid = plan.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
        const totalRemainingDue = Math.max(0, totalCourseFee - totalPaid);
        return {
            student: {
                id: student._id,
                name: student.name,
                admissionNo: student.admissionNo,
                batchName: student.batchName,
                feeBillingType: student.feeBillingType || "installment",
                totalCourseFee,
                numberOfInstallments: student.numberOfInstallments || plan.length,
            },
            summary: {
                totalCourseFee,
                totalPaid,
                totalRemainingDue,
            },
            installmentPlan: plan,
            feeRecords: pastFees,
        };
    },
};
