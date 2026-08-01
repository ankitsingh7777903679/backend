import { Request, Response } from "express";
import { noticeService } from "../../services/notice/notice.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getAllNotices = catchAsync(async (req: Request, res: Response) => {
  const list = await noticeService.getAll(req.user.instituteId, req.query as { search?: string; audience?: string });
  res.json(apiResponse.success(list, "Notices fetched successfully"));
});

export const getNotice = catchAsync(async (req: Request, res: Response) => {
  const item = await noticeService.getById(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(item));
});

export const createNotice = catchAsync(async (req: Request, res: Response) => {
  const item = await noticeService.create(
    req.body,
    req.user.instituteId,
    req.user.userId,
    req.user.role === "owner" || req.user.role === "admin" ? "Institute Admin" : "Teacher"
  );
  res.status(201).json(apiResponse.success(item, "Notice published and broadcasted successfully"));
});

export const updateNotice = catchAsync(async (req: Request, res: Response) => {
  const item = await noticeService.update(req.params.id as string, req.body, req.user.instituteId);
  res.json(apiResponse.success(item, "Notice updated successfully"));
});

export const resendWhatsAppBroadcast = catchAsync(async (req: Request, res: Response) => {
  const item = await noticeService.resendWhatsAppBroadcast(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(item, "WhatsApp broadcast re-sent successfully!"));
});

export const deleteNotice = catchAsync(async (req: Request, res: Response) => {
  await noticeService.delete(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(null, "Notice record removed successfully"));
});
