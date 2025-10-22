import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
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

export const CreateGroupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [groupName, setGroupName] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadContacts();

    // Listen for group creation success
    WebSocketService.onGroup((event, data) => {
      if (event === "created") {
        setIsCreating(false);
        Alert.alert(
          "Group Created",
          `${groupName} has been created with ${selectedContacts.length} members`,
          [
            {
              text: "View Group",
              onPress: () => {
                navigation.navigate("Chat", {
                  groupId: data.groupId,
                  groupName: data.groupName,
                  chatType: "group",
                  members: data.members,
                });
              },
            },
            {
              text: "OK",
              onPress: () => navigation.navigate("Main"),
            },
          ],
        );
      }
    });
  }, []);

  const loadContacts = async () => {
    try {
      setIsLoading(true);

      if (!WebSocketService.isConnected()) {
        await WebSocketService.connect();
      }

      WebSocketService.getContacts();

      // Wait for contacts
      WebSocketService.onContacts((loadedContacts) => {
        setContacts(loadedContacts);
        setIsLoading(false);
      });
    } catch (error) {
      console.error("Failed to load contacts:", error);
      setIsLoading(false);
      Alert.alert("Error", "Failed to load contacts");
    }
  };

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id)
        ? prev.filter((contactId) => contactId !== id)
        : [...prev, id],
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    if (selectedContacts.length < 2) {
      Alert.alert("Error", "Please select at least 2 members");
      return;
    }

    setIsCreating(true);

    try {
      if (!WebSocketService.isConnected()) {
        await WebSocketService.connect();
      }

      // Create group via WebSocket
      WebSocketService.createGroup(groupName.trim(), selectedContacts);
    } catch (error: any) {
      setIsCreating(false);
      Alert.alert("Error", error.message || "Failed to create group");
    }
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const isSelected = selectedContacts.includes(item.id);

    return (
      <TouchableOpacity
        className="flex-row items-center p-4 rounded-lg mb-2"
        style={{
          backgroundColor: isSelected
            ? `${theme.colors.accent}20`
            : theme.colors.cardBg,
          borderWidth: 1,
          borderColor: isSelected ? theme.colors.accent : theme.colors.border,
        }}
        onPress={() => toggleContact(item.id)}
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
          <Text
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            {item.designation} • {item.armyId}
          </Text>
        </View>

        <View
          className="w-6 h-6 rounded-full border-2 items-center justify-center"
          style={{
            borderColor: isSelected ? theme.colors.accent : theme.colors.border,
            backgroundColor: isSelected ? theme.colors.accent : "transparent",
          }}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    );
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
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
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
                Create Group
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {selectedContacts.length} members selected
              </Text>
            </View>
          </View>
          {selectedContacts.length >= 2 && groupName.trim() && (
            <TouchableOpacity onPress={handleCreateGroup} disabled={isCreating}>
              {isCreating ? (
                <ActivityIndicator color={theme.colors.accent} />
              ) : (
                <Text
                  className="font-bold text-lg"
                  style={{ color: theme.colors.accent }}
                >
                  Create
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Group Name */}
        <View className="p-4">
          <Text
            className="mb-2 font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            Group Name *
          </Text>
          <View
            className="flex-row items-center px-4 py-3 rounded-xl border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={theme.colors.textSecondary}
            />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: theme.colors.textPrimary }}
              placeholder="Enter group name"
              placeholderTextColor={theme.colors.textSecondary}
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>
        </View>

        {/* Select Members */}
        <View className="px-4 pb-4">
          <Text
            className="font-bold mb-3"
            style={{ color: theme.colors.textPrimary }}
          >
            Select Members (minimum 2)
          </Text>

          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text
                className="mt-4"
                style={{ color: theme.colors.textSecondary }}
              >
                Loading contacts...
              </Text>
            </View>
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id}
              renderItem={renderContact}
              scrollEnabled={false}
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
                    No contacts available
                  </Text>
                  <Text
                    className="text-sm mt-2 text-center px-8"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Add contacts before creating a group
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>

      {/* Create Button (Fixed at bottom when selection is valid) */}
      {selectedContacts.length >= 2 && groupName.trim() && (
        <View
          className="px-6 py-4 border-t"
          style={{
            backgroundColor: theme.colors.secondaryBg,
            borderTopColor: theme.colors.border,
          }}
        >
          <TouchableOpacity
            className="py-4 rounded-xl"
            style={{
              backgroundColor: theme.colors.accent,
              shadowColor: theme.colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
            onPress={handleCreateGroup}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                Create Group with {selectedContacts.length} Members
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
