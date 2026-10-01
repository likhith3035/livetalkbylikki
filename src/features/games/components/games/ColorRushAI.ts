import { ColorRushGameState } from "../../types";

export interface ColorRushAIPersona {
  name: string;
  avatar: string;
  title: string;
  brushSpeed: number; // cells per step
  huntPowerUps: boolean;
  overwriteAggression: number; // 0 (passive) to 1 (aggressive territory stealer)
  stepIntervalMs: number; // tick rate
}

export const COLOR_RUSH_AI_PERSONAS: Record<string, ColorRushAIPersona> = {
  easy: {
    name: "Pixel Pup 🐶",
    avatar: "🐶",
    title: "Playful Novice (Easy)",
    brushSpeed: 0.8,
    huntPowerUps: false,
    overwriteAggression: 0.2,
    stepIntervalMs: 140,
  },
  medium: {
    name: "Neon Fox 🦊",
    avatar: "🦊",
    title: "Territory Stalker (Medium)",
    brushSpeed: 1.4,
    huntPowerUps: true,
    overwriteAggression: 0.55,
    stepIntervalMs: 100,
  },
  hard: {
    name: "Cyber Dragon 🐉",
    avatar: "🐉",
    title: "Arena Overlord (Hard)",
    brushSpeed: 2.2,
    huntPowerUps: true,
    overwriteAggression: 0.85,
    stepIntervalMs: 70,
  },
};

export interface ColorRushAIControllerState {
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  targetType: "powerup" | "neutral" | "enemy" | "wander";
  stepsRemainingInStroke: number;
}

/**
 * Initializes the AI bot at a sensible starting quadrant (usually bottom or top-right).
 */
export function initColorRushAIState(gridWidth = 24, gridHeight = 24): ColorRushAIControllerState {
  const startX = Math.floor(gridWidth * 0.75);
  const startY = Math.floor(gridHeight * 0.75);
  return {
    currentX: startX,
    currentY: startY,
    targetX: startX,
    targetY: startY,
    targetType: "wander",
    stepsRemainingInStroke: 0,
  };
}

/**
 * Selects a high-value destination for the bot based on board state and difficulty.
 */
function pickNextTarget(
  state: ColorRushGameState,
  aiState: ColorRushAIControllerState,
  persona: ColorRushAIPersona,
  botPlayerNum: 1 | 2
): { targetX: number; targetY: number; targetType: "powerup" | "neutral" | "enemy" | "wander" } {
  const { grid, gridWidth, gridHeight, powerUps } = state;
  const opponentNum = botPlayerNum === 1 ? 2 : 1;

  // 1. Power-up priority
  if (persona.huntPowerUps && powerUps && powerUps.length > 0) {
    const activePu = powerUps.find((p) => p.active);
    if (activePu) {
      return {
        targetX: activePu.x,
        targetY: activePu.y,
        targetType: "powerup",
      };
    }
  }

  // 2. Overwrite Opponent Territory vs Neutral Territory
  const shouldOverwrite = Math.random() < persona.overwriteAggression;

  if (shouldOverwrite) {
    // Find candidate opponent cells
    const enemyCells: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (grid[y * gridWidth + x] === opponentNum) {
          enemyCells.push({ x, y });
        }
      }
    }

    if (enemyCells.length > 0) {
      // Pick random enemy cell cluster to slice into
      const picked = enemyCells[Math.floor(Math.random() * enemyCells.length)];
      return {
        targetX: picked.x,
        targetY: picked.y,
        targetType: "enemy",
      };
    }
  }

  // 3. Search for unpainted neutral cells
  const neutralCells: Array<{ x: number; y: number }> = [];
  for (let y = 1; y < gridHeight - 1; y += 2) {
    for (let x = 1; x < gridWidth - 1; x += 2) {
      if (grid[y * gridWidth + x] === 0) {
        neutralCells.push({ x, y });
      }
    }
  }

  if (neutralCells.length > 0) {
    const picked = neutralCells[Math.floor(Math.random() * neutralCells.length)];
    return {
      targetX: picked.x,
      targetY: picked.y,
      targetType: "neutral",
    };
  }

  // Fallback: Random coordinate in arena
  return {
    targetX: Math.floor(1 + Math.random() * (gridWidth - 2)),
    targetY: Math.floor(1 + Math.random() * (gridHeight - 2)),
    targetType: "wander",
  };
}

/**
 * Steps the AI agent towards its target, interpolating intermediate brush positions.
 */
export function stepColorRushAI(
  state: ColorRushGameState,
  aiState: ColorRushAIControllerState,
  difficulty: "easy" | "medium" | "hard" = "medium",
  botPlayerNum: 1 | 2 = 2
): { nextAiState: ColorRushAIControllerState; nextStroke: { x: number; y: number } | null } {
  // If bot is frozen by opponent's power-up, it cannot paint
  const now = Date.now();
  if (botPlayerNum === 2 && state.guestFrozenUntil > now) {
    return { nextAiState: aiState, nextStroke: null };
  }
  if (botPlayerNum === 1 && state.hostFrozenUntil > now) {
    return { nextAiState: aiState, nextStroke: null };
  }

  const persona = COLOR_RUSH_AI_PERSONAS[difficulty] || COLOR_RUSH_AI_PERSONAS.medium;

  const currentX = aiState.currentX;
  const currentY = aiState.currentY;
  let targetX = aiState.targetX;
  let targetY = aiState.targetY;
  let targetType = aiState.targetType;

  // Check if near target
  const distToTarget = Math.hypot(targetX - currentX, targetY - currentY);
  if (distToTarget <= persona.brushSpeed || aiState.stepsRemainingInStroke <= 0) {
    const nextTarget = pickNextTarget(state, aiState, persona, botPlayerNum);
    targetX = nextTarget.targetX;
    targetY = nextTarget.targetY;
    targetType = nextTarget.targetType;
    aiState.stepsRemainingInStroke = Math.floor(10 + Math.random() * 15);
  }

  // Move towards target
  const angle = Math.atan2(targetY - currentY, targetX - currentX);
  const nextX = Math.max(0, Math.min(state.gridWidth - 1, currentX + Math.cos(angle) * persona.brushSpeed));
  const nextY = Math.max(0, Math.min(state.gridHeight - 1, currentY + Math.sin(angle) * persona.brushSpeed));

  const updatedAiState: ColorRushAIControllerState = {
    currentX: nextX,
    currentY: nextY,
    targetX,
    targetY,
    targetType,
    stepsRemainingInStroke: aiState.stepsRemainingInStroke - 1,
  };

  return {
    nextAiState: updatedAiState,
    nextStroke: { x: nextX, y: nextY },
  };
}
