import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

type Role = "super_admin" | "owner" | "admin" | "teacher" | "accountant" | "student" | "parent";

export const checkRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new AppError("Access denied. You do not have permission for this action.", 403);
    }
    next();
  };
};
