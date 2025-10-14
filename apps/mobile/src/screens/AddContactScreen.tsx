import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

export const AddContactScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [relationType, setRelationType] = useState<"family" | "professional">(
    "professional",
  );
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");

  const handleSendRequest = () => {
    if (!serviceId || !name || !relation || !phone) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    Alert.alert("Request Sent", `Connection request sent to ${name}`, [
      {
        text: "OK",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              Add Contact
            </Text>
            <Text
              className="text-sm"
              style={{ color: theme.colors.textSecondary }}
            >
              Send a connection request
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Service ID */}
        <View className="mb-4">
          <Text
            className="mb-2 font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            Service ID / Army ID *
          </Text>
          <View
            className="flex-row items-center px-4 py-3 rounded-xl border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons
              name="id-card-outline"
              size={20}
              color={theme.colors.textSecondary}
            />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: theme.colors.textPrimary }}
              placeholder="Enter Service ID"
              placeholderTextColor={theme.colors.textSecondary}
              value={serviceId}
              onChangeText={setServiceId}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Name */}
        <View className="mb-4">
          <Text
            className="mb-2 font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            Full Name *
          </Text>
          <View
            className="flex-row items-center px-4 py-3 rounded-xl border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={theme.colors.textSecondary}
            />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: theme.colors.textPrimary }}
              placeholder="Enter full name"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* Relation Type */}
        <View className="mb-4">
          <Text
            className="mb-2 font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            Relation Type *
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl border"
              style={{
                backgroundColor:
                  relationType === "professional"
                    ? theme.colors.accent
                    : theme.colors.cardBg,
                borderColor:
                  relationType === "professional"
                    ? theme.colors.accent
                    : theme.colors.border,
              }}
              onPress={() => setRelationType("professional")}
            >
              <Text
                className="text-center font-semibold"
                style={{
                  color:
                    relationType === "professional"
                      ? "#FFFFFF"
                      : theme.colors.textPrimary,
                }}
              >
                Professional
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl border"
              style={{
                backgroundColor:
                  relationType === "family"
                    ? theme.colors.accent
                    : theme.colors.cardBg,
                borderColor:
                  relationType === "family"
                    ? theme.colors.accent
                    : theme.colors.border,
              }}
              onPress={() => setRelationType("family")}
            >
              <Text
                className="text-center font-semibold"
                style={{
                  color:
                    relationType === "family"
                      ? "#FFFFFF"
                      : theme.colors.textPrimary,
                }}
              >
                Family
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Relation */}
        <View className="mb-4">
          <Text
            className="mb-2 font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            {relationType === "professional"
              ? "Rank / Position"
              : "Family Relation"}{" "}
            *
          </Text>
          <View
            className="flex-row items-center px-4 py-3 rounded-xl border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons
              name={
                relationType === "professional"
                  ? "medal-outline"
                  : "people-outline"
              }
              size={20}
              color={theme.colors.textSecondary}
            />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: theme.colors.textPrimary }}
              placeholder={
                relationType === "professional"
                  ? "e.g., Captain, Lieutenant"
                  : "e.g., Father, Mother, Spouse"
              }
              placeholderTextColor={theme.colors.textSecondary}
              value={relation}
              onChangeText={setRelation}
            />
          </View>
        </View>

        {/* Phone Number */}
        <View className="mb-6">
          <Text
            className="mb-2 font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            Phone Number *
          </Text>
          <View
            className="flex-row items-center px-4 py-3 rounded-xl border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons
              name="call-outline"
              size={20}
              color={theme.colors.textSecondary}
            />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: theme.colors.textPrimary }}
              placeholder="+91 XXXXXXXXXX"
              placeholderTextColor={theme.colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Send Request Button */}
        <TouchableOpacity
          className="py-4 rounded-xl mb-4"
          style={{
            backgroundColor: theme.colors.accent,
            shadowColor: theme.colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
          onPress={handleSendRequest}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Send Request
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
