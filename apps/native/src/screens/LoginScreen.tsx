import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthService } from "../services/auth/AuthService";
import { TEST_USERS } from "../services/mock/MockData";
import { useTheme } from "../contexts/ThemeContext";

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [armyId, setArmyId] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!armyId || !phone) {
      Alert.alert("Error", "Please enter Army ID and Phone Number");
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.login({ armyId, phone });

      navigation.navigate("OTPVerification", {
        armyId,
        phone,
        otp: result.otp,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestUser = () => {
    setArmyId(TEST_USERS.personnel.armyId);
    setPhone(TEST_USERS.personnel.phone);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Icon */}
        <View className="items-center mb-12">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={
              {
                // backgroundColor: theme.colors.accent,
                // shadowColor: theme.colors.accent,
                // shadowOffset: { width: 0, height: 8 },
                // shadowOpacity: isDark ? 0.5 : 0.3,
                // shadowRadius: 16,
                // elevation: 10,
              }
            }
          >
            {/* <Ionicons name="shield-checkmark" size={48} color="#FFFFFF" /> */}
            <Image
              source={require("../../assets/icon.png")}
              className="w-24 h-24 mr-2"
              resizeMode="contain"
            />
          </View>
          <Text
            className="text-4xl font-bold mb-2"
            style={{ color: theme.colors.textPrimary }}
          >
            Ghost Line
          </Text>
          <Text
            className="text-lg text-center"
            style={{ color: theme.colors.textSecondary }}
          >
            Encrypted Communication Platform
          </Text>
        </View>

        {/* Input Fields */}
        <View className="space-y-4">
          <View>
            <Text
              className="mb-2 font-medium"
              style={{ color: theme.colors.textSecondary }}
            >
              Army ID
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
                placeholder="Enter Army ID"
                placeholderTextColor={theme.colors.textSecondary}
                value={armyId}
                onChangeText={setArmyId}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View>
            <Text
              className="mb-2 font-medium"
              style={{ color: theme.colors.textSecondary }}
            >
              Phone Number
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

          <TouchableOpacity
            className="py-4 rounded-xl mt-6"
            style={{
              backgroundColor: isLoading
                ? theme.colors.border
                : theme.colors.accent,
              shadowColor: theme.colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? "Checking..." : "Send OTP"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-4"
            onPress={() => navigation.navigate("Register")}
          >
            <Text
              className="text-center font-medium"
              style={{ color: theme.colors.accent }}
            >
              New User? Register Here
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-center mt-4">
            <Ionicons
              name="lock-closed"
              size={14}
              color={theme.colors.accent}
            />
            <Text
              className="text-sm ml-2"
              style={{ color: theme.colors.textSecondary }}
            >
              End-to-end encrypted with seed phrase security
            </Text>
          </View>
        </View>

        {/* Test Credentials Helper */}
        <View
          className="mt-8 p-4 rounded-xl border"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
          }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text
              className="text-xs"
              style={{ color: theme.colors.textSecondary }}
            >
              Test Credentials:
            </Text>
            <TouchableOpacity onPress={fillTestUser}>
              <Text
                className="text-xs font-semibold"
                style={{ color: theme.colors.accent }}
              >
                Auto Fill →
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-xs" style={{ color: theme.colors.textPrimary }}>
            Army ID: {TEST_USERS.personnel.armyId}
          </Text>
          <Text className="text-xs" style={{ color: theme.colors.textPrimary }}>
            Phone: {TEST_USERS.personnel.phone}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
