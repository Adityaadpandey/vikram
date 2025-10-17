import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeMode } from "../../contexts/ThemeContext";

export const ThemeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, themeMode, setThemeMode, isDark } = useTheme();

  const themes: {
    mode: ThemeMode;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    description: string;
  }[] = [
    {
      mode: "system",
      label: "System Default",
      icon: "phone-portrait-outline",
      description: "Follow system settings",
    },
    {
      mode: "dark",
      label: "Dark Mode",
      icon: "moon",
      description: "Deep navy with cyber green accents",
    },
    {
      mode: "light",
      label: "Light Mode",
      icon: "sunny",
      description: "Soft white with teal green accents",
    },
  ];

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
    >
      {/* Header */}
      <View
        className="px-4 pt-12 pb-4 shadow-lg"
        style={{ backgroundColor: theme.colors.secondaryBg }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <View className="flex-1">
            <Text
              className="text-xl font-bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Theme
            </Text>
            <Text
              className="text-sm mt-1"
              style={{ color: theme.colors.textSecondary }}
            >
              Customize your appearance
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Theme Options */}
        {themes.map((item) => (
          <TouchableOpacity
            key={item.mode}
            className="rounded-xl p-4 mb-4 border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor:
                themeMode === item.mode
                  ? theme.colors.accent
                  : theme.colors.border,
              borderWidth: themeMode === item.mode ? 2 : 1,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={() => setThemeMode(item.mode)}
          >
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{
                  backgroundColor: isDark
                    ? theme.colors.secondaryBg
                    : theme.colors.secondaryBg,
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={
                    themeMode === item.mode
                      ? theme.colors.accent
                      : theme.colors.textSecondary
                  }
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-base font-semibold"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {item.label}
                </Text>
                <Text
                  className="text-sm mt-1"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {item.description}
                </Text>
              </View>
              {themeMode === item.mode && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.accent}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Preview Section */}
        <View className="mt-6">
          <Text
            className="text-base font-semibold mb-4"
            style={{ color: theme.colors.textPrimary }}
          >
            Preview
          </Text>
          <View
            className="rounded-xl p-6 border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text
              className="text-lg font-bold mb-2"
              style={{ color: theme.colors.textPrimary }}
            >
              Sample Message
            </Text>
            <Text
              className="text-sm mb-4"
              style={{ color: theme.colors.textSecondary }}
            >
              This is how your messages will appear in the app
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg mr-2"
                style={{ backgroundColor: theme.colors.accent }}
              >
                <Text className="text-white text-center font-semibold">
                  Accent Button
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg ml-2 border"
                style={{
                  backgroundColor: "transparent",
                  borderColor: theme.colors.accent,
                }}
              >
                <Text
                  className="text-center font-semibold"
                  style={{ color: theme.colors.accent }}
                >
                  Outlined
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
