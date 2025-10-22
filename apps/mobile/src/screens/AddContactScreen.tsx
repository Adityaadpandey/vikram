import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { WebSocketService } from "../services/api/WebSocketService";

export const AddContactScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [armyId, setArmyId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddContact = async () => {
    if (!armyId.trim()) {
      Alert.alert("Error", "Please enter an Army ID");
      return;
    }

    setIsLoading(true);

    try {
      // Ensure WebSocket is connected
      if (!WebSocketService.isConnected()) {
        await WebSocketService.connect();
      }

      // Add friend via WebSocket
      WebSocketService.addFriend(armyId.trim());

      // Listen for success
      setTimeout(() => {
        Alert.alert("Success", "Contact request sent successfully", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      }, 1000);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add contact");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
    >
      {/* Header */}
      <View
        className="px-6 pt-12 pb-6"
        style={{ backgroundColor: theme.colors.secondaryBg }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <View className="flex-1">
            <Text
              className="text-2xl font-bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Add Contact
            </Text>
            <Text
              className="text-sm mt-1"
              style={{ color: theme.colors.textSecondary }}
            >
              Enter the Army ID to connect
            </Text>
          </View>
        </View>
      </View>

      {/* Form */}
      <View className="px-6 pt-8">
        <View className="mb-4">
          <Text
            className="mb-2 font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            Army ID / Service Number
          </Text>
          <View
            className="flex-row items-center px-4 py-4 rounded-xl border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={theme.colors.accent}
            />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: theme.colors.textPrimary }}
              placeholder="B67890"
              placeholderTextColor={theme.colors.textSecondary}
              value={armyId}
              onChangeText={setArmyId}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <TouchableOpacity
          className="py-4 rounded-xl mt-4"
          style={{
            backgroundColor: theme.colors.accent,
            shadowColor: theme.colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
          onPress={handleAddContact}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Send Request
            </Text>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View
          className="mt-8 p-4 rounded-xl"
          style={{ backgroundColor: theme.colors.cardBg }}
        >
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="information-circle"
              size={24}
              color={theme.colors.accent}
            />
            <Text
              className="ml-2 font-bold"
              style={{ color: theme.colors.textPrimary }}
            >
              How it works
            </Text>
          </View>
          <Text
            className="text-sm leading-5"
            style={{ color: theme.colors.textSecondary }}
          >
            1. Enter the Army ID of the person you want to connect with{"\n"}
            2. They will receive your connection request{"\n"}
            3. Once accepted, you can start secure conversations
          </Text>
        </View>
      </View>
    </View>
  );
};
