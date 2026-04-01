import { io, Socket } from "socket.io-client";
import { API_CONFIG, WS_ENDPOINT } from "../../config/api.config";
import { SecureStorage } from "../security/SecureStorage";

interface EncryptedMessage {
  recipientId: string;
  encryptedContent: string;
  encryptedKey: string;
  iv: string;
  messageId?: string;
  timestamp: number;
}

interface IncomingMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  encryptedContent: string;
  encryptedKey: string;
  iv: string;
  timestamp: number;
}

interface Contact {
  id: string;
  armyId: string;
  name: string;
  designation: string;
  publicKey: string;
  status: "online" | "offline";
}

type MessageCallback = (message: IncomingMessage) => void;
type ContactsCallback = (contacts: Contact[]) => void;
type StatusCallback = (userId: string, status: string) => void;
type ErrorCallback = (error: string) => void;

class WebSocketServiceClass {
  private socket: Socket | null = null;
  private isAuthenticated: boolean = false;
  private authPromise: Promise<void> | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private contactsCallbacks: ContactsCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private groupCallbacks: Array<(event: string, data: any) => void> = [];
  private groupsCallbacks: Array<(groups: any[]) => void> = [];
  private groupMessageCallbacks: Array<(message: any) => void> = [];
  private callsCallbacks: Array<(calls: any[]) => void> = [];
  private starredMessagesCallbacks: Array<(messages: any[]) => void> = [];

  async connect(): Promise<void> {
    if (this.socket?.connected && this.isAuthenticated) {
      console.log("✅ Already connected and authenticated");
      return;
    }

    if (this.authPromise) {
      console.log("⏳ Auth in progress, waiting...");
      return this.authPromise;
    }

    const sessionToken = await SecureStorage.getToken();
    if (!sessionToken) {
      throw new Error("No session token available");
    }

    console.log("🔌 Connecting to WebSocket...");
    console.log("📍 URL:", API_CONFIG.WS_GATEWAY_URL + WS_ENDPOINT);

    this.authPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!this.isAuthenticated) {
          console.error("❌ Authentication timeout");
          reject(new Error("Authentication timeout"));
          this.authPromise = null;
        }
      }, 15000); // 15 second timeout

      // Disconnect existing socket
      if (this.socket) {
        this.socket.disconnect();
      }

      // Create new socket connection
      this.socket = io(API_CONFIG.WS_GATEWAY_URL, {
        path: WS_ENDPOINT,
        transports: ["websocket", "polling"], // Try both transports
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 10000,
        forceNew: true,
      });

      this.setupListeners();

      // Handle connection success
      this.socket.once("connect", () => {
        console.log("✅ WebSocket connected, socket ID:", this.socket?.id);

        // Wait a bit before authenticating
        setTimeout(() => {
          console.log("🔑 Sending authentication...");
          this.authenticate(sessionToken);
        }, 500);
      });

      // Handle auth success
      this.socket.once("auth_success", (data) => {
        console.log("✅ Authentication successful:", data);
        this.isAuthenticated = true;
        clearTimeout(timeout);
        this.authPromise = null;
        resolve();
      });

      // Handle connection errors
      this.socket.once("connect_error", (error) => {
        console.error("❌ Connection error:", error.message);
        clearTimeout(timeout);
        this.authPromise = null;
        reject(error);
      });

      // Handle auth errors
      this.socket.once("error", (data: { message: string }) => {
        console.error("❌ WebSocket error:", data.message);
        if (!this.isAuthenticated) {
          clearTimeout(timeout);
          this.authPromise = null;
          reject(new Error(data.message));
        }
      });
    });

    return this.authPromise;
  }

  private setupListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("🔄 WebSocket reconnected");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔌 WebSocket disconnected:", reason);
      this.isAuthenticated = false;

      // Auto-reconnect after disconnect
      if (reason === "io server disconnect") {
        // Server disconnected, need to reconnect manually
        setTimeout(() => {
          console.log("♻️ Attempting to reconnect...");
          this.connect().catch((err) => {
            console.error("❌ Reconnection failed:", err);
          });
        }, 2000);
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      this.errorCallbacks.forEach((callback) => callback(error.message));
    });

    // Message events
    this.socket.on("message", (data: IncomingMessage) => {
      console.log("📨 Received message:", data.messageId);
      this.messageCallbacks.forEach((callback) => callback(data));
    });

    this.socket.on("contacts", (data: { contacts: Contact[] }) => {
      console.log("👥 Received contacts:", data.contacts.length);
      this.contactsCallbacks.forEach((callback) => callback(data.contacts));
    });

    this.socket.on(
      "status_update",
      (data: { userId: string; status: string }) => {
        console.log("📊 Status update:", data);
        this.statusCallbacks.forEach((callback) =>
          callback(data.userId, data.status),
        );
      },
    );

    this.socket.on("error", (data: { message: string }) => {
      console.error("⚠️ WebSocket error:", data.message);
      this.errorCallbacks.forEach((callback) => callback(data.message));
    });

    this.socket.on("friend_added", (data) => {
      console.log("✅ Friend added:", data);
      // Refresh contacts
      this.getContacts();
    });

    this.socket.on("public_key_response", (data) => {
      console.log("🔑 Public key received:", data.userId);
    });

    this.socket.on("typing", (data: { userId: string }) => {
      console.log("⌨️ User typing:", data.userId);
    });

    this.socket.on("read", (data: { messageId: string; userId: string }) => {
      console.log("✓ Message read:", data.messageId);
    });

    this.socket.on("pong", () => {
      console.log("🏓 Pong received");
    });

    this.socket.on(
      "message_sent",
      (data: { messageId: string; timestamp: number }) => {
        console.log("✅ Message sent:", data.messageId);
      },
    );

    // Group events
    this.socket.on(
      "group_created",
      (data: {
        groupId: string;
        groupName: string;
        members: any[];
        createdBy: string;
      }) => {
        console.log("👥 Group created:", data.groupName);
        this.groupCallbacks.forEach((callback) => callback("created", data));
      },
    );

    this.socket.on("groups", (data: { groups: any[] }) => {
      console.log("📋 Received groups:", data.groups.length);
      this.groupsCallbacks.forEach((callback) => callback(data.groups));
    });

    this.socket.on("group_message", (data: any) => {
      console.log("📨 Group message:", data.messageId);
      this.groupMessageCallbacks.forEach((callback) => callback(data));
    });

    this.socket.on(
      "member_added",
      (data: { groupId: string; userId: string; userName: string }) => {
        console.log("➕ Member added:", data.userName);
        this.groupCallbacks.forEach((callback) =>
          callback("member_added", data),
        );
      },
    );

    this.socket.on(
      "member_removed",
      (data: { groupId: string; userId: string }) => {
        console.log("➖ Member removed:", data.userId);
        this.groupCallbacks.forEach((callback) =>
          callback("member_removed", data),
        );
      },
    );

    // Calls events
    this.socket.on("calls_history", (data: { calls: any[] }) => {
      console.log("📞 Received calls history:", data.calls.length);
      this.callsCallbacks.forEach((callback) => callback(data.calls));
    });

    // Starred messages events
    this.socket.on("starred_messages", (data: { messages: any[] }) => {
      console.log("⭐ Received starred messages:", data.messages.length);
      this.starredMessagesCallbacks.forEach((callback) =>
        callback(data.messages),
      );
    });

    this.socket.on("message_starred", (data: { messageId: string }) => {
      this.getStarredMessages();
    });

    this.socket.on("message_unstarred", (data: { messageId: string }) => {
      this.getStarredMessages();
    });
  }

  private authenticate(sessionToken: string) {
    if (!this.socket) {
      console.error("❌ Cannot authenticate: socket is null");
      return;
    }

    console.log("📤 Emitting auth message...");

    // Try both formats - the backend might expect either
    this.socket.emit("message", {
      type: "auth",
      sessionToken,
    });

    // Also try direct auth event (some backends expect this)
    this.socket.emit("auth", {
      type: "auth",
      sessionToken,
    });
  }

  // Wait for connection and authentication
  private async ensureConnected(): Promise<void> {
    if (this.socket?.connected && this.isAuthenticated) {
      return;
    }

    if (!this.socket || !this.socket.connected) {
      console.log("⚠️ Not connected, connecting...");
      await this.connect();
    } else if (!this.isAuthenticated) {
      throw new Error("WebSocket connected but not authenticated");
    }
  }

  // Send encrypted message (direct)
  async sendMessage(message: EncryptedMessage) {
    await this.ensureConnected();

    console.log("📤 Sending message to:", message.recipientId);
    this.socket!.emit("message", {
      type: "message",
      ...message,
    });
  }

  // Get contacts
  async getContacts() {
    await this.ensureConnected();

    console.log("📤 Requesting contacts...");
    this.socket!.emit("message", {
      type: "get_contacts",
    });
  }

  // Add friend
  async addFriend(armyId: string) {
    await this.ensureConnected();

    console.log("📤 Adding friend:", armyId);
    this.socket!.emit("message", {
      type: "add_friend",
      armyId,
    });
  }

  // Request public key
  async requestPublicKey(recipientId: string) {
    await this.ensureConnected();

    console.log("📤 Requesting public key:", recipientId);
    this.socket!.emit("message", {
      type: "request_public_key",
      recipientId,
    });
  }

  // Send typing indicator
  async sendTypingIndicator(recipientId: string) {
    if (!this.isConnected()) return;

    this.socket!.emit("message", {
      type: "typing",
      recipientId,
    });
  }

  // Send read receipt
  async sendReadReceipt(messageId: string) {
    if (!this.isConnected()) return;

    this.socket!.emit("message", {
      type: "read",
      messageId,
    });
  }

  // Ping/Pong heartbeat
  startHeartbeat() {
    setInterval(() => {
      if (this.socket?.connected && this.isAuthenticated) {
        this.socket.emit("message", { type: "ping" });
      }
    }, 30000); // Every 30 seconds
  }

  // Group Management Methods
  async createGroup(groupName: string, memberIds: string[]) {
    await this.ensureConnected();

    console.log("📤 Creating group:", groupName);
    this.socket!.emit("message", {
      type: "create_group",
      groupName,
      memberIds,
    });
  }

  async sendGroupMessage(message: {
    groupId: string;
    encryptedContent: string;
    encryptedKeys: { [userId: string]: string };
    iv: string;
    messageId?: string;
    timestamp: number;
  }) {
    await this.ensureConnected();

    console.log("📤 Sending group message to:", message.groupId);
    this.socket!.emit("message", {
      type: "group_message",
      ...message,
    });
  }

  async getGroups() {
    await this.ensureConnected();

    console.log("📤 Requesting groups...");
    this.socket!.emit("message", {
      type: "get_groups",
    });
  }

  async addGroupMember(groupId: string, userId: string) {
    await this.ensureConnected();

    console.log("📤 Adding member to group:", groupId);
    this.socket!.emit("message", {
      type: "add_group_member",
      groupId,
      userId,
    });
  }

  async removeGroupMember(groupId: string, userId: string) {
    await this.ensureConnected();

    console.log("📤 Removing member from group:", groupId);
    this.socket!.emit("message", {
      type: "remove_group_member",
      groupId,
      userId,
    });
  }

  async leaveGroup(groupId: string) {
    await this.ensureConnected();

    console.log("📤 Leaving group:", groupId);
    this.socket!.emit("message", {
      type: "leave_group",
      groupId,
    });
  }

  // Event listeners
  onMessage(callback: MessageCallback) {
    this.messageCallbacks.push(callback);
  }

  onContacts(callback: ContactsCallback) {
    this.contactsCallbacks.push(callback);
  }

  onStatusUpdate(callback: StatusCallback) {
    this.statusCallbacks.push(callback);
  }

  onError(callback: ErrorCallback) {
    this.errorCallbacks.push(callback);
  }

  onGroup(callback: (event: string, data: any) => void) {
    this.groupCallbacks.push(callback);
  }

  onGroups(callback: (groups: any[]) => void) {
    this.groupsCallbacks.push(callback);
  }

  onGroupMessage(callback: (message: any) => void) {
    this.groupMessageCallbacks.push(callback);
  }

  // Calls
  getCalls() {
    if (this.socket?.connected) {
      this.socket.emit("message", { type: "get_calls" });
    }
  }

  onCalls(callback: (calls: any[]) => void) {
    this.callsCallbacks.push(callback);
    return () => {
      this.callsCallbacks = this.callsCallbacks.filter((cb) => cb !== callback);
    };
  }

  // Starred Messages
  getStarredMessages() {
    if (this.socket?.connected) {
      this.socket.emit("message", { type: "get_starred_messages" });
    }
  }

  onStarredMessages(callback: (messages: any[]) => void) {
    this.starredMessagesCallbacks.push(callback);
    return () => {
      this.starredMessagesCallbacks = this.starredMessagesCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  starMessage(messageId: string) {
    if (this.socket?.connected) {
      this.socket.emit("message", { type: "star_message", messageId });
    }
  }

  unstarMessage(messageId: string) {
    if (this.socket?.connected) {
      this.socket.emit("message", { type: "unstar_message", messageId });
    }
  }

  disconnect() {
    console.log("🔌 Disconnecting WebSocket...");
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isAuthenticated = false;
      this.authPromise = null;
    }
  }

  isConnected(): boolean {
    return !!(this.socket?.connected && this.isAuthenticated);
  }

  // Get connection status for debugging
  getStatus(): {
    connected: boolean;
    authenticated: boolean;
    socketId: string | undefined;
  } {
    return {
      connected: !!this.socket?.connected,
      authenticated: this.isAuthenticated,
      socketId: this.socket?.id,
    };
  }
}

export const WebSocketService = new WebSocketServiceClass();
