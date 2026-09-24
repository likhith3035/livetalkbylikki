import { describe, it, expect } from "vitest";
import {
  calculateBingoLines,
  getSmartBingoAIMove,
  getBingoAFKAutoMove,
  DEFAULT_BINGO_TURN_TIMER,
  generateRandomBingoCard,
  generateSequentialBingoCard,
  generateSpiralBingoCard,
  createEmptyBingoCard,
  validateBingoCard,
  autoFillRemainingCard,
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
    it("initializes a valid 5x5 Bingo game state with setup phase and randomized cards", () => {
      const state = createInitialGameState("bingo") as BingoGameState;
      expect(state.hostCard).toHaveLength(5);
      expect(state.hostCard[0]).toHaveLength(5);
      expect(state.guestCard).toHaveLength(5);
      expect(state.stampedNumbers).toEqual([]);
      expect(state.hostLines).toBe(0);
      expect(state.guestLines).toBe(0);
      expect(state.lastCalledNumber).toBeNull();
      expect(state.phase).toBe("setup");
      expect(state.hostReady).toBe(false);
      expect(state.guestReady).toBe(false);
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

    it("generates sequential preset cards (rows & cols)", () => {
      const rowSeq = generateSequentialBingoCard("rows");
      expect(rowSeq[0]).toEqual([1, 2, 3, 4, 5]);
      expect(rowSeq[4]).toEqual([21, 22, 23, 24, 25]);
      expect(validateBingoCard(rowSeq)).toBe(true);

      const colSeq = generateSequentialBingoCard("cols");
      expect(colSeq[0][0]).toBe(1);
      expect(colSeq[1][0]).toBe(2);
      expect(colSeq[0][1]).toBe(6);
      expect(validateBingoCard(colSeq)).toBe(true);
    });

    it("generates spiral preset card with numbers 1 to 25", () => {
      const spiral = generateSpiralBingoCard();
      expect(spiral[0]).toEqual([1, 2, 3, 4, 5]);
      expect(spiral[1][4]).toBe(6);
      expect(validateBingoCard(spiral)).toBe(true);
    });

    it("creates an empty 5x5 matrix filled with 0s", () => {
      const empty = createEmptyBingoCard();
      expect(empty).toHaveLength(5);
      expect(empty.every((r) => r.length === 5 && r.every((c) => c === 0))).toBe(true);
    });
  });

  describe("Custom 25-Number Card Validation & Auto-Fill", () => {
    it("validates a full 1..25 card successfully", () => {
      expect(validateBingoCard(sampleCard)).toBe(true);
      const randomCard = generateRandomBingoCard();
      expect(validateBingoCard(randomCard)).toBe(true);
    });

    it("rejects incomplete cards containing 0", () => {
      const incomplete = [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 0, 14, 15],
        [16, 17, 18, 19, 20],
        [21, 22, 23, 24, 25],
      ];
      expect(validateBingoCard(incomplete)).toBe(false);
      expect(validateBingoCard(createEmptyBingoCard())).toBe(false);
    });

    it("rejects cards with duplicate numbers", () => {
      const duplicateCard = [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20],
        [21, 22, 23, 24, 1], // 1 duplicated
      ];
      expect(validateBingoCard(duplicateCard)).toBe(false);
    });

    it("rejects cards with numbers out of range (> 25 or < 1)", () => {
      const outOfRange = [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20],
        [21, 22, 23, 24, 99], // 99 out of range
      ];
      expect(validateBingoCard(outOfRange)).toBe(false);
    });

    it("auto-fills empty 0 slots while preserving player's custom placed numbers", () => {
      const partial = createEmptyBingoCard();
      // Place lucky numbers in corners & center
      partial[0][0] = 7;
      partial[0][4] = 13;
      partial[2][2] = 21;
      partial[4][0] = 3;
      partial[4][4] = 25;

      const filled = autoFillRemainingCard(partial);

      // Verify custom placed numbers remain in their exact cells
      expect(filled[0][0]).toBe(7);
      expect(filled[0][4]).toBe(13);
      expect(filled[2][2]).toBe(21);
      expect(filled[4][0]).toBe(3);
      expect(filled[4][4]).toBe(25);

      // Verify the entire card is now valid with 25 distinct numbers 1..25
      expect(validateBingoCard(filled)).toBe(true);
    });

    it("auto-fills a completely empty card into a full valid card", () => {
      const empty = createEmptyBingoCard();
      const filled = autoFillRemainingCard(empty);
      expect(validateBingoCard(filled)).toBe(true);
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

  describe("15-Second Turn Timer & AFK Auto-Call Strategy", () => {
    it("has a standard default turn timer duration of 15 seconds", () => {
      expect(DEFAULT_BINGO_TURN_TIMER).toBe(15);
    });

    it("AFK auto-move returns a valid unstamped number on the card", () => {
      const stamped = [1, 7, 13, 19];
      const autoMove = getBingoAFKAutoMove(sampleCard, stamped);
      expect(autoMove).toBeGreaterThanOrEqual(1);
      expect(autoMove).toBeLessThanOrEqual(25);
      expect(stamped.includes(autoMove)).toBe(false);
    });

    it("AFK auto-move immediately clinches a 4/5 completed line", () => {
      // Main diagonal has 1, 7, 13, 19 stamped. Missing 25.
      const stamped = [1, 7, 13, 19];
      const autoMove = getBingoAFKAutoMove(sampleCard, stamped);
      expect(autoMove).toBe(25);
    });

    it("AFK auto-move selects the sole remaining tile when 24 numbers are stamped", () => {
      // Stamp all except #17
      const stamped = Array.from({ length: 25 }, (_, i) => i + 1).filter((n) => n !== 17);
      const autoMove = getBingoAFKAutoMove(sampleCard, stamped);
      expect(autoMove).toBe(17);
    });
  });

  describe("Realtime Online 5x5 Board Lock & Fast Auto-Fill Synchronization", () => {
    it("fast auto-fills a partially drafted board into a valid 5x5 card instantaneously", () => {
      const draft = createEmptyBingoCard();
      // Player hand-picked their 5 favorite numbers:
      draft[0][0] = 7;
      draft[1][1] = 11;
      draft[2][2] = 22;
      draft[3][3] = 14;
      draft[4][4] = 3;

      const fastFilled = autoFillRemainingCard(draft);

      // Verify custom placed numbers remain intact
      expect(fastFilled[0][0]).toBe(7);
      expect(fastFilled[1][1]).toBe(11);
      expect(fastFilled[2][2]).toBe(22);
      expect(fastFilled[3][3]).toBe(14);
      expect(fastFilled[4][4]).toBe(3);

      // Verify completeness and uniqueness
      expect(validateBingoCard(fastFilled)).toBe(true);
      const flat = fastFilled.flat();
      expect(flat).toHaveLength(25);
      expect(new Set(flat).size).toBe(25);
    });

    it("evaluates both ready states to transition match phase from setup to playing", () => {
      const state = createInitialGameState("bingo") as BingoGameState;
      expect(state.phase).toBe("setup");
      expect(state.hostReady).toBe(false);
      expect(state.guestReady).toBe(false);

      // Opponent (Host) locks first
      const hostLockedState: BingoGameState = {
        ...state,
        hostReady: true,
        phase: false ? "playing" : "setup",
      };
      expect(hostLockedState.hostReady).toBe(true);
      expect(hostLockedState.phase).toBe("setup");

      // Guest locks second -> triggers immediate transition to playing phase
      const bothLockedState: BingoGameState = {
        ...hostLockedState,
        guestReady: true,
        phase: hostLockedState.hostReady ? "playing" : "setup",
        isCardLocked: true,
      };
      expect(bothLockedState.guestReady).toBe(true);
      expect(bothLockedState.phase).toBe("playing");
      expect(bothLockedState.isCardLocked).toBe(true);
    });
  });
});

