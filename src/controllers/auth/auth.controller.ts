import { Request, Response } from "express";
import { authService } from "../../services/auth/auth.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const registerInstitute = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerInstitute(req.body);
  res.status(201).json(apiResponse.success(result, "Institute registered successfully"));
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json(apiResponse.success(result, "Login successful"));
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const tokens = await authService.refreshAccessToken(req.body.refreshToken);
  res.json(apiResponse.success(tokens, "Token refreshed successfully"));
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(req.user.userId);
  res.json(apiResponse.success(null, "Logged out successfully"));
});

export const sendOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.sendOtp(req.body.email);
  res.json(apiResponse.success(result, "OTP code sent to email successfully"));
});

export const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.verifyOtp(req.body.email, req.body.otpCode);
  res.json(apiResponse.success(result, "OTP verification successful"));
});

