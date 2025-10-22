import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { ApiService } from "../services/api/ApiService";

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [armyId, setArmyId] = useState("");
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!armyId || !name || !designation || !phoneNumber) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+91[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert(
        "Error",
        "Please enter a valid phone number (format: +919876543210)",
      );
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Send OTP
      await ApiService.register(armyId, phoneNumber);

      // Navigate to OTP screen
      navigation.navigate("OTPVerification", {
        armyId,
        name,
        designation,
        phoneNumber,
        isRegistration: true,
      });
    } catch (error: any) {
      Alert.alert(
        "Registration Failed",
        error.response?.data?.message ||
          "Failed to send OTP. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
    >
      {/* Header */}
      <View className="px-6 pt-16">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-8">
          <Ionicons
            name="arrow-back"
            size={28}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>

        <Text
          className="text-4xl font-bold mb-2"
          style={{ color: theme.colors.textPrimary }}
        >
          Register
        </Text>
        <Text
          className="text-lg mb-8"
          style={{ color: theme.colors.textSecondary }}
        >
          Create your secure account
        </Text>
      </View>

      {/* Form */}
      <View className="px-6">
        {/* Army ID */}
        <View className="mb-4">
          <Text
            className="mb-2 font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            Army ID / Service Number
          </Text>
          <View
            className="flex-row items-center px-4 py-4 rounded-xl border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={theme.colors.accent}
            />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: theme.colors.textPrimary }}
              placeholder="A12345"
              placeholderTextColor={theme.colors.textSecondary}
              value={armyId}
              onChangeText={setArmyId}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Full Name */}
        <View className="mb-4">
          <Text
            className="mb-2 font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            Full Name
          </Text>
          <View
            className="flex-row items-center px-4 py-4 rounded-xl border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons name="person" size={20} color={theme.colors.accent} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: theme.colors.textPrimary }}
              placeholder="John Doe"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* Designation */}
        <View className="mb-4">
          <Text
            className="mb-2 font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            Rank / Designation
          </Text>
          <View
            className="flex-row items-center px-4 py-4 rounded-xl border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons name="star" size={20} color={theme.colors.accent} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: theme.colors.textPrimary }}
              placeholder="Captain"
              placeholderTextColor={theme.colors.textSecondary}
              value={designation}
              onChangeText={setDesignation}
            />
          </View>
        </View>

        {/* Phone Number */}
        <View className="mb-6">
          <Text
            className="mb-2 font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            Phone Number
          </Text>
          <View
            className="flex-row items-center px-4 py-4 rounded-xl border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons name="call" size={20} color={theme.colors.accent} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: theme.colors.textPrimary }}
              placeholder="+919876543210"
              placeholderTextColor={theme.colors.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Register Button */}
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
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Continue
            </Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View className="flex-row justify-center items-center">
          <Text style={{ color: theme.colors.textSecondary }}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text className="font-bold" style={{ color: theme.colors.accent }}>
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
