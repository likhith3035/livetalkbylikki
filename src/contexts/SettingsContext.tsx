import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type ChatTheme = "default" | "ocean" | "sunset" | "forest" | "rose" | "midnight";
export type ChatWallpaper = "none" | "dots" | "grid" | "waves" | "gradient";

export type SettingsState = {
  darkMode: boolean;
  soundEffects: boolean;
  notifications: boolean;
  chatTheme: ChatTheme;
  chatWallpaper: ChatWallpaper;
};

const DEFAULT_SETTINGS: SettingsState = {
  darkMode: true,
  soundEffects: false,
  notifications: false,
  chatTheme: "default",
  chatWallpaper: "none",
};

interface SettingsContextValue {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const loadSettings = (): SettingsState => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  return {
    darkMode: localStorage.getItem("echo.darkMode")
      ? localStorage.getItem("echo.darkMode") === "true"
      : DEFAULT_SETTINGS.darkMode,
    soundEffects: localStorage.getItem("echo.soundEffects") === "true",
    notifications: localStorage.getItem("echo.notifications") === "true",
    chatTheme: (localStorage.getItem("echo.chatTheme") as ChatTheme) || DEFAULT_SETTINGS.chatTheme,
    chatWallpaper: (localStorage.getItem("echo.chatWallpaper") as ChatWallpaper) || DEFAULT_SETTINGS.chatWallpaper,
  };
};

export const CHAT_THEMES: Record<ChatTheme, { label: string; bubble: string; accent: string }> = {
  default: { label: "Violet", bubble: "265 90% 55%", accent: "hsl(265 90% 55%)" },
  ocean: { label: "Ocean", bubble: "200 80% 50%", accent: "hsl(200 80% 50%)" },
  sunset: { label: "Sunset", bubble: "25 90% 55%", accent: "hsl(25 90% 55%)" },
  forest: { label: "Forest", bubble: "150 60% 40%", accent: "hsl(150 60% 40%)" },
  rose: { label: "Rose", bubble: "340 80% 55%", accent: "hsl(340 80% 55%)" },
  midnight: { label: "Midnight", bubble: "230 60% 45%", accent: "hsl(230 60% 45%)" },
};

export const CHAT_WALLPAPERS: Record<ChatWallpaper, { label: string; emoji: string }> = {
  none: { label: "None", emoji: "🚫" },
  dots: { label: "Dots", emoji: "⚬" },
  grid: { label: "Grid", emoji: "▦" },
  waves: { label: "Waves", emoji: "🌊" },
  gradient: { label: "Gradient", emoji: "🎨" },
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);

  useEffect(() => {
    localStorage.setItem("echo.darkMode", String(settings.darkMode));
    localStorage.setItem("echo.soundEffects", String(settings.soundEffects));
    localStorage.setItem("echo.notifications", String(settings.notifications));
    localStorage.setItem("echo.chatTheme", settings.chatTheme);
    localStorage.setItem("echo.chatWallpaper", settings.chatWallpaper);

    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Apply chat theme CSS variables
    const theme = CHAT_THEMES[settings.chatTheme] || CHAT_THEMES.default;
    document.documentElement.style.setProperty("--bubble-you", theme.bubble);
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
