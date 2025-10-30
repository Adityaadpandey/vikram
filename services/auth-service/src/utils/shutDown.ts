import { Server } from "http";
import logger from "../config/logger";
import { redis } from "../config/redis";

export const setupGracefulShutdown = (server: Server) => {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    try {
      // CLosing HTTP Server
      await new Promise<void>((resolve) => {
        server.close(() => {
          logger.info("HTTP server closed.");
          resolve();
        });
      });

      await redis.quit();
      logger.info("Redis connection closed.");

      logger.info("All connections closed. Exiting process.");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    shutdown("unhandledRejection");
  });
};
