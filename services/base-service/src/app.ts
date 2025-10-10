import dotenv from "dotenv";
dotenv.config();

import express from "express";

import { config } from "./config";
import logger from "./config/logger";
import { connectRedis } from "./config/redis";
import { authRouter } from "./routes";

const app = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/api/v1/auth/health", (req, res) => {
  res.status(200).json({ status: "ok", service: config.SERVICE_NAME });
});

app.use("/api/v1/auth", authRouter);

// Start server
export const startServer = async () => {
  try {
    await connectRedis();
    app.listen(config.PORT, () => {
      logger.info(`${config.SERVICE_NAME} running on port ${config.PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};
