import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

interface Contact {
  id: string;
  name: string;
  relation: string;
  selected: boolean;
}

const MOCK_CONTACTS: Contact[] = [
  { id: "1", name: "Capt. Miller", relation: "Captain", selected: false },
  { id: "2", name: "Lt. Johnson", relation: "Lieutenant", selected: false },
  { id: "3", name: "Sgt. Thompson", relation: "Sergeant", selected: false },
  { id: "4", name: "Cpl. Davis", relation: "Corporal", selected: false },
];

export const CreateGroupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [groupName, setGroupName] = useState("");
  const [contacts, setContacts] = useState(MOCK_CONTACTS);

  const selectedCount = contacts.filter((c) => c.selected).length;

  const toggleContact = (id: string) => {
    setContacts(
      contacts.map((contact) =>
        contact.id === id
          ? { ...contact, selected: !contact.selected }
          : contact,
      ),
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    if (selectedCount < 2) {
      Alert.alert("Error", "Please select at least 2 members");
      return;
    }

    Alert.alert(
      "Group Created",
      `${groupName} has been created with ${selectedCount} members`,
      [
        {
          text: "OK",
          onPress: () => navigation.navigate("Main"),
        },
      ],
    );
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 rounded-lg mb-2"
      style={{
        backgroundColor: item.selected
          ? `${theme.colors.accent}20`
          : theme.colors.cardBg,
        borderWidth: 1,
        borderColor: item.selected ? theme.colors.accent : theme.colors.border,
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
        <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>
          {item.relation}
        </Text>
      </View>

      <View
        className="w-6 h-6 rounded-full border-2 items-center justify-center"
        style={{
          borderColor: item.selected
            ? theme.colors.accent
            : theme.colors.border,
          backgroundColor: item.selected ? theme.colors.accent : "transparent",
        }}
      >
        {item.selected && (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        )}
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
              className="text-xl font-bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Create Group
            </Text>
            <Text
              className="text-sm"
              style={{ color: theme.colors.textSecondary }}
            >
              {selectedCount} members selected
            </Text>
          </View>
          {selectedCount >= 2 && (
            <TouchableOpacity onPress={handleCreateGroup}>
              <Text
                className="font-bold"
                style={{ color: theme.colors.accent }}
              >
                Create
              </Text>
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
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContact}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};
