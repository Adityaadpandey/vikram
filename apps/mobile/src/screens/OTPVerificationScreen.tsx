import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthService } from "../services/auth/AuthService";
import { useTheme } from "../contexts/ThemeContext";

export const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useTheme();
  const { armyId, phone, otp: generatedOtp } = route.params;

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert("Error", "Please enter 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.verifyLoginOTP(armyId, phone, otp);

      navigation.navigate("SeedPhrase", {
        armyId,
        phone,
        publicKey: result.publicKey,
        encryptedPrivateKey: result.encryptedPrivateKey,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      className="flex-1 justify-center px-6"
      style={{ backgroundColor: theme.colors.primaryBg }}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="mb-6 flex-row items-center"
      >
        <Ionicons name="arrow-back" size={24} color={theme.colors.accent} />
        <Text
          className="ml-2 text-base font-medium"
          style={{ color: theme.colors.accent }}
        >
          Back
        </Text>
      </TouchableOpacity>

      <View className="items-center mb-8">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={
            {
              // backgroundColor: theme.colors.accent,
              // shadowColor: theme.colors.accent,
              // shadowOffset: { width: 0, height: 8 },
              // shadowOpacity: 0.3,
              // shadowRadius: 16,
              // elevation: 10,
            }
          }
        >
          {/* <Ionicons name="shield-checkmark" size={40} color="#FFFFFF" /> */}
          <Image
            source={require("../../assets/icon.png")}
            className="w-25 h-24 mr-2"
            resizeMode="contain"
          />
        </View>
      </View>

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
        className="px-4 py-4 rounded-xl mb-4 border"
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
          autoFocus
        />
      </View>

      <View
        className="rounded-xl p-4 mb-6"
        style={{
          backgroundColor: theme.colors.cardBg,
          borderColor: theme.colors.border,
        }}
      >
        <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>
          📱 Mock OTP: {generatedOtp}
        </Text>
      </View>

      <TouchableOpacity
        className="py-4 rounded-xl"
        style={{
          backgroundColor:
            otp.length === 6 && !isLoading
              ? theme.colors.accent
              : theme.colors.border,
          shadowColor: theme.colors.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
        onPress={handleVerify}
        disabled={otp.length !== 6 || isLoading}
      >
        <Text className="text-white text-center font-semibold text-lg">
          {isLoading ? "Verifying..." : "Verify OTP"}
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-center justify-center mt-6">
        <Ionicons name="lock-closed" size={14} color={theme.colors.accent} />
        <Text
          className="text-sm ml-2"
          style={{ color: theme.colors.textSecondary }}
        >
          Secure OTP verification
        </Text>
      </View>
    </View>
  );
};
