import { router } from "expo-router";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Container } from "@/components/container";
import { useAuth } from "@/contexts/auth-context";

export default function TabTwo() {
  const { isAuthenticated, user, logout, loading } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.push("/(tabs)");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Container>
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">Loading...</Text>
        </View>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container>
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-gray-500 text-center mb-4">
            You are not logged in.
          </Text>
          <TouchableOpacity
            className="bg-blue-600 px-6 py-3 rounded-xl"
            onPress={() => router.push("/(tabs)")}
          >
            <Text className="text-white font-semibold">Go to Login</Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <ScrollView className="flex-1 p-6 bg-gray-50">
        <View className="py-8">
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            Welcome Back!
          </Text>
          <Text className="text-lg text-gray-600 mb-8">
            Here's your profile information
          </Text>
        </View>

        {/* User Profile Card */}
        <View className="bg-white p-6 rounded-2xl shadow-lg mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4">
              <Text className="text-2xl font-bold text-blue-600">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800">
                {user?.name || "User"}
              </Text>
              <Text className="text-gray-600">
                ID: {user?.user_reg_id || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Details Card */}
        <View className="bg-white p-6 rounded-2xl shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Profile Details
          </Text>

          <View className="space-y-4">
            <View className="border-b border-gray-100 pb-3">
              <Text className="text-gray-600 text-sm font-medium">
                Full Name
              </Text>
              <Text className="text-gray-800 text-lg">
                {user?.name || "Not provided"}
              </Text>
            </View>

            <View className="border-b border-gray-100 pb-3">
              <Text className="text-gray-600 text-sm font-medium">
                Registration ID
              </Text>
              <Text className="text-gray-800 text-lg">
                {user?.user_reg_id || "Not provided"}
              </Text>
            </View>

            <View className="border-b border-gray-100 pb-3">
              <Text className="text-gray-600 text-sm font-medium">Type</Text>
              <Text className="text-gray-800 text-lg">
                {user?.type || "Not provided"}
              </Text>
            </View>

            <View className="pb-3">
              <Text className="text-gray-600 text-sm font-medium">
                Account Status
              </Text>
              <View className="flex-row items-center mt-1">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-green-600 font-medium">Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions Card */}
        <View className="bg-white p-6 rounded-2xl shadow-lg">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Account Actions
          </Text>

          <TouchableOpacity
            className="bg-red-600 p-4 rounded-xl"
            onPress={handleLogout}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </Container>
  );
}
