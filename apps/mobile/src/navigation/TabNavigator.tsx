import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChatsListScreen } from "../screens/tabs/ChatsListScreen";
import { CallsListScreen } from "../screens/tabs/CallsListScreen";
import { NotificationsScreen } from "../screens/tabs/NotificationsScreen";
import { useTheme } from "../contexts/ThemeContext";

const Tab = createBottomTabNavigator();

interface CustomTabBarButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  accessibilityState?: { selected: boolean };
}

const CustomTabBarButton: React.FC<CustomTabBarButtonProps> = ({
  children,
  onPress,
  accessibilityState,
}) => {
  const { theme, isDark } = useTheme();
  const isSelected = accessibilityState?.selected;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 items-center justify-center"
      style={{
        paddingVertical: 8,
      }}
    >
      <View
        className="items-center justify-center px-6 py-2 rounded-full"
        style={{
          backgroundColor: isSelected
            ? isDark
              ? `${theme.colors.accent}20`
              : `${theme.colors.accent}15`
            : "transparent",
        }}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

export const TabNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.secondaryBg,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 85 : 65,
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
          paddingTop: 10,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarButton: (props) => <CustomTabBarButton {...props} />,
      })}
    >
      <Tab.Screen
        name="Chats"
        component={ChatsListScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="relative">
              <Ionicons
                name={focused ? "chatbubbles" : "chatbubbles-outline"}
                size={24}
                color={color}
              />
              <View
                className="absolute -top-1 -right-2 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1"
                style={{
                  backgroundColor: theme.colors.accent,
                }}
              >
                <Text className="text-white text-[10px] font-bold">3</Text>
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="relative">
              <Ionicons
                name={focused ? "notifications" : "notifications-outline"}
                size={24}
                color={color}
              />
              <View
                className="absolute -top-1 -right-2 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1"
                style={{
                  backgroundColor: theme.colors.accent,
                }}
              >
                <Text className="text-white text-[10px] font-bold">2</Text>
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Calls"
        component={CallsListScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "call" : "call-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
