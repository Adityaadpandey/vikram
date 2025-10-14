import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, BackHandler } from "react-native";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraType, CameraView } from "expo-camera";
import { useTheme } from "../contexts/ThemeContext";
import { CallNotificationService } from "../services/call/CallNotificationService";
import { CallManager } from "../services/call/CallManager";

export const VoiceVideoCallScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const {
    isVideoCall,
    contactName = "Unknown",
    callId = Date.now().toString(),
  } = route.params;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(isVideoCall);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>("front");
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      initializeCall();
      isInitialized.current = true;
    }

    // Handle back button
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleMinimizeCall();
        return true;
      },
    );

    return () => {
      backHandler.remove();
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      const durationInterval = setInterval(() => {
        setCallDuration(CallManager.getCallDuration());
      }, 1000);

      return () => clearInterval(durationInterval);
    }
  }, [isConnected]);

  const initializeCall = async () => {
    console.log("Initializing call...");
    await requestCameraPermission();

    // Start call in CallManager
    CallManager.startCall(callId, contactName, isVideoCall);

    // Show outgoing notification
    console.log("Showing outgoing notification...");
    await CallNotificationService.showOutgoingCallNotification(
      contactName,
      isVideoCall,
    );

    // Simulate call connection after 2 seconds
    setTimeout(() => {
      handleCallConnected();
    }, 2000);
  };

  const handleCallConnected = async () => {
    console.log("Call connected, switching to ongoing notification...");
    setIsConnected(true);

    // IMPORTANT: Cancel outgoing notification first
    await CallNotificationService.cancelOutgoingCallNotification();

    // Small delay to ensure outgoing is dismissed
    setTimeout(async () => {
      // Show ongoing call notification
      await CallManager.callConnected();
      console.log("Ongoing notification should be visible now");
    }, 300);
  };

  const requestCameraPermission = async () => {
    if (isVideoCall) {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    }
  };

  const toggleCamera = () => {
    setCameraType((current) => (current === "back" ? "front" : "back"));
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMinimizeCall = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Main");
    }
  };

  const handleEndCall = () => {
    Alert.alert("End Call", "Are you sure you want to end this call?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Call",
        style: "destructive",
        onPress: async () => {
          await endCallCleanup();
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate("Main");
          }
        },
      },
    ]);
  };

  const endCallCleanup = async () => {
    console.log("Ending call and cleaning up notifications...");
    await CallManager.endCall();
  };

  const handleMuteToggle = async () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);

    if (isConnected) {
      await CallManager.updateCallNotification(newMuteState, isSpeakerOn);
    }
  };

  const handleSpeakerToggle = async () => {
    const newSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerState);

    if (isConnected) {
      await CallManager.updateCallNotification(isMuted, newSpeakerState);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (!CallManager.isCallActive()) {
          endCallCleanup();
        }
      };
    }, []),
  );

  if (isVideoCall && hasPermission === null) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.colors.primaryBg }}
      >
        <Text style={{ color: theme.colors.textPrimary }}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (isVideoCall && hasPermission === false) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: theme.colors.primaryBg }}
      >
        <Ionicons name="videocam-off" size={64} color={theme.colors.error} />
        <Text
          className="text-lg mt-4 text-center"
          style={{ color: theme.colors.textPrimary }}
        >
          Camera permission is required for video calls
        </Text>
        <TouchableOpacity
          className="mt-6 py-3 px-6 rounded-lg"
          style={{ backgroundColor: theme.colors.accent }}
          onPress={requestCameraPermission}
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
    >
      {/* Video Display Area */}
      {isVideoCall && isCameraOn ? (
        <View className="flex-1">
          {/* Remote Video (Simulated) */}
          <View
            className="absolute inset-0"
            style={{ backgroundColor: theme.colors.secondaryBg }}
          >
            <View className="flex-1 items-center justify-center">
              <Ionicons
                name="person"
                size={100}
                color={theme.colors.textSecondary}
              />
              <Text
                className="text-lg mt-4"
                style={{ color: theme.colors.textSecondary }}
              >
                {contactName}
              </Text>
              {!isConnected && (
                <Text
                  className="text-sm mt-2"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Connecting...
                </Text>
              )}
            </View>
          </View>

          {/* Local Camera View */}
          <View
            className="absolute top-16 right-4 w-28 h-40 rounded-xl overflow-hidden"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing={cameraType}
            />
            <TouchableOpacity
              className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 items-center justify-center"
              onPress={toggleCamera}
            >
              <Ionicons name="camera-reverse" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Audio Call Display
        <View className="flex-1 justify-center items-center">
          <View
            className="w-32 h-32 rounded-full items-center justify-center mb-6"
            style={{
              backgroundColor: isDark
                ? theme.colors.cardBg
                : theme.colors.secondaryBg,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Ionicons name="person" size={60} color={theme.colors.accent} />
          </View>
          <Text
            className="text-2xl font-bold"
            style={{ color: theme.colors.textPrimary }}
          >
            {contactName}
          </Text>
          <Text
            className="mt-2 text-base"
            style={{ color: theme.colors.textSecondary }}
          >
            {isConnected ? formatDuration(callDuration) : "Connecting..."}
          </Text>
        </View>
      )}

      {/* Minimize Button */}
      <TouchableOpacity
        className="absolute top-12 left-4 w-10 h-10 rounded-full items-center justify-center"
        style={{
          backgroundColor: theme.colors.cardBg,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
        onPress={handleMinimizeCall}
      >
        <Ionicons
          name="chevron-down"
          size={24}
          color={theme.colors.textPrimary}
        />
      </TouchableOpacity>

      {/* Network Quality */}
      <View
        className="absolute top-12 right-4 flex-row items-center px-3 py-2 rounded-full"
        style={{
          backgroundColor: isDark
            ? theme.colors.cardBg
            : theme.colors.cardBg + "CC",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <View
          className="w-2 h-2 rounded-full mr-2"
          style={{ backgroundColor: theme.colors.success }}
        />
        <Ionicons name="wifi" size={16} color={theme.colors.success} />
        <Text
          className="text-xs ml-2 font-medium"
          style={{ color: theme.colors.textPrimary }}
        >
          Excellent
        </Text>
      </View>

      {/* Call Timer */}
      {isConnected && (
        <View className="absolute top-24 self-center">
          <View
            className="px-4 py-2 rounded-full"
            style={{ backgroundColor: theme.colors.cardBg + "CC" }}
          >
            <Text
              className="text-base font-semibold"
              style={{ color: theme.colors.textPrimary }}
            >
              {formatDuration(callDuration)}
            </Text>
          </View>
        </View>
      )}

      {/* Call Controls */}
      <View
        className="px-6 pb-12"
        style={{ backgroundColor: theme.colors.secondaryBg }}
      >
        <View className="flex-row justify-around items-center mb-6 pt-6">
          {/* Mute */}
          <TouchableOpacity className="items-center" onPress={handleMuteToggle}>
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{
                backgroundColor: isMuted
                  ? theme.colors.error
                  : theme.colors.cardBg,
                shadowColor: isMuted ? theme.colors.error : "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <Ionicons
                name={isMuted ? "mic-off" : "mic"}
                size={28}
                color={isMuted ? "#FFFFFF" : theme.colors.textPrimary}
              />
            </View>
            <Text
              className="text-xs mt-2 font-medium"
              style={{ color: theme.colors.textSecondary }}
            >
              {isMuted ? "Unmute" : "Mute"}
            </Text>
          </TouchableOpacity>

          {/* Camera (Video only) */}
          {isVideoCall && (
            <TouchableOpacity
              className="items-center"
              onPress={() => setIsCameraOn(!isCameraOn)}
            >
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isCameraOn
                    ? theme.colors.cardBg
                    : theme.colors.error,
                  shadowColor: !isCameraOn ? theme.colors.error : "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Ionicons
                  name={isCameraOn ? "videocam" : "videocam-off"}
                  size={28}
                  color={isCameraOn ? theme.colors.textPrimary : "#FFFFFF"}
                />
              </View>
              <Text
                className="text-xs mt-2 font-medium"
                style={{ color: theme.colors.textSecondary }}
              >
                Camera
              </Text>
            </TouchableOpacity>
          )}

          {/* Speaker */}
          <TouchableOpacity
            className="items-center"
            onPress={handleSpeakerToggle}
          >
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{
                backgroundColor: isSpeakerOn
                  ? theme.colors.accent
                  : theme.colors.cardBg,
                shadowColor: isSpeakerOn ? theme.colors.accent : "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <Ionicons
                name={isSpeakerOn ? "volume-high" : "volume-medium"}
                size={28}
                color={isSpeakerOn ? "#FFFFFF" : theme.colors.textPrimary}
              />
            </View>
            <Text
              className="text-xs mt-2 font-medium"
              style={{ color: theme.colors.textSecondary }}
            >
              Speaker
            </Text>
          </TouchableOpacity>

          {/* End Call */}
          <TouchableOpacity className="items-center" onPress={handleEndCall}>
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{
                backgroundColor: theme.colors.error,
                shadowColor: theme.colors.error,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons
                name="call"
                size={28}
                color="#FFFFFF"
                style={{ transform: [{ rotate: "135deg" }] }}
              />
            </View>
            <Text
              className="text-xs mt-2 font-medium"
              style={{ color: theme.colors.error }}
            >
              End
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-center mt-4">
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={theme.colors.accent}
          />
          <Text
            className="text-sm ml-2"
            style={{ color: theme.colors.textSecondary }}
          >
            End-to-end encrypted call
          </Text>
        </View>
      </View>
    </View>
  );
};
