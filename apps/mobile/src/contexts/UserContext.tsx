import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserProfile {
  serviceId: string;
  name: string;
  rank: string;
  unit: string;
  phone: string;
  profileImage: string | null;
}

interface UserContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  loadProfile: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  serviceId: "DEF2025001",
  name: "Captain Miller",
  rank: "Captain",
  unit: "5th Infantry Division",
  phone: "+91 98765 43210",
  profileImage: null,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_PROFILE_KEY = "@user_profile";

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const updatedProfile = { ...profile, ...updates };
      await AsyncStorage.setItem(
        USER_PROFILE_KEY,
        JSON.stringify(updatedProfile),
      );
      setProfile(updatedProfile);
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ profile, updateProfile, loadProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};
