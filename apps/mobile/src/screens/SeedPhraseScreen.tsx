import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { SecureStorage } from "../services/security/SecureStorage";
import * as Clipboard from "expo-clipboard";

export const SeedPhraseScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { seedPhrase, publicKey, userId } = route.params;
  const [confirmed, setConfirmed] = useState(false);

  const words = seedPhrase.split(" ");

  const handleCopy = async () => {
    await Clipboard.setStringAsync(seedPhrase);
    Alert.alert("Copied", "Seed phrase copied to clipboard");
  };

  const handleContinue = async () => {
    if (!confirmed) {
      Alert.alert(
        "Confirmation Required",
        "Please confirm that you have saved your seed phrase",
        [{ text: "OK" }],
      );
      return;
    }

    try {
      // Store initial data
      await SecureStorage.setItem("userId", userId);
      await SecureStorage.setItem("publicKey", publicKey);
      await SecureStorage.setItem("seedPhrase", seedPhrase);

      Alert.alert(
        "Account Created",
        "Your account has been created successfully. Please login to continue.",
        [
          {
            text: "Login",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save account information");
    }
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <View className="items-center mb-8">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: theme.colors.warning }}
          >
            <Ionicons name="key" size={48} color="#FFFFFF" />
          </View>

          <Text
            className="text-3xl font-bold mb-2 text-center"
            style={{ color: theme.colors.textPrimary }}
          >
            Save Your Seed Phrase
          </Text>
          <Text
            className="text-center text-base"
            style={{ color: theme.colors.textSecondary }}
          >
            Write down these 12 words in order and keep them safe
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Warning */}
        <View
          className="p-4 rounded-xl mb-6"
          style={{
            backgroundColor: theme.colors.error + "20",
            borderWidth: 2,
            borderColor: theme.colors.error,
          }}
        >
          <View className="flex-row items-center mb-2">
            <Ionicons name="warning" size={24} color={theme.colors.error} />
            <Text
              className="ml-3 font-bold text-lg"
              style={{ color: theme.colors.error }}
            >
              Important Warning
            </Text>
          </View>
          <Text
            className="text-sm leading-5"
            style={{ color: theme.colors.textPrimary }}
          >
            • This phrase is the ONLY way to recover your account{"\n"}• Never
            share it with anyone{"\n"}• Store it in a secure location{"\n"}• You
            cannot reset or recover this phrase
          </Text>
        </View>

        {/* Seed Phrase Grid */}
        <View
          className="p-4 rounded-xl mb-6"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderWidth: 2,
            borderColor: theme.colors.accent,
          }}
        >
          <View className="flex-row flex-wrap">
            {words.map((word: string, index: number) => (
              <View key={index} className="w-1/2 p-2">
                <View
                  className="flex-row items-center p-3 rounded-lg"
                  style={{ backgroundColor: theme.colors.secondaryBg }}
                >
                  <Text
                    className="w-8 font-bold"
                    style={{ color: theme.colors.accent }}
                  >
                    {index + 1}.
                  </Text>
                  <Text
                    className="flex-1 font-mono font-semibold"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {word}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Copy Button */}
        <TouchableOpacity
          className="py-4 rounded-xl mb-4 flex-row items-center justify-center"
          style={{
            backgroundColor: theme.colors.secondaryBg,
            borderWidth: 2,
            borderColor: theme.colors.accent,
          }}
          onPress={handleCopy}
        >
          <Ionicons name="copy-outline" size={24} color={theme.colors.accent} />
          <Text
            className="ml-2 font-semibold text-lg"
            style={{ color: theme.colors.accent }}
          >
            Copy to Clipboard
          </Text>
        </TouchableOpacity>

        {/* Confirmation */}
        <TouchableOpacity
          className="flex-row items-center p-4 rounded-xl mb-6"
          style={{ backgroundColor: theme.colors.cardBg }}
          onPress={() => setConfirmed(!confirmed)}
        >
          <View
            className="w-6 h-6 rounded border-2 items-center justify-center mr-3"
            style={{
              borderColor: confirmed
                ? theme.colors.accent
                : theme.colors.border,
              backgroundColor: confirmed ? theme.colors.accent : "transparent",
            }}
          >
            {confirmed && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>
          <Text className="flex-1" style={{ color: theme.colors.textPrimary }}>
            I have saved my seed phrase in a secure location
          </Text>
        </TouchableOpacity>

        {/* Continue Button */}
        <TouchableOpacity
          className="py-4 rounded-xl mb-8"
          style={{
            backgroundColor: confirmed
              ? theme.colors.accent
              : theme.colors.border,
            shadowColor: confirmed ? theme.colors.accent : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: confirmed ? 5 : 0,
          }}
          onPress={handleContinue}
          disabled={!confirmed}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Continue
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
