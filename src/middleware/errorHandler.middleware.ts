import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`${err.name}: ${err.message}`, { stack: err.stack, url: req.originalUrl });
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  logger.error(`${err.name}: ${err.message}`, { stack: err.stack, url: req.originalUrl });

  // Mongoose duplicate key error
  if ((err as { code?: number }).code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate entry — record already exists",
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
