import dotenv from "dotenv";

dotenv.config();

import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import http from "node:http";

import { config } from "./config";
import logger from "./config/logger";
import { proxyServices } from "./config/services";
import { errorHandler } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import { limiter } from "./middlewares/rate-limit.middleware";
import { reqMiddleware } from "./middlewares/req.middleware";

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: "*" }));

app.use(limiter);
app.use(reqMiddleware);

// Health endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Route proxies
proxyServices(app);

// 404
app.use(notFoundMiddleware);

// Error handler
app.use(errorHandler);

export const startServer = () => {
  try {
    server.listen(config.PORT, () => {
      logger.info(
        `${config.SERVICE_NAME} running on port ${config.PORT} in worker ${process.pid}`,
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};
