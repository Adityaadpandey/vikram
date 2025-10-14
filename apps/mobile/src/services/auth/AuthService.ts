import { SecureStorage } from "../security/SecureStorage";
import { CryptoService } from "./CryptoService";
import { TEST_USERS, MOCK_OTP } from "../mock/MockData"; // Import the test users and OTP

export interface RegistrationData {
  armyId: string;
  phone: string;
  name: string;
  rank: string;
  unit: string;
}

export interface LoginData {
  armyId: string;
  phone: string;
}

export class AuthService {
  // Mock database for demo purposes
  private static mockDatabase: Map<string, any> = new Map();

  // Generate OTP (6 digits)
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Check if user exists in database
  static async checkUserExists(
    armyId: string,
    phone: string,
  ): Promise<boolean> {
    const key = `${armyId}:${phone}`;
    return this.mockDatabase.has(key);
  }

  // Register new user
  static async register(data: RegistrationData): Promise<{
    otp: string;
    publicKey: string;
  }> {
    const key = `${data.armyId}:${data.phone}`;

    // Check if user already exists
    if (this.mockDatabase.has(key)) {
      throw new Error("User already registered");
    }

    // Generate OTP
    const otp = this.generateOTP();

    // Store temporary registration data
    const tempData = {
      ...data,
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000, // 5 minutes
      status: "pending_verification",
    };

    this.mockDatabase.set(`temp:${key}`, tempData);

    console.log(`📱 OTP sent to ${data.phone}: ${otp}`);

    return { otp, publicKey: "" };
  }

  // Verify OTP and complete registration
  static async verifyRegistrationOTP(
    armyId: string,
    phone: string,
    otp: string,
    seedPhrase: string,
  ): Promise<{ success: boolean; publicKey: string }> {
    const key = `${armyId}:${phone}`;
    const tempKey = `temp:${key}`;
    const tempData = this.mockDatabase.get(tempKey);

    if (!tempData) {
      throw new Error("Registration session expired");
    }

    if (tempData.otp !== otp) {
      throw new Error("Invalid OTP");
    }

    if (Date.now() > tempData.otpExpiry) {
      throw new Error("OTP expired");
    }

    // Generate key pair
    const keyPair = await CryptoService.generateKeyPair(
      armyId,
      phone,
      seedPhrase,
    );

    // Store user data with encrypted private key
    const userData = {
      armyId: tempData.armyId,
      phone: tempData.phone,
      name: tempData.name,
      rank: tempData.rank,
      unit: tempData.unit,
      publicKey: keyPair.publicKey,
      encryptedPrivateKey: keyPair.encryptedPrivateKey,
      createdAt: Date.now(),
      verified: true,
    };

    this.mockDatabase.set(key, userData);
    this.mockDatabase.delete(tempKey);

    console.log("✅ User registered successfully");
    console.log("Public Key:", keyPair.publicKey);
    console.log("Encrypted Private Key stored on server");

    return { success: true, publicKey: keyPair.publicKey };
  }

  // Login - Send OTP
  static async login(data: LoginData): Promise<{ otp: string }> {
    const key = `${data.armyId}:${data.phone}`;

    // Check if this is a test user
    const isTestPersonnel =
      data.armyId === TEST_USERS.personnel.armyId &&
      data.phone === TEST_USERS.personnel.phone;
    const isTestVeteran =
      data.armyId === TEST_USERS.veteran.armyId &&
      data.phone === TEST_USERS.veteran.phone;
    const isTestUser = isTestPersonnel || isTestVeteran;

    // Check if user exists
    let userData = this.mockDatabase.get(key);

    // For test users, auto-register if not already registered
    if (!userData && isTestUser) {
      const testUser = isTestPersonnel
        ? TEST_USERS.personnel
        : TEST_USERS.veteran;

      // Mock auto-registration for test users
      userData = {
        armyId: testUser.armyId,
        phone: testUser.phone,
        name: testUser.name,
        rank: testUser.rank,
        unit: testUser.unit,
        publicKey: "mock-public-key-for-testing",
        encryptedPrivateKey: "mock-encrypted-key-for-testing",
        createdAt: Date.now(),
        verified: true,
      };

      this.mockDatabase.set(key, userData);
      console.log("✅ Test user auto-registered for demo purposes");
    } else if (!userData) {
      throw new Error("User not found. Please register first.");
    }

    // Generate OTP
    const otp = this.generateOTP();

    // For test users, use a fixed OTP for easier testing
    const finalOtp = isTestUser ? MOCK_OTP : otp;

    // Store OTP temporarily
    this.mockDatabase.set(`otp:${key}`, {
      otp: finalOtp,
      expiry: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    console.log(`📱 Login OTP sent to ${data.phone}: ${finalOtp}`);

    return { otp: finalOtp };
  }

  // Verify login OTP
  static async verifyLoginOTP(
    armyId: string,
    phone: string,
    otp: string,
  ): Promise<{
    publicKey: string;
    encryptedPrivateKey: string;
    userData: any;
  }> {
    const key = `${armyId}:${phone}`;
    const otpData = this.mockDatabase.get(`otp:${key}`);

    if (!otpData) {
      throw new Error("OTP session expired");
    }

    if (otpData.otp !== otp) {
      throw new Error("Invalid OTP");
    }

    if (Date.now() > otpData.expiry) {
      throw new Error("OTP expired");
    }

    // Get user data
    const userData = this.mockDatabase.get(key);

    // Clean up OTP
    this.mockDatabase.delete(`otp:${key}`);

    console.log(
      "✅ OTP verified. User can now enter seed phrase to decrypt private key.",
    );

    return {
      publicKey: userData.publicKey,
      encryptedPrivateKey: userData.encryptedPrivateKey,
      userData,
    };
  }

  // Decrypt and validate private key with seed phrase
  static async validateSeedPhrase(
    armyId: string,
    phone: string,
    publicKey: string,
    encryptedPrivateKey: string,
    seedPhrase: string,
  ): Promise<{ success: boolean; privateKey: string }> {
    try {
      // Check if this is a test user and test seed phrase
      const isTestPersonnel =
        armyId === TEST_USERS.personnel.armyId &&
        phone === TEST_USERS.personnel.phone &&
        seedPhrase === TEST_USERS.personnel.seedPhrase;
      const isTestVeteran =
        armyId === TEST_USERS.veteran.armyId &&
        phone === TEST_USERS.veteran.phone &&
        seedPhrase === TEST_USERS.veteran.seedPhrase;

      // For test users with correct seed phrase, bypass decryption
      if (isTestPersonnel || isTestVeteran) {
        const mockPrivateKey = "mock-private-key-for-testing";
        console.log("✅ Test user detected - bypassing decryption");

        // Store in secure storage
        await SecureStorage.saveToken(mockPrivateKey);

        return { success: true, privateKey: mockPrivateKey };
      }

      // Normal flow - Generate encryption key
      const encryptionKey = await CryptoService.generateEncryptionKey(
        armyId,
        phone,
        publicKey,
      );

      // Decrypt private key
      const privateKey = CryptoService.decryptPrivateKey(
        encryptedPrivateKey,
        seedPhrase,
        encryptionKey,
      );

      console.log("✅ Private key decrypted successfully");

      // Store in secure storage
      await SecureStorage.saveToken(privateKey);

      return { success: true, privateKey };
    } catch (error) {
      throw new Error("Invalid seed phrase. Cannot decrypt private key.");
    }
  }
}
