import { Request, Response } from "express";
import { reportService } from "../../services/report/report.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getFinancialSummary = catchAsync(async (req: Request, res: Response) => {
  const monthFilter = typeof req.query.month === "string" ? req.query.month : undefined;
  const summary = await reportService.getFinancialSummary(String(req.user.instituteId), monthFilter);
  res.json(apiResponse.success(summary, "Financial and academic summary reports generated successfully"));
});

export const getStudentProgressReport = catchAsync(async (req: Request, res: Response) => {
  const studentId = String(req.params.studentId);
  const monthFilter = typeof req.query.month === "string" ? req.query.month : undefined;
  const report = await reportService.getStudentProgressReport(String(req.user.instituteId), studentId, monthFilter);
  res.json(apiResponse.success(report, "Student progress report card generated successfully"));
});
