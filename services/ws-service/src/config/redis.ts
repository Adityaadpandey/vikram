import IORedis from "ioredis";
import { config } from ".";
import logger from "./logger";

export const redis = new IORedis(
  config.REDIS_URL || "redis://:cantremember@localhost:6379",
  {
    retryStrategy: (times) => {
      // Exponential backoff (min 50ms, max 1000ms)
      const delay = Math.min(times * 50, 1000);
      return delay;
    },
    connectTimeout: 10000,
    db: 0,
    maxRetriesPerRequest: null,
  },
);

// Event handlers
redis.on("error", (err) => logger.error("Redis Client Error:", err));
redis.on("connect", () => logger.info("Redis Connected Successfully"));
redis.on("reconnecting", () => logger.info("Redis Reconnecting..."));
redis.on("ready", () => logger.info("Redis Ready"));
redis.on("end", () => logger.info("Redis Connection Ended"));

export const connectRedis = async () => {
  try {
    // ioredis connects automatically, but you can manually test connection
    await redis.ping();
    logger.info("Redis Ping Successful");
  } catch (error) {
    logger.error("Failed to connect to Redis:", error);
    throw error;
  }
};

export const disconnectRedis = async () => {
  try {
    await redis.quit();
    logger.info("Redis Client Disconnected");
  } catch (error) {
    logger.error("Error disconnecting Redis:", error);
  }
};

export const ensureConnection = async () => {
  try {
    await redis.ping();
  } catch {
    await connectRedis();
  }
};
