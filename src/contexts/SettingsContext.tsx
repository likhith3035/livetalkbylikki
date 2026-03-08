import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type SettingsState = {
  darkMode: boolean;
  soundEffects: boolean;
  notifications: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  darkMode: true,
  soundEffects: false,
  notifications: false,
};

interface SettingsContextValue {
  settings: SettingsState;
  updateSetting: (key: keyof SettingsState, value: boolean) => void;
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
  };
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);

  useEffect(() => {
    localStorage.setItem("echo.darkMode", String(settings.darkMode));
    localStorage.setItem("echo.soundEffects", String(settings.soundEffects));
    localStorage.setItem("echo.notifications", String(settings.notifications));

    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings]);

  const updateSetting = useCallback((key: keyof SettingsState, value: boolean) => {
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
