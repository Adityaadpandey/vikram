import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useTheme } from "../../contexts/ThemeContext";

interface IncomingCallModalProps {
  visible: boolean;
  callerName: string;
  callerImage?: string;
  isVideoCall: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  visible,
  callerName,
  callerImage,
  isVideoCall,
  onAccept,
  onDecline,
}) => {
  const { theme } = useTheme();
  const [sound, setSound] = useState<Audio.Sound>();
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (visible) {
      playRingtone();
      startPulseAnimation();
    } else {
      stopRingtone();
    }

    return () => {
      stopRingtone();
    };
  }, [visible]);

  const playRingtone = async () => {
    try {
      const { sound: ringtone } = await Audio.Sound.createAsync(
        // Use default system sound or custom ringtone
        {
          uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        },
        { shouldPlay: true, isLooping: true, volume: 0.5 },
      );
      setSound(ringtone);
    } catch (error) {
      console.error("Error playing ringtone:", error);
    }
  };

  const stopRingtone = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const handleAccept = () => {
    stopRingtone();
    onAccept();
  };

  const handleDecline = () => {
    stopRingtone();
    onDecline();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent
    >
      <View
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
      >
        {/* Caller Info */}
        <View className="items-center mb-12">
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
            }}
          >
            <View
              className="w-32 h-32 rounded-full items-center justify-center mb-6"
              style={{
                backgroundColor: theme.colors.accent,
                shadowColor: theme.colors.accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              {callerImage ? (
                <Image
                  source={{ uri: callerImage }}
                  className="w-32 h-32 rounded-full"
                />
              ) : (
                <Ionicons name="person" size={64} color="#FFFFFF" />
              )}
            </View>
          </Animated.View>

          <Text className="text-white text-3xl font-bold mb-2">
            {callerName}
          </Text>
          <View className="flex-row items-center">
            <Ionicons
              name={isVideoCall ? "videocam" : "call"}
              size={20}
              color={theme.colors.accent}
            />
            <Text className="text-white text-lg ml-2">
              Incoming {isVideoCall ? "Video" : "Voice"} Call
            </Text>
          </View>
        </View>

        {/* Call Actions */}
        <View className="flex-row items-center justify-center gap-8">
          {/* Decline Button */}
          <TouchableOpacity className="items-center" onPress={handleDecline}>
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{
                backgroundColor: theme.colors.error,
                shadowColor: theme.colors.error,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons name="close" size={36} color="#FFFFFF" />
            </View>
            <Text className="text-white text-sm mt-3 font-medium">Decline</Text>
          </TouchableOpacity>

          {/* Accept Button */}
          <TouchableOpacity className="items-center" onPress={handleAccept}>
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{
                backgroundColor: theme.colors.success,
                shadowColor: theme.colors.success,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons
                name={isVideoCall ? "videocam" : "call"}
                size={36}
                color="#FFFFFF"
              />
            </View>
            <Text className="text-white text-sm mt-3 font-medium">Accept</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Options */}
        <View className="absolute bottom-12 flex-row gap-6">
          <TouchableOpacity className="items-center">
            <View
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.colors.cardBg }}
            >
              <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
            </View>
            <Text className="text-white text-xs mt-2">Message</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center">
            <View
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.colors.cardBg }}
            >
              <Ionicons name="time" size={24} color="#FFFFFF" />
            </View>
            <Text className="text-white text-xs mt-2">Remind</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
