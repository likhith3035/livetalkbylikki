import { PenModelId, PenRigidBody, PenSurfaceType, PenSkinId, PenPowerUpType } from "../types";

export interface PenDefinition {
  id: PenModelId;
  name: string;
  brand: string;
  tagline: string;
  mass: number; // Base mass in arbitrary physics units
  length: number; // Visual & collision length (pixels in 1000x1800 table space)
  width: number; // Collision width
  friction: number; // Velocity multiplier per frame (e.g. 0.965 = ~3.5% decay per frame)
  elasticity: number; // Restitution on collision (0.6 to 0.8)
  powerMultiplier: number;
  primaryColor: string;
  secondaryColor: string;
  clipColor: string;
  accentGradient: string;
  isUnlockedByDefault: boolean;
  requiredWins?: number;
  stats: {
    weight: number; // 1-5 stars
    speed: number;  // 1-5 stars
    spin: number;   // 1-5 stars
    impact: number; // 1-5 stars
  };
}

export interface SurfaceDefinition {
  id: PenSurfaceType;
  name: string;
  emoji: string;
  description: string;
  frictionMultiplier: number; // Multiplied with pen's base friction
  driftEnabled: boolean; // Random per-frame drift (wet desk)
  driftIntensity: number; // 0 to 1
  deskColorPrimary: string;
  deskColorSecondary: string;
  deskColorTertiary: string;
  deskColorQuaternary: string;
  grainOpacity: number;
  ambientLight: string;
  requiredWins: number; // Unlock requirement
}

export interface SkinDefinition {
  id: PenSkinId;
  name: string;
  emoji: string;
  description: string;
  isUnlockedByDefault: boolean;
  requiredWins: number;
  overlayType: "glow" | "pattern" | "particles" | "none";
  color1: string;
  color2: string;
}

export interface PowerUpDefinition {
  type: PenPowerUpType;
  name: string;
  emoji: string;
  description: string;
  duration: number; // In frames (60fps)
  color: string;
}

export const PEN_MODELS: Record<PenModelId, PenDefinition> = {
  pilot_v5: {
    id: "pilot_v5",
    name: "Pilot V5 Hi-Tecpoint",
    brand: "Pilot",
    tagline: "Needle-Point Precision: Surgical straight trajectory and snappy off-center spin.",
    mass: 1.15,
    length: 185,
    width: 26,
    friction: 0.965,
    elasticity: 0.72,
    powerMultiplier: 1.05,
    primaryColor: "#1e3a8a", // Navy Blue
    secondaryColor: "#94a3b8", // Stainless Steel
    clipColor: "#e2e8f0",
    accentGradient: "from-blue-600 to-indigo-800",
    isUnlockedByDefault: true,
    stats: {
      weight: 3,
      speed: 4,
      spin: 5,
      impact: 4,
    },
  },
  reynolds_045: {
    id: "reynolds_045",
    name: "Reynolds 045 Fine Carbure",
    brand: "Reynolds",
    tagline: "The School Legend: Ultra-slick glide, blazing speed, and devastating glances.",
    mass: 0.85,
    length: 175,
    width: 22,
    friction: 0.978, // Slippery
    elasticity: 0.80,
    powerMultiplier: 1.25,
    primaryColor: "#f8fafc", // White Hexagonal
    secondaryColor: "#2563eb", // Translucent Blue Cap
    clipColor: "#1d4ed8",
    accentGradient: "from-slate-100 to-blue-500",
    isUnlockedByDefault: true,
    stats: {
      weight: 2,
      speed: 5,
      spin: 4,
      impact: 3,
    },
  },
  trimax: {
    id: "trimax",
    name: "Trimax Gold Gel",
    brand: "Reynolds",
    tagline: "The Heavyweight Tank: Hard to knock off the desk and delivers massive push force.",
    mass: 1.55,
    length: 195,
    width: 32,
    friction: 0.952, // High table grip
    elasticity: 0.65,
    powerMultiplier: 0.95,
    primaryColor: "#0f172a", // Matte Black
    secondaryColor: "#eab308", // Golden Accents
    clipColor: "#f59e0b",
    accentGradient: "from-slate-900 to-amber-600",
    isUnlockedByDefault: true,
    stats: {
      weight: 5,
      speed: 2,
      spin: 3,
      impact: 5,
    },
  },
  cello_gripper: {
    id: "cello_gripper",
    name: "Cello Gripper",
    brand: "Cello",
    tagline: "Front-Heavy Rubber Grip: Grips the desk for controlled direct shoves.",
    mass: 1.20,
    length: 180,
    width: 26,
    friction: 0.960,
    elasticity: 0.70,
    powerMultiplier: 1.00,
    primaryColor: "#0284c7", // Sky Blue Body
    secondaryColor: "#1e293b", // Black Rubber Grip
    clipColor: "#cbd5e1",
    accentGradient: "from-sky-500 to-slate-800",
    isUnlockedByDefault: true,
    stats: {
      weight: 4,
      speed: 3,
      spin: 4,
      impact: 4,
    },
  },
  parker_vector: {
    id: "parker_vector",
    name: "Parker Vector Steel",
    brand: "Parker",
    tagline: "Royal Metal Body: Unshakeable mass and brutal head-on momentum transfer.",
    mass: 1.85,
    length: 190,
    width: 28,
    friction: 0.958,
    elasticity: 0.62,
    powerMultiplier: 0.90,
    primaryColor: "#64748b", // Brushed Steel
    secondaryColor: "#cbd5e1", // Chrome Arrow Clip
    clipColor: "#f8fafc",
    accentGradient: "from-slate-400 to-slate-700",
    isUnlockedByDefault: false,
    requiredWins: 3,
    stats: {
      weight: 5,
      speed: 3,
      spin: 2,
      impact: 5,
    },
  },

  // ══════ NEW UNLOCKABLE PENS ══════

  montblanc: {
    id: "montblanc",
    name: "Montblanc Meisterstück",
    brand: "Montblanc",
    tagline: "The Prestige: Ultra-heavy luxury body with devastating inertia and bulldozer impacts.",
    mass: 2.20,
    length: 200,
    width: 34,
    friction: 0.948,
    elasticity: 0.58,
    powerMultiplier: 0.85,
    primaryColor: "#1a1a2e", // Deep Black Resin
    secondaryColor: "#d4af37", // Gold Nib Band
    clipColor: "#ffd700",
    accentGradient: "from-slate-950 to-amber-500",
    isUnlockedByDefault: false,
    requiredWins: 10,
    stats: {
      weight: 5,
      speed: 1,
      spin: 2,
      impact: 5,
    },
  },
  lamy_safari: {
    id: "lamy_safari",
    name: "Lamy Safari",
    brand: "Lamy",
    tagline: "German Precision: Featherweight agility with razor accuracy and spinning finesse.",
    mass: 0.70,
    length: 172,
    width: 22,
    friction: 0.980,
    elasticity: 0.85,
    powerMultiplier: 1.35,
    primaryColor: "#ef4444", // Signature Red
    secondaryColor: "#1e293b", // Black Clip
    clipColor: "#0f172a",
    accentGradient: "from-red-500 to-red-800",
    isUnlockedByDefault: false,
    requiredWins: 5,
    stats: {
      weight: 1,
      speed: 5,
      spin: 5,
      impact: 2,
    },
  },
  camlin_flora: {
    id: "camlin_flora",
    name: "Camlin Flora",
    brand: "Camlin",
    tagline: "Wildcard Classic: Unpredictable bounces and chaos energy. A fan favorite underdog.",
    mass: 1.00,
    length: 178,
    width: 24,
    friction: 0.970,
    elasticity: 0.88, // Highest bounce!
    powerMultiplier: 1.10,
    primaryColor: "#059669", // Forest Green
    secondaryColor: "#fef08a", // Yellow Flower Print
    clipColor: "#facc15",
    accentGradient: "from-emerald-600 to-yellow-400",
    isUnlockedByDefault: false,
    requiredWins: 7,
    stats: {
      weight: 3,
      speed: 4,
      spin: 3,
      impact: 3,
    },
  },
};

// ══════ SURFACE TYPES ══════

export const SURFACE_TYPES: Record<PenSurfaceType, SurfaceDefinition> = {
  classic_wood: {
    id: "classic_wood",
    name: "Classic Teakwood",
    emoji: "🪵",
    description: "Standard classroom desk. Balanced friction and predictable physics.",
    frictionMultiplier: 1.0,
    driftEnabled: false,
    driftIntensity: 0,
    deskColorPrimary: "#d97706",
    deskColorSecondary: "#b45309",
    deskColorTertiary: "#92400e",
    deskColorQuaternary: "#78350f",
    grainOpacity: 0.14,
    ambientLight: "rgba(254, 243, 199, 0.18)",
    requiredWins: 0,
  },
  glass_desk: {
    id: "glass_desk",
    name: "Glass Desktop",
    emoji: "🔮",
    description: "Near-zero friction. Pens slide forever — master control or lose everything.",
    frictionMultiplier: 1.018, // Makes friction much higher (closer to 1 = less drag)
    driftEnabled: false,
    driftIntensity: 0,
    deskColorPrimary: "#1e293b",
    deskColorSecondary: "#334155",
    deskColorTertiary: "#475569",
    deskColorQuaternary: "#0f172a",
    grainOpacity: 0.05,
    ambientLight: "rgba(147, 197, 253, 0.15)",
    requiredWins: 3,
  },
  velvet_mat: {
    id: "velvet_mat",
    name: "Velvet Mat",
    emoji: "🎱",
    description: "High friction surface. Short, precise shots — every millimeter counts.",
    frictionMultiplier: 0.975, // Reduces friction coefficient → more drag
    driftEnabled: false,
    driftIntensity: 0,
    deskColorPrimary: "#14532d",
    deskColorSecondary: "#166534",
    deskColorTertiary: "#15803d",
    deskColorQuaternary: "#052e16",
    grainOpacity: 0.08,
    ambientLight: "rgba(74, 222, 128, 0.12)",
    requiredWins: 5,
  },
  wet_desk: {
    id: "wet_desk",
    name: "Wet Desk",
    emoji: "💧",
    description: "Random drift every frame. Water puddles cause chaotic, unpredictable trajectories.",
    frictionMultiplier: 1.01,
    driftEnabled: true,
    driftIntensity: 0.6,
    deskColorPrimary: "#44403c",
    deskColorSecondary: "#57534e",
    deskColorTertiary: "#78716c",
    deskColorQuaternary: "#292524",
    grainOpacity: 0.10,
    ambientLight: "rgba(186, 230, 253, 0.18)",
    requiredWins: 8,
  },
};

// ══════ PEN SKINS ══════

export const PEN_SKINS: Record<PenSkinId, SkinDefinition> = {
  default: {
    id: "default",
    name: "Stock",
    emoji: "🖊️",
    description: "Factory default finish.",
    isUnlockedByDefault: true,
    requiredWins: 0,
    overlayType: "none",
    color1: "transparent",
    color2: "transparent",
  },
  flames: {
    id: "flames",
    name: "Inferno",
    emoji: "🔥",
    description: "Blazing fire trail that intensifies with speed.",
    isUnlockedByDefault: false,
    requiredWins: 2,
    overlayType: "particles",
    color1: "#ef4444",
    color2: "#f59e0b",
  },
  glitter: {
    id: "glitter",
    name: "Sparkle Dust",
    emoji: "✨",
    description: "Leaves a trail of shimmering particles.",
    isUnlockedByDefault: false,
    requiredWins: 4,
    overlayType: "particles",
    color1: "#fbbf24",
    color2: "#f472b6",
  },
  neon_glow: {
    id: "neon_glow",
    name: "Neon Pulse",
    emoji: "💜",
    description: "Pulsating neon aura around your pen.",
    isUnlockedByDefault: false,
    requiredWins: 6,
    overlayType: "glow",
    color1: "#a855f7",
    color2: "#06b6d4",
  },
  school_logo: {
    id: "school_logo",
    name: "School Pride",
    emoji: "🏫",
    description: "Classic school emblem engraving.",
    isUnlockedByDefault: false,
    requiredWins: 3,
    overlayType: "pattern",
    color1: "#0284c7",
    color2: "#fbbf24",
  },
  galaxy: {
    id: "galaxy",
    name: "Cosmic Void",
    emoji: "🌌",
    description: "A swirling galaxy pattern with star particles.",
    isUnlockedByDefault: false,
    requiredWins: 12,
    overlayType: "glow",
    color1: "#7c3aed",
    color2: "#ec4899",
  },
  carbon_fiber: {
    id: "carbon_fiber",
    name: "Carbon Fiber",
    emoji: "⚫",
    description: "Sleek carbon weave texture overlay.",
    isUnlockedByDefault: false,
    requiredWins: 8,
    overlayType: "pattern",
    color1: "#1e293b",
    color2: "#475569",
  },
};

// ══════ POWER-UP DEFINITIONS ══════

export const POWER_UP_DEFINITIONS: Record<PenPowerUpType, PowerUpDefinition> = {
  eraser_shield: {
    type: "eraser_shield",
    name: "Eraser Shield",
    emoji: "🛡️",
    description: "Blocks one collision impact completely.",
    duration: 0, // One-time use
    color: "#3b82f6",
  },
  ink_splash: {
    type: "ink_splash",
    name: "Ink Splash",
    emoji: "🖋️",
    description: "Douses opponent in ink — reduces their friction by 15%.",
    duration: 180, // 3 seconds at 60fps
    color: "#6d28d9",
  },
  compass_spin: {
    type: "compass_spin",
    name: "Compass Spin",
    emoji: "🧭",
    description: "Auto-flick with maximum power aimed at opponent.",
    duration: 0, // Instant use
    color: "#f59e0b",
  },
};

export const TABLE_DIMENSIONS = {
  width: 1000,
  height: 1500,
  beveledEdgeWidth: 35,
};

export function createInitialPenRigidBody(
  id: "host" | "guest",
  modelId: PenModelId = "pilot_v5",
  capOn: boolean = true,
  skinId: PenSkinId = "default"
): PenRigidBody {
  const model = PEN_MODELS[modelId] || PEN_MODELS.pilot_v5;

  const isHost = id === "host";
  const length = model.length + (capOn ? 18 : 0);
  const mass = model.mass + (capOn ? 0.25 : 0);

  return {
    id,
    modelId,
    capOn,
    skinId,
    x: TABLE_DIMENSIONS.width / 2,
    y: isHost ? TABLE_DIMENSIONS.height - 350 : 350,
    angle: isHost ? -Math.PI / 2 : Math.PI / 2, // Facing each other
    vx: 0,
    vy: 0,
    va: 0,
    mass,
    length,
    width: model.width,
    isFallen: false,
    teeterProgress: 0,
    fallenZ: 0,
    hasShield: false,
    isInkSplashed: false,
    edgeBounceCount: 0,
    totalRotations: 0,
  };
}

/**
 * Calculate pen-fight specific wins from gamer profile
 */
export function getPenFightWins(): number {
  try {
    const raw = localStorage.getItem("livetalk_penfight_wins");
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function incrementPenFightWins(): number {
  const current = getPenFightWins();
  const next = current + 1;
  try {
    localStorage.setItem("livetalk_penfight_wins", String(next));
  } catch {}
  return next;
}

export function isPenUnlocked(pen: PenDefinition): boolean {
  if (pen.isUnlockedByDefault) return true;
  return getPenFightWins() >= (pen.requiredWins || 0);
}

export function isSurfaceUnlocked(surface: SurfaceDefinition): boolean {
  return getPenFightWins() >= surface.requiredWins;
}

export function isSkinUnlocked(skin: SkinDefinition): boolean {
  if (skin.isUnlockedByDefault) return true;
  return getPenFightWins() >= skin.requiredWins;
}
