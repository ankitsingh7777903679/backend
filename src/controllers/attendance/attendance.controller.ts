import { Request, Response } from "express";
import { attendanceService } from "../../services/attendance/attendance.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getBatchAttendance = catchAsync(async (req: Request, res: Response) => {
  const { batchId, dateStr } = req.query as { batchId: string; dateStr: string };
  const record = await attendanceService.getBatchAttendance(req.user.instituteId, batchId, dateStr);
  res.json(apiResponse.success(record));
});

export const getAllAttendance = catchAsync(async (req: Request, res: Response) => {
  const records = await attendanceService.getAllRecords(req.user.instituteId, req.query as { batchId?: string; dateStr?: string });
  res.json(apiResponse.success(records, "Attendance records fetched"));
});

export const markAttendance = catchAsync(async (req: Request, res: Response) => {
  const result = await attendanceService.markAttendance(
    req.body,
    req.user.instituteId,
    req.user.userId,
    req.user.role === "owner" || req.user.role === "admin" ? "Admin" : "Teacher"
  );
  res.status(200).json(apiResponse.success(result, "Attendance saved and WhatsApp alerts dispatched"));
});

export const getMyAttendanceHistory = catchAsync(async (req: Request, res: Response) => {
  const records = await attendanceService.getStudentAttendanceHistory(
    req.user.instituteId,
    req.user.userId,
    req.user.email,
    req.user.name
  );
  res.json(apiResponse.success(records, "Student attendance history loaded"));
});
