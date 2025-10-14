import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../contexts/ThemeContext";
import { useUser } from "../../contexts/UserContext";

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { profile, updateProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need camera roll permissions to change your profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newProfileImage = result.assets[0].uri;
      setEditedProfile({ ...editedProfile, profileImage: newProfileImage });
      await updateProfile({ profileImage: newProfileImage });
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile(editedProfile);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
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
            <Text
              className="text-2xl font-bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Profile
            </Text>
          </View>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text
                className="font-semibold"
                style={{ color: theme.colors.accent }}
              >
                Edit
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="items-center py-8">
          <TouchableOpacity onPress={isEditing ? pickImage : undefined}>
            <View
              className="w-32 h-32 rounded-full items-center justify-center mb-4"
              style={{
                backgroundColor: editedProfile.profileImage
                  ? "transparent"
                  : theme.colors.accent,
                shadowColor: theme.colors.accent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              {editedProfile.profileImage ? (
                <Image
                  source={{ uri: editedProfile.profileImage }}
                  className="w-32 h-32 rounded-full"
                />
              ) : (
                <Ionicons name="person" size={64} color="#FFFFFF" />
              )}
              {isEditing && (
                <View
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.colors.accent }}
                >
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          <Text
            className="text-2xl font-bold"
            style={{ color: theme.colors.textPrimary }}
          >
            {editedProfile.name}
          </Text>
          <Text
            className="text-lg mt-2"
            style={{ color: theme.colors.textSecondary }}
          >
            Active Defense Personnel
          </Text>
        </View>

        {/* Profile Info */}
        <View className="px-6 pb-6">
          {/* Service ID */}
          <View
            className="rounded-lg p-4 mb-4 border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              className="text-sm mb-1"
              style={{ color: theme.colors.textSecondary }}
            >
              Service ID / Army ID
            </Text>
            <Text
              className="text-base font-semibold"
              style={{ color: theme.colors.textPrimary }}
            >
              {editedProfile.serviceId}
            </Text>
          </View>

          {/* Full Name */}
          <View
            className="rounded-lg p-4 mb-4 border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              className="text-sm mb-2"
              style={{ color: theme.colors.textSecondary }}
            >
              Full Name
            </Text>
            {isEditing ? (
              <TextInput
                className="text-base font-semibold"
                style={{ color: theme.colors.textPrimary }}
                value={editedProfile.name}
                onChangeText={(text) =>
                  setEditedProfile({ ...editedProfile, name: text })
                }
              />
            ) : (
              <Text
                className="text-base font-semibold"
                style={{ color: theme.colors.textPrimary }}
              >
                {editedProfile.name}
              </Text>
            )}
          </View>

          {/* Rank */}
          <View
            className="rounded-lg p-4 mb-4 border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              className="text-sm mb-2"
              style={{ color: theme.colors.textSecondary }}
            >
              Rank
            </Text>
            {isEditing ? (
              <TextInput
                className="text-base font-semibold"
                style={{ color: theme.colors.textPrimary }}
                value={editedProfile.rank}
                onChangeText={(text) =>
                  setEditedProfile({ ...editedProfile, rank: text })
                }
              />
            ) : (
              <Text
                className="text-base font-semibold"
                style={{ color: theme.colors.textPrimary }}
              >
                {editedProfile.rank}
              </Text>
            )}
          </View>

          {/* Unit */}
          <View
            className="rounded-lg p-4 mb-4 border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              className="text-sm mb-2"
              style={{ color: theme.colors.textSecondary }}
            >
              Unit
            </Text>
            {isEditing ? (
              <TextInput
                className="text-base font-semibold"
                style={{ color: theme.colors.textPrimary }}
                value={editedProfile.unit}
                onChangeText={(text) =>
                  setEditedProfile({ ...editedProfile, unit: text })
                }
              />
            ) : (
              <Text
                className="text-base font-semibold"
                style={{ color: theme.colors.textPrimary }}
              >
                {editedProfile.unit}
              </Text>
            )}
          </View>

          {/* Phone Number */}
          <View
            className="rounded-lg p-4 mb-4 border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              className="text-sm mb-1"
              style={{ color: theme.colors.textSecondary }}
            >
              Phone Number
            </Text>
            <Text
              className="text-base font-semibold"
              style={{ color: theme.colors.textPrimary }}
            >
              {editedProfile.phone}
            </Text>
          </View>

          {isEditing && (
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-4 rounded-lg border"
                style={{
                  backgroundColor: "transparent",
                  borderColor: theme.colors.border,
                }}
                onPress={handleCancel}
              >
                <Text
                  className="text-center font-semibold"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-4 rounded-lg"
                style={{ backgroundColor: theme.colors.accent }}
                onPress={handleSave}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
