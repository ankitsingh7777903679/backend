import { Request, Response } from "express";
import { whatsappService } from "../../services/whatsapp/whatsapp.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getAllTemplates = catchAsync(async (req: Request, res: Response) => {
  const templates = await whatsappService.getAllTemplates(req.user.instituteId, req.query as { category?: string });
  res.json(apiResponse.success(templates, "WhatsApp templates fetched successfully"));
});

export const createTemplate = catchAsync(async (req: Request, res: Response) => {
  const template = await whatsappService.createTemplate(req.body, req.user.instituteId);
  res.status(201).json(apiResponse.success(template, "WhatsApp template created & approved by Meta"));
});

export const sendBroadcast = catchAsync(async (req: Request, res: Response) => {
  const result = await whatsappService.sendBroadcast(req.body, req.user.instituteId);
  res.json(apiResponse.success(result, "WhatsApp broadcast dispatched successfully"));
});

export const deleteTemplate = catchAsync(async (req: Request, res: Response) => {
  await whatsappService.deleteTemplate(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(null, "WhatsApp template removed"));
});
