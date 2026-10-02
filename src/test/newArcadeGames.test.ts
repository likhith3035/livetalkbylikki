import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../features/games/services/gameRoomService";
import { ALL_GAME_RULES } from "../features/games/data/gameRulesData";
import {
  DotsBoxesGameState,
  AirHockeyGameState,
  TypeRaceGameState,
  WordClashGameState,
} from "../features/games/types";

describe("New Arcade Games Add-Ons Integration", () => {
  it("initializes Dots & Boxes game state correctly", () => {
    const state = createInitialGameState("dotsboxes") as DotsBoxesGameState;
    expect(state).toBeDefined();
    expect(state.gridSize).toBe(5);
    expect(state.totalBoxes).toBe(16);
    expect(state.hostScore).toBe(0);
    expect(state.guestScore).toBe(0);
    expect(Object.keys(state.lines).length).toBe(0);
    expect(Object.keys(state.boxes).length).toBe(0);
  });

  it("initializes Neon Air Hockey 1v1 state with table physics", () => {
    const state = createInitialGameState("airhockey") as AirHockeyGameState;
    expect(state).toBeDefined();
    expect(state.tableWidth).toBe(600);
    expect(state.tableHeight).toBe(900);
    expect(state.maxScore).toBe(5);
    expect(state.puck.x).toBe(300);
    expect(state.puck.y).toBe(450);
    expect(state.hostPaddle.y).toBeGreaterThan(state.guestPaddle.y);
  });

  it("initializes Speed Typing Nitro Race with valid prompt words", () => {
    const state = createInitialGameState("typerace") as TypeRaceGameState;
    expect(state).toBeDefined();
    expect(state.promptText.length).toBeGreaterThan(15);
    expect(state.words.length).toBeGreaterThan(3);
    expect(state.hostCharIndex).toBe(0);
    expect(state.hostAccuracy).toBe(100);
    expect(state.hostFinished).toBe(false);
  });

  it("initializes Word Clash 1v1 with secret 5-letter word and clue", () => {
    const state = createInitialGameState("wordclash") as WordClashGameState;
    expect(state).toBeDefined();
    expect(state.targetWord.length).toBe(5);
    expect(state.maxAttempts).toBe(6);
    expect(state.clueHint).toBeTruthy();
    expect(state.hostAttempts.length).toBe(0);
    expect(state.revealed).toBe(false);
  });

  it("provides comprehensive rule guides for all 4 new games", () => {
    const newGames = ["dotsboxes", "airhockey", "typerace", "wordclash"] as const;

    for (const gid of newGames) {
      const guide = ALL_GAME_RULES[gid];
      expect(guide).toBeDefined();
      expect(guide.title).toBeTruthy();
      expect(guide.tagline).toBeTruthy();
      expect(guide.steps.length).toBeGreaterThanOrEqual(3);
      expect(guide.proTips.length).toBeGreaterThanOrEqual(2);
      expect(guide.winCondition).toBeTruthy();
    }
  });

  it("evaluates Word Clash letter matching logic accurately", () => {
    const evaluateWord = (guess: string, target: string) => {
      const results: string[] = Array(5).fill("absent");
      const targetLetters = target.split("");
      const guessLetters = guess.split("");

      // Greens
      for (let i = 0; i < 5; i++) {
        if (guessLetters[i] === targetLetters[i]) {
          results[i] = "correct";
          targetLetters[i] = "";
          guessLetters[i] = "";
        }
      }

      // Yellows
      for (let i = 0; i < 5; i++) {
        if (guessLetters[i] && targetLetters.includes(guessLetters[i])) {
          results[i] = "present";
          const idx = targetLetters.indexOf(guessLetters[i]);
          targetLetters[idx] = "";
        }
      }

      return results;
    };

    expect(evaluateWord("REACT", "REACT")).toEqual(["correct", "correct", "correct", "correct", "correct"]);
    expect(evaluateWord("CRANE", "REACT")).toEqual(["present", "present", "correct", "absent", "present"]);
    expect(evaluateWord("GHOST", "REACT")).toEqual(["absent", "absent", "absent", "absent", "correct"]);
  });

  it("detects rolling keystroke sequence 'likki' for Memory Game X-Ray cheat activation", () => {
    let keyBuffer = "";
    let isCheatActive = false;

    const simulateKeyPress = (key: string) => {
      keyBuffer = (keyBuffer + key.toLowerCase()).slice(-5);
      if (keyBuffer === "likki") {
        keyBuffer = "";
        isCheatActive = !isCheatActive;
      }
    };

    // Random typing noise before typing the secret code
    ["a", "b", "c", "d"].forEach(simulateKeyPress);
    expect(isCheatActive).toBe(false);

    // Typing 'likki' activates cheat
    ["l", "i", "k", "k", "i"].forEach(simulateKeyPress);
    expect(isCheatActive).toBe(true);

    // Typing 'likki' again toggles cheat off
    ["L", "I", "K", "K", "I"].forEach(simulateKeyPress);
    expect(isCheatActive).toBe(false);
  });
});
