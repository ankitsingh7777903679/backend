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
