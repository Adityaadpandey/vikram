import cluster from "cluster";
import { cpus } from "os";
import { startServer } from "./app";
import logger from "./config/logger";

const numCPUs = cpus().length;

if (cluster.isPrimary) {
  logger.info(`Primary process ${process.pid} is running`);
  logger.info(`Forking ${numCPUs} workers to utilize all CPU cores...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    logger.warn(
      `Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Spawning a new one.`,
    );
    cluster.fork();
  });
} else {
  logger.info(`Worker ${process.pid} started`);
  startServer();
}
