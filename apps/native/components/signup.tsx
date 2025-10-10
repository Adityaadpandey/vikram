import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/contexts/auth-context";

interface SignupScreenProps {
  switchToLogin: () => void;
  onSuccess: () => void;
}

export const SignupScreen = ({
  switchToLogin,
  onSuccess,
}: SignupScreenProps) => {
  const [userRegId, setUserRegId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const handleSignup = async () => {
    if (!userRegId || !name || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    const result = await signup(userRegId, name, password);
    setIsLoading(false);

    if (result.success) {
      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: onSuccess },
      ]);
    } else {
      Alert.alert("Signup Failed", result.error);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-gray-50">
      <View className="bg-white p-8 rounded-2xl shadow-lg">
        <Text className="text-3xl font-bold text-gray-800 text-center mb-8">
          Create Account
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
            <Text className="text-gray-600 mb-2 font-medium">Full Name</Text>
            <TextInput
              className="bg-gray-100 p-4 rounded-xl text-gray-800"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
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

          <View>
            <Text className="text-gray-600 mb-2 font-medium">
              Confirm Password
            </Text>
            <TextInput
              className="bg-gray-100 p-4 rounded-xl text-gray-800"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className={`p-4 rounded-xl mt-6 ${isLoading ? "bg-green-300" : "bg-green-600"}`}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="p-4 mt-4" onPress={switchToLogin}>
            <Text className="text-blue-600 text-center font-medium">
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
