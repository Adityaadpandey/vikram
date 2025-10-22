import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

class SecureStorageClass {
  // Storage keys
  private static KEYS = {
    TOKEN: "session_token",
    USER_ID: "user_id",
    ARMY_ID: "army_id",
    USER_NAME: "user_name",
    USER_DESIGNATION: "user_designation",
    PHONE_NUMBER: "phone_number",
    PUBLIC_KEY: "public_key",
    PRIVATE_KEY: "private_key",
    SEED_PHRASE: "seed_phrase",
    BIOMETRIC_ENABLED: "biometric_enabled",
    AUTO_LOCK_ENABLED: "auto_lock_enabled",
    AUTO_LOCK_TIMEOUT: "auto_lock_timeout",
    THEME: "theme",
  };

  // Use SecureStore for sensitive data, AsyncStorage for non-sensitive
  private async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        // Web fallback to localStorage (not recommended for production)
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error("Error storing secure item:", error);
      throw error;
    }
  }

  private async getSecureItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        return localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error("Error retrieving secure item:", error);
      return null;
    }
  }

  private async deleteSecureItem(key: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error("Error deleting secure item:", error);
    }
  }

  // Session Token
  async setToken(token: string): Promise<void> {
    await this.setSecureItem(SecureStorageClass.KEYS.TOKEN, token);
  }

  async getToken(): Promise<string | null> {
    return await this.getSecureItem(SecureStorageClass.KEYS.TOKEN);
  }

  async clearToken(): Promise<void> {
    await this.deleteSecureItem(SecureStorageClass.KEYS.TOKEN);
  }

  // User ID
  async setUserId(userId: string): Promise<void> {
    await this.setSecureItem(SecureStorageClass.KEYS.USER_ID, userId);
  }

  async getUserId(): Promise<string | null> {
    return await this.getSecureItem(SecureStorageClass.KEYS.USER_ID);
  }

  // Army ID
  async setArmyId(armyId: string): Promise<void> {
    await this.setSecureItem(SecureStorageClass.KEYS.ARMY_ID, armyId);
  }

  async getArmyId(): Promise<string | null> {
    return await this.getSecureItem(SecureStorageClass.KEYS.ARMY_ID);
  }

  // User Name
  async setUserName(name: string): Promise<void> {
    await this.setSecureItem(SecureStorageClass.KEYS.USER_NAME, name);
  }

  async getUserName(): Promise<string | null> {
    return await this.getSecureItem(SecureStorageClass.KEYS.USER_NAME);
  }

  // User Designation
  async setUserDesignation(designation: string): Promise<void> {
    await this.setSecureItem(
      SecureStorageClass.KEYS.USER_DESIGNATION,
      designation,
    );
  }

  async getUserDesignation(): Promise<string | null> {
    return await this.getSecureItem(SecureStorageClass.KEYS.USER_DESIGNATION);
  }

  // Phone Number
  async setPhoneNumber(phone: string): Promise<void> {
    await this.setSecureItem(SecureStorageClass.KEYS.PHONE_NUMBER, phone);
  }

  async getPhoneNumber(): Promise<string | null> {
    return await this.getSecureItem(SecureStorageClass.KEYS.PHONE_NUMBER);
  }

  // Public Key
  async setPublicKey(publicKey: string): Promise<void> {
    await this.setSecureItem(SecureStorageClass.KEYS.PUBLIC_KEY, publicKey);
  }

  async getPublicKey(): Promise<string | null> {
    return await this.getSecureItem(SecureStorageClass.KEYS.PUBLIC_KEY);
  }

  // Private Key (Most sensitive)
  async setPrivateKey(privateKey: string): Promise<void> {
    await this.setSecureItem(SecureStorageClass.KEYS.PRIVATE_KEY, privateKey);
  }

  async getPrivateKey(): Promise<string | null> {
    return await this.getSecureItem(SecureStorageClass.KEYS.PRIVATE_KEY);
  }

  // Seed Phrase (Most sensitive)
  async setSeedPhrase(seedPhrase: string): Promise<void> {
    await this.setSecureItem(SecureStorageClass.KEYS.SEED_PHRASE, seedPhrase);
  }

  async getSeedPhrase(): Promise<string | null> {
    return await this.getSecureItem(SecureStorageClass.KEYS.SEED_PHRASE);
  }

  // Biometric Settings
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(
      SecureStorageClass.KEYS.BIOMETRIC_ENABLED,
      enabled.toString(),
    );
  }

  async isBiometricEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(
      SecureStorageClass.KEYS.BIOMETRIC_ENABLED,
    );
    return value === "true";
  }

  // Auto Lock Settings
  async setAutoLockEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(
      SecureStorageClass.KEYS.AUTO_LOCK_ENABLED,
      enabled.toString(),
    );
  }

  async isAutoLockEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(
      SecureStorageClass.KEYS.AUTO_LOCK_ENABLED,
    );
    return value === "true";
  }

  async setAutoLockTimeout(timeout: number): Promise<void> {
    await AsyncStorage.setItem(
      SecureStorageClass.KEYS.AUTO_LOCK_TIMEOUT,
      timeout.toString(),
    );
  }

  async getAutoLockTimeout(): Promise<number> {
    const value = await AsyncStorage.getItem(
      SecureStorageClass.KEYS.AUTO_LOCK_TIMEOUT,
    );
    return value ? parseInt(value, 10) : 300000; // Default 5 minutes
  }

  // Theme
  async setTheme(theme: "light" | "dark"): Promise<void> {
    await AsyncStorage.setItem(SecureStorageClass.KEYS.THEME, theme);
  }

  async getTheme(): Promise<"light" | "dark" | null> {
    const theme = await AsyncStorage.getItem(SecureStorageClass.KEYS.THEME);
    return theme as "light" | "dark" | null;
  }

  // Generic methods for custom keys
  async setItem(key: string, value: string): Promise<void> {
    await this.setSecureItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return await this.getSecureItem(key);
  }

  async removeItem(key: string): Promise<void> {
    await this.deleteSecureItem(key);
  }

  // Get user profile
  async getUserProfile(): Promise<{
    userId: string | null;
    armyId: string | null;
    name: string | null;
    designation: string | null;
    phone: string | null;
  }> {
    return {
      userId: await this.getUserId(),
      armyId: await this.getArmyId(),
      name: await this.getUserName(),
      designation: await this.getUserDesignation(),
      phone: await this.getPhoneNumber(),
    };
  }

  // Clear all user data (logout)
  async clearAll(): Promise<void> {
    try {
      // Clear all secure items
      await Promise.all([
        this.clearToken(),
        this.deleteSecureItem(SecureStorageClass.KEYS.USER_ID),
        this.deleteSecureItem(SecureStorageClass.KEYS.ARMY_ID),
        this.deleteSecureItem(SecureStorageClass.KEYS.USER_NAME),
        this.deleteSecureItem(SecureStorageClass.KEYS.USER_DESIGNATION),
        this.deleteSecureItem(SecureStorageClass.KEYS.PHONE_NUMBER),
        this.deleteSecureItem(SecureStorageClass.KEYS.PUBLIC_KEY),
        this.deleteSecureItem(SecureStorageClass.KEYS.PRIVATE_KEY),
        this.deleteSecureItem(SecureStorageClass.KEYS.SEED_PHRASE),
      ]);

      // Keep settings (biometric, auto-lock, theme)
      console.log("User data cleared successfully");
    } catch (error) {
      console.error("Error clearing user data:", error);
      throw error;
    }
  }

  // Clear everything including settings
  async clearAllIncludingSettings(): Promise<void> {
    try {
      if (Platform.OS === "web") {
        localStorage.clear();
      } else {
        // Clear all SecureStore items
        await this.clearAll();
      }
      // Clear AsyncStorage
      await AsyncStorage.clear();
      console.log("All data cleared successfully");
    } catch (error) {
      console.error("Error clearing all data:", error);
      throw error;
    }
  }

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  // Get authentication keys
  async getAuthKeys(): Promise<{
    publicKey: string | null;
    privateKey: string | null;
  }> {
    return {
      publicKey: await this.getPublicKey(),
      privateKey: await this.getPrivateKey(),
    };
  }
}

export const SecureStorage = new SecureStorageClass();
