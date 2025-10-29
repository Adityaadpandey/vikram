import { ApiService } from "../api/ApiService";
import { WebSocketService } from "../api/WebSocketService";
import { SecureStorage } from "../security/SecureStorage";
import { EncryptionService } from "../security/EncryptionService";

export interface RegisterRequest {
  armyId: string;
  phoneNumber: string;
}

export interface VerifyOTPRequest {
  armyId: string;
  phoneNumber: string;
  otp: string;
  name?: string;
  designation?: string;
}

export interface LoginRequest {
  armyId: string;
  phoneNumber: string;
}

export interface LoginVerifyRequest {
  armyId: string;
  phoneNumber: string;
  otp: string;
  seedPhrase: string;
}

export interface User {
  id: string;
  armyId: string;
  phone: string;
  name: string;
  designation: string;
}

export interface AuthKeys {
  publicKey: string;
  privateKey: string;
}

class AuthServiceClass {
  // Registration flow
  async initiateRegistration(
    armyId: string,
    phoneNumber: string,
  ): Promise<{ message: string }> {
    try {
      console.log("Initiating registration for:", armyId, phoneNumber);
      const response = await ApiService.register(armyId, phoneNumber);
      console.log("Registration initiated:", response);
      return response;
    } catch (error: any) {
      console.error("Registration initiation failed:", error);
      throw this.handleError(error);
    }
  }

  async verifyRegistrationOTP(
    armyId: string,
    phoneNumber: string,
    otp: string,
    name: string,
    designation: string,
  ): Promise<{
    message: string;
    userId: string;
    publicKey: string;
    seedPhrase: string;
  }> {
    try {
      console.log("Verifying registration OTP for:", armyId);
      const response = await ApiService.verifyRegistrationOTP(
        armyId,
        phoneNumber,
        otp,
        name,
        designation,
      );
      console.log("Registration verified:", response.userId);

      // Store initial data (but don't log in yet - user must save seed phrase)
      await SecureStorage.setUserId(response.userId);
      await SecureStorage.setArmyId(armyId);
      await SecureStorage.setPhoneNumber(phoneNumber);
      await SecureStorage.setUserName(name);
      await SecureStorage.setUserDesignation(designation);
      await SecureStorage.setPublicKey(response.publicKey);

      return response;
    } catch (error: any) {
      console.error("Registration verification failed:", error);
      throw this.handleError(error);
    }
  }

  // Login flow
  async initiateLogin(
    armyId: string,
    phoneNumber: string,
  ): Promise<{ message: string }> {
    try {
      console.log("Initiating login for:", armyId);
      const response = await ApiService.login(armyId, phoneNumber);
      console.log("Login initiated:", response);
      return response;
    } catch (error: any) {
      console.error("Login initiation failed:", error);
      throw this.handleError(error);
    }
  }

  async verifyLoginOTP(
    armyId: string,
    phoneNumber: string,
    otp: string,
    seedPhrase: string,
  ): Promise<{
    message: string;
    sessionToken: string;
    user: User;
    keys: AuthKeys;
  }> {
    try {
      console.log("Verifying login OTP for:", armyId);
      const response = await ApiService.verifyLoginOTP(
        armyId,
        phoneNumber,
        otp,
        seedPhrase,
      );
      console.log("Login verified, storing session...");

      // Store session and user data
      await this.storeUserSession(
        response.sessionToken,
        response.user,
        response.keys,
      );

      // Connect to WebSocket
      await this.connectWebSocket();

      return response;
    } catch (error: any) {
      console.error("Login verification failed:", error);
      throw this.handleError(error);
    }
  }

  // Store user session
  private async storeUserSession(
    sessionToken: string,
    user: User,
    keys: AuthKeys,
  ): Promise<void> {
    try {
      await SecureStorage.setToken(sessionToken);
      await SecureStorage.setUserId(user.id);
      await SecureStorage.setArmyId(user.armyId);
      await SecureStorage.setPhoneNumber(user.phone);
      await SecureStorage.setUserName(user.name);
      await SecureStorage.setUserDesignation(user.designation);
      await SecureStorage.setPublicKey(keys.publicKey);
      await SecureStorage.setPrivateKey(keys.privateKey);

      console.log("User session stored successfully");
    } catch (error) {
      console.error("Failed to store user session:", error);
      throw new Error("Failed to store user session");
    }
  }

  // Connect to WebSocket
  private async connectWebSocket(): Promise<void> {
    try {
      if (!WebSocketService.isConnected()) {
        console.log("Connecting to WebSocket...");
        await WebSocketService.connect();
        WebSocketService.startHeartbeat();
        console.log("WebSocket connected successfully");
      }
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      // Don't throw - allow login to succeed even if WebSocket fails
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const sessionToken = await SecureStorage.getToken();

      if (sessionToken) {
        try {
          await ApiService.logout(sessionToken);
        } catch (error) {
          console.error("Logout API call failed:", error);
          // Continue with local cleanup even if API fails
        }
      }

      // Disconnect WebSocket
      WebSocketService.disconnect();

      // Clear local storage
      await SecureStorage.clearAll();

      console.log("Logout successful");
    } catch (error) {
      console.error("Logout failed:", error);
      throw this.handleError(error);
    }
  }

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await SecureStorage.getToken();
      const userId = await SecureStorage.getUserId();
      return !!(token && userId);
    } catch (error) {
      console.error("Failed to check login status:", error);
      return false;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const userId = await SecureStorage.getUserId();
      const armyId = await SecureStorage.getArmyId();
      const phone = await SecureStorage.getPhoneNumber();
      const name = await SecureStorage.getUserName();
      const designation = await SecureStorage.getUserDesignation();

      if (userId && armyId && phone && name && designation) {
        return {
          id: userId,
          armyId,
          phone,
          name,
          designation,
        };
      }

      return null;
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  }

  // Get user keys
  async getUserKeys(): Promise<AuthKeys | null> {
    try {
      const publicKey = await SecureStorage.getPublicKey();
      const privateKey = await SecureStorage.getPrivateKey();

      if (publicKey && privateKey) {
        return { publicKey, privateKey };
      }

      return null;
    } catch (error) {
      console.error("Failed to get user keys:", error);
      return null;
    }
  }

  // Validate seed phrase format
  validateSeedPhrase(seedPhrase: string): boolean {
    const words = seedPhrase.trim().split(/\s+/);
    return words.length === 12;
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber: string): boolean {
    // Format: +91XXXXXXXXXX (Indian mobile number)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }

  // Validate army ID format
  validateArmyId(armyId: string): boolean {
    // Army ID should be alphanumeric and at least 3 characters
    const armyIdRegex = /^[A-Z0-9]{3,}$/;
    return armyIdRegex.test(armyId.toUpperCase());
  }

  // Handle errors
  private handleError(error: any): Error {
    if (error.response) {
      // API error response
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        "Request failed";
      const statusCode = error.response.status;

      console.error("API Error:", statusCode, message);

      switch (statusCode) {
        case 400:
          return new Error(message || "Invalid request");
        case 401:
          return new Error("Unauthorized - Invalid credentials");
        case 403:
          return new Error("Access denied");
        case 404:
          return new Error("User not found");
        case 409:
          return new Error(message || "User already exists");
        case 429:
          return new Error("Too many requests - Please try again later");
        case 500:
          return new Error("Server error - Please try again later");
        default:
          return new Error(message);
      }
    } else if (error.request) {
      // Network error
      console.error("Network Error:", error.message);
      return new Error("Network error - Please check your connection");
    } else {
      // Other error
      console.error("Error:", error.message);
      return new Error(error.message || "An unexpected error occurred");
    }
  }

  // Check backend health
  async checkHealth(): Promise<boolean> {
    try {
      await ApiService.checkHealth();
      return true;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }

  // Reconnect WebSocket if disconnected
  async reconnectWebSocket(): Promise<void> {
    try {
      const isLoggedIn = await this.isLoggedIn();

      if (isLoggedIn && !WebSocketService.isConnected()) {
        console.log("Reconnecting WebSocket...");
        await WebSocketService.connect();
        WebSocketService.startHeartbeat();
      }
    } catch (error) {
      console.error("Failed to reconnect WebSocket:", error);
      throw new Error("Failed to reconnect - Please try again");
    }
  }

  // Get session token
  async getSessionToken(): Promise<string | null> {
    return await SecureStorage.getToken();
  }

  // Refresh session (if needed in future)
  async refreshSession(): Promise<void> {
    // Placeholder for future session refresh implementation
    console.log("Session refresh not yet implemented");
  }
}

export const AuthService = new AuthServiceClass();
