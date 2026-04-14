import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { SecureStorage } from "../services/security/SecureStorage";

interface UserProfile {
  id: string;
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
  isLoaded: boolean;
}

const emptyProfile: UserProfile = {
  id: "",
  serviceId: "",
  name: "",
  rank: "",
  unit: "",
  phone: "",
  profileImage: null,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Load from SecureStorage (synced with backend auth)
      const userId = await SecureStorage.getUserId();
      const armyId = await SecureStorage.getArmyId();
      const name = await SecureStorage.getUserName();
      const designation = await SecureStorage.getUserDesignation();
      const phone = await SecureStorage.getPhoneNumber();

      if (userId && armyId) {
        setProfile({
          id: userId,
          serviceId: armyId,
          name: name || "",
          rank: designation || "",
          unit: "",
          phone: phone || "",
          profileImage: null,
        });
      } else {
        setProfile(emptyProfile);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error("Failed to load profile from SecureStorage:", error);
      setProfile(emptyProfile);
      setIsLoaded(true);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const updatedProfile = { ...profile, ...updates };

      // Persist back to SecureStorage
      if (updates.name) await SecureStorage.setUserName(updates.name);
      if (updates.rank) await SecureStorage.setUserDesignation(updates.rank);
      if (updates.phone) await SecureStorage.setPhoneNumber(updates.phone);
      if (updates.serviceId) await SecureStorage.setArmyId(updates.serviceId);

      setProfile(updatedProfile);
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{ profile, updateProfile, loadProfile, isLoaded }}
    >
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
