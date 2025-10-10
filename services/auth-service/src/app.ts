import "dotenv/config";

import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { authRouter } from './routes';
import { initializeWebSocket } from './websocket/chatServer';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);

// Initialize WebSocket
initializeWebSocket(httpServer);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
