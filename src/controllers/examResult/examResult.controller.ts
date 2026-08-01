import { Request, Response } from "express";
import { examResultService } from "../../services/examResult/examResult.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getResultsByExam = catchAsync(async (req: Request, res: Response) => {
  const results = await examResultService.getResultsByExam(
    req.params.examId as string,
    req.user.instituteId
  );
  res.json(apiResponse.success(results, "Exam results retrieved successfully"));
});

export const submitResults = catchAsync(async (req: Request, res: Response) => {
  const results = await examResultService.submitResults(
    req.params.examId as string,
    req.body,
    req.user.instituteId
  );
  res.json(apiResponse.success(results, "Exam marks saved and evaluation completed successfully"));
});
