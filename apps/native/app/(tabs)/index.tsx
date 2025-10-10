import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Container } from "@/components/container";
import { LoginScreen } from "@/components/login";
import { SignupScreen } from "@/components/signup";
import { useAuth } from "@/contexts/auth-context";

export default function TabOne() {
  const [isSignupMode, setIsSignupMode] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/(tabs)/two");
    }
  }, [isAuthenticated]);

  const handleSuccess = () => {
    router.push("/(tabs)/two");
  };

  const switchToSignup = () => {
    setIsSignupMode(true);
  };

  const switchToLogin = () => {
    setIsSignupMode(false);
  };

  if (loading) {
    return (
      <Container>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </Container>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to two.tsx
  }

  return (
    <Container>
      {isSignupMode ? (
        <SignupScreen switchToLogin={switchToLogin} onSuccess={handleSuccess} />
      ) : (
        <LoginScreen
          switchToSignup={switchToSignup}
          onSuccess={handleSuccess}
        />
      )}
    </Container>
  );
}
