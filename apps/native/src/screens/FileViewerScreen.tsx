import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useScreenshotProtection } from "../services/security/ScreenshotProtection";
import { useTheme } from "../contexts/ThemeContext";

export const FileViewerScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { fileType = "pdf", fileName = "Document.pdf" } = route.params || {};

  useScreenshotProtection(true);

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
    >
      {/* Header */}
      <View
        className="px-4 pt-12 pb-4 flex-row items-center"
        style={{ backgroundColor: theme.colors.secondaryBg }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="close" size={28} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text
            className="font-semibold"
            style={{ color: theme.colors.textPrimary }}
          >
            {fileName}
          </Text>
          <Text
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            {fileType.toUpperCase()} • Protected
          </Text>
        </View>
      </View>

      {/* File Content with Watermark */}
      <ScrollView className="flex-1 relative">
        <View className="p-6 items-center justify-center min-h-full">
          <Ionicons
            name={
              fileType === "pdf"
                ? "document-text"
                : fileType === "image"
                  ? "image"
                  : "videocam"
            }
            size={64}
            color={theme.colors.textSecondary}
          />
          <Text
            className="text-center mt-4"
            style={{ color: theme.colors.textSecondary }}
          >
            {fileType === "pdf" && "PDF Document Viewer"}
            {fileType === "image" && "Image Viewer"}
            {fileType === "video" && "Video Player"}
          </Text>
          <Text
            className="text-sm mt-4 text-center"
            style={{ color: theme.colors.textSecondary }}
          >
            File content displayed here
          </Text>
        </View>

        {/* Diagonal Watermark */}
        <View className="absolute inset-0 items-center justify-center pointer-events-none">
          <View style={{ transform: [{ rotate: "-45deg" }] }}>
            <Text
              className="text-4xl font-bold opacity-10"
              style={{ color: theme.colors.textSecondary }}
            >
              CONFIDENTIAL
            </Text>
            <Text
              className="text-sm text-center mt-2 opacity-10"
              style={{ color: theme.colors.textSecondary }}
            >
              officer001 • {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Security Notice */}
      <View
        className="px-4 py-3"
        style={{ backgroundColor: theme.colors.secondaryBg }}
      >
        <View className="flex-row items-center justify-center">
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={theme.colors.accent}
          />
          <Text
            className="text-xs ml-2"
            style={{ color: theme.colors.textSecondary }}
          >
            Screenshots disabled • Content watermarked for security
          </Text>
        </View>
      </View>
    </View>
  );
};
