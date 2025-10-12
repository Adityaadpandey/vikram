/**
 * Example client implementation for the E2E encrypted chat system
 * This shows how to use the WebSocket API for secure messaging
 */

import { io, Socket } from "socket.io-client";
import { decryptMessage } from "../utils/encryption";

class SecureChatClient {
  private socket: Socket | null = null;
  private privateKey: string | null = null;
  private publicKey: string | null = null;
  private userId: string | null = null;

  constructor(private serverUrl: string) {}

  /**
   * Connect to the chat server with authentication
   */
  async connect(token: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        auth: { token },
        transports: ["polling", "websocket"],
      });

      this.userId = userId;

      this.socket.on("connect", () => {
        console.log("✅ Connected to chat server");
        this.setupEventListeners();
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ Connection failed:", error);
        reject(error);
      });

      this.socket.on("connected", (data) => {
        console.log("🔐 Authenticated:", data);
      });
    });
  }

  /**
   * Setup encryption for this session
   */
  async setupEncryption(
    seedPhrase: string,
    phone: string,
    armyId: string,
  ): Promise<void> {
    try {
      // First, get the decrypted private key from the server
      const response = await fetch(
        `${this.serverUrl.replace("ws://", "http://").replace("wss://", "https://")}/auth/decrypt-key`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.socket?.auth.token}`,
          },
          body: JSON.stringify({
            userId: this.userId,
            seedPhrase,
            phone,
            armyId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to decrypt key");
      }

      this.privateKey = data.privateKey;
      this.publicKey = data.publicKey;

      // Setup encryption on the socket
      this.socket?.emit("setup_encryption", {
        privateKey: this.privateKey,
        publicKey: this.publicKey,
      });

      console.log("🔐 Encryption setup complete");
    } catch (error) {
      console.error("❌ Encryption setup failed:", error);
      throw error;
    }
  }

  /**
   * Send an encrypted message to another user
   */
  sendMessage(recipientId: string, message: string): void {
    if (!this.socket) {
      throw new Error("Not connected to server");
    }

    this.socket.emit("send_message", {
      recipientId,
      message,
    });
  }

  /**
   * Decrypt a received message
   */
  decryptMessage(encryptedMessage: string): string {
    if (!this.privateKey) {
      throw new Error("Private key not available");
    }

    return decryptMessage(encryptedMessage, this.privateKey);
  }

  /**
   * Get pending messages
   */
  getPendingMessages(): void {
    this.socket?.emit("get_pending_messages");
  }

  /**
   * Setup event listeners for the socket
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("encryption_ready", (data) => {
      console.log("🔐 Encryption ready:", data);
    });

    this.socket.on("receive_message", (data) => {
      console.log("📨 Received encrypted message:", data);

      // Decrypt the message
      try {
        const decryptedMessage = this.decryptMessage(data.encryptedMessage);
        console.log("🔓 Decrypted message:", decryptedMessage);

        // Emit custom event for the application to handle
        this.socket?.emit("message_decrypted", {
          decryptedMessage,
          from: data.from,
          timestamp: data.timestamp,
        });
      } catch (error) {
        console.error("❌ Failed to decrypt message:", error);
      }
    });

    this.socket.on("message_sent", (data) => {
      console.log("✅ Message sent:", data);
    });

    this.socket.on("pending_messages", (messages) => {
      console.log("📬 Pending messages:", messages);

      // Decrypt all pending messages
      messages.forEach((msg: any) => {
        try {
          const decryptedMessage = this.decryptMessage(msg.encryptedMessage);
          console.log("🔓 Decrypted pending message:", decryptedMessage);
        } catch (error) {
          console.error("❌ Failed to decrypt pending message:", error);
        }
      });
    });

    this.socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected:", reason);
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.privateKey = null;
    this.publicKey = null;
    this.userId = null;
  }
}

// Example usage
async function exampleUsage() {
  const client = new SecureChatClient("http://localhost:3000");

  try {
    // 1. Connect with authentication token
    await client.connect("your-jwt-token", "user-id");

    // 2. Setup encryption with user credentials
    await client.setupEncryption(
      "your seed phrase",
      "+1234567890",
      "army-id-123",
    );

    // 3. Get any pending messages
    client.getPendingMessages();

    // 4. Send a message
    client.sendMessage("recipient-user-id", "Hello, this is a secure message!");

    // 5. Listen for incoming messages (handled automatically)
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

export { SecureChatClient };
