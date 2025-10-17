import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  onPress: () => void;
  badge?: number;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  name,
  size = 24,
  color = "#ffffff",
  onPress,
  badge,
  className = "",
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`relative ${className}`}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name={name} size={size} color={color} />
      {badge !== undefined && badge > 0 && (
        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
          <Text className="text-white text-xs font-bold">
            {badge > 99 ? "99+" : badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
