import * as bip39 from "bip39";
import * as Crypto from "expo-crypto";
import CryptoJS from "crypto-js";
import { SecureStorage } from "../security/SecureStorage";

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  encryptedPrivateKey: string;
}

export class CryptoService {
  // Generate seed phrase (15 words = 160 bits of entropy)
  static async generateSeedPhrase(): Promise<string> {
    try {
      // Generate 160 bits (20 bytes) of entropy for 15 words
      const randomBytes = await Crypto.getRandomBytesAsync(20);
      const entropy = Buffer.from(randomBytes);

      // Generate mnemonic from entropy
      const mnemonic = bip39.entropyToMnemonic(entropy);

      return mnemonic;
    } catch (error) {
      console.error("Error generating seed phrase:", error);
      throw new Error("Failed to generate seed phrase");
    }
  }

  // Validate seed phrase
  static validateSeedPhrase(seedPhrase: string): boolean {
    return bip39.validateMnemonic(seedPhrase);
  }

  // Generate encryption key from ArmyId + Phone + PublicKey hash
  static async generateEncryptionKey(
    armyId: string,
    phone: string,
    publicKey: string,
  ): Promise<string> {
    const combinedData = `${armyId}:${phone}:${publicKey}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combinedData,
    );
    return hash;
  }

  // Encrypt private key with seed phrase + encryption key
  static encryptPrivateKey(
    privateKey: string,
    seedPhrase: string,
    encryptionKey: string,
  ): string {
    const combinedKey = `${seedPhrase}:${encryptionKey}`;
    const encrypted = CryptoJS.AES.encrypt(privateKey, combinedKey).toString();
    return encrypted;
  }

  // Decrypt private key with seed phrase + encryption key
  static decryptPrivateKey(
    encryptedPrivateKey: string,
    seedPhrase: string,
    encryptionKey: string,
  ): string {
    try {
      const combinedKey = `${seedPhrase}:${encryptionKey}`;
      const decrypted = CryptoJS.AES.decrypt(encryptedPrivateKey, combinedKey);
      const privateKey = decrypted.toString(CryptoJS.enc.Utf8);

      if (!privateKey) {
        throw new Error("Invalid seed phrase or credentials");
      }

      return privateKey;
    } catch (error) {
      throw new Error("Failed to decrypt private key. Invalid credentials.");
    }
  }

  // Generate RSA-like key pair (simulated for demo - in production use actual RSA)
  static async generateKeyPair(
    armyId: string,
    phone: string,
    seedPhrase: string,
  ): Promise<KeyPair> {
    // Convert mnemonic to seed (64 bytes)
    const seedBuffer = await bip39.mnemonicToSeed(seedPhrase);
    const seedHex = seedBuffer.toString("hex");

    // Use first 64 chars as private key
    const privateKey = seedHex.substring(0, 64);

    // Generate public key (in production, use proper RSA key derivation)
    const publicKeyHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${privateKey}:public`,
    );
    const publicKey = publicKeyHash;

    // Generate encryption key from ArmyId + Phone + PublicKey
    const encryptionKey = await this.generateEncryptionKey(
      armyId,
      phone,
      publicKey,
    );

    // Encrypt private key
    const encryptedPrivateKey = this.encryptPrivateKey(
      privateKey,
      seedPhrase,
      encryptionKey,
    );

    return {
      publicKey,
      privateKey,
      encryptedPrivateKey,
    };
  }
}
