import { NextFunction, Request, Response } from "express";
import logger from "../config/logger";

export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  logger.warn(`Resource not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "Resource not found" });
  next();
};
