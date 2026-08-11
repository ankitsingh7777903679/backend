import { Request, Response } from "express";
import { teacherService } from "../../services/teacher/teacher.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getAllTeachers = catchAsync(async (req: Request, res: Response) => {
  const teachers = await teacherService.getAll(req.user.instituteId, req.query as { search?: string; type?: string });
  res.json(apiResponse.success(teachers, "Teachers fetched successfully"));
});

export const getTeacher = catchAsync(async (req: Request, res: Response) => {
  const teacher = await teacherService.getById(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(teacher));
});

export const createTeacher = catchAsync(async (req: Request, res: Response) => {
  const teacher = await teacherService.create(req.body, req.user.instituteId, req.user.userId);
  res.status(201).json(apiResponse.success(teacher, "Teacher created successfully"));
});

export const updateTeacher = catchAsync(async (req: Request, res: Response) => {
  const teacher = await teacherService.update(req.params.id as string, req.body, req.user.instituteId);
  res.json(apiResponse.success(teacher, "Teacher updated successfully"));
});

export const deleteTeacher = catchAsync(async (req: Request, res: Response) => {
  await teacherService.delete(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(null, "Teacher record removed successfully"));
});
