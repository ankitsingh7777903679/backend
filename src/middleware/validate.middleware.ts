import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate = (source: "body" | "query" | "params", schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }
    req[source] = result.data;
    next();
  };
};
