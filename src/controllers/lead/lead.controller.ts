import { Request, Response } from "express";
import { leadService } from "../../services/lead/lead.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getAllLeads = catchAsync(async (req: Request, res: Response) => {
  const result = await leadService.getAll(req.user.instituteId, req.query as { search?: string; stage?: string });
  res.json(apiResponse.success(result, "Leads fetched successfully"));
});

export const createLead = catchAsync(async (req: Request, res: Response) => {
  const lead = await leadService.create(req.body, req.user.instituteId);
  res.status(201).json(apiResponse.success(lead, "Lead inquiry created successfully"));
});

export const updateLeadStage = catchAsync(async (req: Request, res: Response) => {
  const { stage } = req.body;
  const lead = await leadService.updateStage(req.params.id as string, stage, req.user.instituteId);
  res.json(apiResponse.success(lead, "Lead stage updated"));
});

export const convertLeadToStudent = catchAsync(async (req: Request, res: Response) => {
  const result = await leadService.convertLeadToStudent(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(result, "Lead successfully converted into enrolled student!"));
});
