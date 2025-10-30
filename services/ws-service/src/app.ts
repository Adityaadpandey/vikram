import dotenv from "dotenv";

dotenv.config();

import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { config } from "./config";
import logger from "./config/logger";
import { connectRedis } from "./config/redis";
// import { connectKafka } from "./kafka";
import { setupGracefulShutdown } from "./utils/shutDown";
import { createWebSocketServer } from "./ws/server";

// Initialize Express app

const app = express();
app.use(cors());
app.use(express.json());

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

    // await connectKafka();
    createWebSocketServer(server);

    // Setup graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
