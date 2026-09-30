import { describe, it, expect } from "vitest";
import {
  calculateGridPercentages,
  createInitialColorRushState,
  applyPaintStroke,
  applyPaintPath,
  spawnColorRushPowerUp,
  COLOR_RUSH_THEMES,
} from "@/features/games/data/colorRushData";
import { ColorRushGameState } from "@/features/games/types";

describe("ColorRush Game Mechanics", () => {
  it("initializes a neutral 24x24 grid with correct dimensions and zero player control", () => {
    const state = createInitialColorRushState(30, "#06b6d4", "#f43f5e");
    expect(state.grid.length).toBe(24 * 24);
    expect(state.hostPct).toBe(0);
    expect(state.guestPct).toBe(0);
    expect(state.neutralPct).toBe(100);
    expect(state.timerDurationSeconds).toBe(30);
    expect(state.hostColor).toBe("#06b6d4");
    expect(state.guestColor).toBe("#f43f5e");
  });

  it("calculates accurate area percentages after painting cells", () => {
    const totalCells = 24 * 24; // 576
    const grid = new Array(totalCells).fill(0);
    // Paint exactly 50% host (288 cells), 25% guest (144 cells), 25% neutral (144 cells)
    for (let i = 0; i < 288; i++) grid[i] = 1;
    for (let i = 288; i < 432; i++) grid[i] = 2;

    const pcts = calculateGridPercentages(grid, 24, 24);
    expect(pcts.hostPct).toBe(50);
    expect(pcts.guestPct).toBe(25);
    expect(pcts.neutralPct).toBe(25);
  });

  it("applies paint brush radius with cell overwriting", () => {
    let state = createInitialColorRushState(30);
    // Host paints around center (12, 12) with brush radius 2
    state = applyPaintStroke(state, 12, 12, 1, 2);
    expect(state.hostPct).toBeGreaterThan(0);

    // Guest overwrites center (12, 12) with brush radius 3
    state = applyPaintStroke(state, 12, 12, 2, 3);
    expect(state.guestPct).toBeGreaterThan(0);

    // Cell at center should now belong to guest (2)
    const centerIdx = 12 * 24 + 12;
    expect(state.grid[centerIdx]).toBe(2);
  });

  it("paints continuous interpolated paths between points with applyPaintPath", () => {
    let state = createInitialColorRushState(30);
    // Drag horizontally from (2, 5) to (10, 5)
    state = applyPaintPath(state, 2, 5, 10, 5, 1, 1.5);
    expect(state.hostPct).toBeGreaterThan(4);

    // Verify all intermediate cells along the path are captured
    for (let x = 2; x <= 10; x++) {
      const idx = 5 * 24 + x;
      expect(state.grid[idx]).toBe(1);
    }
  });

  it("handles frozen status without modifying grid", () => {
    let state = createInitialColorRushState(30);
    state.hostFrozenUntil = Date.now() + 5000;

    const beforeGrid = [...state.grid];
    state = applyPaintStroke(state, 10, 10, 1, 2);
    expect(state.grid).toEqual(beforeGrid);
    expect(state.hostPct).toBe(0);
  });

  it("spawns power-up crates within grid bounds", () => {
    let state = createInitialColorRushState(30);
    state = spawnColorRushPowerUp(state);
    expect(state.powerUps.length).toBe(1);
    const pu = state.powerUps[0];
    expect(pu.x).toBeGreaterThanOrEqual(0);
    expect(pu.x).toBeLessThan(24);
    expect(pu.y).toBeGreaterThanOrEqual(0);
    expect(pu.y).toBeLessThan(24);
    expect(["bomb", "turbo", "freeze"]).toContain(pu.type);
  });

  it("triggers bomb power-up explosion when collected", () => {
    let state = createInitialColorRushState(30);
    // Manually place a bomb power-up at (10, 10)
    state.powerUps = [
      {
        id: "pu_test_bomb",
        type: "bomb",
        x: 10,
        y: 10,
        active: true,
        spawnedAt: Date.now(),
      },
    ];

    // Host paints over (10, 10) to collect the bomb
    state = applyPaintStroke(state, 10, 10, 1, 1.5);
    // Bomb should be consumed
    expect(state.powerUps.length).toBe(0);
    // Bomb paints an expanded radius, host area should be significant
    expect(state.hostPct).toBeGreaterThan(3);
  });

  it("contains valid built-in themes", () => {
    expect(COLOR_RUSH_THEMES.neon_cyber).toBeDefined();
    expect(COLOR_RUSH_THEMES.retro_arcade).toBeDefined();
    expect(COLOR_RUSH_THEMES.laser_duel).toBeDefined();
    expect(COLOR_RUSH_THEMES.fire_ice).toBeDefined();
  });

  it("integrates with createInitialGameState and GAME_RULES", async () => {
    const { createInitialGameState } = await import("@/features/games/services/gameRoomService");
    const { GAME_RULES } = await import("@/features/games/data/gameRulesData");

    const state = createInitialGameState("colorrush", { turnTimerSeconds: 60 } as any) as ColorRushGameState;
    expect(state).toBeDefined();
    expect(state.timerDurationSeconds).toBe(60);
    expect(state.grid.length).toBe(24 * 24);

    expect(GAME_RULES.colorrush).toBeDefined();
    expect(GAME_RULES.colorrush.gameId).toBe("colorrush");
    expect(GAME_RULES.colorrush.steps.length).toBe(4);
    expect(GAME_RULES.colorrush.proTips.length).toBeGreaterThan(0);
  });

  it("drives autonomous AI bot movements and steps towards targets", async () => {
    const { initColorRushAIState, stepColorRushAI, COLOR_RUSH_AI_PERSONAS } = await import(
      "@/features/games/components/games/ColorRushAI"
    );

    expect(COLOR_RUSH_AI_PERSONAS.easy).toBeDefined();
    expect(COLOR_RUSH_AI_PERSONAS.medium).toBeDefined();
    expect(COLOR_RUSH_AI_PERSONAS.hard).toBeDefined();

    let aiState = initColorRushAIState(24, 24);
    const gameState = createInitialColorRushState(30);

    const stepResult = stepColorRushAI(gameState, aiState, "hard", 2);
    expect(stepResult.nextStroke).toBeDefined();
    expect(stepResult.nextStroke?.x).toBeGreaterThanOrEqual(0);
    expect(stepResult.nextStroke?.x).toBeLessThan(24);
    expect(stepResult.nextStroke?.y).toBeGreaterThanOrEqual(0);
    expect(stepResult.nextStroke?.y).toBeLessThan(24);
  });
});


