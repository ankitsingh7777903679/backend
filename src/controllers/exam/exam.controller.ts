import { Request, Response } from "express";
import { examService } from "../../services/exam/exam.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getAllExams = catchAsync(async (req: Request, res: Response) => {
  const exams = await examService.getAll(
    req.user.instituteId,
    req.query as { search?: string; type?: string },
    req.user.role,
    req.user.userId
  );
  res.json(apiResponse.success(exams, "Exams fetched successfully"));
});

export const getExam = catchAsync(async (req: Request, res: Response) => {
  const exam = await examService.getById(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(exam));
});

export const createExam = catchAsync(async (req: Request, res: Response) => {
  const exam = await examService.create(req.body, req.user.instituteId, req.user.userId);
  res.status(201).json(apiResponse.success(exam, "Exam scheduled successfully"));
});

export const updateExam = catchAsync(async (req: Request, res: Response) => {
  const exam = await examService.update(req.params.id as string, req.body, req.user.instituteId);
  res.json(apiResponse.success(exam, "Exam updated successfully"));
});

export const deleteExam = catchAsync(async (req: Request, res: Response) => {
  await examService.delete(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(null, "Exam record removed successfully"));
});

export const submitLiveExam = catchAsync(async (req: Request, res: Response) => {
  const result = await examService.submitLiveExam(
    req.params.id as string,
    req.user.userId,
    req.user.instituteId,
    req.body.answers || []
  );
  res.json(apiResponse.success(result, "Test submitted and evaluated successfully"));
});

export const getExamLeaderboard = catchAsync(async (req: Request, res: Response) => {
  const data = await examService.getExamLeaderboard(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(data, "Exam leaderboard fetched successfully"));
});
