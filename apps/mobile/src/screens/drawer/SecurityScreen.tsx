import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { BiometricAuthService } from "../../services/security/BiometricAuth";
import { AutoLockService } from "../../services/security/AutoLockService";
import {
  SessionService,
  Session,
} from "../../services/security/SessionService";

const AUTO_LOCK_OPTIONS = [
  { label: "Immediately", value: 0 },
  { label: "1 Minute", value: 1 },
  { label: "5 Minutes", value: 5 },
  { label: "15 Minutes", value: 15 },
  { label: "30 Minutes", value: 30 },
  { label: "Never", value: -1 },
];

export const SecurityScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [autoLockTime, setAutoLockTime] = useState(5);
  const [showAutoLockOptions, setShowAutoLockOptions] = useState(false);
  const [lastSeenVisibility, setLastSeenVisibility] = useState<
    "everyone" | "contacts" | "nobody"
  >("everyone");
  const [profilePicVisibility, setProfilePicVisibility] = useState<
    "everyone" | "contacts" | "nobody"
  >("everyone");
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [showSessions, setShowSessions] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    loadAutoLockTime();
    loadActiveSessions();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await BiometricAuthService.isAvailable();
    setBiometricAvailable(available);

    if (available) {
      const enabled = await BiometricAuthService.isEnabled();
      setBiometricEnabled(enabled);
    }
  };

  const loadAutoLockTime = async () => {
    const time = await AutoLockService.getAutoLockTime();
    setAutoLockTime(time);
  };

  const loadActiveSessions = async () => {
    const sessions = await SessionService.getActiveSessions();
    setActiveSessions(sessions);
  };

  const toggleBiometric = async () => {
    if (!biometricAvailable) {
      Alert.alert(
        "Not Available",
        "Biometric authentication is not available on this device",
      );
      return;
    }

    if (!biometricEnabled) {
      const authenticated = await BiometricAuthService.authenticate(
        "Enable biometric login",
      );
      if (authenticated) {
        await BiometricAuthService.enable();
        setBiometricEnabled(true);
        Alert.alert("Success", "Biometric login enabled");
      }
    } else {
      await BiometricAuthService.disable();
      setBiometricEnabled(false);
      Alert.alert("Disabled", "Biometric login disabled");
    }
  };

  const handleAutoLockChange = async (minutes: number) => {
    await AutoLockService.setAutoLockTime(minutes);
    setAutoLockTime(minutes);
    setShowAutoLockOptions(false);

    const label =
      AUTO_LOCK_OPTIONS.find((opt) => opt.value === minutes)?.label || "";
    Alert.alert("Auto Lock Updated", `App will lock after ${label}`);
  };

  const handleRevokeSession = async (sessionId: string) => {
    Alert.alert(
      "Revoke Session",
      "Are you sure you want to revoke this session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            await SessionService.revokeSession(sessionId);
            await loadActiveSessions();
            Alert.alert("Success", "Session revoked successfully");
          },
        },
      ],
    );
  };

  const handleRevokeAllSessions = () => {
    Alert.alert(
      "Revoke All Sessions",
      "This will log you out from all other devices. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke All",
          style: "destructive",
          onPress: async () => {
            await SessionService.revokeAllOtherSessions();
            await loadActiveSessions();
            Alert.alert("Success", "All other sessions have been revoked");
          },
        },
      ],
    );
  };

  const renderSession = ({ item }: { item: Session }) => (
    <View
      className="p-4 rounded-lg mb-3 border"
      style={{
        backgroundColor: theme.colors.cardBg,
        borderColor: item.isCurrent ? theme.colors.accent : theme.colors.border,
      }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Ionicons
              name={
                item.deviceType === "Mobile"
                  ? "phone-portrait"
                  : item.deviceType === "Tablet"
                    ? "tablet-portrait"
                    : "desktop"
              }
              size={20}
              color={theme.colors.textPrimary}
            />
            <Text
              className="font-semibold ml-2"
              style={{ color: theme.colors.textPrimary }}
            >
              {item.deviceName}
            </Text>
            {item.isCurrent && (
              <View
                className="ml-2 px-2 py-0.5 rounded"
                style={{ backgroundColor: theme.colors.success }}
              >
                <Text className="text-white text-xs font-bold">Current</Text>
              </View>
            )}
          </View>
          <Text
            className="text-sm mb-1"
            style={{ color: theme.colors.textSecondary }}
          >
            {item.ipAddress} • {item.location}
          </Text>
          <Text
            className="text-xs"
            style={{ color: theme.colors.textSecondary }}
          >
            Last active: {item.lastActive}
          </Text>
        </View>
        {!item.isCurrent && (
          <TouchableOpacity onPress={() => handleRevokeSession(item.id)}>
            <Ionicons
              name="close-circle"
              size={24}
              color={theme.colors.error}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.primaryBg }}
    >
      {/* Header */}
      <View
        className="px-6 pt-12 pb-6"
        style={{ backgroundColor: theme.colors.secondaryBg }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <Text
            className="text-2xl font-bold"
            style={{ color: theme.colors.textPrimary }}
          >
            Security
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Security Info Banner */}
        <View
          className="rounded-lg p-4 mb-6 border-l-4"
          style={{
            backgroundColor: isDark
              ? `${theme.colors.accent}20`
              : `${theme.colors.accent}15`,
            borderLeftColor: theme.colors.accent,
          }}
        >
          <View className="flex-row items-start">
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={theme.colors.accent}
            />
            <View className="flex-1 ml-3">
              <Text
                className="font-semibold mb-1"
                style={{ color: theme.colors.accent }}
              >
                Enhanced Protection Active
              </Text>
              <Text
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                Screenshots, screen recordings, and copy/paste are disabled for
                maximum security
              </Text>
            </View>
          </View>
        </View>

        {/* Authentication Section */}
        <Text
          className="text-sm font-bold mb-3"
          style={{ color: theme.colors.textSecondary }}
        >
          AUTHENTICATION
        </Text>

        {/* Biometric Login */}
        <View
          className="rounded-lg p-4 mb-3 border"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
          }}
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-1 pr-4">
              <Text
                className="text-base font-semibold"
                style={{ color: theme.colors.textPrimary }}
              >
                Biometric Login
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {biometricAvailable
                  ? "Use fingerprint or face ID"
                  : "Not available on this device"}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              disabled={!biometricAvailable}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.accent,
              }}
              thumbColor={biometricEnabled ? "#ffffff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Auto Lock */}
        <TouchableOpacity
          className="rounded-lg p-4 mb-4 border"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
          }}
          onPress={() => setShowAutoLockOptions(!showAutoLockOptions)}
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text
                className="text-base font-semibold"
                style={{ color: theme.colors.textPrimary }}
              >
                Auto Lock
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {AUTO_LOCK_OPTIONS.find((opt) => opt.value === autoLockTime)
                  ?.label || "5 Minutes"}
              </Text>
            </View>
            <Ionicons
              name={showAutoLockOptions ? "chevron-up" : "chevron-down"}
              size={24}
              color={theme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {showAutoLockOptions && (
          <View className="mb-4">
            {AUTO_LOCK_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                className="p-4 rounded-lg mb-2 border"
                style={{
                  backgroundColor:
                    autoLockTime === option.value
                      ? `${theme.colors.accent}20`
                      : theme.colors.cardBg,
                  borderColor:
                    autoLockTime === option.value
                      ? theme.colors.accent
                      : theme.colors.border,
                }}
                onPress={() => handleAutoLockChange(option.value)}
              >
                <Text
                  className="font-semibold"
                  style={{
                    color:
                      autoLockTime === option.value
                        ? theme.colors.accent
                        : theme.colors.textPrimary,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Privacy Section */}
        <Text
          className="text-sm font-bold mb-3 mt-4"
          style={{ color: theme.colors.textSecondary }}
        >
          PRIVACY
        </Text>

        {/* Last Seen Visibility */}
        <View
          className="rounded-lg p-4 mb-3 border"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            className="text-base font-semibold mb-3"
            style={{ color: theme.colors.textPrimary }}
          >
            Last Seen
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {["everyone", "contacts", "nobody"].map((option) => (
              <TouchableOpacity
                key={option}
                className="px-4 py-2 rounded-full border"
                style={{
                  backgroundColor:
                    lastSeenVisibility === option
                      ? theme.colors.accent
                      : "transparent",
                  borderColor:
                    lastSeenVisibility === option
                      ? theme.colors.accent
                      : theme.colors.border,
                }}
                onPress={() => setLastSeenVisibility(option as any)}
              >
                <Text
                  className="font-semibold capitalize"
                  style={{
                    color:
                      lastSeenVisibility === option
                        ? "#FFFFFF"
                        : theme.colors.textSecondary,
                  }}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Profile Picture Visibility */}
        <View
          className="rounded-lg p-4 mb-4 border"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            className="text-base font-semibold mb-3"
            style={{ color: theme.colors.textPrimary }}
          >
            Profile Picture
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {["everyone", "contacts", "nobody"].map((option) => (
              <TouchableOpacity
                key={option}
                className="px-4 py-2 rounded-full border"
                style={{
                  backgroundColor:
                    profilePicVisibility === option
                      ? theme.colors.accent
                      : "transparent",
                  borderColor:
                    profilePicVisibility === option
                      ? theme.colors.accent
                      : theme.colors.border,
                }}
                onPress={() => setProfilePicVisibility(option as any)}
              >
                <Text
                  className="font-semibold capitalize"
                  style={{
                    color:
                      profilePicVisibility === option
                        ? "#FFFFFF"
                        : theme.colors.textSecondary,
                  }}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active Sessions Section */}
        <View className="flex-row justify-between items-center mb-3 mt-4">
          <Text
            className="text-sm font-bold"
            style={{ color: theme.colors.textSecondary }}
          >
            ACTIVE SESSIONS
          </Text>
          <TouchableOpacity onPress={() => setShowSessions(!showSessions)}>
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.colors.accent }}
            >
              {showSessions ? "Hide" : "Show All"}
            </Text>
          </TouchableOpacity>
        </View>

        {showSessions && (
          <>
            <FlatList
              data={activeSessions}
              keyExtractor={(item) => item.id}
              renderItem={renderSession}
              scrollEnabled={false}
            />

            <TouchableOpacity
              className="py-3 rounded-lg mb-6 border"
              style={{
                backgroundColor: "transparent",
                borderColor: theme.colors.error,
              }}
              onPress={handleRevokeAllSessions}
            >
              <Text
                className="text-center font-semibold"
                style={{ color: theme.colors.error }}
              >
                Revoke All Other Sessions
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};
