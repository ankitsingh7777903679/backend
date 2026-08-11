"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstallmentPlan = exports.setupInstallmentPlan = exports.getPendingProofs = exports.rejectPaymentProof = exports.approvePaymentProof = exports.submitPaymentProof = exports.getStudentLedger = exports.recordFeePayment = exports.getAllFees = void 0;
const fee_service_1 = require("../../services/fee/fee.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getAllFees = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await fee_service_1.feeService.getAll(req.user.instituteId, req.query);
    res.json(apiResponse_1.apiResponse.success(result, "Fee records fetched"));
});
exports.recordFeePayment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const fee = await fee_service_1.feeService.recordPayment(req.body, req.user.instituteId, req.user.userId);
    res.status(201).json(apiResponse_1.apiResponse.success(fee, "Payment recorded and receipt generated"));
});
exports.getStudentLedger = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const studentId = String(req.params.studentId);
    const ledger = await fee_service_1.feeService.getStudentLedger(studentId, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(ledger, "Student fee ledger and carry-forward arrears fetched"));
});
exports.submitPaymentProof = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { feeId, paymentProofUrl, studentUtrNumber, lateFeeAmount, studentSubmittedAmount } = req.body;
    const result = await fee_service_1.feeService.submitPaymentProof(feeId, { paymentProofUrl, studentUtrNumber, lateFeeAmount, studentSubmittedAmount }, req.user.userId, req.user.instituteId, req.user.role === "student");
    res.json(apiResponse_1.apiResponse.success(result, "Payment proof submitted successfully. Pending teacher verification."));
});
exports.approvePaymentProof = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { feeId } = req.params;
    const { approvedAmount } = req.body;
    const result = await fee_service_1.feeService.approvePaymentProof(feeId, req.user.userId, req.user.instituteId, approvedAmount ? Number(approvedAmount) : undefined);
    res.json(apiResponse_1.apiResponse.success(result, "Payment proof approved and receipt generated successfully."));
});
exports.rejectPaymentProof = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { feeId } = req.params;
    const { rejectionReason } = req.body;
    const result = await fee_service_1.feeService.rejectPaymentProof(feeId, rejectionReason, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(result, "Payment proof rejected."));
});
exports.getPendingProofs = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const pending = await fee_service_1.feeService.getPendingProofs(req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(pending, "Pending payment proofs fetched"));
});
exports.setupInstallmentPlan = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const studentId = String(req.params.studentId);
    const result = await fee_service_1.feeService.setupInstallmentPlan(studentId, req.user.instituteId, req.body);
    res.status(200).json(apiResponse_1.apiResponse.success(result, "Flexible installment plan created successfully"));
});
exports.getInstallmentPlan = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const studentId = String(req.params.studentId);
    const result = await fee_service_1.feeService.getInstallmentPlan(studentId, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(result, "Student installment plan retrieved"));
});
