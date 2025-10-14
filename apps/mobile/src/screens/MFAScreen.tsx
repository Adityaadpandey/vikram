import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { MOCK_USERS } from "../services/mock/MockData";
import { SecureStorage } from "../services/security/SecureStorage";

interface MFAScreenProps {
  username: string;
  onVerified: () => void;
}

export const MFAScreen: React.FC<MFAScreenProps> = ({
  username,
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
    const user = Object.values(MOCK_USERS).find((u) => u.username === username);

    if (user && enteredCode === user.mfaCode) {
      await SecureStorage.saveToken("mock_jwt_token_12345");
      onVerified();
    } else {
      Alert.alert("Invalid Code", "Please enter the correct MFA code");
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
        Enter the 6-digit code from your authenticator app
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

      <Text className="text-military-grey text-sm text-center mt-6">
        Mock MFA Code:{" "}
        {MOCK_USERS[username as keyof typeof MOCK_USERS]?.mfaCode || "123456"}
      </Text>
    </View>
  );
};
