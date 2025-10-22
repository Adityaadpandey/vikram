import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { SecureStorage } from "../services/security/SecureStorage";
import { useTheme } from "../contexts/ThemeContext";
import { useUser } from "../contexts/UserContext";
import { useNavigation } from "@react-navigation/native";

interface DrawerItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

export const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (
  props,
) => {
  const { theme, isDark } = useTheme();
  const { profile } = useUser();
  const navigation = useNavigation<any>();

  const drawerItems: DrawerItem[] = [
    { label: "Profile", icon: "person-outline", route: "Profile" },
    {
      label: "Starred Messages",
      icon: "star-outline",
      route: "StarredMessages",
    },
    { label: "Theme", icon: "color-palette-outline", route: "Theme" },
    { label: "Security", icon: "shield-checkmark-outline", route: "Security" },
    { label: "Settings", icon: "settings-outline", route: "Settings" },
    { label: "About", icon: "information-circle-outline", route: "About" },
  ];

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout? All local data will be cleared.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all secure storage
              await SecureStorage.clearAll();

              // Clear AsyncStorage
              const AsyncStorage =
                require("@react-native-async-storage/async-storage").default;
              await AsyncStorage.clear();

              Alert.alert(
                "Logged Out",
                "You have been successfully logged out",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      // Navigation will automatically redirect to login
                      // because authentication state is cleared
                      navigation.reset({
                        index: 0,
                        routes: [{ name: "Login" }],
                      });
                    },
                  },
                ],
              );
            } catch (error) {
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ],
    );
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
    >
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        {/* Header */}
        <View
          className="px-6 pt-16 pb-6"
          style={{ backgroundColor: theme.colors.secondaryBg }}
        >
          {/* Profile Picture */}
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{
              backgroundColor: profile.profileImage
                ? "transparent"
                : theme.colors.accent,
              shadowColor: theme.colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {profile.profileImage ? (
              <Image
                source={{ uri: profile.profileImage }}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <Ionicons name="person" size={40} color="#FFFFFF" />
            )}
          </View>

          <Text
            className="text-xl font-bold"
            style={{ color: theme.colors.textPrimary }}
          >
            {profile.name}
          </Text>
          <Text
            className="text-sm mt-1"
            style={{ color: theme.colors.textSecondary }}
          >
            {profile.unit} • {profile.rank}
          </Text>

          <View className="flex-row mt-3">
            <View
              className="px-3 py-1 rounded-full flex-row items-center"
              style={{
                backgroundColor: isDark
                  ? theme.colors.cardBg
                  : theme.colors.secondaryBg,
              }}
            >
              <View
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: theme.colors.success }}
              />
              <Text
                className="text-xs font-semibold"
                style={{ color: theme.colors.success }}
              >
                Online
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-2 py-4">
          {drawerItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="flex-row items-center py-4 px-4 rounded-lg mb-1"
              style={{
                backgroundColor: "transparent",
              }}
              onPress={() => props.navigation.navigate(item.route)}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={theme.colors.textPrimary}
              />
              <Text
                className="flex-1 text-base font-medium ml-4"
                style={{ color: theme.colors.textPrimary }}
              >
                {item.label}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        <View
          className="h-px mx-4 my-2"
          style={{ backgroundColor: theme.colors.border }}
        />

        {/* Logout */}
        <TouchableOpacity
          className="flex-row items-center py-4 px-6 mx-2 rounded-lg"
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color={theme.colors.error}
          />
          <Text
            className="text-base font-medium ml-4"
            style={{ color: theme.colors.error }}
          >
            Logout
          </Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* Footer with App Icon */}
      <View
        className="border-t px-6 py-4"
        style={{ borderTopColor: theme.colors.border }}
      >
        <View className="flex-row items-center justify-center mb-2">
          <Image
            source={require("../../assets/app-icon.png")}
            className="w-6 h-6 mr-2"
            resizeMode="contain"
          />
          <Text
            className="text-xs font-semibold"
            style={{ color: theme.colors.textPrimary }}
          >
            Vikram
          </Text>
        </View>
        <Text
          className="text-xs text-center"
          style={{ color: theme.colors.textSecondary }}
        >
          Version 1.0.0 • Encrypted
        </Text>
      </View>
    </View>
  );
};
