import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";

export const AboutScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
    >
      {/* Header */}
      <View
        className="px-6 pt-12 pb-6"
        style={{ backgroundColor: theme.colors.secondaryBg }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <Text
            className="text-2xl font-bold"
            style={{ color: theme.colors.textPrimary }}
          >
            About
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-8">
        {/* App Logo */}
        <View className="items-center mb-8">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-4 overflow-hidden"
            style={{
              backgroundColor: theme.colors.accent,
              shadowColor: theme.colors.accent,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            <Image
              source={require("../../../assets/icon.png")}
              className="w-20 h-20"
              resizeMode="contain"
            />
          </View>
          <Text
            className="text-2xl font-bold"
            style={{ color: theme.colors.textPrimary }}
          >
            Ghost Line
          </Text>
          <Text className="mt-2" style={{ color: theme.colors.textSecondary }}>
            Version 1.0.0 (Build 100)
          </Text>
        </View>

        {/* Description */}
        <View
          className="rounded-lg p-6 mb-4 border"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            className="text-center leading-6"
            style={{ color: theme.colors.textSecondary }}
          >
            A highly secure communication platform designed exclusively for
            defense personnel, veterans, and their families. Built with
            military-grade encryption and advanced security protocols to ensure
            complete privacy and data protection.
          </Text>
        </View>

        {/* Key Features */}
        <View
          className="rounded-lg p-6 mb-4 border"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            className="font-bold text-lg mb-4"
            style={{ color: theme.colors.textPrimary }}
          >
            Security Features
          </Text>

          {[
            "End-to-end encryption (AES-256)",
            "Biometric authentication",
            "Screenshot & screen recording prevention",
            "Auto-lock & session management",
            "Seed phrase backup system",
            "No cloud storage - server-based only",
            "Emergency data wipe capability",
            "Copy/paste protection in chats",
          ].map((feature, index) => (
            <View key={index} className="flex-row items-start mb-3">
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={theme.colors.accent}
              />
              <Text
                className="flex-1 ml-3"
                style={{ color: theme.colors.textSecondary }}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Developer Info */}
        <View
          className="rounded-lg p-6 mb-4 border"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            className="font-bold text-lg mb-3"
            style={{ color: theme.colors.textPrimary }}
          >
            Developed By
          </Text>
          <Text className="mb-2" style={{ color: theme.colors.textSecondary }}>
            ABCD
          </Text>
          <Text
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            In collaboration with Ministry of Defense, India
          </Text>
        </View>

        {/* Legal Links */}
        <Text
          className="text-sm font-bold mb-3"
          style={{ color: theme.colors.textSecondary }}
        >
          LEGAL
        </Text>

        <TouchableOpacity
          className="rounded-lg p-4 mb-2 border"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
          }}
          onPress={() => {}}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text
                className="text-base font-semibold"
                style={{ color: theme.colors.textPrimary }}
              >
                Terms of Service
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                Read our terms and conditions
              </Text>
            </View>
            <Ionicons
              name="document-text-outline"
              size={24}
              color={theme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="rounded-lg p-4 mb-2 border"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
          }}
          onPress={() => {}}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text
                className="text-base font-semibold"
                style={{ color: theme.colors.textPrimary }}
              >
                Privacy Policy
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                How we protect your data
              </Text>
            </View>
            <Ionicons
              name="shield-outline"
              size={24}
              color={theme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="rounded-lg p-4 mb-4 border"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
          }}
          onPress={() => {}}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text
                className="text-base font-semibold"
                style={{ color: theme.colors.textPrimary }}
              >
                Open Source Licenses
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                Third-party libraries and attributions
              </Text>
            </View>
            <Ionicons
              name="code-slash-outline"
              size={24}
              color={theme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Support */}
        <View
          className="rounded-lg p-6 mt-2 mb-6 border"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            className="font-bold text-lg mb-3"
            style={{ color: theme.colors.textPrimary }}
          >
            Support
          </Text>
          <View className="flex-row items-center mb-2">
            <Ionicons name="mail" size={20} color={theme.colors.accent} />
            <Text
              className="ml-3"
              style={{ color: theme.colors.textSecondary }}
            >
              support@defensesecure.gov.in
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="call" size={20} color={theme.colors.accent} />
            <Text
              className="ml-3"
              style={{ color: theme.colors.textSecondary }}
            >
              1800-XXX-XXXX (Toll Free)
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text
          className="text-center text-xs mt-4 mb-8"
          style={{ color: theme.colors.textSecondary }}
        >
          © 2025 Defense Secure. All rights reserved.{"\n"}
          Made in India 🇮🇳
        </Text>
      </ScrollView>
    </View>
  );
};
