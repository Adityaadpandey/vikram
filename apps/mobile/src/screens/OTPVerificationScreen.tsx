import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { ApiService } from "../services/api/ApiService";
import { SecureStorage } from "../services/security/SecureStorage";

export const OTPVerificationScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { armyId, name, designation, phoneNumber, isRegistration, seedPhrase } =
    route.params;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      Alert.alert("Error", "Please enter the complete OTP");
      return;
    }

    setIsLoading(true);

    try {
      if (isRegistration) {
        // Registration flow
        const response = await ApiService.verifyRegistrationOTP(
          armyId,
          phoneNumber,
          otpString,
          name,
          designation,
        );

        Alert.alert(
          "Registration Successful",
          "Please save your seed phrase securely. You will need it to access your account.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate("SeedPhrase", {
                  seedPhrase: response.seedPhrase,
                  publicKey: response.publicKey,
                  userId: response.userId,
                });
              },
            },
          ],
        );
      } else {
        // Login flow
        const response = await ApiService.verifyLoginOTP(
          armyId,
          phoneNumber,
          otpString,
          seedPhrase,
        );

        // Store session token and keys
        await SecureStorage.setToken(response.sessionToken);
        await SecureStorage.setItem("userId", response.user.id);
        await SecureStorage.setItem("publicKey", response.keys.publicKey);
        await SecureStorage.setItem("privateKey", response.keys.privateKey);
        await SecureStorage.setItem("armyId", response.user.armyId);
        await SecureStorage.setItem("userName", response.user.name);
        await SecureStorage.setItem(
          "userDesignation",
          response.user.designation,
        );

        Alert.alert("Login Successful", "Welcome back!", [
          {
            text: "OK",
            onPress: () => {
              // Navigation will be handled by AppNavigator based on token
              navigation.reset({
                index: 0,
                routes: [{ name: "Main" }],
              });
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        "Verification Failed",
        error.response?.data?.message || "Invalid OTP. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      if (isRegistration) {
        await ApiService.register(armyId, phoneNumber);
      } else {
        await ApiService.login(armyId, phoneNumber);
      }
      Alert.alert("Success", "OTP resent successfully");
    } catch (error: any) {
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
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

        <View className="items-center mb-12">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: theme.colors.accent }}
          >
            <Ionicons name="shield-checkmark" size={48} color="#FFFFFF" />
          </View>

          <Text
            className="text-3xl font-bold mb-2"
            style={{ color: theme.colors.textPrimary }}
          >
            Verify OTP
          </Text>
          <Text
            className="text-center text-base"
            style={{ color: theme.colors.textSecondary }}
          >
            Enter the 6-digit code sent to{"\n"}
            <Text className="font-semibold">{phoneNumber}</Text>
          </Text>
        </View>
      </View>

      {/* OTP Input */}
      <View className="px-6">
        <View className="flex-row justify-between mb-8">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              className="w-14 h-16 text-center text-2xl font-bold rounded-xl"
              style={{
                backgroundColor: theme.colors.cardBg,
                color: theme.colors.textPrimary,
                borderWidth: 2,
                borderColor: digit ? theme.colors.accent : theme.colors.border,
              }}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
            />
          ))}
        </View>

        {/* Verify Button */}
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
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Verify OTP
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend OTP */}
        <View className="flex-row justify-center items-center">
          <Text style={{ color: theme.colors.textSecondary }}>
            Didn't receive the code?{" "}
          </Text>
          <TouchableOpacity onPress={handleResendOTP}>
            <Text className="font-bold" style={{ color: theme.colors.accent }}>
              Resend
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
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={theme.colors.accent}
          />
          <Text
            className="flex-1 ml-3 text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            This is a secure military communication channel. Never share your
            OTP with anyone.
          </Text>
        </View>
      </View>
    </View>
  );
};
