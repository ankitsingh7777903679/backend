import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import { JWTPayload } from "../types/express";
import { catchAsync } from "../utils/catchAsync";

export const verifyToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required. Token missing.", 401);
  }

  const token = authHeader.split(" ")[1];

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new AppError("JWT Access Secret not configured in environment.", 500);
  }

  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    req.user = decoded;
    next();
  } catch {
    throw new AppError("Authentication failed. Please login again.", 401);
  }
});

// Alias — used by all route files
export const authenticate = verifyToken;
