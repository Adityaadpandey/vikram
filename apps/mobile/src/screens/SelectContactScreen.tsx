import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { WebSocketService } from "../services/api/WebSocketService";

interface Contact {
  id: string;
  armyId: string;
  name: string;
  designation: string;
  publicKey: string;
  status: "online" | "offline";
}

export const SelectContactScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        if (!WebSocketService.isConnected()) {
          await WebSocketService.connect();
        }
        WebSocketService.onContacts((serverContacts) => {
          setContacts(serverContacts as Contact[]);
          setLoading(false);
        });
        WebSocketService.getContacts();
      } catch (error) {
        console.error("Failed to load contacts:", error);
        setLoading(false);
      }
    };
    loadContacts();
  }, []);

  const filteredContacts = contacts.filter((contact) =>
    (contact.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCallContact = (contact: Contact, isVideo: boolean) => {
    navigation.replace("Call", {
      callId: contact.id,
      contactName: contact.name,
      isVideoCall: isVideo,
    });
  };

  const renderContact = ({ item }: { item: Contact }) => (
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
          {item.name || item.armyId}
        </Text>
        <View className="flex-row items-center mt-1">
          <View
            className="w-2 h-2 rounded-full mr-2"
            style={{
              backgroundColor:
                item.status === "online"
                  ? theme.colors.success
                  : theme.colors.textSecondary,
            }}
          />
          <Text
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            {item.designation || item.armyId}
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
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text
            className="text-sm mt-4"
            style={{ color: theme.colors.textSecondary }}
          >
            Loading contacts...
          </Text>
        </View>
      ) : (
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
      )}
    </View>
  );
};
