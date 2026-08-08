import { Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";
import { classService } from "../../services/class/class.service";

interface AuthRequest extends Request {
  user?: {
    id: string;
    instituteId: string;
    role: string;
  };
}

export const createClass = catchAsync(async (req: any, res: Response) => {
  const newClass = await classService.create(req.body, req.user.instituteId);
  res.status(201).json(apiResponse.success(newClass, "Class created successfully"));
});

export const getAllClasses = catchAsync(async (req: any, res: Response) => {
  const classes = await classService.getAll(req.user.instituteId, req.user);
  res.status(200).json(apiResponse.success(classes, "Classes fetched successfully"));
});

export const getClassById = catchAsync(async (req: any, res: Response) => {
  const cls = await classService.getById(req.params.id, req.user.instituteId);
  res.status(200).json(apiResponse.success(cls, "Class details fetched"));
});

export const updateClass = catchAsync(async (req: any, res: Response) => {
  const updated = await classService.update(req.params.id, req.body, req.user.instituteId);
  res.status(200).json(apiResponse.success(updated, "Class updated successfully"));
});

export const deleteClass = catchAsync(async (req: any, res: Response) => {
  await classService.delete(req.params.id, req.user.instituteId);
  res.status(200).json(apiResponse.success(null, "Class deleted successfully"));
});

export const shiftStudents = catchAsync(async (req: any, res: Response) => {
  const result = await classService.shiftStudents(req.body, req.user.instituteId);
  res.status(200).json(apiResponse.success(result, `${result.shiftedCount} students shifted to ${result.targetClass}`));
});
