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

export const checkPermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    // Owner, Admin, and Super Admin bypass granular permission checks
    if (req.user.role === "owner" || req.user.role === "admin" || req.user.role === "super_admin") {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    if (!userPermissions.includes(requiredPermission)) {
      throw new AppError(`Access denied. Missing permission '${requiredPermission}'.`, 403);
    }

    next();
  };
};
