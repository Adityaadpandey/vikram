import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { UserRole } from "../types/User";

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const navigation = useNavigation<any>();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Secure Communication",
      description:
        "End-to-end encrypted messaging for defense personnel and families",
    },
    {
      title: "Protected Content",
      description:
        "Screenshot protection and secure file sharing with watermarks",
    },
    {
      title: "Select Your Role",
      description: "Choose your role to access appropriate features",
    },
  ];

  const handleComplete = () => {
    onComplete();
    navigation.replace("Login");
  };

  const renderRoleSelection = () => (
    <View className="space-y-4 px-6">
      {Object.values(UserRole).map((role) => (
        <TouchableOpacity
          key={role}
          className={`p-4 rounded-lg border-2 ${
            selectedRole === role
              ? "bg-military-navy border-military-green"
              : "bg-military-blue border-military-grey"
          }`}
          onPress={() => setSelectedRole(role)}
        >
          <Text className="text-white text-lg font-semibold">{role}</Text>
          <Text className="text-military-lightGrey text-sm mt-1">
            {role === UserRole.PERSONNEL && "Active duty defense personnel"}
            {role === UserRole.VETERAN && "Retired or former service members"}
            {role === UserRole.FAMILY && "Family members of personnel"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-military-dark">
      <ScrollView contentContainerClassName="flex-grow justify-center py-12">
        {currentStep < 2 ? (
          <View className="px-6">
            <View className="h-2 bg-military-grey rounded-full mb-8">
              <View
                className="h-2 bg-military-green rounded-full"
                style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
              />
            </View>

            <Text className="text-white text-3xl font-bold mb-4">
              {steps[currentStep].title}
            </Text>
            <Text className="text-military-lightGrey text-lg mb-8">
              {steps[currentStep].description}
            </Text>

            <TouchableOpacity
              className="bg-military-green py-4 rounded-lg"
              onPress={() => setCurrentStep(currentStep + 1)}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Next
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text className="text-white text-3xl font-bold mb-6 px-6">
              {steps[2].title}
            </Text>
            {renderRoleSelection()}

            <View className="px-6 mt-8">
              <TouchableOpacity
                className={`py-4 rounded-lg ${
                  selectedRole
                    ? "bg-military-green"
                    : "bg-military-grey opacity-50"
                }`}
                disabled={!selectedRole}
                onPress={handleComplete}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};
