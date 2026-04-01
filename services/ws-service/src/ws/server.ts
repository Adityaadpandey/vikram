import crypto from "crypto";
import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { prisma } from "../config/db";
import logger from "../config/logger";
import { redis } from "../config/redis";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  armyId?: string;
}

let io: Server;
const clients = new Map<string, AuthenticatedSocket>();

export const createWebSocketServer = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  const address = server.address();
  const port = typeof address === "string" ? address : address?.port;
  logger.info(`Socket.IO Server starting on PORT ${port}`);

  io.on("connection", async (socket: AuthenticatedSocket) => {
    try {
      logger.info(`New Socket.IO connection: ${socket.id}`);

      // --- Authentication via "message" envelope (mobile sends {type: "auth", ...}) ---
      socket.on("message", async (data: any) => {
        try {
          if (!data || !data.type) {
            socket.emit("error", { message: "Invalid message format" });
            return;
          }

          switch (data.type) {
            case "auth":
              await handleAuth(socket, data);
              break;
            case "message":
              await handleMessage(socket, data);
              break;
            case "typing":
              await handleTyping(socket, data);
              break;
            case "read":
              await handleReadReceipt(socket, data);
              break;
            case "get_contacts":
              await handleGetContacts(socket);
              break;
            case "add_friend":
              await handleAddFriend(socket, data);
              break;
            case "request_public_key":
              await handlePublicKeyRequest(socket, data);
              break;
            case "ping":
              socket.emit("pong", { timestamp: Date.now() });
              break;

            // --- Group handlers ---
            case "create_group":
              await handleCreateGroup(socket, data);
              break;
            case "group_message":
              await handleGroupMessage(socket, data);
              break;
            case "get_groups":
              await handleGetGroups(socket);
              break;
            case "add_group_member":
              await handleAddGroupMember(socket, data);
              break;
            case "remove_group_member":
              await handleRemoveGroupMember(socket, data);
              break;
            case "leave_group":
              await handleLeaveGroup(socket, data);
              break;

            // --- WebRTC signaling stubs & Call History ---
            case "get_calls":
              await handleGetCalls(socket);
              break;
            case "call_offer":
              await handleCallSignal(socket, data, "call_offer");
              break;
            case "call_answer":
              await handleCallSignal(socket, data, "call_answer");
              break;
            case "ice_candidate":
              await handleCallSignal(socket, data, "ice_candidate");
              break;
            case "call_end":
              await handleCallSignal(socket, data, "call_end");
              break;

            // --- Starred Messages ---
            case "star_message":
              await handleStarMessage(socket, data);
              break;
            case "unstar_message":
              await handleUnstarMessage(socket, data);
              break;
            case "get_starred_messages":
              await handleGetStarredMessages(socket);
              break;

            default:
              socket.emit("error", { message: "Unknown message type" });
          }
        } catch (error) {
          logger.error("Error processing message:", error);
          socket.emit("error", { message: "Failed to process message" });
        }
      });

      // Also handle direct "auth" event (mobile tries both patterns)
      socket.on("auth", async (data: any) => {
        try {
          await handleAuth(socket, { ...data, type: "auth" });
        } catch (error) {
          logger.error("Error processing direct auth:", error);
          socket.emit("error", { message: "Authentication failed" });
        }
      });

      socket.on("disconnect", (reason) => {
        if (socket.userId) {
          clients.delete(socket.userId);
          logger.info(`User ${socket.userId} disconnected: ${reason}`);
          broadcastUserStatus(socket.userId, "offline");
        }
      });

      socket.on("error", (error) => {
        logger.error("Socket error:", error);
      });
    } catch (error) {
      logger.error("Socket connection error:", error);
      socket.disconnect();
    }
  });

  io.engine.on("connection_error", (err: any) => {
    logger.error("Connection error:", err);
  });

  return io;
};

// ==================== Authentication ====================
async function handleAuth(socket: AuthenticatedSocket, data: any) {
  try {
    const sessionToken = data.sessionToken;
    if (!sessionToken) {
      socket.emit("auth_error", { message: "Session token required" });
      socket.disconnect();
      return;
    }

    const sessionData = await redis.get(`session:${sessionToken}`);
    if (!sessionData) {
      socket.emit("auth_error", { message: "Invalid or expired session" });
      socket.disconnect();
      return;
    }

    const session = JSON.parse(sessionData);

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
      socket.emit("auth_error", { message: "User not found" });
      socket.disconnect();
      return;
    }

    socket.userId = user.id;
    socket.armyId = user.armyId;
    clients.set(user.id, socket);

    logger.info(`User ${user.armyId} authenticated via Socket.IO`);

    socket.emit("auth_success", {
      userId: user.id,
      armyId: user.armyId,
      publicKey: user.keys[0]?.publicKey,
    });

    await deliverPendingMessages(socket, user.id);
    broadcastUserStatus(user.id, "online");
  } catch (error) {
    logger.error("Authentication error:", error);
    socket.emit("auth_error", { message: "Authentication failed" });
    socket.disconnect();
  }
}

// ==================== Direct Messages ====================
async function handleMessage(socket: AuthenticatedSocket, data: any) {
  try {
    if (!socket.userId) {
      return socket.emit("error", { message: "Not authenticated" });
    }

    if (
      !data.recipientId ||
      !data.encryptedContent ||
      !data.encryptedKey ||
      !data.iv
    ) {
      return socket.emit("error", {
        message:
          "Missing required fields: recipientId, encryptedContent, encryptedKey, iv",
      });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: data.recipientId },
    });

    if (!recipient) {
      return socket.emit("error", { message: "Recipient not found" });
    }

    const messageData = {
      type: "message",
      messageId:
        data.messageId ||
        `msg_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`,
      senderId: socket.userId,
      senderArmyId: socket.armyId,
      recipientId: data.recipientId,
      encryptedContent: data.encryptedContent,
      encryptedKey: data.encryptedKey,
      iv: data.iv,
      timestamp: data.timestamp || Date.now(),
      status: "sent",
    };

    // Store in Redis for offline delivery
    await redis.setex(
      `message:${messageData.messageId}`,
      604800,
      JSON.stringify(messageData),
    );
    await redis.lpush(`pending:${data.recipientId}`, messageData.messageId);

    // Persist to DB
    try {
      await prisma.message.create({
        data: {
          id: messageData.messageId,
          senderId: socket.userId,
          recipientId: data.recipientId,
          encryptedContent: data.encryptedContent,
          encryptedKey: data.encryptedKey,
          iv: data.iv,
          status: "sent",
          timestamp: new Date(messageData.timestamp),
        },
      });
    } catch (dbError) {
      logger.warn("Failed to persist message to database:", dbError);
    }

    socket.emit("message_sent", {
      messageId: messageData.messageId,
      timestamp: messageData.timestamp,
    });

    // Deliver to recipient if online
    const recipientSocket = clients.get(data.recipientId);
    if (recipientSocket?.connected) {
      recipientSocket.emit("message", messageData);
      messageData.status = "delivered";
      await redis.setex(
        `message:${messageData.messageId}`,
        604800,
        JSON.stringify(messageData),
      );
      await redis.lrem(`pending:${data.recipientId}`, 1, messageData.messageId);
    }

    logger.info(
      `Message ${messageData.messageId} sent from ${socket.userId} to ${data.recipientId}`,
    );
  } catch (error) {
    logger.error("Error handling message:", error);
    socket.emit("error", { message: "Failed to send message" });
  }
}

// ==================== Offline Message Delivery ====================
async function deliverPendingMessages(
  socket: AuthenticatedSocket,
  userId: string,
) {
  try {
    const pendingMessageIds = await redis.lrange(`pending:${userId}`, 0, -1);
    if (pendingMessageIds.length === 0) return;

    logger.info(
      `Delivering ${pendingMessageIds.length} pending messages to ${userId}`,
    );

    for (const messageId of pendingMessageIds) {
      const messageData = await redis.get(`message:${messageId}`);
      if (messageData) {
        const msg = JSON.parse(messageData);
        socket.emit("message", { ...msg, status: "delivered" });

        msg.status = "delivered";
        await redis.setex(`message:${messageId}`, 604800, JSON.stringify(msg));

        try {
          await prisma.message.update({
            where: { id: messageId },
            data: { status: "delivered" },
          });
        } catch (dbError) {
          logger.warn(`Failed to update message ${messageId}:`, dbError);
        }
      }
      await redis.lrem(`pending:${userId}`, 1, messageId);
    }
  } catch (error) {
    logger.error("Error delivering pending messages:", error);
  }
}

// ==================== Public Key Request ====================
async function handlePublicKeyRequest(socket: AuthenticatedSocket, data: any) {
  try {
    if (!socket.userId) {
      return socket.emit("error", { message: "Not authenticated" });
    }
    if (!data.recipientId) {
      return socket.emit("error", { message: "Recipient ID required" });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: data.recipientId },
      include: {
        keys: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!recipient || recipient.keys.length === 0) {
      return socket.emit("error", {
        message: "Recipient or public key not found",
      });
    }

    socket.emit("public_key_response", {
      userId: recipient.id,
      armyId: recipient.armyId,
      publicKey: recipient.keys[0].publicKey,
    });
  } catch (error) {
    logger.error("Error handling public key request:", error);
    socket.emit("error", { message: "Failed to get public key" });
  }
}

// ==================== Typing Indicator ====================
async function handleTyping(socket: AuthenticatedSocket, data: any) {
  if (!socket.userId || !data.recipientId) return;

  const recipientSocket = clients.get(data.recipientId);
  if (recipientSocket?.connected) {
    recipientSocket.emit("typing", {
      userId: socket.userId,
      armyId: socket.armyId,
    });
  }
}

// ==================== Read Receipts ====================
async function handleReadReceipt(socket: AuthenticatedSocket, data: any) {
  if (!socket.userId || !data.messageId) return;

  const messageData = await redis.get(`message:${data.messageId}`);
  if (messageData) {
    const msg = JSON.parse(messageData);
    msg.status = "read";
    await redis.setex(`message:${data.messageId}`, 604800, JSON.stringify(msg));

    try {
      await prisma.message.update({
        where: { id: data.messageId },
        data: { status: "read" },
      });
    } catch (dbError) {
      logger.warn("Failed to update message status in database:", dbError);
    }

    const senderSocket = clients.get(msg.senderId);
    if (senderSocket?.connected) {
      senderSocket.emit("message_read", {
        messageId: data.messageId,
        readBy: socket.userId,
      });
    }
  }
}

// ==================== Contacts ====================
async function handleGetContacts(socket: AuthenticatedSocket) {
  try {
    if (!socket.userId) return;

    const user = await prisma.user.findUnique({
      where: { id: socket.userId },
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

    socket.emit("contacts", { contacts });
  } catch (error) {
    logger.error("Error getting contacts:", error);
    socket.emit("error", { message: "Failed to get contacts" });
  }
}

// ==================== Add Friend ====================
async function handleAddFriend(socket: AuthenticatedSocket, data: any) {
  try {
    if (!socket.userId || !data.armyId) {
      return socket.emit("error", { message: "Army ID required" });
    }

    const friend = await prisma.user.findUnique({
      where: { armyId: data.armyId },
      include: {
        keys: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!friend) {
      return socket.emit("error", { message: "User not found" });
    }

    if (friend.id === socket.userId) {
      return socket.emit("error", { message: "Cannot add yourself as friend" });
    }

    const existingFriend = await prisma.friend.findFirst({
      where: { userId: socket.userId, friendId: friend.id },
    });

    if (existingFriend) {
      return socket.emit("error", { message: "Already friends" });
    }

    // Bidirectional friendship
    await prisma.friend.createMany({
      data: [
        { userId: socket.userId, friendId: friend.id },
        { userId: friend.id, friendId: socket.userId },
      ],
    });

    socket.emit("friend_added", {
      friend: {
        id: friend.id,
        armyId: friend.armyId,
        name: friend.name,
        designation: friend.designation,
        publicKey: friend.keys[0]?.publicKey,
      },
    });

    // Notify the friend if online
    const friendSocket = clients.get(friend.id);
    if (friendSocket?.connected) {
      const currentUser = await prisma.user.findUnique({
        where: { id: socket.userId },
        include: {
          keys: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      friendSocket.emit("friend_added", {
        friend: {
          id: currentUser!.id,
          armyId: currentUser!.armyId,
          name: currentUser!.name,
          designation: currentUser!.designation,
          publicKey: currentUser!.keys[0]?.publicKey,
        },
      });
    }
  } catch (error) {
    logger.error("Error adding friend:", error);
    socket.emit("error", { message: "Failed to add friend" });
  }
}

// ==================== Group: Create ====================
async function handleCreateGroup(socket: AuthenticatedSocket, data: any) {
  try {
    if (!socket.userId) {
      return socket.emit("error", { message: "Not authenticated" });
    }
    if (!data.groupName || !data.memberIds || !Array.isArray(data.memberIds)) {
      return socket.emit("error", {
        message: "groupName and memberIds[] required",
      });
    }

    // Ensure creator is in the members list
    const memberIds: string[] = Array.from(
      new Set([socket.userId, ...data.memberIds]),
    );

    const group = await prisma.group.create({
      data: {
        name: data.groupName,
        createdById: socket.userId,
        members: {
          create: memberIds.map((uid) => ({
            userId: uid,
            role: uid === socket.userId ? "admin" : "member",
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
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

    const groupPayload = {
      groupId: group.id,
      groupName: group.name,
      createdBy: socket.userId,
      members: group.members.map((m) => ({
        id: m.user.id,
        armyId: m.user.armyId,
        name: m.user.name,
        designation: m.user.designation,
        publicKey: m.user.keys[0]?.publicKey,
        role: m.role,
      })),
    };

    // Notify all members
    for (const memberId of memberIds) {
      const memberSocket = clients.get(memberId);
      if (memberSocket?.connected) {
        memberSocket.emit("group_created", groupPayload);
      }
    }

    logger.info(`Group "${group.name}" created by ${socket.userId}`);
  } catch (error) {
    logger.error("Error creating group:", error);
    socket.emit("error", { message: "Failed to create group" });
  }
}

// ==================== Group: Message ====================
async function handleGroupMessage(socket: AuthenticatedSocket, data: any) {
  try {
    if (!socket.userId) {
      return socket.emit("error", { message: "Not authenticated" });
    }
    if (
      !data.groupId ||
      !data.encryptedContent ||
      !data.encryptedKeys ||
      !data.iv
    ) {
      return socket.emit("error", {
        message: "groupId, encryptedContent, encryptedKeys, iv required",
      });
    }

    // Verify sender is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: data.groupId, userId: socket.userId },
      },
    });

    if (!membership) {
      return socket.emit("error", {
        message: "You are not a member of this group",
      });
    }

    const messageId =
      data.messageId ||
      `grp_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;

    // Persist to DB
    try {
      await prisma.message.create({
        data: {
          id: messageId,
          senderId: socket.userId,
          groupId: data.groupId,
          encryptedContent: data.encryptedContent,
          encryptedKeys: data.encryptedKeys,
          iv: data.iv,
          status: "sent",
          timestamp: new Date(data.timestamp || Date.now()),
        },
      });
    } catch (dbError) {
      logger.warn("Failed to persist group message:", dbError);
    }

    // Get all group members
    const members = await prisma.groupMember.findMany({
      where: { groupId: data.groupId },
      select: { userId: true },
    });

    const senderUser = await prisma.user.findUnique({
      where: { id: socket.userId },
      select: { name: true, armyId: true },
    });

    const messagePayload = {
      type: "group_message",
      messageId,
      groupId: data.groupId,
      senderId: socket.userId,
      senderName: senderUser?.name || socket.armyId,
      senderArmyId: socket.armyId,
      encryptedContent: data.encryptedContent,
      encryptedKeys: data.encryptedKeys,
      iv: data.iv,
      timestamp: data.timestamp || Date.now(),
      status: "sent",
    };

    // Send confirmation to sender
    socket.emit("message_sent", {
      messageId,
      timestamp: messagePayload.timestamp,
    });

    // Broadcast to all members except sender
    for (const member of members) {
      if (member.userId === socket.userId) continue;
      const memberSocket = clients.get(member.userId);
      if (memberSocket?.connected) {
        memberSocket.emit("group_message", messagePayload);
      }
    }

    logger.info(`Group message ${messageId} sent to group ${data.groupId}`);
  } catch (error) {
    logger.error("Error handling group message:", error);
    socket.emit("error", { message: "Failed to send group message" });
  }
}

// ==================== Group: Get Groups ====================
async function handleGetGroups(socket: AuthenticatedSocket) {
  try {
    if (!socket.userId) return;

    const memberships = await prisma.groupMember.findMany({
      where: { userId: socket.userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
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
        },
      },
    });

    const groups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      createdById: m.group.createdById,
      role: m.role,
      members: m.group.members.map((gm) => ({
        id: gm.user.id,
        armyId: gm.user.armyId,
        name: gm.user.name,
        designation: gm.user.designation,
        publicKey: gm.user.keys[0]?.publicKey,
        role: gm.role,
      })),
    }));

    socket.emit("groups", { groups });
  } catch (error) {
    logger.error("Error getting groups:", error);
    socket.emit("error", { message: "Failed to get groups" });
  }
}

// ==================== Group: Add Member ====================
async function handleAddGroupMember(socket: AuthenticatedSocket, data: any) {
  try {
    if (!socket.userId) {
      return socket.emit("error", { message: "Not authenticated" });
    }
    if (!data.groupId || !data.userId) {
      return socket.emit("error", { message: "groupId and userId required" });
    }

    // Verify requester is admin
    const requesterMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: data.groupId, userId: socket.userId },
      },
    });

    if (!requesterMembership || requesterMembership.role !== "admin") {
      return socket.emit("error", { message: "Only admins can add members" });
    }

    // Check if user exists
    const userToAdd = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, name: true, armyId: true },
    });

    if (!userToAdd) {
      return socket.emit("error", { message: "User not found" });
    }

    // Add member
    await prisma.groupMember.create({
      data: {
        groupId: data.groupId,
        userId: data.userId,
        role: "member",
      },
    });

    // Notify all group members
    const members = await prisma.groupMember.findMany({
      where: { groupId: data.groupId },
      select: { userId: true },
    });

    for (const member of members) {
      const memberSocket = clients.get(member.userId);
      if (memberSocket?.connected) {
        memberSocket.emit("member_added", {
          groupId: data.groupId,
          userId: userToAdd.id,
          userName: userToAdd.name,
        });
      }
    }

    logger.info(`User ${data.userId} added to group ${data.groupId}`);
  } catch (error) {
    logger.error("Error adding group member:", error);
    socket.emit("error", { message: "Failed to add member" });
  }
}

// ==================== Group: Remove Member ====================
async function handleRemoveGroupMember(socket: AuthenticatedSocket, data: any) {
  try {
    if (!socket.userId) {
      return socket.emit("error", { message: "Not authenticated" });
    }
    if (!data.groupId || !data.userId) {
      return socket.emit("error", { message: "groupId and userId required" });
    }

    const requesterMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: data.groupId, userId: socket.userId },
      },
    });

    if (!requesterMembership || requesterMembership.role !== "admin") {
      return socket.emit("error", {
        message: "Only admins can remove members",
      });
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: { groupId: data.groupId, userId: data.userId },
      },
    });

    // Notify
    const members = await prisma.groupMember.findMany({
      where: { groupId: data.groupId },
      select: { userId: true },
    });

    const removedSocket = clients.get(data.userId);
    if (removedSocket?.connected) {
      removedSocket.emit("member_removed", {
        groupId: data.groupId,
        userId: data.userId,
      });
    }

    for (const member of members) {
      const memberSocket = clients.get(member.userId);
      if (memberSocket?.connected) {
        memberSocket.emit("member_removed", {
          groupId: data.groupId,
          userId: data.userId,
        });
      }
    }

    logger.info(`User ${data.userId} removed from group ${data.groupId}`);
  } catch (error) {
    logger.error("Error removing group member:", error);
    socket.emit("error", { message: "Failed to remove member" });
  }
}

// ==================== Group: Leave ====================
async function handleLeaveGroup(socket: AuthenticatedSocket, data: any) {
  try {
    if (!socket.userId) {
      return socket.emit("error", { message: "Not authenticated" });
    }
    if (!data.groupId) {
      return socket.emit("error", { message: "groupId required" });
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: { groupId: data.groupId, userId: socket.userId },
      },
    });

    const members = await prisma.groupMember.findMany({
      where: { groupId: data.groupId },
      select: { userId: true },
    });

    for (const member of members) {
      const memberSocket = clients.get(member.userId);
      if (memberSocket?.connected) {
        memberSocket.emit("member_removed", {
          groupId: data.groupId,
          userId: socket.userId,
        });
      }
    }

    socket.emit("group_left", { groupId: data.groupId });
    logger.info(`User ${socket.userId} left group ${data.groupId}`);
  } catch (error) {
    logger.error("Error leaving group:", error);
    socket.emit("error", { message: "Failed to leave group" });
  }
}

// ==================== WebRTC Signaling Relay & Call DB Tracking ====================
async function handleCallSignal(
  socket: AuthenticatedSocket,
  data: any,
  eventType: string,
) {
  if (!socket.userId || !data.recipientId) return;

  const recipientSocket = clients.get(data.recipientId);
  if (recipientSocket?.connected) {
    recipientSocket.emit(eventType, {
      ...data,
      senderId: socket.userId,
      senderArmyId: socket.armyId,
    });
  }

  try {
    const callId = data.callId;
    if (!callId) return;

    if (eventType === "call_offer") {
      await prisma.call.create({
        data: {
          id: callId,
          callerId: socket.userId,
          type: data.isVideoCall ? "video" : "voice",
          status: "ongoing",
          participants: {
            create: [
              { userId: socket.userId, status: "accepted" },
              { userId: data.recipientId, status: "missed" }, // Default missed until answered
            ],
          },
        },
      });
    } else if (eventType === "call_answer") {
      await prisma.callParticipant.update({
        where: { callId_userId: { callId: callId, userId: socket.userId } },
        data: { status: "accepted" },
      });
    } else if (eventType === "call_end") {
      await prisma.call.update({
        where: { id: callId },
        data: { status: "completed", endedAt: new Date() },
      });
    }
  } catch (error) {
    logger.error(`Error logging call signal ${eventType}:`, error);
  }
}

// ==================== Call History ====================
async function handleGetCalls(socket: AuthenticatedSocket) {
  try {
    if (!socket.userId) return;

    // Get calls where user is caller OR participant
    const calls = await prisma.call.findMany({
      where: {
        OR: [
          { callerId: socket.userId },
          { participants: { some: { userId: socket.userId } } },
        ],
      },
      include: {
        caller: { select: { id: true, name: true, armyId: true } },
        participants: {
          include: { user: { select: { id: true, name: true, armyId: true } } },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    const formattedCalls = calls.map((call) => {
      const isCaller = call.callerId === socket.userId;
      const otherParticipant = isCaller
        ? call.participants.find((p) => p.userId !== socket.userId)
        : call.participants.find((p) => p.userId === call.callerId);

      const participantInfo = otherParticipant?.user;
      const pStatus = call.participants.find(
        (p) => p.userId === socket.userId,
      )?.status;

      let callTypeDisplay: "incoming" | "outgoing" | "missed" = "outgoing";
      if (!isCaller) {
        callTypeDisplay =
          pStatus === "missed" && call.status !== "ongoing"
            ? "missed"
            : "incoming";
      }

      return {
        id: call.id,
        name: participantInfo?.name || participantInfo?.armyId || "Unknown",
        type: callTypeDisplay,
        callType: call.type,
        timestamp: call.startedAt.toISOString(),
        duration: call.endedAt
          ? Math.floor(
              (new Date(call.endedAt).getTime() -
                new Date(call.startedAt).getTime()) /
                1000,
            )
          : null,
      };
    });

    socket.emit("calls_history", { calls: formattedCalls });
  } catch (error) {
    logger.error("Error fetching call history:", error);
    socket.emit("error", { message: "Failed to fetch call history" });
  }
}

// ==================== Starred Messages ====================
async function handleStarMessage(socket: AuthenticatedSocket, data: any) {
  try {
    if (!socket.userId || !data.messageId) return;

    await prisma.starredMessage.upsert({
      where: {
        userId_messageId: { userId: socket.userId, messageId: data.messageId },
      },
      update: {},
      create: { userId: socket.userId, messageId: data.messageId },
    });

    socket.emit("message_starred", { messageId: data.messageId });
  } catch (error) {
    logger.error("Error starring message:", error);
    socket.emit("error", { message: "Failed to star message" });
  }
}

async function handleUnstarMessage(socket: AuthenticatedSocket, data: any) {
  try {
    if (!socket.userId || !data.messageId) return;

    await prisma.starredMessage.delete({
      where: {
        userId_messageId: { userId: socket.userId, messageId: data.messageId },
      },
    });

    socket.emit("message_unstarred", { messageId: data.messageId });
  } catch (error) {
    logger.error("Error unstarring message:", error);
    socket.emit("error", { message: "Failed to unstar message" });
  }
}

async function handleGetStarredMessages(socket: AuthenticatedSocket) {
  try {
    if (!socket.userId) return;

    const stars = await prisma.starredMessage.findMany({
      where: { userId: socket.userId },
      include: {
        message: {
          include: {
            sender: { select: { name: true, armyId: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedStars = stars.map((s) => ({
      messageId: s.messageId,
      senderId: s.message.senderId,
      senderName:
        s.message.sender?.name || s.message.sender?.armyId || "Unknown",
      groupId: s.message.groupId,
      encryptedContent: s.message.encryptedContent,
      encryptedKey: s.message.encryptedKey,
      iv: s.message.iv,
      timestamp: s.message.timestamp.toISOString(),
      starredAt: s.createdAt.toISOString(),
    }));

    socket.emit("starred_messages", { messages: formattedStars });
  } catch (error) {
    logger.error("Error fetching starred messages:", error);
    socket.emit("error", { message: "Failed to fetch starred messages" });
  }
}

// ==================== Broadcast Status ====================
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

    const statusMessage = {
      type: "user_status",
      userId,
      armyId: user.armyId,
      status,
    };

    user.FriendOf.forEach((f) => {
      const friendSocket = clients.get(f.userId);
      if (friendSocket?.connected) {
        friendSocket.emit("status_update", statusMessage);
      }
    });
  } catch (error) {
    logger.error("Error broadcasting status:", error);
  }
}

export const closeWebSocketServer = async () => {
  if (io) {
    logger.info("Closing Socket.IO server...");
    await new Promise<void>((resolve) => io.close(() => resolve()));
    logger.info("Socket.IO server closed.");
  }
};

export { clients, io as wss };
