import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { ZodError } from "zod";
import mongoose from "mongoose";

export function notFound(req: Request, res: Response) {
  res
    .status(404)
    .json({ success: false, message: `Route not found: ${req.method}` });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Own Error
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }

  // Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  //  Mongoose error Wrong Object id
  if (err instanceof mongoose.Error.CastError) {
    return res
      .status(400)
      .json({ success: false, message: `Invalid ${err.path}` });
  }

  // Mongoose duplicate unique index
  if (typeof err === "object" && err !== null && (err as any).code === 11000) {
    return res.status(409).json({ success: false, message: "Duplicate entry" });
  }

  console.error(err);
  res.status(500).json({ success: false, message: "Something went wrong" });
}
