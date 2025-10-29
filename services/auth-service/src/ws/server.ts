import crypto from "crypto";
import { Server as HttpServer, IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { prisma } from "../config/db";
import logger from "../config/logger";
import { redis } from "../config/redis";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  armyId?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type:
    | "auth"
    | "message"
    | "typing"
    | "read"
    | "ping"
    | "get_contacts"
    | "add_friend"
    | "request_public_key";
  sessionToken?: string;
  recipientId?: string;
  encryptedContent?: string;
  encryptedKey?: string; // Encrypted AES key
  iv?: string; // Initialization vector for AES
  messageId?: string;
  timestamp?: number;
  armyId?: string;
}

let wss: WebSocketServer;
const clients = new Map<string, AuthenticatedWebSocket>();

export const createWebSocketServer = (server: HttpServer) => {
  wss = new WebSocketServer({
    server,
    perMessageDeflate: false,
  });

  const address = server.address();
  const port = typeof address === "string" ? address : address?.port;
  logger.info(`WebSocket Server starting on PORT ${port}`);

  // Heartbeat interval to detect dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.isAlive === false) {
        logger.info(`Terminating inactive connection for user ${ws.userId}`);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on(
    "connection",
    async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      try {
        logger.info("New WebSocket connection attempt");
        ws.isAlive = true;

        ws.on("pong", () => {
          ws.isAlive = true;
        });

        ws.on("message", async (data: Buffer) => {
          try {
            const message: WebSocketMessage = JSON.parse(data.toString());

            switch (message.type) {
              case "auth":
                await handleAuth(ws, message);
                break;

              case "message":
                await handleMessage(ws, message);
                break;

              case "typing":
                await handleTyping(ws, message);
                break;

              case "read":
                await handleReadReceipt(ws, message);
                break;

              case "get_contacts":
                await handleGetContacts(ws);
                break;

              case "add_friend":
                await handleAddFriend(ws, message);
                break;

              case "request_public_key":
                await handlePublicKeyRequest(ws, message);
                break;

              case "ping":
                ws.send(
                  JSON.stringify({ type: "pong", timestamp: Date.now() }),
                );
                break;

              default:
                ws.send(
                  JSON.stringify({
                    type: "error",
                    message: "Unknown message type",
                  }),
                );
            }
          } catch (error) {
            logger.error("Error processing message:", error);
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Failed to process message",
              }),
            );
          }
        });

        ws.on("close", () => {
          if (ws.userId) {
            clients.delete(ws.userId);
            logger.info(`User ${ws.userId} disconnected`);

            // Broadcast offline status to friends
            broadcastUserStatus(ws.userId, "offline");
          }
        });

        ws.on("error", (error) => {
          logger.error("WebSocket error:", error);
        });
      } catch (error) {
        logger.error("WebSocket connection error:", error);
        ws.close();
      }
    },
  );

  wss.on("error", (error: any) => {
    logger.error("WebSocket Server error:", error);
  });

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  return wss;
};

// Handle authentication
async function handleAuth(
  ws: AuthenticatedWebSocket,
  message: WebSocketMessage,
) {
  try {
    if (!message.sessionToken) {
      ws.send(
        JSON.stringify({
          type: "auth_error",
          message: "Session token required",
        }),
      );
      return ws.close();
    }

    // Verify session from Redis
    const sessionData = await redis.get(`session:${message.sessionToken}`);

    if (!sessionData) {
      ws.send(
        JSON.stringify({
          type: "auth_error",
          message: "Invalid or expired session",
        }),
      );
      return ws.close();
    }

    const session = JSON.parse(sessionData);

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        keys: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      ws.send(
        JSON.stringify({
          type: "auth_error",
          message: "User not found",
        }),
      );
      return ws.close();
    }

    // Store user info in WebSocket
    ws.userId = user.id;
    ws.armyId = user.armyId;

    // Add to clients map
    clients.set(user.id, ws);

    logger.info(`User ${user.armyId} authenticated successfully`);

    // Send auth success with user public key
    ws.send(
      JSON.stringify({
        type: "auth_success",
        userId: user.id,
        armyId: user.armyId,
        publicKey: user.keys[0]?.publicKey,
      }),
    );

    // Deliver pending messages
    await deliverPendingMessages(ws, user.id);

    // Broadcast online status to friends
    broadcastUserStatus(user.id, "online");
  } catch (error) {
    logger.error("Authentication error:", error);
    ws.send(
      JSON.stringify({
        type: "auth_error",
        message: "Authentication failed",
      }),
    );
    ws.close();
  }
}

// Handle sending E2E encrypted messages
async function handleMessage(
  ws: AuthenticatedWebSocket,
  message: WebSocketMessage,
) {
  try {
    if (!ws.userId) {
      return ws.send(
        JSON.stringify({
          type: "error",
          message: "Not authenticated",
        }),
      );
    }

    if (
      !message.recipientId ||
      !message.encryptedContent ||
      !message.encryptedKey ||
      !message.iv
    ) {
      return ws.send(
        JSON.stringify({
          type: "error",
          message:
            "Missing required fields: recipientId, encryptedContent, encryptedKey, and iv are required for E2E encryption",
        }),
      );
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: message.recipientId },
    });

    if (!recipient) {
      return ws.send(
        JSON.stringify({
          type: "error",
          message: "Recipient not found",
        }),
      );
    }

    // Create message object
    const messageData = {
      type: "message",
      messageId:
        message.messageId ||
        `msg_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`,
      senderId: ws.userId,
      senderArmyId: ws.armyId,
      recipientId: message.recipientId,
      encryptedContent: message.encryptedContent, // AES encrypted content
      encryptedKey: message.encryptedKey, // RSA encrypted AES key
      iv: message.iv, // IV for AES decryption
      timestamp: message.timestamp || Date.now(),
      status: "sent",
    };

    // Store message in Redis for offline delivery (expires in 7 days)
    await redis.setex(
      `message:${messageData.messageId}`,
      604800,
      JSON.stringify(messageData),
    );

    // Add to recipient's pending messages queue
    await redis.lpush(`pending:${message.recipientId}`, messageData.messageId);

    // Optionally persist to database for long-term storage
    try {
      await prisma.message.create({
        data: {
          id: messageData.messageId,
          senderId: ws.userId,
          recipientId: message.recipientId,
          encryptedContent: message.encryptedContent,
          encryptedKey: message.encryptedKey,
          iv: message.iv,
          status: "sent",
          timestamp: new Date(messageData.timestamp),
        },
      });
    } catch (dbError) {
      logger.warn("Failed to persist message to database:", dbError);
      // Continue even if DB save fails - message is in Redis
    }

    // Send confirmation to sender
    ws.send(
      JSON.stringify({
        type: "message_sent",
        messageId: messageData.messageId,
        timestamp: messageData.timestamp,
      }),
    );

    // Try to deliver to recipient if online
    const recipientWs = clients.get(message.recipientId);
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      recipientWs.send(JSON.stringify(messageData));

      // Update message status
      messageData.status = "delivered";
      await redis.setex(
        `message:${messageData.messageId}`,
        604800,
        JSON.stringify(messageData),
      );

      // Remove from pending queue since it was delivered
      await redis.lrem(
        `pending:${message.recipientId}`,
        1,
        messageData.messageId,
      );
    }

    logger.info(
      `E2E encrypted message ${messageData.messageId} sent from ${ws.userId} to ${message.recipientId}`,
    );
  } catch (error) {
    logger.error("Error handling message:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to send message",
      }),
    );
  }
}

// Deliver pending messages when user comes online
async function deliverPendingMessages(
  ws: AuthenticatedWebSocket,
  userId: string,
) {
  try {
    // Get all pending message IDs for this user
    const pendingMessageIds = await redis.lrange(`pending:${userId}`, 0, -1);

    if (pendingMessageIds.length === 0) {
      return;
    }

    logger.info(
      `Delivering ${pendingMessageIds.length} pending messages to user ${userId}`,
    );

    // Deliver each pending message
    for (const messageId of pendingMessageIds) {
      const messageData = await redis.get(`message:${messageId}`);

      if (messageData) {
        const msg = JSON.parse(messageData);

        // Send the message
        ws.send(
          JSON.stringify({
            ...msg,
            status: "delivered",
          }),
        );

        // Update status in Redis
        msg.status = "delivered";
        await redis.setex(`message:${messageId}`, 604800, JSON.stringify(msg));

        // Update in database if exists
        try {
          await prisma.message.update({
            where: { id: messageId },
            data: { status: "delivered" },
          });
        } catch (dbError) {
          logger.warn(
            `Failed to update message ${messageId} in database:`,
            dbError,
          );
        }
      }

      // Remove from pending queue
      await redis.lrem(`pending:${userId}`, 1, messageId);
    }

    logger.info(
      `Successfully delivered ${pendingMessageIds.length} pending messages to user ${userId}`,
    );
  } catch (error) {
    logger.error("Error delivering pending messages:", error);
  }
}

// Handle public key request (for E2E encryption setup)
async function handlePublicKeyRequest(
  ws: AuthenticatedWebSocket,
  message: WebSocketMessage,
) {
  try {
    if (!ws.userId) {
      return ws.send(
        JSON.stringify({
          type: "error",
          message: "Not authenticated",
        }),
      );
    }

    if (!message.recipientId) {
      return ws.send(
        JSON.stringify({
          type: "error",
          message: "Recipient ID required",
        }),
      );
    }

    // Get recipient's public key
    const recipient = await prisma.user.findUnique({
      where: { id: message.recipientId },
      include: {
        keys: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!recipient || recipient.keys.length === 0) {
      return ws.send(
        JSON.stringify({
          type: "error",
          message: "Recipient or public key not found",
        }),
      );
    }

    ws.send(
      JSON.stringify({
        type: "public_key_response",
        userId: recipient.id,
        armyId: recipient.armyId,
        publicKey: recipient.keys[0].publicKey,
      }),
    );
  } catch (error) {
    logger.error("Error handling public key request:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to get public key",
      }),
    );
  }
}

// Handle typing indicators
async function handleTyping(
  ws: AuthenticatedWebSocket,
  message: WebSocketMessage,
) {
  if (!ws.userId || !message.recipientId) return;

  const recipientWs = clients.get(message.recipientId);
  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
    recipientWs.send(
      JSON.stringify({
        type: "typing",
        userId: ws.userId,
        armyId: ws.armyId,
      }),
    );
  }
}

// Handle read receipts
async function handleReadReceipt(
  ws: AuthenticatedWebSocket,
  message: WebSocketMessage,
) {
  if (!ws.userId || !message.messageId) return;

  // Update message status in Redis
  const messageData = await redis.get(`message:${message.messageId}`);
  if (messageData) {
    const msg = JSON.parse(messageData);
    msg.status = "read";
    await redis.setex(
      `message:${message.messageId}`,
      604800,
      JSON.stringify(msg),
    );

    // Update in database
    try {
      await prisma.message.update({
        where: { id: message.messageId },
        data: { status: "read" },
      });
    } catch (dbError) {
      logger.warn("Failed to update message status in database:", dbError);
    }

    // Notify sender
    const senderWs = clients.get(msg.senderId);
    if (senderWs && senderWs.readyState === WebSocket.OPEN) {
      senderWs.send(
        JSON.stringify({
          type: "message_read",
          messageId: message.messageId,
          readBy: ws.userId,
        }),
      );
    }
  }
}

// Handle get contacts
async function handleGetContacts(ws: AuthenticatedWebSocket) {
  try {
    if (!ws.userId) return;

    const user = await prisma.user.findUnique({
      where: { id: ws.userId },
      include: {
        Friends: {
          include: {
            friend: {
              select: {
                id: true,
                armyId: true,
                name: true,
                designation: true,
                keys: {
                  select: { publicKey: true },
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const contacts = user?.Friends.map((f) => ({
      id: f.friend.id,
      armyId: f.friend.armyId,
      name: f.friend.name,
      designation: f.friend.designation,
      publicKey: f.friend.keys[0]?.publicKey,
      status: clients.has(f.friend.id) ? "online" : "offline",
    }));

    ws.send(
      JSON.stringify({
        type: "contacts",
        contacts,
      }),
    );
  } catch (error) {
    logger.error("Error getting contacts:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to get contacts",
      }),
    );
  }
}

// Handle add friend
async function handleAddFriend(
  ws: AuthenticatedWebSocket,
  message: WebSocketMessage,
) {
  try {
    if (!ws.userId || !message.armyId) {
      return ws.send(
        JSON.stringify({
          type: "error",
          message: "Army ID required",
        }),
      );
    }

    // Find friend by army ID
    const friend = await prisma.user.findUnique({
      where: { armyId: message.armyId },
      include: {
        keys: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!friend) {
      return ws.send(
        JSON.stringify({
          type: "error",
          message: "User not found",
        }),
      );
    }

    if (friend.id === ws.userId) {
      return ws.send(
        JSON.stringify({
          type: "error",
          message: "Cannot add yourself as friend",
        }),
      );
    }

    // Check if already friends
    const existingFriend = await prisma.friend.findFirst({
      where: {
        userId: ws.userId,
        friendId: friend.id,
      },
    });

    if (existingFriend) {
      return ws.send(
        JSON.stringify({
          type: "error",
          message: "Already friends",
        }),
      );
    }

    // Create friend relationship (bidirectional)
    await prisma.friend.createMany({
      data: [
        {
          userId: ws.userId,
          friendId: friend.id,
        },
        {
          userId: friend.id,
          friendId: ws.userId,
        },
      ],
    });

    ws.send(
      JSON.stringify({
        type: "friend_added",
        friend: {
          id: friend.id,
          armyId: friend.armyId,
          name: friend.name,
          designation: friend.designation,
          publicKey: friend.keys[0]?.publicKey,
        },
      }),
    );

    // Notify the friend if they're online
    const friendWs = clients.get(friend.id);
    if (friendWs && friendWs.readyState === WebSocket.OPEN) {
      const currentUser = await prisma.user.findUnique({
        where: { id: ws.userId },
        include: {
          keys: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      friendWs.send(
        JSON.stringify({
          type: "friend_added",
          friend: {
            id: currentUser!.id,
            armyId: currentUser!.armyId,
            name: currentUser!.name,
            designation: currentUser!.designation,
            publicKey: currentUser!.keys[0]?.publicKey,
          },
        }),
      );
    }
  } catch (error) {
    logger.error("Error adding friend:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to add friend",
      }),
    );
  }
}

// Broadcast user status to friends
async function broadcastUserStatus(
  userId: string,
  status: "online" | "offline",
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        FriendOf: {
          select: { userId: true },
        },
      },
    });

    if (!user) return;

    const statusMessage = JSON.stringify({
      type: "user_status",
      userId,
      armyId: user.armyId,
      status,
    });

    user.FriendOf.forEach((f) => {
      const friendWs = clients.get(f.userId);
      if (friendWs && friendWs.readyState === WebSocket.OPEN) {
        friendWs.send(statusMessage);
      }
    });
  } catch (error) {
    logger.error("Error broadcasting status:", error);
  }
}

export const closeWebSocketServer = async () => {
  if (wss) {
    logger.info("Closing WebSocket server...");
    await new Promise<void>((resolve) => wss.close(() => resolve()));
    logger.info("WebSocket server closed.");
  }
};

export { clients, wss };
