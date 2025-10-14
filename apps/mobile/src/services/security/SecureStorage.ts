import * as Keychain from "react-native-keychain";

export class SecureStorage {
  static async saveCredentials(
    username: string,
    password: string,
  ): Promise<boolean> {
    try {
      await Keychain.setGenericPassword(username, password, {
        service: "defense.secure.chat",
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      });
      return true;
    } catch (error) {
      console.error("Failed to save credentials:", error);
      return false;
    }
  }

  static async getCredentials(): Promise<{
    username: string;
    password: string;
  } | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: "defense.secure.chat",
      });

      if (credentials) {
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to retrieve credentials:", error);
      return null;
    }
  }

  static async saveToken(token: string): Promise<void> {
    await Keychain.setInternetCredentials("auth_token", "token", token);
  }

  static async getToken(): Promise<string | null> {
    try {
      const creds = await Keychain.getInternetCredentials("auth_token");
      return creds ? creds.password : null;
    } catch (error) {
      return null;
    }
  }

  static async clearAll(): Promise<void> {
    await Keychain.resetGenericPassword({ service: "defense.secure.chat" });
    await Keychain.resetInternetCredentials("auth_token");
  }
}
