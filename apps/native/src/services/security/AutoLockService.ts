import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";

const AUTO_LOCK_TIME_KEY = "@auto_lock_time";
const LAST_ACTIVE_TIME_KEY = "@last_active_time";

export class AutoLockService {
  private static lockCallback: (() => void) | null = null;

  // Set auto lock time (in minutes)
  static async setAutoLockTime(minutes: number): Promise<void> {
    await AsyncStorage.setItem(AUTO_LOCK_TIME_KEY, minutes.toString());
  }

  // Get auto lock time
  static async getAutoLockTime(): Promise<number> {
    const time = await AsyncStorage.getItem(AUTO_LOCK_TIME_KEY);
    return time ? parseInt(time) : 5; // Default 5 minutes
  }

  // Update last active time
  static async updateLastActiveTime(): Promise<void> {
    await AsyncStorage.setItem(LAST_ACTIVE_TIME_KEY, Date.now().toString());
  }

  // Check if app should be locked
  static async shouldLock(): Promise<boolean> {
    const autoLockTime = await this.getAutoLockTime();
    const lastActiveTime = await AsyncStorage.getItem(LAST_ACTIVE_TIME_KEY);

    if (!lastActiveTime) return false;

    const timeDiff = Date.now() - parseInt(lastActiveTime);
    const minutesDiff = timeDiff / (1000 * 60);

    return minutesDiff >= autoLockTime;
  }

  // Set lock callback
  static setLockCallback(callback: () => void): void {
    this.lockCallback = callback;
  }

  // Subscription reference for AppState event
  private static appStateSubscription: { remove: () => void } | null = null;

  // Start monitoring
  static startMonitoring(): void {
    if (!this.appStateSubscription) {
      this.appStateSubscription = AppState.addEventListener(
        "change",
        this.handleAppStateChange,
      );
    }
  }

  // Stop monitoring
  static stopMonitoring(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  private static handleAppStateChange = async (
    nextAppState: AppStateStatus,
  ) => {
    if (nextAppState === "active") {
      const shouldLock = await AutoLockService.shouldLock();
      if (shouldLock && AutoLockService.lockCallback) {
        AutoLockService.lockCallback();
      }
    } else if (nextAppState === "background" || nextAppState === "inactive") {
      await AutoLockService.updateLastActiveTime();
    }
  };
}
