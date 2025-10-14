import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthService } from "../services/auth/AuthService";
import { TEST_USERS } from "../services/mock/MockData";
import { useTheme } from "../contexts/ThemeContext";

interface SeedPhraseScreenProps {
  onSuccess: () => void;
}

export const SeedPhraseScreen: React.FC<SeedPhraseScreenProps> = ({
  onSuccess,
}) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useTheme();
  const { armyId, phone, publicKey, encryptedPrivateKey } = route.params;

  const [seedPhrase, setSeedPhrase] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const wordCount = seedPhrase
    .trim()
    .split(/\s+/)
    .filter((w) => w).length;

  const handleVerifySeedPhrase = async () => {
    const trimmedPhrase = seedPhrase.trim();

    if (!trimmedPhrase) {
      Alert.alert("Error", "Please enter your seed phrase");
      return;
    }

    if (wordCount !== 15) {
      Alert.alert("Error", "Seed phrase must contain exactly 15 words");
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.validateSeedPhrase(
        armyId,
        phone,
        publicKey,
        encryptedPrivateKey,
        trimmedPhrase,
      );

      Alert.alert("Success", "Login successful!", [
        { text: "OK", onPress: onSuccess },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestSeedPhrase = () => {
    setSeedPhrase(TEST_USERS.personnel.seedPhrase);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView className="flex-1 px-6" contentContainerClassName="py-12">
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

        <Text
          className="text-3xl font-bold mb-2"
          style={{ color: theme.colors.textPrimary }}
        >
          Enter Seed Phrase
        </Text>
        <Text
          className="text-lg mb-6"
          style={{ color: theme.colors.textSecondary }}
        >
          Enter your 15-word seed phrase to decrypt your private key
        </Text>

        <View
          className="rounded-xl p-4 mb-6 border"
          style={{
            backgroundColor: isDark
              ? theme.colors.cardBg
              : theme.colors.secondaryBg,
            borderColor: theme.colors.accent,
          }}
        >
          <Text
            className="text-sm font-semibold mb-2"
            style={{ color: theme.colors.accent }}
          >
            🔐 How This Works:
          </Text>
          <Text
            className="text-xs leading-5"
            style={{ color: theme.colors.textSecondary }}
          >
            Your private key is encrypted using:{"\n"}
            1. Your seed phrase (15 words){"\n"}
            2. ArmyID + Phone + PublicKey (SHA256){"\n\n"}
            Without your seed phrase, the private key cannot be decrypted - even
            by the server.
          </Text>
        </View>

        <View className="mb-6">
          <Text
            className="mb-2 font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            Seed Phrase (15 words)
          </Text>
          <View
            className="rounded-xl p-4 border min-h-32"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
            }}
          >
            <TextInput
              className="min-h-24"
              style={{ color: theme.colors.textPrimary }}
              placeholder="Enter your seed phrase (15 words separated by spaces)"
              placeholderTextColor={theme.colors.textSecondary}
              value={seedPhrase}
              onChangeText={setSeedPhrase}
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text
            className="text-xs mt-2"
            style={{ color: theme.colors.textSecondary }}
          >
            {wordCount} / 15 words
          </Text>
        </View>

        <TouchableOpacity
          className="py-4 rounded-xl mb-4"
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
          onPress={handleVerifySeedPhrase}
          disabled={isLoading}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {isLoading ? "Decrypting..." : "Verify & Login"}
          </Text>
        </TouchableOpacity>

        {/* Test Helper */}
        <View
          className="rounded-xl p-4 mt-4 border"
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
              Test Seed Phrase:
            </Text>
            <TouchableOpacity onPress={fillTestSeedPhrase}>
              <Text
                className="text-xs font-semibold"
                style={{ color: theme.colors.accent }}
              >
                Auto Fill →
              </Text>
            </TouchableOpacity>
          </View>
          <Text
            className="text-xs leading-5"
            style={{ color: theme.colors.textPrimary }}
          >
            {TEST_USERS.personnel.seedPhrase}
          </Text>
        </View>

        <View
          className="rounded-xl p-4 mt-6 mb-8 border-2"
          style={{
            backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2",
            borderColor: theme.colors.error,
          }}
        >
          <Text
            className="text-xs font-semibold mb-2"
            style={{ color: theme.colors.error }}
          >
            ⚠️ Security Notice
          </Text>
          <Text className="text-xs" style={{ color: theme.colors.error }}>
            Never share your seed phrase with anyone. Defense Secure will never
            ask for your seed phrase via email or phone.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
