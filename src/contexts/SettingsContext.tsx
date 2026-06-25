import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type ChatTheme = "default" | "ocean" | "sunset" | "forest" | "rose" | "midnight" | "amber" | "cyan" | "crimson" | "lavender" | "emerald" | "slate";
export type ChatWallpaper = "none" | "dots" | "grid" | "waves" | "gradient" | "bubbles" | "stars" | "zigzag" | "custom";
export type GlassPreset = 'ios' | 'aurora' | 'emerald' | 'sunset' | 'obsidian' | 'cyber' | 'custom';

export type SettingsState = {
  darkMode: boolean;
  soundEffects: boolean;
  notifications: boolean;
  chatTheme: ChatTheme;
  chatWallpaper: ChatWallpaper;
  protectionEnabled: boolean;
  notifyAlerts: boolean;
  autoStopOnScreenshot: boolean;
  
  // Liquid Glass settings
  liquidGlassEnabled: boolean;
  glassOpacity: number;
  glassBlur: number;
  glassBorderOpacity: number;
  glassGlowIntensity: number;
  glassTintHSL: string;
  glassPreset: GlassPreset;
  liquidBgSpeed: number;
  glassTextureIntensity: number; // custom noise opacity
  glassBorderWidth: number;      // custom border size in px

  // Custom Wallpaper Settings
  chatWallpaperImage: string;    // Base64 or image URL
  chatWallpaperBlur: number;     // px
  chatWallpaperOpacity: number;  // 0 to 1
  chatWallpaperBrightness: number; // 0.1 to 1.5
  chatWallpaperSaturation: number; // 0 to 2
  chatWallpaperOverlayPattern: "none" | "dots" | "grid" | "waves" | "bubbles" | "stars" | "zigzag" | "stripes" | "honeycomb" | "hearts";
  chatWallpaperOverlayOpacity: number;  // 0 to 1
  chatWallpaperOverlayBlendMode: "overlay" | "multiply" | "screen" | "difference" | "color-dodge" | "luminosity";
  chatWallpaperParallaxEnabled: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  darkMode: true,
  soundEffects: false,
  notifications: false,
  chatTheme: "default",
  chatWallpaper: "none",
  protectionEnabled: true,
  notifyAlerts: true,
  autoStopOnScreenshot: false,
  
  // Liquid Glass defaults — OFF by default to prevent glitches on first load
  liquidGlassEnabled: false,
  glassOpacity: 0.4,
  glassBlur: 20,
  glassBorderOpacity: 0.25,
  glassGlowIntensity: 0.3,
  glassTintHSL: "265 90% 60%",
  glassPreset: "ios",
  liquidBgSpeed: 4,
  glassTextureIntensity: 0.045,
  glassBorderWidth: 1,

  // Custom Wallpaper Defaults
  chatWallpaperImage: "",
  chatWallpaperBlur: 0,
  chatWallpaperOpacity: 0.8,
  chatWallpaperBrightness: 1.0,
  chatWallpaperSaturation: 1.0,
  chatWallpaperOverlayPattern: "none",
  chatWallpaperOverlayOpacity: 0.35,
  chatWallpaperOverlayBlendMode: "overlay",
  chatWallpaperParallaxEnabled: true,
};

export const LIQUID_GLASS_PRESETS: Record<GlassPreset, {
  label: string;
  glassOpacity: number;
  glassBlur: number;
  glassBorderOpacity: number;
  glassGlowIntensity: number;
  glassTintHSL: string;
  liquidBgSpeed: number;
  glassTextureIntensity: number;
  glassBorderWidth: number;
  colors: string[];
}> = {
  ios: {
    label: "iOS Frosted Glass",
    glassOpacity: 0.4,
    glassBlur: 20,
    glassBorderOpacity: 0.25,
    glassGlowIntensity: 0.2,
    glassTintHSL: "240 10% 98%",
    liquidBgSpeed: 3,
    glassTextureIntensity: 0.04,
    glassBorderWidth: 1,
    colors: ["#6366f1", "#a855f7", "#3b82f6", "#06b6d4"]
  },
  aurora: {
    label: "Aurora Borealis",
    glassOpacity: 0.3,
    glassBlur: 24,
    glassBorderOpacity: 0.35,
    glassGlowIntensity: 0.5,
    glassTintHSL: "280 80% 60%",
    liquidBgSpeed: 5,
    glassTextureIntensity: 0.05,
    glassBorderWidth: 1,
    colors: ["#d946ef", "#06b6d4", "#a855f7", "#3b82f6"]
  },
  emerald: {
    label: "Liquid Emerald",
    glassOpacity: 0.25,
    glassBlur: 18,
    glassBorderOpacity: 0.3,
    glassGlowIntensity: 0.4,
    glassTintHSL: "150 75% 45%",
    liquidBgSpeed: 4,
    glassTextureIntensity: 0.045,
    glassBorderWidth: 1,
    colors: ["#10b981", "#14b8a6", "#22c55e", "#0ea5e9"]
  },
  sunset: {
    label: "Sunset Quartz",
    glassOpacity: 0.3,
    glassBlur: 16,
    glassBorderOpacity: 0.3,
    glassGlowIntensity: 0.5,
    glassTintHSL: "25 90% 55%",
    liquidBgSpeed: 4,
    glassTextureIntensity: 0.04,
    glassBorderWidth: 1.5,
    colors: ["#f97316", "#ec4899", "#eab308", "#8b5cf6"]
  },
  obsidian: {
    label: "Frosted Obsidian",
    glassOpacity: 0.75,
    glassBlur: 25,
    glassBorderOpacity: 0.15,
    glassGlowIntensity: 0.15,
    glassTintHSL: "240 10% 5%",
    liquidBgSpeed: 2,
    glassTextureIntensity: 0.065,
    glassBorderWidth: 1,
    colors: ["#1e293b", "#0f172a", "#334155", "#1e1b4b"]
  },
  cyber: {
    label: "Cyber Hologram",
    glassOpacity: 0.2,
    glassBlur: 12,
    glassBorderOpacity: 0.6,
    glassGlowIntensity: 0.8,
    glassTintHSL: "320 90% 55%",
    liquidBgSpeed: 7,
    glassTextureIntensity: 0.08,
    glassBorderWidth: 2,
    colors: ["#ff007f", "#00f0ff", "#7f00ff", "#ffef00"]
  },
  custom: {
    label: "Custom Glass",
    glassOpacity: 0.4,
    glassBlur: 20,
    glassBorderOpacity: 0.3,
    glassGlowIntensity: 0.3,
    glassTintHSL: "265 90% 60%",
    liquidBgSpeed: 4,
    glassTextureIntensity: 0.045,
    glassBorderWidth: 1,
    colors: ["#6366f1", "#a855f7", "#3b82f6", "#06b6d4"]
  }
};

interface SettingsContextValue {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const loadSettings = (): SettingsState => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  
  const getBool = (key: string, def: boolean): boolean => {
    const val = localStorage.getItem(key);
    return val !== null ? val === "true" : def;
  };
  const getNum = (key: string, def: number): number => {
    const val = localStorage.getItem(key);
    return val !== null ? Number(val) : def;
  };
  const getStr = (key: string, def: string): string => {
    const val = localStorage.getItem(key);
    return val !== null && val !== "undefined" && val !== "null" ? val : def;
  };

  return {
    darkMode: localStorage.getItem("echo.darkMode")
      ? localStorage.getItem("echo.darkMode") === "true"
      : DEFAULT_SETTINGS.darkMode,
    soundEffects: localStorage.getItem("echo.soundEffects") === "true",
    notifications: localStorage.getItem("echo.notifications") === "true",
    chatTheme: (localStorage.getItem("echo.chatTheme") as ChatTheme) || DEFAULT_SETTINGS.chatTheme,
    chatWallpaper: (localStorage.getItem("echo.chatWallpaper") as ChatWallpaper) || DEFAULT_SETTINGS.chatWallpaper,
    protectionEnabled: localStorage.getItem("echo.protectionEnabled") !== "false",
    notifyAlerts: localStorage.getItem("echo.notifyAlerts") !== "false",
    autoStopOnScreenshot: localStorage.getItem("echo.autoStopOnScreenshot") === "true",
    
    // Liquid Glass settings parsing
    liquidGlassEnabled: getBool("echo.liquidGlassEnabled", DEFAULT_SETTINGS.liquidGlassEnabled),
    glassOpacity: getNum("echo.glassOpacity", DEFAULT_SETTINGS.glassOpacity),
    glassBlur: getNum("echo.glassBlur", DEFAULT_SETTINGS.glassBlur),
    glassBorderOpacity: getNum("echo.glassBorderOpacity", DEFAULT_SETTINGS.glassBorderOpacity),
    glassGlowIntensity: getNum("echo.glassGlowIntensity", DEFAULT_SETTINGS.glassGlowIntensity),
    glassTintHSL: getStr("echo.glassTintHSL", DEFAULT_SETTINGS.glassTintHSL),
    glassPreset: getStr("echo.glassPreset", DEFAULT_SETTINGS.glassPreset) as GlassPreset,
    liquidBgSpeed: getNum("echo.liquidBgSpeed", DEFAULT_SETTINGS.liquidBgSpeed),
    glassTextureIntensity: getNum("echo.glassTextureIntensity", DEFAULT_SETTINGS.glassTextureIntensity),
    glassBorderWidth: getNum("echo.glassBorderWidth", DEFAULT_SETTINGS.glassBorderWidth),

    // Custom Wallpaper settings parsing
    chatWallpaperImage: getStr("echo.chatWallpaperImage", DEFAULT_SETTINGS.chatWallpaperImage),
    chatWallpaperBlur: getNum("echo.chatWallpaperBlur", DEFAULT_SETTINGS.chatWallpaperBlur),
    chatWallpaperOpacity: getNum("echo.chatWallpaperOpacity", DEFAULT_SETTINGS.chatWallpaperOpacity),
    chatWallpaperBrightness: getNum("echo.chatWallpaperBrightness", DEFAULT_SETTINGS.chatWallpaperBrightness),
    chatWallpaperSaturation: getNum("echo.chatWallpaperSaturation", DEFAULT_SETTINGS.chatWallpaperSaturation),
    chatWallpaperOverlayPattern: getStr("echo.chatWallpaperOverlayPattern", DEFAULT_SETTINGS.chatWallpaperOverlayPattern) as any,
    chatWallpaperOverlayOpacity: getNum("echo.chatWallpaperOverlayOpacity", DEFAULT_SETTINGS.chatWallpaperOverlayOpacity),
    chatWallpaperOverlayBlendMode: getStr("echo.chatWallpaperOverlayBlendMode", DEFAULT_SETTINGS.chatWallpaperOverlayBlendMode) as any,
    chatWallpaperParallaxEnabled: getBool("echo.chatWallpaperParallaxEnabled", DEFAULT_SETTINGS.chatWallpaperParallaxEnabled),
  };
};

export const CHAT_THEMES: Record<ChatTheme, { label: string; bubble: string; accent: string }> = {
  default: { label: "Violet", bubble: "265 90% 55%", accent: "hsl(265 90% 55%)" },
  ocean: { label: "Ocean", bubble: "200 80% 50%", accent: "hsl(200 80% 50%)" },
  sunset: { label: "Sunset", bubble: "25 90% 55%", accent: "hsl(25 90% 55%)" },
  forest: { label: "Forest", bubble: "150 60% 40%", accent: "hsl(150 60% 40%)" },
  rose: { label: "Rose", bubble: "340 80% 55%", accent: "hsl(340 80% 55%)" },
  midnight: { label: "Midnight", bubble: "230 60% 45%", accent: "hsl(230 60% 45%)" },
  amber: { label: "Amber", bubble: "38 92% 50%", accent: "hsl(38 92% 50%)" },
  cyan: { label: "Cyan", bubble: "185 80% 45%", accent: "hsl(185 80% 45%)" },
  crimson: { label: "Crimson", bubble: "0 75% 50%", accent: "hsl(0 75% 50%)" },
  lavender: { label: "Lavender", bubble: "280 60% 65%", accent: "hsl(280 60% 65%)" },
  emerald: { label: "Emerald", bubble: "160 70% 38%", accent: "hsl(160 70% 38%)" },
  slate: { label: "Slate", bubble: "215 20% 45%", accent: "hsl(215 20% 45%)" },
};

export const CHAT_WALLPAPERS: Record<ChatWallpaper, { label: string; emoji: string }> = {
  none: { label: "None", emoji: "🚫" },
  dots: { label: "Dots", emoji: "⚬" },
  grid: { label: "Grid", emoji: "▦" },
  waves: { label: "Waves", emoji: "🌊" },
  gradient: { label: "Gradient", emoji: "🎨" },
  bubbles: { label: "Bubbles", emoji: "🫧" },
  stars: { label: "Stars", emoji: "⭐" },
  zigzag: { label: "Zigzag", emoji: "⚡" },
  custom: { label: "Custom", emoji: "🖼️" },
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);

  useEffect(() => {
    localStorage.setItem("echo.darkMode", String(settings.darkMode));
    localStorage.setItem("echo.soundEffects", String(settings.soundEffects));
    localStorage.setItem("echo.notifications", String(settings.notifications));
    localStorage.setItem("echo.chatTheme", settings.chatTheme);
    localStorage.setItem("echo.chatWallpaper", settings.chatWallpaper);
    localStorage.setItem("echo.protectionEnabled", String(settings.protectionEnabled));
    localStorage.setItem("echo.notifyAlerts", String(settings.notifyAlerts));
    localStorage.setItem("echo.autoStopOnScreenshot", String(settings.autoStopOnScreenshot));

    // Store Liquid Glass state
    localStorage.setItem("echo.liquidGlassEnabled", String(settings.liquidGlassEnabled));
    localStorage.setItem("echo.glassOpacity", String(settings.glassOpacity));
    localStorage.setItem("echo.glassBlur", String(settings.glassBlur));
    localStorage.setItem("echo.glassBorderOpacity", String(settings.glassBorderOpacity));
    localStorage.setItem("echo.glassGlowIntensity", String(settings.glassGlowIntensity));
    localStorage.setItem("echo.glassTintHSL", settings.glassTintHSL);
    localStorage.setItem("echo.glassPreset", settings.glassPreset);
    localStorage.setItem("echo.liquidBgSpeed", String(settings.liquidBgSpeed));
    localStorage.setItem("echo.glassTextureIntensity", String(settings.glassTextureIntensity));
    localStorage.setItem("echo.glassBorderWidth", String(settings.glassBorderWidth));

    // Store Custom Wallpaper settings
    localStorage.setItem("echo.chatWallpaperImage", settings.chatWallpaperImage);
    localStorage.setItem("echo.chatWallpaperBlur", String(settings.chatWallpaperBlur));
    localStorage.setItem("echo.chatWallpaperOpacity", String(settings.chatWallpaperOpacity));
    localStorage.setItem("echo.chatWallpaperBrightness", String(settings.chatWallpaperBrightness));
    localStorage.setItem("echo.chatWallpaperSaturation", String(settings.chatWallpaperSaturation));
    localStorage.setItem("echo.chatWallpaperOverlayPattern", settings.chatWallpaperOverlayPattern);
    localStorage.setItem("echo.chatWallpaperOverlayOpacity", String(settings.chatWallpaperOverlayOpacity));
    localStorage.setItem("echo.chatWallpaperOverlayBlendMode", settings.chatWallpaperOverlayBlendMode);
    localStorage.setItem("echo.chatWallpaperParallaxEnabled", String(settings.chatWallpaperParallaxEnabled));

    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Apply chat theme CSS variables
    const theme = CHAT_THEMES[settings.chatTheme] || CHAT_THEMES.default;
    document.documentElement.style.setProperty("--bubble-you", theme.bubble);

    // Apply Liquid Glass CSS variables dynamically
    const root = document.documentElement;
    if (settings.liquidGlassEnabled) {
      root.classList.add("liquid-glass-active");
      root.style.setProperty("--glass-opacity", String(settings.glassOpacity));
      root.style.setProperty("--glass-blur", `${settings.glassBlur}px`);
      root.style.setProperty("--glass-border-opacity", String(settings.glassBorderOpacity));
      root.style.setProperty("--glass-glow-intensity", String(settings.glassGlowIntensity));
      root.style.setProperty("--glass-tint-hsl", settings.glassTintHSL);
      root.style.setProperty("--glass-noise-opacity", String(settings.glassTextureIntensity));
      root.style.setProperty("--glass-border-width", `${settings.glassBorderWidth}px`);
      // Map speed slider (1 to 10) to CSS animation duration (e.g. 10 -> 4s, 1 -> 40s)
      const duration = settings.liquidBgSpeed === 0 ? 0 : Math.max(4, 30 - settings.liquidBgSpeed * 3.5);
      root.style.setProperty("--liquid-speed", duration > 0 ? `${duration}s` : "0s");
    } else {
      root.classList.remove("liquid-glass-active");
      root.style.removeProperty("--glass-opacity");
      root.style.removeProperty("--glass-blur");
      root.style.removeProperty("--glass-border-opacity");
      root.style.removeProperty("--glass-glow-intensity");
      root.style.removeProperty("--glass-tint-hsl");
      root.style.removeProperty("--glass-noise-opacity");
      root.style.removeProperty("--glass-border-width");
      root.style.removeProperty("--liquid-speed");
    }

    // Bind custom wallpaper variables globally so index.css and ChatWallpaper can pick them up
    root.style.setProperty("--wallpaper-blur", `${settings.chatWallpaperBlur}px`);
    root.style.setProperty("--wallpaper-opacity", String(settings.chatWallpaperOpacity));
    root.style.setProperty("--wallpaper-brightness", String(settings.chatWallpaperBrightness));
    root.style.setProperty("--wallpaper-saturation", String(settings.chatWallpaperSaturation));

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
