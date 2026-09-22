export type Connect4ThemeId = "classic" | "cyber" | "matrix" | "synthwave";

export interface ChipThemeStyle {
  label: string;
  shortLabel: string;
  colorName: string;
  emoji: string;
  gradient: string;
  border: string;
  shadow: string;
  glow: string;
  ring: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export interface ThemeStyle {
  id: Connect4ThemeId;
  name: string;
  icon: string;
  cabinetBg: string;
  cabinetBorder: string;
  cabinetGlow: string;
  cabinetAccent: string;
  slotBg: string;
  slotBorder: string;
  slotInnerShadow: string;
  beamGlow: string;
  redChip: ChipThemeStyle;
  yellowChip: ChipThemeStyle;
}

export const CONNECT4_THEMES: Record<Connect4ThemeId, ThemeStyle> = {
  classic: {
    id: "classic",
    name: "Classic",
    icon: "🔵",
    cabinetBg: "bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900",
    cabinetBorder: "border-blue-500/80 shadow-[0_16px_45px_rgba(29,78,216,0.4)]",
    cabinetGlow: "shadow-blue-500/20",
    cabinetAccent: "text-blue-200",
    slotBg: "bg-blue-950/90",
    slotBorder: "border-blue-900/90",
    slotInnerShadow: "shadow-[inset_0_4px_8px_rgba(0,0,0,0.85)]",
    beamGlow: "from-blue-400/25 via-blue-400/10 to-transparent",
    redChip: {
      label: "Ruby Red",
      shortLabel: "Ruby",
      colorName: "Red",
      emoji: "🔴",
      gradient: "bg-gradient-to-b from-rose-400 via-red-500 to-red-700",
      border: "border-red-300/80",
      shadow: "shadow-[0_4px_12px_rgba(225,29,72,0.5),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-3px_4px_rgba(0,0,0,0.5)]",
      glow: "ring-rose-400/60 shadow-rose-500/60",
      ring: "border-rose-200/50",
      textColor: "text-rose-400",
      bgColor: "bg-rose-500/15",
      borderColor: "border-rose-500/30",
    },
    yellowChip: {
      label: "Solar Gold",
      shortLabel: "Gold",
      colorName: "Yellow",
      emoji: "🟡",
      gradient: "bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-600",
      border: "border-amber-200/80",
      shadow: "shadow-[0_4px_12px_rgba(234,179,8,0.5),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-3px_4px_rgba(0,0,0,0.5)]",
      glow: "ring-yellow-400/60 shadow-yellow-500/60",
      ring: "border-amber-100/50",
      textColor: "text-amber-400",
      bgColor: "bg-amber-500/15",
      borderColor: "border-amber-500/30",
    },
  },
  cyber: {
    id: "cyber",
    name: "Cyber Neon",
    icon: "⚡",
    cabinetBg: "bg-gradient-to-b from-slate-900 via-zinc-950 to-black",
    cabinetBorder: "border-cyan-500/50 shadow-[0_16px_45px_rgba(6,182,212,0.3)]",
    cabinetGlow: "shadow-cyan-500/25",
    cabinetAccent: "text-cyan-400",
    slotBg: "bg-black/95",
    slotBorder: "border-cyan-950/80",
    slotInnerShadow: "shadow-[inset_0_4px_10px_rgba(0,0,0,0.95)]",
    beamGlow: "from-cyan-400/25 via-cyan-400/10 to-transparent",
    redChip: {
      label: "Neon Magenta",
      shortLabel: "Magenta",
      colorName: "Magenta",
      emoji: "🌸",
      gradient: "bg-gradient-to-b from-pink-400 via-fuchsia-600 to-purple-800",
      border: "border-pink-300/80",
      shadow: "shadow-[0_4px_15px_rgba(236,72,153,0.65),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-3px_4px_rgba(0,0,0,0.5)]",
      glow: "ring-pink-400/70 shadow-pink-500/70",
      ring: "border-pink-200/50",
      textColor: "text-pink-400",
      bgColor: "bg-pink-500/15",
      borderColor: "border-pink-500/30",
    },
    yellowChip: {
      label: "Electric Cyan",
      shortLabel: "Cyan",
      colorName: "Cyan",
      emoji: "⚡",
      gradient: "bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-700",
      border: "border-cyan-200/80",
      shadow: "shadow-[0_4px_15px_rgba(6,182,212,0.65),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-3px_4px_rgba(0,0,0,0.5)]",
      glow: "ring-cyan-400/70 shadow-cyan-500/70",
      ring: "border-cyan-100/50",
      textColor: "text-cyan-400",
      bgColor: "bg-cyan-500/15",
      borderColor: "border-cyan-500/30",
    },
  },
  matrix: {
    id: "matrix",
    name: "Matrix",
    icon: "🟩",
    cabinetBg: "bg-gradient-to-b from-zinc-950 via-emerald-950/40 to-black",
    cabinetBorder: "border-emerald-500/50 shadow-[0_16px_45px_rgba(16,185,129,0.3)]",
    cabinetGlow: "shadow-emerald-500/25",
    cabinetAccent: "text-emerald-400",
    slotBg: "bg-black/95",
    slotBorder: "border-emerald-950/80",
    slotInnerShadow: "shadow-[inset_0_4px_10px_rgba(0,0,0,0.95)]",
    beamGlow: "from-emerald-400/25 via-emerald-400/10 to-transparent",
    redChip: {
      label: "Crimson Core",
      shortLabel: "Crimson",
      colorName: "Crimson",
      emoji: "🔴",
      gradient: "bg-gradient-to-b from-rose-400 via-rose-600 to-rose-900",
      border: "border-rose-300/80",
      shadow: "shadow-[0_4px_14px_rgba(244,63,94,0.55),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-3px_4px_rgba(0,0,0,0.5)]",
      glow: "ring-rose-400/60 shadow-rose-500/60",
      ring: "border-rose-200/50",
      textColor: "text-rose-400",
      bgColor: "bg-rose-500/15",
      borderColor: "border-rose-500/30",
    },
    yellowChip: {
      label: "Lime Laser",
      shortLabel: "Lime",
      colorName: "Lime",
      emoji: "🟢",
      gradient: "bg-gradient-to-b from-lime-300 via-emerald-500 to-teal-700",
      border: "border-lime-200/80",
      shadow: "shadow-[0_4px_14px_rgba(132,204,22,0.55),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-3px_4px_rgba(0,0,0,0.5)]",
      glow: "ring-lime-400/60 shadow-lime-500/60",
      ring: "border-lime-100/50",
      textColor: "text-lime-400",
      bgColor: "bg-lime-500/15",
      borderColor: "border-lime-500/30",
    },
  },
  synthwave: {
    id: "synthwave",
    name: "Synthwave",
    icon: "🌅",
    cabinetBg: "bg-gradient-to-b from-purple-950 via-indigo-950 to-slate-950",
    cabinetBorder: "border-purple-500/50 shadow-[0_16px_45px_rgba(168,85,247,0.3)]",
    cabinetGlow: "shadow-purple-500/25",
    cabinetAccent: "text-purple-300",
    slotBg: "bg-purple-950/70",
    slotBorder: "border-purple-900/80",
    slotInnerShadow: "shadow-[inset_0_4px_10px_rgba(0,0,0,0.9)]",
    beamGlow: "from-purple-400/25 via-purple-400/10 to-transparent",
    redChip: {
      label: "Sunset Flare",
      shortLabel: "Sunset",
      colorName: "Sunset",
      emoji: "🟠",
      gradient: "bg-gradient-to-b from-orange-400 via-amber-500 to-rose-700",
      border: "border-orange-300/80",
      shadow: "shadow-[0_4px_14px_rgba(249,115,22,0.55),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-3px_4px_rgba(0,0,0,0.5)]",
      glow: "ring-orange-400/60 shadow-orange-500/60",
      ring: "border-orange-200/50",
      textColor: "text-orange-400",
      bgColor: "bg-orange-500/15",
      borderColor: "border-orange-500/30",
    },
    yellowChip: {
      label: "Arcade Violet",
      shortLabel: "Violet",
      colorName: "Violet",
      emoji: "🟣",
      gradient: "bg-gradient-to-b from-violet-300 via-purple-500 to-indigo-800",
      border: "border-violet-200/80",
      shadow: "shadow-[0_4px_14px_rgba(168,85,247,0.55),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-3px_4px_rgba(0,0,0,0.5)]",
      glow: "ring-violet-400/60 shadow-violet-500/60",
      ring: "border-violet-100/50",
      textColor: "text-violet-400",
      bgColor: "bg-violet-500/15",
      borderColor: "border-violet-500/30",
    },
  },
};

export const C4_THEME_STORAGE_KEY = "incog_c4_theme";
export const C4_THEME_CHANGE_EVENT = "incog_c4_theme_changed";

export function getSavedConnectFourTheme(): Connect4ThemeId {
  try {
    const saved = localStorage.getItem(C4_THEME_STORAGE_KEY) as Connect4ThemeId;
    return saved && CONNECT4_THEMES[saved] ? saved : "classic";
  } catch {
    return "classic";
  }
}

export function saveConnectFourTheme(themeId: Connect4ThemeId): void {
  try {
    localStorage.setItem(C4_THEME_STORAGE_KEY, themeId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(C4_THEME_CHANGE_EVENT, { detail: themeId }));
    }
  } catch {}
}
