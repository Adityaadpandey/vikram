import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeColors {
  primaryBg: string;
  secondaryBg: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  border: string;
  success: string;
  error: string;
  warning: string;
}

interface Theme {
  colors: ThemeColors;
  mode: "light" | "dark";
}

const darkTheme: Theme = {
  mode: "dark",
  colors: {
    primaryBg: "#0D1B2A",
    secondaryBg: "#1B263B",
    accent: "#00C6A7",
    textPrimary: "#E0E1DD",
    textSecondary: "#9CA3AF",
    cardBg: "#16243A",
    border: "#2D3748",
    success: "#00C6A7",
    error: "#EF4444",
    warning: "#F59E0B",
  },
};

const lightTheme: Theme = {
  mode: "light",
  colors: {
    primaryBg: "#F8FAFC",
    secondaryBg: "#E2E8F0",
    accent: "#00897B",
    textPrimary: "#0D1B2A",
    textSecondary: "#475569",
    cardBg: "#FFFFFF",
    border: "#CBD5E1",
    success: "#00897B",
    error: "#DC2626",
    warning: "#F59E0B",
  },
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@defense_secure_theme";

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    Appearance.getColorScheme() || "dark",
  );

  useEffect(() => {
    loadTheme();

    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme || "dark");
    });

    return () => listener.remove();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  const getActiveTheme = (): Theme => {
    if (themeMode === "system") {
      return systemTheme === "dark" ? darkTheme : lightTheme;
    }
    return themeMode === "dark" ? darkTheme : lightTheme;
  };

  const theme = getActiveTheme();
  const isDark = theme.mode === "dark";

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
