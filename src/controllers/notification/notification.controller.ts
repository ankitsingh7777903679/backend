import { Request, Response } from "express";
import { notificationService } from "../../services/notification/notification.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await notificationService.getUserNotifications(req.user.instituteId, req.user.userId, limit);
  res.json(apiResponse.success(result, "Notifications fetched successfully"));
});

export const markRead = catchAsync(async (req: Request, res: Response) => {
  const { notificationId } = req.body as { notificationId?: string };
  const result = await notificationService.markAsRead(req.user.instituteId, req.user.userId, notificationId);
  res.json(apiResponse.success(result, "Notifications updated"));
});

export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const notificationId = String(req.params.id);
  const result = await notificationService.deleteNotification(req.user.instituteId, req.user.userId, notificationId);
  res.json(apiResponse.success(result, "Notification deleted"));
});
