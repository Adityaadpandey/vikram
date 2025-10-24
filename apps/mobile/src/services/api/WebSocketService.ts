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
  private messageCallbacks: MessageCallback[] = [];
  private contactsCallbacks: ContactsCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private groupCallbacks: Array<(event: string, data: any) => void> = [];
  private groupsCallbacks: Array<(groups: any[]) => void> = [];
  private groupMessageCallbacks: Array<(message: any) => void> = [];

  async connect() {
    if (this.socket?.connected) {
      console.log("Already connected to WebSocket");
      return;
    }

    const sessionToken = await SecureStorage.getToken();
    if (!sessionToken) {
      throw new Error("No session token available");
    }

    console.log(
      "Connecting to WebSocket Gateway:",
      API_CONFIG.WS_GATEWAY_URL + WS_ENDPOINT,
    );

    // Connect through API Gateway WebSocket endpoint
    this.socket = io(API_CONFIG.WS_GATEWAY_URL + WS_ENDPOINT, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    this.setupListeners();

    // Authenticate after connection
    this.socket.on("connect", () => {
      console.log("WebSocket connected, authenticating...");
      this.authenticate(sessionToken);
    });
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      this.isAuthenticated = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.errorCallbacks.forEach((callback) => callback(error.message));
    });

    this.socket.on("auth_success", (data) => {
      console.log("WebSocket authenticated:", data);
      this.isAuthenticated = true;
    });

    this.socket.on("message", (data: IncomingMessage) => {
      console.log("Received message:", data);
      this.messageCallbacks.forEach((callback) => callback(data));
    });

    this.socket.on("contacts", (data: { contacts: Contact[] }) => {
      console.log("Received contacts:", data.contacts.length);
      this.contactsCallbacks.forEach((callback) => callback(data.contacts));
    });

    this.socket.on(
      "status_update",
      (data: { userId: string; status: string }) => {
        console.log("Status update:", data);
        this.statusCallbacks.forEach((callback) =>
          callback(data.userId, data.status),
        );
      },
    );

    this.socket.on("error", (data: { message: string }) => {
      console.error("WebSocket error:", data.message);
      this.errorCallbacks.forEach((callback) => callback(data.message));
    });

    this.socket.on("friend_added", (data) => {
      console.log("Friend added:", data);
      // Refresh contacts
      this.getContacts();
    });

    this.socket.on("public_key_response", (data) => {
      console.log("Public key received:", data);
    });

    this.socket.on("typing", (data: { userId: string }) => {
      console.log("User typing:", data);
    });

    this.socket.on("read", (data: { messageId: string; userId: string }) => {
      console.log("Message read:", data);
    });

    this.socket.on("pong", (data: { timestamp: number }) => {
      console.log("Pong received");
    });

    this.socket.on(
      "message_sent",
      (data: { messageId: string; timestamp: number }) => {
        console.log("Message sent confirmation:", data);
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
        console.log("Group created:", data);
        this.groupCallbacks.forEach((callback) => callback("created", data));
      },
    );

    this.socket.on("groups", (data: { groups: any[] }) => {
      console.log("Received groups:", data.groups.length);
      this.groupsCallbacks.forEach((callback) => callback(data.groups));
    });

    this.socket.on("group_message", (data: any) => {
      console.log("Received group message:", data);
      this.groupMessageCallbacks.forEach((callback) => callback(data));
    });

    this.socket.on(
      "member_added",
      (data: { groupId: string; userId: string; userName: string }) => {
        console.log("Member added to group:", data);
        this.groupCallbacks.forEach((callback) =>
          callback("member_added", data),
        );
      },
    );

    this.socket.on(
      "member_removed",
      (data: { groupId: string; userId: string }) => {
        console.log("Member removed from group:", data);
        this.groupCallbacks.forEach((callback) =>
          callback("member_removed", data),
        );
      },
    );
  }

  private authenticate(sessionToken: string) {
    if (!this.socket) return;

    console.log("Sending auth message...");
    this.socket.emit("message", {
      type: "auth",
      sessionToken,
    });
  }

  // Send encrypted message (direct)
  sendMessage(message: EncryptedMessage) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("message", {
      type: "message",
      ...message,
    });
  }

  // Get contacts
  getContacts() {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("message", {
      type: "get_contacts",
    });
  }

  // Add friend
  addFriend(armyId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("message", {
      type: "add_friend",
      armyId,
    });
  }

  // Request public key
  requestPublicKey(recipientId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("message", {
      type: "request_public_key",
      recipientId,
    });
  }

  // Send typing indicator
  sendTypingIndicator(recipientId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("message", {
      type: "typing",
      recipientId,
    });
  }

  // Send read receipt
  sendReadReceipt(messageId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("message", {
      type: "read",
      messageId,
    });
  }

  // Ping/Pong heartbeat
  startHeartbeat() {
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("message", { type: "ping" });
      }
    }, 30000); // Every 30 seconds
  }

  // Group Management Methods
  createGroup(groupName: string, memberIds: string[]) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("message", {
      type: "create_group",
      groupName,
      memberIds,
    });
  }

  sendGroupMessage(message: {
    groupId: string;
    encryptedContent: string;
    encryptedKeys: { [userId: string]: string };
    iv: string;
    messageId?: string;
    timestamp: number;
  }) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("message", {
      type: "group_message",
      ...message,
    });
  }

  getGroups() {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("message", {
      type: "get_groups",
    });
  }

  addGroupMember(groupId: string, userId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("message", {
      type: "add_group_member",
      groupId,
      userId,
    });
  }

  removeGroupMember(groupId: string, userId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("message", {
      type: "remove_group_member",
      groupId,
      userId,
    });
  }

  leaveGroup(groupId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("message", {
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

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isAuthenticated = false;
    }
  }

  isConnected(): boolean {
    return (this.socket?.connected && this.isAuthenticated) || false;
  }
}

export const WebSocketService = new WebSocketServiceClass();
