import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { getStarredMessages } from "../../services/mock/MockData";

export const StarredMessagesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const starredMessages = getStarredMessages();

  const navigateToChat = (
    chatId: string,
    chatName: string,
    messageId: string,
  ) => {
    navigation.navigate("Chat", {
      groupId: chatId,
      groupName: chatName,
      chatType:
        chatName.includes("Squad") || chatName.includes("Group")
          ? "group"
          : "direct",
      highlightMessageId: messageId, // Pass message ID to highlight
    });
  };

  const renderStarredMessage = ({ item }: any) => (
    <TouchableOpacity
      className="p-4 mb-3 rounded-lg border"
      style={{
        backgroundColor: theme.colors.cardBg,
        borderColor: theme.colors.border,
      }}
      onPress={() => navigateToChat(item.chatId, item.chatName, item.id)}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-semibold" style={{ color: theme.colors.accent }}>
          {item.chatName}
        </Text>
        <Ionicons name="star" size={16} color={theme.colors.warning} />
      </View>

      <Text
        className="font-medium mb-1"
        style={{ color: theme.colors.textPrimary }}
      >
        {item.senderName}
      </Text>

      <Text
        className="text-sm mb-2"
        style={{ color: theme.colors.textSecondary }}
      >
        {item.text}
      </Text>

      <Text className="text-xs" style={{ color: theme.colors.textSecondary }}>
        {item.timestamp}
      </Text>
    </TouchableOpacity>
  );

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
          <View>
            <Text
              className="text-2xl font-bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Starred Messages
            </Text>
            <Text
              className="text-sm mt-1"
              style={{ color: theme.colors.textSecondary }}
            >
              {starredMessages.length} messages
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={starredMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderStarredMessage}
        contentContainerClassName="p-6"
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons
              name="star-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text
              className="text-lg mt-4"
              style={{ color: theme.colors.textSecondary }}
            >
              No starred messages
            </Text>
          </View>
        }
      />
    </View>
  );
};
