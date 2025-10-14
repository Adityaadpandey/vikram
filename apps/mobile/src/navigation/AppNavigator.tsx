import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { OTPVerificationScreen } from "../screens/OTPVerificationScreen";
import { SeedPhraseScreen } from "../screens/SeedPhraseScreen";
import { DrawerNavigator } from "./DrawerNavigator";
import { ChatScreen } from "../screens/ChatScreen";
import { VoiceVideoCallScreen } from "../screens/VoiceVideoCallScreen";
import { FileViewerScreen } from "../screens/FileViewerScreen";
import { ContactsScreen } from "../screens/ContactsScreen";
import { SelectContactScreen } from "../screens/SelectContactScreen";
import { AddContactScreen } from "../screens/AddContactScreen";
import { CreateGroupScreen } from "../screens/CreateGroupScreen";
import { SecureStorage } from "../services/security/SecureStorage";

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStorage.getToken();
      setIsAuthenticated(!!token);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen
            name="OTPVerification"
            component={OTPVerificationScreen}
          />
          <Stack.Screen name="SeedPhrase" options={{ gestureEnabled: false }}>
            {(props) => (
              <SeedPhraseScreen
                {...props}
                onSuccess={() => setIsAuthenticated(true)}
              />
            )}
          </Stack.Screen>
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen name="Main" component={DrawerNavigator} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Call" component={VoiceVideoCallScreen} />
          <Stack.Screen name="FileViewer" component={FileViewerScreen} />
          <Stack.Screen name="Contacts" component={ContactsScreen} />
          <Stack.Screen name="SelectContact" component={SelectContactScreen} />
          <Stack.Screen name="AddContact" component={AddContactScreen} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
