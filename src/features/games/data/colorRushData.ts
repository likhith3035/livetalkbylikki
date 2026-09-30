import { ColorRushGameState, ColorRushPowerUp, ColorRushTimerOption } from "../types";

export const DEFAULT_GRID_SIZE = 24; // 24x24 = 576 cells

export interface ColorRushTheme {
  id: string;
  name: string;
  hostColor: string;
  guestColor: string;
  hostName: string;
  guestName: string;
  arenaBackground: string;
  neutralCellColor: string;
}

export const COLOR_RUSH_THEMES: Record<string, ColorRushTheme> = {
  neon_cyber: {
    id: "neon_cyber",
    name: "Cyber Neon",
    hostColor: "#06b6d4", // Electric Cyan
    guestColor: "#f43f5e", // Hot Pink
    hostName: "Neon Cyan",
    guestName: "Hot Pink",
    arenaBackground: "#090912",
    neutralCellColor: "#171727",
  },
  retro_arcade: {
    id: "retro_arcade",
    name: "Retro Arcade",
    hostColor: "#8b5cf6", // Electric Violet
    guestColor: "#f59e0b", // Radiant Amber
    hostName: "Ultra Violet",
    guestName: "Solar Amber",
    arenaBackground: "#0b0814",
    neutralCellColor: "#1a1529",
  },
  laser_duel: {
    id: "laser_duel",
    name: "Mint Laser",
    hostColor: "#10b981", // Acid Lime
    guestColor: "#6366f1", // Deep Indigo
    hostName: "Laser Lime",
    guestName: "Pulse Indigo",
    arenaBackground: "#060d0b",
    neutralCellColor: "#13211c",
  },
  fire_ice: {
    id: "fire_ice",
    name: "Fire & Ice",
    hostColor: "#38bdf8", // Glacier Blue
    guestColor: "#ea580c", // Blaze Orange
    hostName: "Glacier Blue",
    guestName: "Blaze Orange",
    arenaBackground: "#090c13",
    neutralCellColor: "#161d2d",
  },
  classic_clash: {
    id: "classic_clash",
    name: "Classic Clash",
    hostColor: "#3b82f6", // Royal Blue
    guestColor: "#ec4899", // Magenta Pink
    hostName: "Royal Blue",
    guestName: "Magenta Pink",
    arenaBackground: "#080b13",
    neutralCellColor: "#151b29",
  },
};

export const COLOR_SWATCHES = [
  "#06b6d4", // Cyan
  "#f43f5e", // Pink
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#38bdf8", // Sky Blue
  "#ea580c", // Orange
  "#ec4899", // Bubblegum
  "#a855f7", // Purple
  "#14b8a6", // Teal
  "#eab308", // Yellow
];

/**
 * Calculates territory percentage breakdown for both players and neutral territory.
 */
export function calculateGridPercentages(
  grid: number[],
  width = DEFAULT_GRID_SIZE,
  height = DEFAULT_GRID_SIZE
): { hostPct: number; guestPct: number; neutralPct: number } {
  const total = width * height;
  if (total === 0) return { hostPct: 0, guestPct: 0, neutralPct: 100 };

  let hostCount = 0;
  let guestCount = 0;
  let neutralCount = 0;

  for (let i = 0; i < grid.length; i++) {
    const val = grid[i];
    if (val === 1) hostCount++;
    else if (val === 2) guestCount++;
    else neutralCount++;
  }

  const hostPct = Number(((hostCount / total) * 100).toFixed(1));
  const guestPct = Number(((guestCount / total) * 100).toFixed(1));
  const neutralPct = Number(Math.max(0, 100 - hostPct - guestPct).toFixed(1));

  return { hostPct, guestPct, neutralPct };
}

/**
 * Initializes a new clean Color Rush game state.
 */
export function createInitialColorRushState(
  timerDuration: ColorRushTimerOption = 30,
  hostColor?: string,
  guestColor?: string,
  themeId = "neon_cyber"
): ColorRushGameState {
  const theme = COLOR_RUSH_THEMES[themeId] || COLOR_RUSH_THEMES.neon_cyber;
  const actualHostColor = hostColor || theme.hostColor;
  const actualGuestColor = guestColor || theme.guestColor;

  const totalCells = DEFAULT_GRID_SIZE * DEFAULT_GRID_SIZE;
  const grid = new Array(totalCells).fill(0);

  return {
    grid,
    gridWidth: DEFAULT_GRID_SIZE,
    gridHeight: DEFAULT_GRID_SIZE,
    hostColor: actualHostColor,
    guestColor: actualGuestColor,
    themeId,
    hostPct: 0,
    guestPct: 0,
    neutralPct: 100,
    timerDurationSeconds: timerDuration,
    timeRemainingSeconds: timerDuration,
    startedAt: Date.now(),
    frozenAt: null,
    hostFrozenUntil: 0,
    guestFrozenUntil: 0,
    hostTurboUntil: 0,
    guestTurboUntil: 0,
    powerUps: [],
    lastMoveTimestamp: Date.now(),
    winner: null,
    hostScore: 0,
    guestScore: 0,
  };
}

/**
 * Paints cells around (cellX, cellY) with a specific brush radius and applies collected power-ups.
 */
export function applyPaintStroke(
  state: ColorRushGameState,
  cellX: number,
  cellY: number,
  playerNum: 1 | 2,
  brushRadius = 1.6
): ColorRushGameState {
  const now = Date.now();
  // Check if player is frozen
  if (playerNum === 1 && state.hostFrozenUntil > now) return state;
  if (playerNum === 2 && state.guestFrozenUntil > now) return state;

  const isTurbo = playerNum === 1 ? state.hostTurboUntil > now : state.guestTurboUntil > now;
  const effectiveRadius = isTurbo ? brushRadius * 1.8 : brushRadius;

  const width = state.gridWidth;
  const height = state.gridHeight;
  const newGrid = [...state.grid];
  let touchedPowerUp: ColorRushPowerUp | null = null;

  const rFloor = Math.ceil(effectiveRadius);
  const minX = Math.max(0, Math.floor(cellX - rFloor));
  const maxX = Math.min(width - 1, Math.ceil(cellX + rFloor));
  const minY = Math.max(0, Math.floor(cellY - rFloor));
  const maxY = Math.min(height - 1, Math.ceil(cellY + rFloor));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cellX;
      const dy = y - cellY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= effectiveRadius) {
        const idx = y * width + x;
        newGrid[idx] = playerNum;

        // Check power-up collection
        if (state.powerUps && state.powerUps.length > 0) {
          for (const pu of state.powerUps) {
            if (pu.active && pu.x === x && pu.y === y) {
              touchedPowerUp = pu;
            }
          }
        }
      }
    }
  }

  let nextHostFrozenUntil = state.hostFrozenUntil;
  let nextGuestFrozenUntil = state.guestFrozenUntil;
  let nextHostTurboUntil = state.hostTurboUntil;
  let nextGuestTurboUntil = state.guestTurboUntil;
  let remainingPowerUps = state.powerUps;

  // Process power-up effect if collected
  if (touchedPowerUp) {
    remainingPowerUps = state.powerUps.filter((p) => p.id !== touchedPowerUp?.id);

    if (touchedPowerUp.type === "bomb") {
      // 5x5 circular blast around power-up
      const bombRadius = 3.2;
      for (let by = Math.max(0, Math.floor(touchedPowerUp.y - 3)); by <= Math.min(height - 1, Math.ceil(touchedPowerUp.y + 3)); by++) {
        for (let bx = Math.max(0, Math.floor(touchedPowerUp.x - 3)); bx <= Math.min(width - 1, Math.ceil(touchedPowerUp.x + 3)); bx++) {
          const d = Math.sqrt((bx - touchedPowerUp.x) ** 2 + (by - touchedPowerUp.y) ** 2);
          if (d <= bombRadius) {
            newGrid[by * width + bx] = playerNum;
          }
        }
      }
    } else if (touchedPowerUp.type === "turbo") {
      if (playerNum === 1) nextHostTurboUntil = now + 4000;
      else nextGuestTurboUntil = now + 4000;
    } else if (touchedPowerUp.type === "freeze") {
      // Freeze opponent for 2.5s
      if (playerNum === 1) nextGuestFrozenUntil = now + 2500;
      else nextHostFrozenUntil = now + 2500;
    }
  }

  const pcts = calculateGridPercentages(newGrid, width, height);

  return {
    ...state,
    grid: newGrid,
    hostPct: pcts.hostPct,
    guestPct: pcts.guestPct,
    neutralPct: pcts.neutralPct,
    hostFrozenUntil: nextHostFrozenUntil,
    guestFrozenUntil: nextGuestFrozenUntil,
    hostTurboUntil: nextHostTurboUntil,
    guestTurboUntil: nextGuestTurboUntil,
    powerUps: remainingPowerUps,
    lastMoveTimestamp: now,
  };
}

/**
 * Paints a continuous interpolated path from (fromX, fromY) to (toX, toY).
 * Ensures zero gaps in territory calculation during rapid drags.
 */
export function applyPaintPath(
  state: ColorRushGameState,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  playerNum: 1 | 2,
  brushRadius = 1.6
): ColorRushGameState {
  const dist = Math.hypot(toX - fromX, toY - fromY);
  const steps = Math.max(1, Math.ceil(dist / 0.4));
  let currentState = state;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const curX = fromX + (toX - fromX) * t;
    const curY = fromY + (toY - fromY) * t;
    currentState = applyPaintStroke(currentState, curX, curY, playerNum, brushRadius);
  }
  return currentState;
}

/**
 * Spawns a new tactical power-up at an unoccupied cell.
 */
export function spawnColorRushPowerUp(state: ColorRushGameState): ColorRushGameState {
  if (state.powerUps.length >= 3) return state; // Maximum 3 concurrent powerups

  const types: Array<ColorRushPowerUp["type"]> = ["bomb", "turbo", "freeze"];
  const randomType = types[Math.floor(Math.random() * types.length)];

  // Pick random coordinates within bounds (padded away from immediate edge)
  const x = Math.floor(2 + Math.random() * (state.gridWidth - 4));
  const y = Math.floor(2 + Math.random() * (state.gridHeight - 4));

  const newPowerUp: ColorRushPowerUp = {
    id: `pu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: randomType,
    x,
    y,
    active: true,
    spawnedAt: Date.now(),
  };

  return {
    ...state,
    powerUps: [...state.powerUps, newPowerUp],
  };
}
