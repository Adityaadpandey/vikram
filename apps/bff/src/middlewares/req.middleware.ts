import { NextFunction, Request, Response } from "express";
import logger from "../config/logger";

export const reqMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = process.hrtime();

  logger.info(
    `Incoming request: ${req.method} ${req.originalUrl} from ${req.ip}`,
  );

  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);

    logger.info(
      `Request completed: ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${durationMs} ms`,
    );
  });

  next();
};
