import { describe, it, expect } from "vitest";
import { detectSOSAtMove, getSmartSOSAIMove } from "@/features/games/components/games/SOSGame";
import { createInitialGameState } from "@/features/games/services/gameRoomService";
import { SOSGameState } from "@/features/games/types";

describe("SOS Neon Duel Game Logic", () => {
  const createEmptyBoard = (size = 6): string[][] => {
    return Array(size).fill("").map(() => Array(size).fill(""));
  };

  describe("Initial State Creation", () => {
    it("should initialize a valid 6x6 SOS game state", () => {
      const state = createInitialGameState("sos") as SOSGameState;
      expect(state.gridSize).toBe(6);
      expect(state.board).toHaveLength(6);
      expect(state.board[0]).toHaveLength(6);
      expect(state.lines).toEqual([]);
      expect(state.hostScore).toBe(0);
      expect(state.guestScore).toBe(0);
      expect(state.lastMove).toBeNull();
    });
  });

  describe("4-Way SOS Line Detection", () => {
    it("detects horizontal SOS when placing the ending 'S'", () => {
      const board = createEmptyBoard();
      board[0][0] = "S";
      board[0][1] = "O";
      board[0][2] = "S";

      const res = detectSOSAtMove(board, 0, 2, "S", "player1", "#06b6d4", []);
      expect(res.scoreGained).toBe(1);
      expect(res.newLines).toHaveLength(1);
      expect(res.newLines[0].direction).toBe("h");
      expect(res.newLines[0].ownerPlayerId).toBe("player1");
      expect(res.newLines[0].startRow).toBe(0);
      expect(res.newLines[0].startCol).toBe(0);
      expect(res.newLines[0].endRow).toBe(0);
      expect(res.newLines[0].endCol).toBe(2);
    });

    it("detects horizontal SOS when placing the middle 'O'", () => {
      const board = createEmptyBoard();
      board[2][1] = "S";
      board[2][2] = "O";
      board[2][3] = "S";

      const res = detectSOSAtMove(board, 2, 2, "O", "player2", "#f43f5e", []);
      expect(res.scoreGained).toBe(1);
      expect(res.newLines[0].direction).toBe("h");
    });

    it("detects vertical SOS in both directions", () => {
      const board = createEmptyBoard();
      board[1][3] = "S";
      board[2][3] = "O";
      board[3][3] = "S";

      // Placing top 'S'
      const resTop = detectSOSAtMove(board, 1, 3, "S", "p1", "#06b6d4", []);
      expect(resTop.scoreGained).toBe(1);
      expect(resTop.newLines[0].direction).toBe("v");

      // Placing bottom 'S'
      const resBottom = detectSOSAtMove(board, 3, 3, "S", "p1", "#06b6d4", []);
      expect(resBottom.scoreGained).toBe(1);
      expect(resBottom.newLines[0].direction).toBe("v");
    });

    it("detects main diagonal ↘ SOS", () => {
      const board = createEmptyBoard();
      board[1][1] = "S";
      board[2][2] = "O";
      board[3][3] = "S";

      const res = detectSOSAtMove(board, 2, 2, "O", "p1", "#06b6d4", []);
      expect(res.scoreGained).toBe(1);
      expect(res.newLines[0].direction).toBe("d_main");
    });

    it("detects anti diagonal ↗ SOS", () => {
      const board = createEmptyBoard();
      board[3][1] = "S";
      board[2][2] = "O";
      board[1][3] = "S";

      const res = detectSOSAtMove(board, 2, 2, "O", "p1", "#06b6d4", []);
      expect(res.scoreGained).toBe(1);
      expect(res.newLines[0].direction).toBe("d_anti");
    });

    it("detects multi-line simultaneous completion on a cross placement", () => {
      const board = createEmptyBoard();
      // Setup horizontal S _ S and vertical S _ S intersecting at (2,2)
      board[2][1] = "S";
      board[2][3] = "S";
      board[1][2] = "S";
      board[3][2] = "S";
      board[2][2] = "O"; // Center 'O' completes both horizontal and vertical SOS!

      const res = detectSOSAtMove(board, 2, 2, "O", "p1", "#06b6d4", []);
      expect(res.scoreGained).toBe(2);
      expect(res.newLines).toHaveLength(2);
      const directions = res.newLines.map((l) => l.direction);
      expect(directions).toContain("h");
      expect(directions).toContain("v");
    });

    it("does not re-award score for previously completed lines", () => {
      const board = createEmptyBoard();
      board[0][0] = "S";
      board[0][1] = "O";
      board[0][2] = "S";

      const initialRes = detectSOSAtMove(board, 0, 2, "S", "p1", "#06b6d4", []);
      expect(initialRes.scoreGained).toBe(1);

      // Subsequent evaluation with existingLines passed
      const secondRes = detectSOSAtMove(board, 0, 2, "S", "p2", "#f43f5e", initialRes.newLines);
      expect(secondRes.scoreGained).toBe(0);
      expect(secondRes.newLines).toHaveLength(0);
    });
  });

  describe("Smart AI Bot Strategy", () => {
    it("AI seizes an immediate 1-move SOS completion when available", () => {
      const board = createEmptyBoard();
      board[0][0] = "S";
      board[0][1] = "O";
      // board[0][2] is empty

      const aiMove = getSmartSOSAIMove(board, [], "ai_bot", "hard");
      expect(aiMove.row).toBe(0);
      expect(aiMove.col).toBe(2);
      expect(aiMove.letter).toBe("S");
    });

    it("AI chooses the move with maximum score if multiple SOS available", () => {
      const board = createEmptyBoard();
      // Setup double SOS opportunity at (2,2) with letter 'O'
      board[2][1] = "S";
      board[2][3] = "S";
      board[1][2] = "S";
      board[3][2] = "S";

      const aiMove = getSmartSOSAIMove(board, [], "ai_bot", "hard");
      expect(aiMove.row).toBe(2);
      expect(aiMove.col).toBe(2);
      expect(aiMove.letter).toBe("O");
    });

    it("AI returns a valid empty cell on an empty board", () => {
      const board = createEmptyBoard();
      const aiMove = getSmartSOSAIMove(board, [], "ai_bot", "medium");
      expect(aiMove.row).toBeGreaterThanOrEqual(0);
      expect(aiMove.row).toBeLessThan(6);
      expect(aiMove.col).toBeGreaterThanOrEqual(0);
      expect(aiMove.col).toBeLessThan(6);
      expect(["S", "O"]).toContain(aiMove.letter);
    });
  });

  describe("Deluxe Features: Wildcards & Dynamic Arenas", () => {
    it("handles Wildcard '?' tile matching both S and O", () => {
      const board = createEmptyBoard(7);
      // Place '?' in between S and S
      board[3][2] = "S";
      board[3][3] = "?";
      board[3][4] = "S";

      const res = detectSOSAtMove(board, 3, 3, "?", "p1", "#06b6d4", []);
      expect(res.scoreGained).toBeGreaterThanOrEqual(1);
    });

    it("correctly evaluates moves on 5x5 Blitz, 7x7 Tactical, and 8x8 Grandmaster grids", () => {
      for (const size of [5, 7, 8]) {
        const board = createEmptyBoard(size);
        board[0][0] = "S";
        board[0][1] = "O";
        board[0][2] = "S";

        const res = detectSOSAtMove(board, 0, 2, "S", "p1", "#06b6d4", []);
        expect(res.scoreGained).toBe(1);
        expect(res.newLines[0].endCol).toBe(2);
      }
    });
  });
});
