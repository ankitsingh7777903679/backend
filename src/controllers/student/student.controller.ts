import { Request, Response } from "express";
import { studentService } from "../../services/student/student.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getAllStudents = catchAsync(async (req: Request, res: Response) => {
  const students = await studentService.getAll(req.user.instituteId, req.query as { search?: string; batch?: string; feeStatus?: string }, req.user);
  res.json(apiResponse.success(students, "Students fetched successfully"));
});

export const getStudent = catchAsync(async (req: Request, res: Response) => {
  const student = await studentService.getById(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(student));
});

export const createStudent = catchAsync(async (req: Request, res: Response) => {
  const student = await studentService.create(req.body, req.user.instituteId);
  res.status(201).json(apiResponse.success(student, "Student admitted successfully"));
});

export const updateStudent = catchAsync(async (req: Request, res: Response) => {
  const student = await studentService.update(req.params.id as string, req.body, req.user.instituteId);
  res.json(apiResponse.success(student, "Student updated successfully"));
});

export const deleteStudent = catchAsync(async (req: Request, res: Response) => {
  await studentService.delete(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(null, "Student record removed successfully"));
});

export const getStudentExamResults = catchAsync(async (req: Request, res: Response) => {
  const data = await studentService.getExamResults(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(data, "Student exam history fetched successfully"));
});

// Student self-service: uses JWT userId to find their own results
export const getMyExamResults = catchAsync(async (req: Request, res: Response) => {
  const data = await studentService.getExamResults(req.user.userId, req.user.instituteId);
  res.json(apiResponse.success(data, "Your exam history fetched successfully"));
});

// Student self-service: uses JWT userId to find their own profile
export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const student = await studentService.getById(req.user.userId, req.user.instituteId);
  res.json(apiResponse.success(student, "Your profile fetched successfully"));
});

