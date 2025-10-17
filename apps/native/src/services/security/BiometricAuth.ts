import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BIOMETRIC_ENABLED_KEY = "@biometric_enabled";

export class BiometricAuthService {
  // Check if device supports biometric authentication
  static async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  }

  // Get supported biometric types
  static async getSupportedTypes(): Promise<string[]> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types.map((type) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return "Fingerprint";
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return "Face ID";
        case LocalAuthentication.AuthenticationType.IRIS:
          return "Iris";
        default:
          return "Biometric";
      }
    });
  }

  // Authenticate user with biometrics
  static async authenticate(reason?: string): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || "Authenticate to access Defense Secure",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
        fallbackLabel: "Use Passcode",
      });
      return result.success;
    } catch (error) {
      console.error("Biometric authentication error:", error);
      return false;
    }
  }

  // Check if biometric is enabled
  static async isEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === "true";
  }

  // Enable biometric authentication
  static async enable(): Promise<void> {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
  }

  // Disable biometric authentication
  static async disable(): Promise<void> {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "false");
  }
}
