# Color Rush 1v1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a high-octane 2-player real-time territory-control game called **Color Rush**, where players tap and drag to paint arena cells with their color against a live timer (15s/30s/60s/90s), featuring dynamic power-ups, custom color themes, AI bots, zero-latency local mode, and end-of-round frozen area percentage victory calculation.

**Architecture:** A fast 2D canvas/grid matrix representation (24x24 cells) backed by `ColorRushGameState` in `src/features/games/types.ts`. Synchronization via Supabase Realtime broadcast channels using high-frequency paint point batching with local optimistic prediction for zero-latency mobile touch/drag. AI engine simulating natural human drag paths with difficulty levels (Easy, Medium, Hard). Audio chimes, haptics, and end-of-round area scanning animation.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Framer Motion, HTML5 Canvas, Vitest, Web Audio API (`gameSoundService`), Capacitor Haptics (`gameHapticsService`), Supabase Realtime.

---

### Task 1: Game Types & State Architecture
**Files:**
- Modify: `src/features/games/types.ts:1-20, 390-420`
- Create: `src/features/games/data/colorRushData.ts`
- Test: `src/test/colorRushGame.test.ts`

**Step 1: Write the failing unit tests for Color Rush game state and calculations**
```typescript
// src/test/colorRushGame.test.ts
import { describe, it, expect } from "vitest";
import {
  calculateGridPercentages,
  createInitialColorRushState,
  applyPaintStroke,
  COLOR_RUSH_THEMES,
} from "@/features/games/data/colorRushData";

describe("ColorRush Game Mechanics", () => {
  it("initializes a neutral 24x24 grid with correct dimensions and zero player control", () => {
    const state = createInitialColorRushState(30, "#06b6d4", "#f43f5e");
    expect(state.grid.length).toBe(24 * 24);
    expect(state.hostPct).toBe(0);
    expect(state.guestPct).toBe(0);
    expect(state.neutralPct).toBe(100);
    expect(state.timerDurationSeconds).toBe(30);
  });

  it("calculates accurate area percentages after painting cells", () => {
    const totalCells = 24 * 24; // 576
    const grid = new Array(totalCells).fill(0);
    // Paint 288 cells host (50%), 144 guest (25%), 144 neutral (25%)
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
});
```

**Step 2: Run test to verify it fails**
Run: `npm test src/test/colorRushGame.test.ts`
Expected: FAIL (Cannot find module `@/features/games/data/colorRushData`)

**Step 3: Implement Game Types & Helper Functions**
1. Update `src/features/games/types.ts`:
   - Add `"colorrush"` to `GameId`:
     ```typescript
     export type GameId = "ttt" | "connect4" | "rps" | "memory" | "reaction" | "sos" | "bingo" | "cricket" | "taptug" | "penfight" | "colorrush";
     ```
   - Define `ColorRushPowerUp` and `ColorRushGameState`:
     ```typescript
     export type ColorRushTimerOption = 15 | 30 | 60 | 90;

     export interface ColorRushPowerUp {
       id: string;
       type: "bomb" | "turbo" | "freeze" | "shield";
       x: number;
       y: number;
       active: boolean;
       spawnedAt: number;
     }

     export interface ColorRushGameState {
       grid: number[]; // 0 = neutral, 1 = host, 2 = guest
       gridWidth: number;
       gridHeight: number;
       hostColor: string;
       guestColor: string;
       themeId: string;
       hostPct: number;
       guestPct: number;
       neutralPct: number;
       timerDurationSeconds: ColorRushTimerOption;
       timeRemainingSeconds: number;
       startedAt: number;
       frozenAt: number | null;
       hostFrozenUntil: number;
       guestFrozenUntil: number;
       hostTurboUntil: number;
       guestTurboUntil: number;
       powerUps: ColorRushPowerUp[];
       lastMoveTimestamp: number;
       winner: "host" | "guest" | "draw" | null;
     }
     ```
2. Create `src/features/games/data/colorRushData.ts`:
   - Implement `calculateGridPercentages(grid, width, height)`
   - Implement `createInitialColorRushState(duration, hostColor, guestColor)`
   - Implement `applyPaintStroke(state, cellX, cellY, playerNum, radius, isShielded)`
   - Provide presets in `COLOR_RUSH_THEMES` (Cyber Neon, Retro Sunset, Acid Lime vs Indigo, Crimson vs Glacier).

**Step 4: Run test to verify it passes**
Run: `npm test src/test/colorRushGame.test.ts`
Expected: PASS (all tests pass)

---

### Task 2: Game Rules & Room Service Integration
**Files:**
- Modify: `src/features/games/data/gameRulesData.ts`
- Modify: `src/features/games/services/gameRoomService.ts:210-240`
- Test: `src/test/colorRushGame.test.ts`

**Step 1: Write tests for room creation & rule data**
Add tests verifying:
- `createInitialGameState("colorrush")` produces valid `ColorRushGameState`.
- `GAME_RULES.colorrush` contains complete instructions, tips, and step-by-step tutorial.

**Step 2: Run test to verify failure**
Run: `npm test src/test/colorRushGame.test.ts`
Expected: FAIL with missing rule data for `colorrush`

**Step 3: Implement Game Registration**
1. In `src/features/games/data/gameRulesData.ts`:
   - Add `colorrush: { gameId: "colorrush", title: "Color Rush 1v1", ... }` with full descriptions, win conditions, and tips.
2. In `src/features/games/services/gameRoomService.ts`:
   - Add `case "colorrush": return createInitialColorRushState(...);` in `createInitialGameState`.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/colorRushGame.test.ts`
Expected: PASS

---

### Task 3: Color Rush Autonomous AI Bot Engine
**Files:**
- Create: `src/features/games/components/games/ColorRushAI.ts`
- Test: `src/test/colorRushGame.test.ts`

**Step 1: Write failing tests for AI simulation**
```typescript
it("generates intelligent path strokes for AI opponent based on difficulty", () => {
  const state = createInitialColorRushState(30);
  const botMove = getBotNextStroke(state, "medium", 2);
  expect(botMove.x).toBeGreaterThanOrEqual(0);
  expect(botMove.x).toBeLessThan(24);
  expect(botMove.y).toBeGreaterThanOrEqual(0);
  expect(botMove.y).toBeLessThan(24);
});
```

**Step 2: Run test to verify failure**
Run: `npm test src/test/colorRushGame.test.ts`
Expected: FAIL (`getBotNextStroke` undefined)

**Step 3: Implement `ColorRushAI.ts`**
- `Easy`: Random walk with slight bias towards neutral cells.
- `Medium`: Seeks nearest unpainted neutral clusters and active power-ups.
- `Hard`: Aggressively slices through player territory borders, collects power-ups instantly, and uses overdrive bursts.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/colorRushGame.test.ts`
Expected: PASS

---

### Task 4: Interactive Arena Component (`ColorRushGame.tsx`)
**Files:**
- Create: `src/features/games/components/games/ColorRushGame.tsx`
- Modify: `src/pages/GamesPage.tsx:180-200, 920-950`

**Step 1: Build the UI & Real-Time Paint Arena**
- **Canvas / Grid Rendering**:
  - 24x24 territory grid with rounded corners and glowing cell borders.
  - Smooth interpolation for continuous drag paths between pointer events.
  - Animated ink splat particles on tap.
- **Top HUD**:
  - Live Dominance Bar: Split bar displaying real-time percentages with animated gradients (`Host %` vs `Guest %`).
  - Digital Countdown Clock with pulsing alert under 5 seconds.
  - Power-up status indicators (Turbo, Freeze, Shield).
- **Control Bar**:
  - Timer selector (15s, 30s, 60s, 90s) before start.
  - Color palette switcher (Blue/Pink, Cyan/Magenta, Gold/Purple, Custom picker).
  - Mode badge (AI / Friend / Local Split / Quick Match).
- **Freeze & Finish Phase**:
  - At `timeRemainingSeconds === 0`:
  - Canvas locks, ice frost overlay animates.
  - Laser scanline sweeps across the grid calculating final captured percentages down to 1 decimal place.
  - Trigger `VictoryModal` and confetti explosion with the winning player's color.

**Step 2: Wire up `GamesPage.tsx`**
- Add `colorrush` to the Game Catalog list with icon `🎨`, category `Action/Reflex`, and `gradient: "from-cyan-500 via-fuchsia-500 to-pink-500"`.
- Render `<ColorRushGame />` when `activeRoom.gameId === "colorrush"`.

---

### Task 5: Audio, Haptics & Polish
**Files:**
- Modify: `src/features/games/components/games/ColorRushGame.tsx`
- Add sound triggers: paint splash, power-up pickup, 5s countdown tick, final freeze whistle.
- Add haptic pulses on drag stroke and territory overwrite.

---

### Task 6: Full Verification & Build
**Commands:**
- `npm test` (verify all unit tests pass)
- `npm run build` (verify clean production bundle and TypeScript types)
