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

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [armyId, setArmyId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [showSeedInput, setShowSeedInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!armyId || !phoneNumber) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!showSeedInput) {
      setShowSeedInput(true);
      return;
    }

    if (!seedPhrase.trim()) {
      Alert.alert("Error", "Please enter your seed phrase");
      return;
    }

    setIsLoading(true);

    try {
      // Send OTP
      await ApiService.login(armyId, phoneNumber);

      // Navigate to OTP verification
      navigation.navigate("OTPVerification", {
        armyId,
        phoneNumber,
        seedPhrase: seedPhrase.trim(),
        isRegistration: false,
      });
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error.response?.data?.message ||
          "Failed to send OTP. Please check your credentials.",
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
      <View className="px-6 pt-20">
        <View className="items-center mb-12">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: theme.colors.accent }}
          >
            <Ionicons name="shield-checkmark" size={48} color="#FFFFFF" />
          </View>

          <Text
            className="text-4xl font-bold mb-2"
            style={{ color: theme.colors.textPrimary }}
          >
            Defense Secure
          </Text>
          <Text
            className="text-lg"
            style={{ color: theme.colors.textSecondary }}
          >
            Military Grade Communication
          </Text>
        </View>
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

        {/* Phone Number */}
        <View className="mb-4">
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

        {/* Seed Phrase (Shown after first continue) */}
        {showSeedInput && (
          <View className="mb-4">
            <Text
              className="mb-2 font-medium"
              style={{ color: theme.colors.textSecondary }}
            >
              Seed Phrase (12 words)
            </Text>
            <View
              className="px-4 py-4 rounded-xl border"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.border,
              }}
            >
              <TextInput
                className="min-h-[100px]"
                style={{ color: theme.colors.textPrimary }}
                placeholder="Enter your 12-word seed phrase"
                placeholderTextColor={theme.colors.textSecondary}
                value={seedPhrase}
                onChangeText={setSeedPhrase}
                multiline
                autoCapitalize="none"
              />
            </View>
          </View>
        )}

        {/* Login Button */}
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
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              {showSeedInput ? "Continue" : "Next"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <View className="flex-row justify-center items-center">
          <Text style={{ color: theme.colors.textSecondary }}>
            Don't have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text className="font-bold" style={{ color: theme.colors.accent }}>
              Register
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Security Note */}
      <View className="absolute bottom-8 left-0 right-0 px-6">
        <View
          className="p-4 rounded-xl flex-row items-start"
          style={{ backgroundColor: theme.colors.cardBg }}
        >
          <Ionicons name="lock-closed" size={20} color={theme.colors.accent} />
          <Text
            className="flex-1 ml-3 text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            All communications are end-to-end encrypted using military-grade
            encryption.
          </Text>
        </View>
      </View>
    </View>
  );
};
