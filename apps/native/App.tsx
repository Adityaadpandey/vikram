// Import polyfills at the very top
import "react-native-get-random-values";
import { Buffer } from "buffer";
global.Buffer = Buffer;

import React, { useEffect, useRef, useState } from "react";
import "./global.css";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import { UserProvider } from "./src/contexts/UserContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  enableScreenshotProtection,
  useAppBackgroundBlur,
} from "./src/services/security/ScreenshotProtection";
import { BiometricAuthService } from "./src/services/security/BiometricAuth";
import { AutoLockService } from "./src/services/security/AutoLockService";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IncomingCallModal } from "./src/components/modals/IncomingCallModal";
import { CallNotificationService } from "./src/services/call/CallNotificationService";
import * as Notifications from "expo-notifications";
import { NavigationContainer } from "@react-navigation/native";

function AppContent() {
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    visible: boolean;
    callerName: string;
    callerImage?: string;
    isVideoCall: boolean;
    callId: string;
  }>({
    visible: false,
    callerName: "",
    isVideoCall: false,
    callId: "",
  });
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Enable global screenshot protection
    enableScreenshotProtection();

    // Setup call notification categories
    CallNotificationService.setupNotificationCategories();
    CallNotificationService.requestPermissions();

    // Listen for notification responses (when user taps on notification)
    const responseSubscription =
      CallNotificationService.addNotificationResponseListener((response) => {
        const { actionIdentifier, notification } = response;
        const callData = notification.request.content.data;

        if (callData.type === "incoming_call") {
          if (
            actionIdentifier === "ACCEPT_CALL" ||
            actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
          ) {
            // Accept call
            CallNotificationService.cancelOngoingCallNotification();
            setIncomingCall({
              visible: false,
              callerName:
                typeof callData.callerName === "string"
                  ? callData.callerName
                  : "",
              isVideoCall:
                typeof callData.isVideoCall === "boolean"
                  ? callData.isVideoCall
                  : false,
              callId:
                typeof callData.callId === "string" ? callData.callId : "",
            });

            // Navigate to call screen
            navigationRef.current?.navigate("Call", {
              callId:
                typeof callData.callId === "string" ? callData.callId : "",
              contactName: callData.callerName,
              isVideoCall:
                typeof callData.isVideoCall === "boolean"
                  ? callData.isVideoCall
                  : false,
            });
          } else if (actionIdentifier === "DECLINE_CALL") {
            // Decline call
            CallNotificationService.cancelOngoingCallNotification();
            console.log("Call declined");
          }
        } else if (callData.type === "ongoing_call") {
          if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
            // Return to call
            navigationRef.current?.navigate("Call", {
              callId:
                typeof callData.callId === "string" ? callData.callId : "",
              contactName: callData.contactName,
              isVideoCall:
                typeof callData.isVideoCall === "boolean"
                  ? callData.isVideoCall
                  : false,
            });
          } else if (actionIdentifier === "END_CALL") {
            // End call
            CallNotificationService.cancelOngoingCallNotification();
          } else if (actionIdentifier === "MUTE_CALL") {
            // Toggle mute (would need to communicate with call screen)
            console.log("Mute toggled from notification");
          } else if (actionIdentifier === "SPEAKER_TOGGLE") {
            // Toggle speaker
            console.log("Speaker toggled from notification");
          }
        } else if (callData.type === "outgoing_call") {
          if (actionIdentifier === "CANCEL_CALL") {
            // Cancel outgoing call
            CallNotificationService.cancelOngoingCallNotification();
            navigationRef.current?.goBack();
          }
        }
      });

    // Listen for notifications received while app is in foreground
    const receivedSubscription =
      CallNotificationService.addNotificationReceivedListener(
        (notification) => {
          const callData = notification.request.content.data;

          if (callData.type === "incoming_call") {
            // Show incoming call modal
            setIncomingCall({
              visible: true,
              callerName:
                typeof callData.callerName === "string"
                  ? callData.callerName
                  : "",
              isVideoCall:
                typeof callData.isVideoCall === "boolean"
                  ? callData.isVideoCall
                  : false,
              callId:
                typeof callData.callId === "string" ? callData.callId : "",
            });
          }
        },
      );

    // Set up auto-lock callback
    AutoLockService.setLockCallback(() => {
      setIsLocked(true);
    });

    // Start monitoring app state
    AutoLockService.startMonitoring();

    return () => {
      AutoLockService.stopMonitoring();
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);

  // Use background blur hook
  useAppBackgroundBlur();

  const handleUnlock = async () => {
    setIsAuthenticating(true);

    const biometricEnabled = await BiometricAuthService.isEnabled();

    if (biometricEnabled) {
      const success = await BiometricAuthService.authenticate(
        "Unlock Defense Secure",
      );
      if (success) {
        setIsLocked(false);
        await AutoLockService.updateLastActiveTime();
      }
    } else {
      // Fallback authentication
      setIsLocked(false);
      await AutoLockService.updateLastActiveTime();
    }

    setIsAuthenticating(false);
  };

  if (isLocked) {
    return (
      <View className="flex-1 bg-dark-primary items-center justify-center px-6">
        {/* App Icon */}
        <View className="w-24 h-24 rounded-full bg-dark-accent items-center justify-center mb-8">
          <Image
            source={require("./assets/icon.png")}
            className="w-20 h-20"
            resizeMode="contain"
          />
        </View>
        <Text className="text-white text-2xl font-bold mb-2">App Locked</Text>
        <Text className="text-dark-text-secondary text-center mb-8">
          Authenticate to continue using Defense Secure
        </Text>
        <TouchableOpacity
          className="bg-dark-accent py-4 px-8 rounded-lg"
          onPress={handleUnlock}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-lg">Unlock</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // Simulate an incoming call for testing in development mode
  function simulateIncomingCall() {
    setIncomingCall({
      visible: true,
      callerName: "Test Caller",
      callerImage: undefined,
      isVideoCall: false,
      callId: "test-call-id",
    });
  }

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <AppNavigator />
      </NavigationContainer>

      {/* Incoming Call Modal */}
      <IncomingCallModal
        visible={incomingCall.visible}
        callerName={incomingCall.callerName}
        callerImage={incomingCall.callerImage}
        isVideoCall={incomingCall.isVideoCall}
        onAccept={() => {
          setIncomingCall({ ...incomingCall, visible: false });
          navigationRef.current?.navigate("Call", {
            callId: incomingCall.callId,
            contactName: incomingCall.callerName,
            isVideoCall: incomingCall.isVideoCall,
          });
        }}
        onDecline={() => {
          setIncomingCall({ ...incomingCall, visible: false });
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
