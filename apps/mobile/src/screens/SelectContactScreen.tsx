import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { MOCK_CONTACTS } from "../services/mock/MockData";

export const SelectContactScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = MOCK_CONTACTS.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCallContact = (
    contact: (typeof MOCK_CONTACTS)[0],
    isVideo: boolean,
  ) => {
    navigation.replace("Call", {
      callId: contact.id,
      contactName: contact.name,
      isVideoCall: isVideo,
    });
  };

  const renderContact = ({ item }: { item: (typeof MOCK_CONTACTS)[0] }) => (
    <View
      className="flex-row items-center p-4 mb-2 rounded-lg"
      style={{
        backgroundColor: theme.colors.cardBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: theme.colors.secondaryBg }}
      >
        <Ionicons name="person" size={24} color={theme.colors.accent} />
      </View>

      <View className="flex-1">
        <Text
          className="font-semibold"
          style={{ color: theme.colors.textPrimary }}
        >
          {item.name}
        </Text>
        <View className="flex-row items-center mt-1">
          <View
            className="w-2 h-2 rounded-full mr-2"
            style={{
              backgroundColor:
                item.status === "online"
                  ? theme.colors.success
                  : item.status === "away"
                    ? theme.colors.warning
                    : theme.colors.textSecondary,
            }}
          />
          <Text
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            {item.rank || item.relation}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: theme.colors.accent }}
          onPress={() => handleCallContact(item, false)}
        >
          <Ionicons name="call" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: theme.colors.accent }}
          onPress={() => handleCallContact(item, true)}
        >
          <Ionicons name="videocam" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
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
        <View className="flex-row items-center mb-4">
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
              className="text-xl font-bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Select Contact
            </Text>
            <Text
              className="text-sm"
              style={{ color: theme.colors.textSecondary }}
            >
              Choose who to call
            </Text>
          </View>
        </View>

        {/* Search */}
        <View
          className="flex-row items-center rounded-lg px-3 py-2"
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
            placeholder="Search contacts..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        contentContainerClassName="p-4"
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Ionicons
              name="people-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text
              className="text-lg mt-4"
              style={{ color: theme.colors.textSecondary }}
            >
              No contacts found
            </Text>
          </View>
        }
      />
    </View>
  );
};
