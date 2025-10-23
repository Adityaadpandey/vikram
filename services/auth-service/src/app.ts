import dotenv from "dotenv";

dotenv.config();

import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { config } from "./config";
import logger from "./config/logger";
import { connectRedis } from "./config/redis";
import { authRouter } from "./router/auth";
import { setupGracefulShutdown } from "./utils/shutDown";
import { createWebSocketServer } from "./ws/server";

// Initialize Express app

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.get("/api/v1/auth/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use((req: Request, res: Response) => {
  logger.warn(`Resource not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "resource not found" });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

const startServer = async () => {
  try {
    await connectRedis();
    const server = app.listen(config.PORT, () => {
      logger.info(`${config.SERVICE_NAME} running on port ${config.PORT}`);
    });

    createWebSocketServer(server);

    // Setup graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
