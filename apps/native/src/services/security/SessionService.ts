import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";

export interface Session {
  id: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const SESSIONS_KEY = "@active_sessions";

export class SessionService {
  // Get current device info
  static async getCurrentDeviceInfo(): Promise<Partial<Session>> {
    return {
      deviceName: Device.deviceName || "Unknown Device",
      deviceType:
        Device.deviceType === Device.DeviceType.PHONE ? "Mobile" : "Tablet",
      ipAddress: "192.168.1.100", // Mock - in production, fetch from server
      location: "Mumbai, India", // Mock - in production, fetch from server
      lastActive: new Date().toLocaleString(),
      isCurrent: true,
    };
  }

  // Get all active sessions
  static async getActiveSessions(): Promise<Session[]> {
    const sessionsData = await AsyncStorage.getItem(SESSIONS_KEY);
    if (sessionsData) {
      return JSON.parse(sessionsData);
    }

    // Return mock sessions including current device
    const currentDevice = await this.getCurrentDeviceInfo();
    return [
      {
        id: "1",
        ...currentDevice,
        isCurrent: true,
      } as Session,
      {
        id: "2",
        deviceName: "iPad Pro",
        deviceType: "Tablet",
        ipAddress: "192.168.1.101",
        location: "Delhi, India",
        lastActive: "2 hours ago",
        isCurrent: false,
      },
      {
        id: "3",
        deviceName: "Web Browser",
        deviceType: "Desktop",
        ipAddress: "192.168.1.102",
        location: "Bangalore, India",
        lastActive: "1 day ago",
        isCurrent: false,
      },
    ];
  }

  // Revoke session
  static async revokeSession(sessionId: string): Promise<void> {
    const sessions = await this.getActiveSessions();
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
  }

  // Revoke all other sessions
  static async revokeAllOtherSessions(): Promise<void> {
    const sessions = await this.getActiveSessions();
    const currentSession = sessions.filter((s) => s.isCurrent);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(currentSession));
  }
}
