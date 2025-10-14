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
import { AuthService, RegistrationData } from "../services/auth/AuthService";
import { CryptoService } from "../services/auth/CryptoService";
import { useTheme } from "../contexts/ThemeContext";

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [armyId, setArmyId] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [rank, setRank] = useState("");
  const [unit, setUnit] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!armyId || !phone || !name || !rank || !unit) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setIsLoading(true);
    try {
      const registrationData: RegistrationData = {
        armyId,
        phone,
        name,
        rank,
        unit,
      };

      const result = await AuthService.register(registrationData);
      setGeneratedOtp(result.otp);
      setStep(2);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSeedPhrase = async () => {
    setIsLoading(true);
    try {
      const phrase = await CryptoService.generateSeedPhrase();
      setSeedPhrase(phrase);
      setStep(3);
    } catch (error: any) {
      Alert.alert("Error", "Failed to generate seed phrase");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndComplete = async () => {
    if (otp !== generatedOtp) {
      Alert.alert("Error", "Invalid OTP");
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.verifyRegistrationOTP(armyId, phone, otp, seedPhrase);
      Alert.alert(
        "Success",
        "Registration complete! Please save your seed phrase securely.",
        [
          {
            text: "OK",
            onPress: () => navigation.replace("Login"),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: User Details */}
        {step === 1 && (
          <>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mb-6 flex-row items-center"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.accent}
              />
              <Text
                className="ml-2 text-base font-medium"
                style={{ color: theme.colors.accent }}
              >
                Back to Login
              </Text>
            </TouchableOpacity>

            <Text
              className="text-3xl font-bold mb-2"
              style={{ color: theme.colors.textPrimary }}
            >
              Create Account
            </Text>
            <Text
              className="text-lg mb-8"
              style={{ color: theme.colors.textSecondary }}
            >
              Register for secure communication
            </Text>

            <View className="space-y-4">
              <View>
                <Text
                  className="mb-2 font-medium"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Army ID *
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

              <View>
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
                    placeholder="Enter your name"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View>
                <Text
                  className="mb-2 font-medium"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Rank *
                </Text>
                <View
                  className="flex-row items-center px-4 py-3 rounded-xl border"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Ionicons
                    name="medal-outline"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                  <TextInput
                    className="flex-1 ml-3"
                    style={{ color: theme.colors.textPrimary }}
                    placeholder="e.g., Captain"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={rank}
                    onChangeText={setRank}
                  />
                </View>
              </View>

              <View>
                <Text
                  className="mb-2 font-medium"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Unit *
                </Text>
                <View
                  className="flex-row items-center px-4 py-3 rounded-xl border"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                  <TextInput
                    className="flex-1 ml-3"
                    style={{ color: theme.colors.textPrimary }}
                    placeholder="e.g., 5th Infantry Division"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={unit}
                    onChangeText={setUnit}
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
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  {isLoading ? "Processing..." : "Send OTP"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <>
            <Text
              className="text-3xl font-bold mb-2"
              style={{ color: theme.colors.textPrimary }}
            >
              Verify OTP
            </Text>
            <Text
              className="text-lg mb-8"
              style={{ color: theme.colors.textSecondary }}
            >
              Enter the 6-digit code sent to {phone}
            </Text>

            <View
              className="px-4 py-3 rounded-xl text-center border"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.border,
              }}
            >
              <TextInput
                className="text-2xl tracking-widest text-center"
                style={{ color: theme.colors.textPrimary }}
                placeholder="000000"
                placeholderTextColor={theme.colors.textSecondary}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View
              className="rounded-xl p-4 mt-4"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.border,
              }}
            >
              <Text
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                📱 Mock OTP: {generatedOtp}
              </Text>
            </View>

            <TouchableOpacity
              className="py-4 rounded-xl mt-6"
              style={{
                backgroundColor:
                  otp.length === 6 ? theme.colors.accent : theme.colors.border,
                shadowColor: theme.colors.accent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
              onPress={handleGenerateSeedPhrase}
              disabled={otp.length !== 6}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Verify & Continue
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 3: Seed Phrase */}
        {step === 3 && (
          <>
            <Text
              className="text-3xl font-bold mb-2"
              style={{ color: theme.colors.textPrimary }}
            >
              Save Your Seed Phrase
            </Text>
            <Text
              className="text-lg mb-4"
              style={{ color: theme.colors.textSecondary }}
            >
              Write down these 15 words in order
            </Text>

            <View
              className="rounded-xl p-4 mb-6 border-2"
              style={{
                backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2",
                borderColor: theme.colors.error,
              }}
            >
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: theme.colors.error }}
              >
                ⚠️ CRITICAL: Save This Securely
              </Text>
              <Text className="text-xs" style={{ color: theme.colors.error }}>
                This seed phrase is the ONLY way to recover your account. Store
                it offline and never share it.
              </Text>
            </View>

            <View
              className="rounded-xl p-4 mb-6"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.border,
              }}
            >
              <Text
                className="text-base leading-7"
                style={{ color: theme.colors.textPrimary }}
              >
                {seedPhrase}
              </Text>
            </View>

            <TouchableOpacity
              className="py-4 rounded-xl"
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
              onPress={handleVerifyAndComplete}
              disabled={isLoading}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {isLoading ? "Completing..." : "I Have Saved It Securely"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
