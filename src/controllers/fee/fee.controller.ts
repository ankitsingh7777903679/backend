import { Request, Response } from "express";
import { feeService } from "../../services/fee/fee.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getAllFees = catchAsync(async (req: Request, res: Response) => {
  const result = await feeService.getAll(
    req.user.instituteId,
    req.query as { search?: string; status?: string; month?: string; batch?: string }
  );
  res.json(apiResponse.success(result, "Fee records fetched"));
});

export const recordFeePayment = catchAsync(async (req: Request, res: Response) => {
  const fee = await feeService.recordPayment(req.body, req.user.instituteId, req.user.userId);
  res.status(201).json(apiResponse.success(fee, "Payment recorded and receipt generated"));
});

export const getStudentLedger = catchAsync(async (req: Request, res: Response) => {
  const studentId = String(req.params.studentId);
  const ledger = await feeService.getStudentLedger(studentId, req.user.instituteId);
  res.json(apiResponse.success(ledger, "Student fee ledger and carry-forward arrears fetched"));
});

export const submitPaymentProof = catchAsync(async (req: Request, res: Response) => {
  const { feeId, paymentProofUrl, studentUtrNumber, lateFeeAmount, studentSubmittedAmount } = req.body;
  const result = await feeService.submitPaymentProof(
    feeId,
    { paymentProofUrl, studentUtrNumber, lateFeeAmount, studentSubmittedAmount },
    req.user.userId,
    req.user.instituteId
  );
  res.json(apiResponse.success(result, "Payment proof submitted successfully. Pending teacher verification."));
});

export const approvePaymentProof = catchAsync(async (req: Request, res: Response) => {
  const { feeId } = req.params;
  const { approvedAmount } = req.body;
  const result = await feeService.approvePaymentProof(
    feeId as string,
    req.user.userId,
    req.user.instituteId,
    approvedAmount ? Number(approvedAmount) : undefined
  );
  res.json(apiResponse.success(result, "Payment proof approved and receipt generated successfully."));
});

export const rejectPaymentProof = catchAsync(async (req: Request, res: Response) => {
  const { feeId } = req.params;
  const { rejectionReason } = req.body;
  const result = await feeService.rejectPaymentProof(feeId as string, rejectionReason, req.user.instituteId);
  res.json(apiResponse.success(result, "Payment proof rejected."));
});

export const getPendingProofs = catchAsync(async (req: Request, res: Response) => {
  const pending = await feeService.getPendingProofs(req.user.instituteId);
  res.json(apiResponse.success(pending, "Pending payment proofs fetched"));
});

export const setupInstallmentPlan = catchAsync(async (req: Request, res: Response) => {
  const studentId = String(req.params.studentId);
  const result = await feeService.setupInstallmentPlan(studentId, req.user.instituteId, req.body);
  res.status(200).json(apiResponse.success(result, "Flexible installment plan created successfully"));
});

export const getInstallmentPlan = catchAsync(async (req: Request, res: Response) => {
  const studentId = String(req.params.studentId);
  const result = await feeService.getInstallmentPlan(studentId, req.user.instituteId);
  res.json(apiResponse.success(result, "Student installment plan retrieved"));
});
