import { Request, Response } from "express";
import { settingService } from "../../services/setting/setting.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const getSetting = catchAsync(async (req: Request, res: Response) => {
  const setting = await settingService.get(req.user.instituteId);
  res.json(apiResponse.success(setting, "Institute settings fetched successfully"));
});

export const updateSetting = catchAsync(async (req: Request, res: Response) => {
  const setting = await settingService.update(req.body, req.user.instituteId);
  res.json(apiResponse.success(setting, "Institute settings updated successfully"));
});
