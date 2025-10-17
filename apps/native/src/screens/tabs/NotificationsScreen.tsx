import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { IconButton } from "../../components/common/IconButton";
import { useTheme } from "../../contexts/ThemeContext";
import {
  MOCK_PENDING_REQUESTS,
  getMentionedMessages,
  approveContactRequest,
  removePendingRequest,
} from "../../services/mock/MockData";

type NotificationFilter = "all" | "requests" | "mentions" | "updates";

interface Notification {
  id: string;
  type: "request" | "mention" | "update";
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [pendingRequests, setPendingRequests] = useState(MOCK_PENDING_REQUESTS);

  const mentionedMessages = getMentionedMessages();

  // Convert pending requests to notifications
  const requestNotifications: Notification[] = pendingRequests.map(
    (request) => ({
      id: request.id,
      type: "request",
      title: "New Contact Request",
      message: `${request.name} wants to connect`,
      timestamp: request.requestDate,
      data: request,
    }),
  );

  // Convert mentions to notifications
  const mentionNotifications: Notification[] = mentionedMessages.map((msg) => ({
    id: `mention_${msg.id}`,
    type: "mention",
    title: `Mention in ${msg.chatName}`,
    message: `${msg.senderName}: ${msg.text}`,
    timestamp: msg.timestamp,
    data: {
      chatId: msg.chatId,
      chatName: msg.chatName,
      messageId: msg.id,
    },
  }));

  const updateNotifications: Notification[] = [
    {
      id: "update1",
      type: "update",
      title: "System Update",
      message: "New security features are now available",
      timestamp: "1 day ago",
    },
  ];

  const allNotifications = [
    ...requestNotifications,
    ...mentionNotifications,
    ...updateNotifications,
  ];

  const filterMap: Record<NotificationFilter, Notification["type"] | null> = {
    all: null,
    requests: "request",
    mentions: "mention",
    updates: "update",
  };

  const filteredNotifications = allNotifications.filter((notification) => {
    if (activeFilter === "all") return true;
    return notification.type === filterMap[activeFilter];
  });

  const handleApprove = (notification: Notification) => {
    const newContact = approveContactRequest(notification.id);
    if (newContact) {
      removePendingRequest(notification.id);
      setPendingRequests(
        pendingRequests.filter((r) => r.id !== notification.id),
      );
      Alert.alert(
        "Approved",
        `${notification.data.name} has been added to your contacts`,
      );
    }
  };

  const handleReject = (notification: Notification) => {
    Alert.alert(
      "Reject Request",
      `Reject ${notification.data.name}'s request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            removePendingRequest(notification.id);
            setPendingRequests(
              pendingRequests.filter((r) => r.id !== notification.id),
            );
            Alert.alert("Rejected", "Contact request has been declined");
          },
        },
      ],
    );
  };

  const handleMentionClick = (notification: Notification) => {
    navigation.navigate("Chat", {
      groupId: notification.data.chatId,
      groupName: notification.data.chatName,
      chatType:
        notification.data.chatName.includes("Squad") ||
        notification.data.chatName.includes("Group")
          ? "group"
          : "direct",
      highlightMessageId: notification.data.messageId,
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request":
        return "person-add";
      case "mention":
        return "at";
      case "update":
        return "information-circle";
      default:
        return "notifications";
    }
  };

  const FilterButton: React.FC<{
    filter: NotificationFilter;
    label: string;
  }> = ({ filter, label }) => (
    <TouchableOpacity
      onPress={() => setActiveFilter(filter)}
      className="px-4 py-2 rounded-full mr-2"
      style={{
        backgroundColor:
          activeFilter === filter ? theme.colors.accent : theme.colors.cardBg,
        borderWidth: activeFilter === filter ? 0 : 1,
        borderColor: theme.colors.border,
      }}
    >
      <Text
        className="font-semibold"
        style={{
          color:
            activeFilter === filter ? "#FFFFFF" : theme.colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      className="mx-4 mb-3 rounded-lg p-4"
      style={{
        backgroundColor: theme.colors.cardBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
      onPress={() => item.type === "mention" && handleMentionClick(item)}
      activeOpacity={item.type === "mention" ? 0.7 : 1}
    >
      <View className="flex-row items-start">
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: theme.colors.secondaryBg }}
        >
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={24}
            color={
              item.type === "request" || item.type === "mention"
                ? theme.colors.accent
                : theme.colors.textSecondary
            }
          />
        </View>

        <View className="flex-1">
          <Text
            className="font-semibold mb-1"
            style={{ color: theme.colors.textPrimary }}
          >
            {item.title}
          </Text>
          <Text
            className="text-sm mb-2"
            style={{ color: theme.colors.textSecondary }}
          >
            {item.message}
          </Text>

          {item.type === "request" && item.data && (
            <View
              className="mb-2 p-2 rounded-lg"
              style={{ backgroundColor: theme.colors.secondaryBg }}
            >
              <Text
                className="text-sm"
                style={{ color: theme.colors.textPrimary }}
              >
                {item.data.rank || item.data.relation} •{" "}
                {item.data.unit || "Family"}
              </Text>
            </View>
          )}

          <Text
            className="text-xs"
            style={{ color: theme.colors.textSecondary }}
          >
            {item.timestamp}
          </Text>

          {item.type === "request" && (
            <View className="flex-row mt-3 gap-2">
              <TouchableOpacity
                className="flex-1 py-2 rounded-lg"
                style={{ backgroundColor: theme.colors.accent }}
                onPress={() => handleApprove(item)}
              >
                <Text className="text-white text-center font-semibold text-sm">
                  Approve
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-2 rounded-lg border"
                style={{
                  backgroundColor: "transparent",
                  borderColor: theme.colors.border,
                }}
                onPress={() => handleReject(item)}
              >
                <Text
                  className="text-center font-semibold text-sm"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Reject
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {item.type === "mention" && (
            <TouchableOpacity
              className="mt-2 py-2 px-3 rounded-lg self-start"
              style={{ backgroundColor: theme.colors.accent }}
              onPress={() => handleMentionClick(item)}
            >
              <Text className="text-white text-sm font-semibold">
                View Message
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
    >
      {/* Header */}
      <View
        className="px-4 pt-12 pb-4 shadow-lg"
        style={{ backgroundColor: theme.colors.secondaryBg }}
      >
        <View className="flex-row items-center justify-between">
          <IconButton
            name="menu"
            size={28}
            color={theme.colors.textPrimary}
            onPress={() => navigation.openDrawer()}
          />

          <View className="flex-1 mx-4">
            <Text
              className="text-xl font-bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Notifications
            </Text>
          </View>

          <IconButton
            name="checkmark-done"
            size={24}
            color={theme.colors.textPrimary}
            onPress={() => Alert.alert("Mark all as read")}
          />
        </View>
      </View>

      {/* Filters */}
      <View
        className="px-4 py-3"
        style={{
          backgroundColor: theme.colors.primaryBg,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { filter: "all" as NotificationFilter, label: "All" },
            { filter: "requests" as NotificationFilter, label: "Requests" },
            { filter: "mentions" as NotificationFilter, label: "Mentions" },
            { filter: "updates" as NotificationFilter, label: "Updates" },
          ]}
          keyExtractor={(item) => item.filter}
          renderItem={({ item }) => (
            <FilterButton filter={item.filter} label={item.label} />
          )}
        />
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerClassName="py-4"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text
              className="text-lg mt-4"
              style={{ color: theme.colors.textSecondary }}
            >
              No notifications
            </Text>
          </View>
        }
      />
    </View>
  );
};
