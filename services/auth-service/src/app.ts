import "dotenv/config";

import cors from "cors";
import express from "express";
import { createServer } from "http";
import { authRouter } from "./routes";
import { initializeWebSocket } from "./websocket/chatServer";

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    socketio: "ready",
  });
});

// Routes
app.use("/api/auth", authRouter);

// Initialize WebSocket BEFORE starting server
console.log("🔧 Initializing WebSocket...");
const io = initializeWebSocket(httpServer);
console.log("✅ WebSocket initialized");

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log("\n" + "=".repeat(50));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket ready at ws://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log("=".repeat(50) + "\n");
});

// Error handling
httpServer.on("error", (error: any) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error("❌ Server error:", error);
  }
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  httpServer.close(() => {
    console.log("HTTP server closed");
  });
});
