import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { TabNavigator } from "./TabNavigator";
import { CustomDrawerContent } from "./CustomDrawerContent";
import { ProfileScreen } from "../screens/drawer/ProfileScreen";
import { StarredMessagesScreen } from "../screens/drawer/StarredMessagesScreen";
import { ThemeScreen } from "../screens/drawer/ThemeScreen";
import { SettingsScreen } from "../screens/drawer/SettingsScreen";
import { SecurityScreen } from "../screens/drawer/SecurityScreen";
import { AboutScreen } from "../screens/drawer/AboutScreen";

const Drawer = createDrawerNavigator();

export const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 280,
        },
        drawerType: "front",
      }}
    >
      <Drawer.Screen name="MainTabs" component={TabNavigator} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="StarredMessages" component={StarredMessagesScreen} />
      <Drawer.Screen name="Theme" component={ThemeScreen} />
      <Drawer.Screen name="Security" component={SecurityScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="About" component={AboutScreen} />
    </Drawer.Navigator>
  );
};
