import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { WebSocketService } from "../../services/api/WebSocketService";

export const ConnectionStatus: React.FC = () => {
  const { theme } = useTheme();
  const [status, setStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");

  useEffect(() => {
    const checkConnection = setInterval(() => {
      const wsStatus = WebSocketService.getStatus();
      if (wsStatus.authenticated) {
        setStatus("connected");
      } else if (wsStatus.connected) {
        setStatus("connecting");
      } else {
        setStatus("disconnected");
      }
    }, 2000);

    return () => clearInterval(checkConnection);
  }, []);

  const handleRetry = async () => {
    setStatus("connecting");
    try {
      await WebSocketService.connect();
    } catch (error) {
      console.error("Connection retry failed:", error);
    }
  };

  if (status === "connected") return null;

  return (
    <TouchableOpacity
      className="px-4 py-2 flex-row items-center justify-between"
      style={{
        backgroundColor:
          status === "connecting" ? theme.colors.warning : theme.colors.error,
      }}
      onPress={handleRetry}
    >
      <View className="flex-row items-center">
        <Ionicons
          name={
            status === "connecting" ? "time-outline" : "cloud-offline-outline"
          }
          size={20}
          color="#FFFFFF"
        />
        <Text className="text-white ml-2 font-semibold">
          {status === "connecting" ? "Connecting..." : "No connection"}
        </Text>
      </View>
      {status === "disconnected" && (
        <Text className="text-white text-sm">Tap to retry</Text>
      )}
    </TouchableOpacity>
  );
};
