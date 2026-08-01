import { Request, Response } from "express";
import { timetableService } from "../../services/timetable/timetable.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getAllSlots = catchAsync(async (req: Request, res: Response) => {
  const slots = await timetableService.getAll(req.user.instituteId, req.query as { day?: string; batch?: string });
  res.json(apiResponse.success(slots, "Timetable slots fetched successfully"));
});

export const getSlot = catchAsync(async (req: Request, res: Response) => {
  const slot = await timetableService.getById(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(slot));
});

export const createSlot = catchAsync(async (req: Request, res: Response) => {
  const slot = await timetableService.create(req.body, req.user.instituteId);
  res.status(201).json(apiResponse.success(slot, "Class slot added to timetable successfully"));
});

export const updateSlot = catchAsync(async (req: Request, res: Response) => {
  const slot = await timetableService.update(req.params.id as string, req.body, req.user.instituteId);
  res.json(apiResponse.success(slot, "Class slot updated successfully"));
});

export const deleteSlot = catchAsync(async (req: Request, res: Response) => {
  await timetableService.delete(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(null, "Class slot removed from timetable"));
});
