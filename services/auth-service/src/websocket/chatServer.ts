import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../config/jwt";
import { redis } from "../config/redis";
import { decryptMessage, encryptMessage } from "../utils/encryption";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  privateKey?: string;
  publicKey?: string;
}

export const initializeWebSocket = (httpServer: HTTPServer) => {
  console.log("🔌 Creating Socket.IO server...");

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["polling", "websocket"], // Start with polling, upgrade to websocket
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log("✅ Socket.IO server created");

  // Log all connection attempts
  io.engine.on("connection_error", (err) => {
    console.error("❌ Connection error:", err);
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    console.log("🔐 Authenticating socket connection...");

    try {
      const token = socket.handshake.auth.token;

      console.log("Token received:", token ? "Yes" : "No");

      if (!token) {
        console.log("❌ No token provided");
        return next(new Error("Authentication token required"));
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        console.log("❌ Invalid token");
        return next(new Error("Invalid token"));
      }

      socket.userId = decoded.userId;
      console.log(`✅ User authenticated: ${socket.userId}`);
      next();
    } catch (error: any) {
      console.error("❌ Auth error:", error.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket: AuthenticatedSocket) => {
    console.log("\n" + "=".repeat(50));
    console.log(`✅ NEW CONNECTION`);
    console.log(`User ID: ${socket.userId}`);
    console.log(`Socket ID: ${socket.id}`);
    console.log(`Transport: ${socket.conn.transport.name}`);
    console.log("=".repeat(50) + "\n");

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Store user's socket ID in Redis
    try {
      await redis.setex(`socket:${socket.userId}`, 3600, socket.id);
      console.log(`💾 Stored socket ID in Redis for user ${socket.userId}`);
    } catch (err) {
      console.error("❌ Redis error:", err);
    }

    // Send connection confirmation
    socket.emit("connected", {
      userId: socket.userId,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });

    // Handle setting up encryption keys
    socket.on("setup_encryption", async (data) => {
      console.log(`🔐 Setting up encryption for ${socket.userId}`);

      try {
        const { privateKey, publicKey } = data;

        if (!privateKey || !publicKey) {
          socket.emit("error", {
            message: "Private and public keys are required",
          });
          return;
        }

        // Store keys in socket for this session
        socket.privateKey = privateKey;
        socket.publicKey = publicKey;

        // Store public key in Redis for other users to access
        await redis.setex(`public_key:${socket.userId}`, 3600, publicKey);

        socket.emit("encryption_ready", {
          message: "Encryption setup complete",
          userId: socket.userId,
        });

        console.log(`✅ Encryption setup complete for ${socket.userId}`);
      } catch (error: any) {
        console.error("❌ Encryption setup error:", error);
        socket.emit("error", { message: "Failed to setup encryption" });
      }
    });

    // Handle sending encrypted message
    socket.on("send_message", async (data) => {
      console.log(`📨 Message from ${socket.userId}:`, data);

      try {
        const { recipientId, message } = data;

        if (!recipientId || !message) {
          socket.emit("error", {
            message: "Recipient ID and message are required",
          });
          return;
        }

        if (!socket.privateKey) {
          socket.emit("error", {
            message: "Encryption not set up. Call setup_encryption first.",
          });
          return;
        }

        // Get recipient's public key
        const recipientPublicKey = await redis.get(`public_key:${recipientId}`);

        if (!recipientPublicKey) {
          socket.emit("error", {
            message: "Recipient not available for encryption",
          });
          return;
        }

        // Encrypt message for recipient
        const encryptedForRecipient = encryptMessage(
          message,
          recipientPublicKey,
        );

        // Encrypt message for sender (for their own records)
        const encryptedForSender = encryptMessage(message, socket.publicKey!);

        const messageData = {
          from: socket.userId,
          to: recipientId,
          encryptedMessage: encryptedForRecipient,
          timestamp: new Date().toISOString(),
        };

        // Check if recipient is online
        const recipientSocketId = await redis.get(`socket:${recipientId}`);

        if (recipientSocketId) {
          io.to(`user:${recipientId}`).emit("receive_message", messageData);
          console.log(`✅ Message delivered to ${recipientId}`);
        } else {
          console.log(`📦 Recipient ${recipientId} offline, storing message`);
          await redis.lpush(
            `messages:${recipientId}`,
            JSON.stringify(messageData),
          );
          await redis.expire(`messages:${recipientId}`, 86400);
        }

        // Send confirmation back to sender
        socket.emit("message_sent", {
          ...messageData,
          encryptedMessage: encryptedForSender,
          status: recipientSocketId ? "delivered" : "pending",
        });
      } catch (error: any) {
        console.error("❌ Send message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle decrypting received message
    socket.on("decrypt_message", async (data) => {
      console.log(`🔓 Decrypting message for ${socket.userId}`);

      try {
        const { encryptedMessage } = data;

        if (!encryptedMessage) {
          socket.emit("error", { message: "Encrypted message is required" });
          return;
        }

        if (!socket.privateKey) {
          socket.emit("error", { message: "Private key not available" });
          return;
        }

        // Decrypt the message
        const decryptedMessage = decryptMessage(
          encryptedMessage,
          socket.privateKey,
        );

        socket.emit("message_decrypted", {
          decryptedMessage,
          timestamp: new Date().toISOString(),
        });

        console.log(`✅ Message decrypted for ${socket.userId}`);
      } catch (error: any) {
        console.error("❌ Decrypt message error:", error);
        socket.emit("error", { message: "Failed to decrypt message" });
      }
    });

    // Get pending messages
    socket.on("get_pending_messages", async () => {
      console.log(`📬 Getting pending messages for ${socket.userId}`);

      try {
        const messages = await redis.lrange(`messages:${socket.userId}`, 0, -1);

        if (messages.length > 0) {
          const parsedMessages = messages.map((msg) => JSON.parse(msg));
          socket.emit("pending_messages", parsedMessages);
          await redis.del(`messages:${socket.userId}`);
          console.log(`✅ Delivered ${messages.length} pending messages`);
        } else {
          console.log(`📭 No pending messages`);
        }
      } catch (error) {
        console.error("❌ Get pending messages error:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async (reason) => {
      console.log(`❌ User ${socket.userId} disconnected: ${reason}`);
      await redis.del(`socket:${socket.userId}`);
      await redis.del(`public_key:${socket.userId}`);
    });

    // Log all events
    socket.onAny((eventName, ...args) => {
      console.log(`📡 Event: ${eventName}`, args);
    });
  });

  return io;
};
