import * as Crypto from "expo-crypto";
import { RSA } from "react-native-rsa-native";

export class EncryptionService {
  // Generate RSA key pair
  static async generateKeyPair(): Promise<{
    publicKey: string;
    privateKey: string;
  }> {
    const keys = await RSA.generateKeys(2048);
    return {
      publicKey: keys.public,
      privateKey: keys.private,
    };
  }

  // Encrypt message content with AES-256
  static async encryptMessage(
    message: string,
    recipientPublicKey: string,
  ): Promise<{ encryptedContent: string; encryptedKey: string; iv: string }> {
    // Generate random AES key (32 bytes for AES-256)
    const aesKey = await Crypto.getRandomBytesAsync(32);
    const aesKeyHex = this.bufferToHex(aesKey);

    // Generate random IV (16 bytes)
    const iv = await Crypto.getRandomBytesAsync(16);
    const ivHex = this.bufferToHex(iv);

    // Encrypt message with AES-256-CBC
    const encryptedContent = await this.aesEncrypt(message, aesKeyHex, ivHex);

    // Encrypt AES key with recipient's RSA public key
    const encryptedKey = await RSA.encrypt(aesKeyHex, recipientPublicKey);

    return {
      encryptedContent,
      encryptedKey,
      iv: ivHex,
    };
  }

  // Decrypt message content
  static async decryptMessage(
    encryptedContent: string,
    encryptedKey: string,
    iv: string,
    privateKey: string,
  ): Promise<string> {
    // Decrypt AES key with private key
    const aesKey = await RSA.decrypt(encryptedKey, privateKey);

    // Decrypt message content with AES key
    const decryptedMessage = await this.aesDecrypt(
      encryptedContent,
      aesKey,
      iv,
    );

    return decryptedMessage;
  }

  // AES encryption helper
  private static async aesEncrypt(
    plaintext: string,
    key: string,
    iv: string,
  ): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Convert hex strings to Uint8Array
    const keyBytes = this.hexToBuffer(key);
    const ivBytes = this.hexToBuffer(iv);

    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes.buffer as ArrayBuffer,
      { name: "AES-CBC" },
      false,
      ["encrypt"],
    );

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: ivBytes.buffer as ArrayBuffer },
      cryptoKey,
      data.buffer as ArrayBuffer,
    );

    return this.bufferToHex(new Uint8Array(encrypted));
  }

  // AES decryption helper
  private static async aesDecrypt(
    ciphertext: string,
    key: string,
    iv: string,
  ): Promise<string> {
    // Convert hex strings to Uint8Array
    const keyBytes = this.hexToBuffer(key);
    const ivBytes = this.hexToBuffer(iv);
    const ciphertextBytes = this.hexToBuffer(ciphertext);

    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes.buffer as ArrayBuffer,
      { name: "AES-CBC" },
      false,
      ["decrypt"],
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: ivBytes.buffer as ArrayBuffer },
      cryptoKey,
      ciphertextBytes.buffer as ArrayBuffer,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // Helper: Convert Uint8Array to hex string
  private static bufferToHex(buffer: Uint8Array): string {
    return Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Helper: Convert hex string to Uint8Array
  private static hexToBuffer(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  // Derive private key from seed phrase
  static async derivePrivateKeyFromSeed(seedPhrase: string): Promise<string> {
    // In production, use proper BIP39 implementation
    // For now, this is a simplified version
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      seedPhrase,
    );
    return hash;
  }

  static async encryptMessageForGroup(
    message: string,
    recipientPublicKeys: { [userId: string]: string },
  ): Promise<{
    encryptedContent: string;
    encryptedKeys: { [userId: string]: string };
    iv: string;
  }> {
    // Generate random AES key (32 bytes for AES-256)
    const aesKey = await Crypto.getRandomBytesAsync(32);
    const aesKeyHex = this.bufferToHex(aesKey);

    // Generate random IV (16 bytes)
    const iv = await Crypto.getRandomBytesAsync(16);
    const ivHex = this.bufferToHex(iv);

    // Encrypt message with AES-256-CBC
    const encryptedContent = await this.aesEncrypt(message, aesKeyHex, ivHex);

    // Encrypt AES key for each recipient
    const encryptedKeys: { [userId: string]: string } = {};

    for (const [userId, publicKey] of Object.entries(recipientPublicKeys)) {
      encryptedKeys[userId] = await RSA.encrypt(aesKeyHex, publicKey);
    }

    return {
      encryptedContent,
      encryptedKeys,
      iv: ivHex,
    };
  }
}
