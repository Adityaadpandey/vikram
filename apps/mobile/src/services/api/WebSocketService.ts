import { io, Socket } from "socket.io-client";
import { API_CONFIG } from "../../config/api.config";
import { SecureStorage } from "../security/SecureStorage";

interface EncryptedMessage {
  recipientId: string;
  encryptedContent: string;
  encryptedKey: string;
  iv: string;
  messageId: string;
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
      console.log("Already connected");
      return;
    }

    const sessionToken = await SecureStorage.getToken();
    if (!sessionToken) {
      throw new Error("No session token available");
    }

    this.socket = io(API_CONFIG.WS_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupListeners();
    this.authenticate(sessionToken);
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      this.isAuthenticated = false;
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
      console.log("Received contacts:", data);
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
      console.error("WebSocket error:", data);
      this.errorCallbacks.forEach((callback) => callback(data.message));
    });

    this.socket.on("friend_added", (data) => {
      console.log("Friend added:", data);
    });

    this.socket.on("typing", (data: { userId: string }) => {
      console.log("User typing:", data);
    });

    this.socket.on("read", (data: { messageId: string; userId: string }) => {
      console.log("Message read:", data);
    });

    this.socket.on("pong", (data: { timestamp: number }) => {
      // Keep-alive response
    });

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
      console.log("Received groups:", data);
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

    this.socket.emit("auth", {
      type: "auth",
      sessionToken,
    });
  }

  sendMessage(message: EncryptedMessage) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("message", {
      type: "message",
      ...message,
    });
  }

  getContacts() {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("get_contacts", {
      type: "get_contacts",
    });
  }

  addFriend(armyId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("add_friend", {
      type: "add_friend",
      armyId,
    });
  }

  requestPublicKey(recipientId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("request_public_key", {
      type: "request_public_key",
      recipientId,
    });
  }

  sendTypingIndicator(recipientId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("typing", {
      type: "typing",
      recipientId,
    });
  }

  sendReadReceipt(messageId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("read", {
      type: "read",
      messageId,
    });
  }

  startHeartbeat() {
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("ping", { type: "ping" });
      }
    }, 30000); // Every 30 seconds
  }

  createGroup(groupName: string, memberIds: string[]) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("create_group", {
      type: "create_group",
      groupName,
      memberIds,
    });
  }

  sendGroupMessage(message: {
    groupId: string;
    encryptedContent: string;
    encryptedKeys: { [userId: string]: string }; // Encrypted key for each member
    iv: string;
    messageId: string;
    timestamp: number;
  }) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("group_message", {
      type: "group_message",
      ...message,
    });
  }

  getGroups() {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("get_groups", {
      type: "get_groups",
    });
  }

  addGroupMember(groupId: string, userId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("add_group_member", {
      type: "add_group_member",
      groupId,
      userId,
    });
  }

  removeGroupMember(groupId: string, userId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("remove_group_member", {
      type: "remove_group_member",
      groupId,
      userId,
    });
  }

  leaveGroup(groupId: string) {
    if (!this.socket || !this.isAuthenticated) {
      throw new Error("WebSocket not connected or authenticated");
    }

    this.socket.emit("leave_group", {
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
