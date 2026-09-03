import { describe, it, expect } from "vitest";
import {
  calculateBingoLines,
  getSmartBingoAIMove,
  generateRandomBingoCard,
} from "@/features/games/components/games/BingoGame";
import { createInitialGameState } from "@/features/games/services/gameRoomService";
import { BingoGameState } from "@/features/games/types";

describe("Bingo Blitz Duel Game Logic", () => {
  // Deterministic 5x5 card with numbers 1 to 25
  const sampleCard = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
  ];

  describe("Initial State Creation & Card Generation", () => {
    it("initializes a valid 5x5 Bingo game state with randomized cards", () => {
      const state = createInitialGameState("bingo") as BingoGameState;
      expect(state.hostCard).toHaveLength(5);
      expect(state.hostCard[0]).toHaveLength(5);
      expect(state.guestCard).toHaveLength(5);
      expect(state.stampedNumbers).toEqual([]);
      expect(state.hostLines).toBe(0);
      expect(state.guestLines).toBe(0);
      expect(state.lastCalledNumber).toBeNull();
    });

    it("generates a card with all numbers 1 to 25 uniquely", () => {
      const card = generateRandomBingoCard();
      const flat = card.flat();
      expect(flat).toHaveLength(25);
      const unique = new Set(flat);
      expect(unique.size).toBe(25);
      for (let i = 1; i <= 25; i++) {
        expect(unique.has(i)).toBe(true);
      }
    });
  });

  describe("Bingo Line Detection Engine", () => {
    it("detects completed horizontal rows", () => {
      // Stamp entire row 0: 1, 2, 3, 4, 5
      const stamped = [1, 2, 3, 4, 5];
      const res = calculateBingoLines(sampleCard, stamped);
      expect(res.count).toBe(1);
      expect(res.completedLineIds).toContain("row-0");
    });

    it("does not count incomplete rows", () => {
      // 4 out of 5 in row 0
      const stamped = [1, 2, 3, 4];
      const res = calculateBingoLines(sampleCard, stamped);
      expect(res.count).toBe(0);
      expect(res.completedLineIds).toHaveLength(0);
    });

    it("detects completed vertical columns", () => {
      // Stamp column 2: 3, 8, 13, 18, 23
      const stamped = [3, 8, 13, 18, 23];
      const res = calculateBingoLines(sampleCard, stamped);
      expect(res.count).toBe(1);
      expect(res.completedLineIds).toContain("col-2");
    });

    it("detects main diagonal ↘ completion", () => {
      // Stamp main diagonal: 1, 7, 13, 19, 25
      const stamped = [1, 7, 13, 19, 25];
      const res = calculateBingoLines(sampleCard, stamped);
      expect(res.count).toBe(1);
      expect(res.completedLineIds).toContain("diag-main");
    });

    it("detects anti diagonal ↗ completion", () => {
      // Stamp anti diagonal: 5, 9, 13, 17, 21
      const stamped = [5, 9, 13, 17, 21];
      const res = calculateBingoLines(sampleCard, stamped);
      expect(res.count).toBe(1);
      expect(res.completedLineIds).toContain("diag-anti");
    });

    it("detects simultaneous multi-line completion (B-I-N-G-O progression)", () => {
      // Stamp Row 0, Row 1, Col 0, Col 4, Diag Main
      const stamped = [
        1, 2, 3, 4, 5,       // Row 0
        6, 7, 8, 9, 10,      // Row 1
        11, 16, 21,          // Completes Col 0 (1, 6, 11, 16, 21)
        15, 20, 25,          // Completes Col 4 (5, 10, 15, 20, 25)
        13, 19,              // Completes Diag Main (1, 7, 13, 19, 25)
      ];

      const res = calculateBingoLines(sampleCard, stamped);
      expect(res.count).toBe(5);
      expect(res.completedLineIds).toContain("row-0");
      expect(res.completedLineIds).toContain("row-1");
      expect(res.completedLineIds).toContain("col-0");
      expect(res.completedLineIds).toContain("col-4");
      expect(res.completedLineIds).toContain("diag-main");
    });
  });

  describe("Smart AI Opponent Strategy", () => {
    it("AI selects a valid unstamped number", () => {
      const stamped = [1, 2, 3, 4, 5];
      const move = getSmartBingoAIMove(sampleCard, stamped, "medium");
      expect(move).toBeGreaterThanOrEqual(1);
      expect(move).toBeLessThanOrEqual(25);
      expect(stamped.includes(move)).toBe(false);
    });

    it("AI prioritizes a number that completes a 4/5 line", () => {
      // Card has 1, 2, 3, 4 stamped in row 0. 5 is missing.
      const stamped = [1, 2, 3, 4];
      const move = getSmartBingoAIMove(sampleCard, stamped, "hard");
      expect(move).toBe(5);
    });
  });
});
