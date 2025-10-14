import { useEffect } from "react";
import { Platform, AppState, AppStateStatus } from "react-native";
import * as ScreenCapture from "expo-screen-capture";

// For Android - using rn-screenshot-prevent
// let ScreenshotPrevent: any = null;
// if (Platform.OS === 'android') {
//   try {
//     ScreenshotPrevent = require('rn-screenshot-prevent').default;
//   } catch (e) {
//     console.warn('rn-screenshot-prevent not available');
//   }
// }

// Enable screenshot protection globally
export const enableScreenshotProtection = async () => {
  try {
    // Method 1: expo-screen-capture (iOS and Android)
    await ScreenCapture.preventScreenCaptureAsync();

    // Method 2: rn-screenshot-prevent (Android only)
    // if (Platform.OS === 'android' && ScreenshotPrevent) {
    //   ScreenshotPrevent.enabled(true);
    // }

    console.log("Screenshot protection enabled");
  } catch (error) {
    console.error("Failed to enable screenshot protection:", error);
  }
};

// Disable screenshot protection
export const disableScreenshotProtection = async () => {
  try {
    await ScreenCapture.allowScreenCaptureAsync();

    // if (Platform.OS === 'android' && ScreenshotPrevent) {
    //   ScreenshotPrevent.enabled(false);
    // }
  } catch (error) {
    console.error("Failed to disable screenshot protection:", error);
  }
};

// Hook to use screenshot protection
export const useScreenshotProtection = (enabled: boolean = true) => {
  useEffect(() => {
    if (enabled) {
      enableScreenshotProtection();
    }

    return () => {
      // Keep protection enabled even when component unmounts
    };
  }, [enabled]);
};

// Disable copy/paste for text inputs
export const disableCopyPaste = () => ({
  contextMenuHidden: true,
  selectTextOnFocus: false,
  selectable: false,
  onCopy: () => false,
  onCut: () => false,
  onPaste: () => false,
});

// Blur app in background (for recent apps screen)
export const useAppBackgroundBlur = () => {
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        // Enable protection when app goes to background
        await enableScreenshotProtection();
      } else if (nextAppState === "active") {
        // Keep protection enabled when app comes to foreground
        await enableScreenshotProtection();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);
};

// Add listener for screenshot attempts
export const useScreenshotListener = (onScreenshot: () => void) => {
  useEffect(() => {
    const subscription = ScreenCapture.addScreenshotListener(() => {
      onScreenshot();
    });

    return () => {
      subscription.remove();
    };
  }, [onScreenshot]);
};
