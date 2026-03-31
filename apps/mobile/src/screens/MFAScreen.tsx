import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { AuthService } from "../services/auth/AuthService";

interface MFAScreenProps {
  username: string;
  phoneNumber: string;
  onVerified: () => void;
}

export const MFAScreen: React.FC<MFAScreenProps> = ({
  username,
  phoneNumber,
  onVerified,
}) => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const enteredCode = code.join("");

    try {
      // Use real OTP verification via backend
      const seedPhrase = ""; // User will enter seed phrase separately
      await AuthService.verifyLoginOTP(
        username,
        phoneNumber,
        enteredCode,
        seedPhrase,
      );
      onVerified();
    } catch (error: any) {
      Alert.alert(
        "Verification Failed",
        error.message || "Invalid OTP. Please try again.",
      );
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <View className="flex-1 bg-military-dark justify-center px-6">
      <Text className="text-white text-3xl font-bold mb-2">
        Two-Factor Authentication
      </Text>
      <Text className="text-military-lightGrey text-lg mb-8">
        Enter the 6-digit code sent to your phone
      </Text>

      <View className="flex-row justify-between mb-8">
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            className="bg-military-blue text-white text-center text-2xl font-bold w-12 h-14 rounded-lg border-2 border-military-grey"
            value={digit}
            onChangeText={(value) => handleCodeChange(value, index)}
            keyboardType="number-pad"
            maxLength={1}
          />
        ))}
      </View>

      <TouchableOpacity
        className={`py-4 rounded-lg ${
          code.every((d) => d)
            ? "bg-military-green"
            : "bg-military-grey opacity-50"
        }`}
        onPress={handleVerify}
        disabled={!code.every((d) => d)}
      >
        <Text className="text-white text-center font-semibold text-lg">
          Verify
        </Text>
      </TouchableOpacity>
    </View>
  );
};
