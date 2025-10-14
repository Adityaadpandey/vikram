import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { IconButton } from "../../components/common/IconButton";
import { useTheme } from "../../contexts/ThemeContext";
import { MOCK_CHATS } from "../../services/mock/MockData";

type FilterType = "all" | "direct" | "group";

export const ChatsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = MOCK_CHATS.filter((chat) => {
    const matchesFilter = activeFilter === "all" || chat.type === activeFilter;
    const matchesSearch = chat.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const FilterButton: React.FC<{ filter: FilterType; label: string }> = ({
    filter,
    label,
  }) => (
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

  const renderChatItem = ({ item }: any) => (
    <TouchableOpacity
      className="flex-row items-center px-6 py-4"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
      onPress={() =>
        navigation.navigate("Chat", {
          groupId: item.id,
          groupName: item.name,
          chatType: item.type,
        })
      }
    >
      <View
        className="w-14 h-14 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: theme.colors.secondaryBg }}
      >
        {item.type === "group" ? (
          <MaterialIcons name="groups" size={28} color={theme.colors.accent} />
        ) : (
          <Ionicons name="person" size={24} color={theme.colors.accent} />
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text
            className="text-base font-semibold flex-1"
            style={{ color: theme.colors.textPrimary }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            className="text-xs ml-2"
            style={{ color: theme.colors.textSecondary }}
          >
            {item.timestamp}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text
            className="text-sm flex-1"
            style={{ color: theme.colors.textSecondary }}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View
              className="rounded-full min-w-[20px] h-5 items-center justify-center px-1.5 ml-2"
              style={{ backgroundColor: theme.colors.accent }}
            >
              <Text className="text-white text-xs font-bold">
                {item.unread}
              </Text>
            </View>
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
              Messages
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
              placeholder="Search messages..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Filters */}
      <View
        className="px-6 py-3"
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
            { filter: "all" as FilterType, label: "All" },
            { filter: "direct" as FilterType, label: "Direct" },
            { filter: "group" as FilterType, label: "Groups" },
          ]}
          keyExtractor={(item) => item.filter}
          renderItem={({ item }) => (
            <FilterButton filter={item.filter} label={item.label} />
          )}
        />
      </View>

      {/* Chats List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons
              name="chatbubbles-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text
              className="text-lg mt-4"
              style={{ color: theme.colors.textSecondary }}
            >
              No messages found
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
        onPress={() => navigation.navigate("Contacts")}
      >
        <Ionicons name="person-add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};
