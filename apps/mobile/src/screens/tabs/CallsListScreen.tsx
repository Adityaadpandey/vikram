import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { IconButton } from "../../components/common/IconButton";
import { useTheme } from "../../contexts/ThemeContext";
import { CallNotificationService } from "../../services/call/CallNotificationService";

interface Call {
  id: string;
  name: string;
  type: "incoming" | "outgoing" | "missed";
  callType: "voice" | "video";
  timestamp: string;
  duration?: string;
}

const MOCK_CALLS: Call[] = [
  {
    id: "1",
    name: "Rahul Sharma",
    type: "incoming",
    callType: "video",
    timestamp: "10:30 AM",
    duration: "12:45",
  },
  {
    id: "2",
    name: "Priya Singh",
    type: "outgoing",
    callType: "voice",
    timestamp: "Yesterday",
    duration: "05:23",
  },
  {
    id: "3",
    name: "Amit Patel",
    type: "missed",
    callType: "voice",
    timestamp: "2 days ago",
  },
  {
    id: "4",
    name: "Team Bharat",
    type: "outgoing",
    callType: "video",
    timestamp: "3 days ago",
    duration: "45:12",
  },
];

export const CallsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCalls = MOCK_CALLS.filter((call) =>
    call.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Test incoming call function
  const simulateIncomingCall = async () => {
    await CallNotificationService.showIncomingCallNotification({
      callId: Date.now().toString(),
      callerName: "Captain Arjun Singh",
      isVideoCall: true,
      timestamp: Date.now(),
    });
  };

  const getCallIcon = (call: Call) => {
    if (call.type === "missed") {
      return (
        <Ionicons name="call-outline" size={20} color={theme.colors.error} />
      );
    }
    if (call.type === "incoming") {
      return (
        <Ionicons name="arrow-down" size={20} color={theme.colors.accent} />
      );
    }
    return (
      <Ionicons name="arrow-up" size={20} color={theme.colors.textSecondary} />
    );
  };

  const renderCallItem = ({ item }: { item: Call }) => (
    <TouchableOpacity
      className="flex-row items-center px-6 py-4"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
      onPress={() =>
        navigation.navigate("Call", {
          callId: item.id,
          contactName: item.name,
          isVideoCall: item.callType === "video",
        })
      }
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: theme.colors.secondaryBg }}
      >
        <Ionicons name="person" size={24} color={theme.colors.accent} />
      </View>

      <View className="flex-1">
        <Text
          className="text-base font-semibold mb-1"
          style={{ color: theme.colors.textPrimary }}
        >
          {item.name}
        </Text>
        <View className="flex-row items-center">
          {getCallIcon(item)}
          <Text
            className="text-sm ml-2"
            style={{
              color:
                item.type === "missed"
                  ? theme.colors.error
                  : theme.colors.textSecondary,
            }}
          >
            {item.callType === "video" ? "Video" : "Voice"} • {item.timestamp}
          </Text>
        </View>
      </View>

      <View className="items-end">
        {item.duration && (
          <Text
            className="text-sm mb-2"
            style={{ color: theme.colors.textSecondary }}
          >
            {item.duration}
          </Text>
        )}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Call", {
              callId: item.id,
              contactName: item.name,
              isVideoCall: item.callType === "video",
            })
          }
        >
          <Ionicons
            name={item.callType === "video" ? "videocam" : "call"}
            size={24}
            color={theme.colors.accent}
          />
        </TouchableOpacity>
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
              Calls
            </Text>
          </View>

          <IconButton
            name={searchVisible ? "close" : "search"}
            size={24}
            color={theme.colors.textPrimary}
            onPress={() => {
              setSearchVisible(!searchVisible);
              if (searchVisible) setSearchQuery("");
            }}
          />
        </View>

        {searchVisible && (
          <View
            className="mt-3 flex-row items-center rounded-lg px-3 py-2"
            style={{ backgroundColor: theme.colors.cardBg }}
          >
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.textSecondary}
            />
            <TextInput
              className="flex-1 ml-2 py-1"
              style={{ color: theme.colors.textPrimary }}
              placeholder="Search calls..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        )}
      </View>

      {/* Calls List */}
      <FlatList
        data={filteredCalls}
        keyExtractor={(item) => item.id}
        renderItem={renderCallItem}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons
              name="call-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text
              className="text-lg mt-4"
              style={{ color: theme.colors.textSecondary }}
            >
              No calls found
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        style={{
          backgroundColor: theme.colors.accent,
          elevation: 8,
          shadowColor: theme.colors.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        }}
        onPress={() => navigation.navigate("SelectContact")}
      >
        <Ionicons name="call" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Test Call Button - Only in Dev Mode */}
      {/* {__DEV__ && (
        <TouchableOpacity
          className="absolute bottom-28 right-6 w-16 h-16 rounded-full items-center justify-center shadow-lg"
          style={{
            backgroundColor: theme.colors.warning,
            elevation: 8,
            shadowColor: theme.colors.warning,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
          }}
          onPress={simulateIncomingCall}
        ><Text style={{ color: '#fff' }}>Test Call</Text>
          { <Ionicons name="notifications" size={28} color="#ffffff" /> }
        </TouchableOpacity>
      )} */}
    </View>
  );
};
