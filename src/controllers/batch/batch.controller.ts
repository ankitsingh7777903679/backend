import { Request, Response } from "express";
import { batchService } from "../../services/batch/batch.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getAllBatches = catchAsync(async (req: Request, res: Response) => {
  const batches = await batchService.getAll(req.user.instituteId, req.query as { search?: string; status?: string });
  res.json(apiResponse.success(batches, "Batches fetched successfully"));
});

export const getBatch = catchAsync(async (req: Request, res: Response) => {
  const batch = await batchService.getById(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(batch));
});

export const createBatch = catchAsync(async (req: Request, res: Response) => {
  const batch = await batchService.create(req.body, req.user.instituteId);
  res.status(201).json(apiResponse.success(batch, "Batch created successfully"));
});

export const updateBatch = catchAsync(async (req: Request, res: Response) => {
  const batch = await batchService.update(req.params.id as string, req.body, req.user.instituteId);
  res.json(apiResponse.success(batch, "Batch updated successfully"));
});

export const deleteBatch = catchAsync(async (req: Request, res: Response) => {
  await batchService.delete(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(null, "Batch removed successfully"));
});
