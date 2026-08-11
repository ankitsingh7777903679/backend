import { Request, Response } from "express";
import { portalAccessService } from "../../services/portalAccess/portalAccess.service";
import { apiResponse } from "../../utils/apiResponse";
import { catchAsync } from "../../utils/catchAsync";

export const createInvitation = catchAsync(async (req: Request, res: Response) => {
  const invitation = await portalAccessService.createInvitation(req.params.profileType as "teacher" | "student", String(req.params.profileId), req.user.instituteId, req.user.userId);
  res.status(201).json(apiResponse.success(invitation, "Portal invitation sent"));
});

export const acceptInvitation = catchAsync(async (req: Request, res: Response) => {
  const result = await portalAccessService.acceptInvitation(String(req.params.token), req.body.password);
  res.json(apiResponse.success(result, "Portal account activated"));
});

export const revokeInvitation = catchAsync(async (req: Request, res: Response) => {
  const invitation = await portalAccessService.revokeInvitation(String(req.params.id), req.user.instituteId);
  res.json(apiResponse.success(invitation, "Portal invitation revoked"));
});

export const setPortalAccess = catchAsync(async (req: Request, res: Response) => {
  const result = await portalAccessService.setPortalAccess(req.params.profileType as "teacher" | "student", String(req.params.profileId), req.body.enabled, req.user.instituteId, req.user.userId);
  res.json(apiResponse.success(result, req.body.enabled ? "Portal invitation sent" : "Portal access disabled"));
});

export const listPending = catchAsync(async (req: Request, res: Response) => {
  const invitations = await portalAccessService.listPending(req.user.instituteId);
  res.json(apiResponse.success(invitations, "Pending portal invitations fetched"));
});

export const getMigrationReport = catchAsync(async (req: Request, res: Response) => {
  const report = await portalAccessService.getMigrationReport(req.user.instituteId);
  res.json(apiResponse.success(report, "Portal account migration review generated"));
});
