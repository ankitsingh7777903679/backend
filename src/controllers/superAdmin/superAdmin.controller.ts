import { Request, Response } from "express";
import { superAdminService } from "../../services/superAdmin/superAdmin.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getOverview = catchAsync(async (req: Request, res: Response) => {
  const data = await superAdminService.getOverview();
  res.json(apiResponse.success(data, "Super admin master overview fetched successfully"));
});

export const toggleInstituteStatus = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.body;
  const inst = await superAdminService.toggleInstituteStatus(req.params.id as string, status);
  res.json(apiResponse.success(inst, `Institute status updated to ${status}`));
});
