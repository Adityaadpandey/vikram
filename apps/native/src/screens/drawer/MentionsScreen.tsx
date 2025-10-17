import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";

interface Mention {
  id: string;
  message: string;
  sender: string;
  group: string;
  timestamp: string;
}

const MOCK_MENTIONS: Mention[] = [
  {
    id: "1",
    message: "@You We need status update on the mission briefing",
    sender: "Capt. Miller",
    group: "Alpha Squad",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    message: "@You Great work on yesterday's presentation",
    sender: "Lt. Johnson",
    group: "Command Center",
    timestamp: "Yesterday",
  },
  {
    id: "3",
    message: "@You Don't forget the meeting at 1400",
    sender: "Sgt. Thompson",
    group: "Team Delta",
    timestamp: "2 days ago",
  },
];

export const MentionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();

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
              Mentions
            </Text>
            <Text
              className="mt-1"
              style={{ color: theme.colors.textSecondary }}
            >
              Messages that mention you
            </Text>
          </View>
        </View>
      </View>

      {/* Mentions List */}
      <FlatList
        data={MOCK_MENTIONS}
        contentContainerClassName="p-4"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="p-4 rounded-lg mb-3 border-l-4"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderLeftColor: theme.colors.accent,
            }}
            onPress={() =>
              navigation.navigate("Chat", {
                groupId: item.id,
                groupName: item.group,
              })
            }
          >
            <View className="flex-row justify-between mb-2">
              <Text
                className="font-semibold"
                style={{ color: theme.colors.textPrimary }}
              >
                {item.sender}
              </Text>
              <Text
                className="text-xs"
                style={{ color: theme.colors.textSecondary }}
              >
                {item.timestamp}
              </Text>
            </View>
            <Text
              className="text-sm mb-2"
              style={{ color: theme.colors.textSecondary }}
            >
              {item.message}
            </Text>
            <Text
              className="text-xs"
              style={{ color: theme.colors.textSecondary }}
            >
              in {item.group}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text
              className="text-lg"
              style={{ color: theme.colors.textSecondary }}
            >
              No mentions yet
            </Text>
          </View>
        }
      />
    </View>
  );
};
