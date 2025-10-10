import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/contexts/auth-context";

interface LoginScreenProps {
  switchToSignup: () => void;
  onSuccess: () => void;
}

export const LoginScreen = ({
  switchToSignup,
  onSuccess,
}: LoginScreenProps) => {
  const [userRegId, setUserRegId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!userRegId || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const result = await login(userRegId, name, password);
    setIsLoading(false);

    if (result.success) {
      Alert.alert("Success", "Login successful!", [
        { text: "OK", onPress: onSuccess },
      ]);
    } else {
      Alert.alert("Login Failed", result.error);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-gray-50">
      <View className="bg-white p-8 rounded-2xl shadow-lg">
        <Text className="text-3xl font-bold text-gray-800 text-center mb-8">
          Welcome Back
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-600 mb-2 font-medium">
              User Registration ID
            </Text>
            <TextInput
              className="bg-gray-100 p-4 rounded-xl text-gray-800"
              value={userRegId}
              onChangeText={setUserRegId}
              placeholder="Enter your user reg ID"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View>
            <Text className="text-gray-600 mb-2 font-medium">Password</Text>
            <TextInput
              className="bg-gray-100 p-4 rounded-xl text-gray-800"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className={`p-4 rounded-xl mt-6 ${isLoading ? "bg-blue-300" : "bg-blue-600"}`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="p-4 mt-4" onPress={switchToSignup}>
            <Text className="text-blue-600 text-center font-medium">
              Don't have an account? Sign up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
