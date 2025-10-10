import { Server as HttpServer, IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";
import logger from "../config/logger";

let wss: WebSocketServer;

export const createWebSocketServer = (server: HttpServer) => {
  wss = new WebSocketServer({
    server,
    perMessageDeflate: false,
  });

  const address = server.address();
  const port = typeof address === "string" ? address : address?.port;
  logger.info(`WebSocket Server starting on PORT ${port}`);

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    try {
    } catch (error) {
      logger.error("WebSocket connection error:", error);
    }
  });

  wss.on("error", (error: any) => {
    logger.error("WebSocket Server error:", error);
  });

  return wss;
};

export const closeWebSocketServer = async () => {
  if (wss) {
    logger.info("Closing WebSocket server...");
    await new Promise<void>((resolve) => wss.close(() => resolve()));
    logger.info("WebSocket server closed.");
  }
};
