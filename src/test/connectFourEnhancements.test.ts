import { describe, it, expect } from "vitest";
import {
  checkConnectFourWinner,
  getBestConnectFourAIMove,
  getTacticalConnectFourHint,
} from "@/features/games/components/games/ConnectFourGame";
import { gameAudio } from "@/features/games/services/gameSoundService";

describe("Connect 4 Drop Game - Kinetic Physics & Aesthetics Enhancements", () => {
  it("should have playConnect4Drop method on gameAudio synthesizer", () => {
    expect(typeof gameAudio.playConnect4Drop).toBe("function");
    expect(() => gameAudio.playConnect4Drop(5)).not.toThrow();
    expect(() => gameAudio.playConnect4Drop(0)).not.toThrow();
  });

  it("should detect horizontal 4-in-a-row victory", () => {
    const board: ("" | "red" | "yellow")[][] = Array(6).fill("").map(() => Array(7).fill(""));
    board[5][1] = "red";
    board[5][2] = "red";
    board[5][3] = "red";
    board[5][4] = "red";

    const result = checkConnectFourWinner(board);
    expect(result.winner).toBe("red");
    expect(result.cells).toEqual([[5, 1], [5, 2], [5, 3], [5, 4]]);
  });

  it("should detect vertical 4-in-a-row victory", () => {
    const board: ("" | "red" | "yellow")[][] = Array(6).fill("").map(() => Array(7).fill(""));
    board[5][3] = "yellow";
    board[4][3] = "yellow";
    board[3][3] = "yellow";
    board[2][3] = "yellow";

    const result = checkConnectFourWinner(board);
    expect(result.winner).toBe("yellow");
    expect(result.cells).toEqual([[2, 3], [3, 3], [4, 3], [5, 3]]);
  });

  it("should detect ascending diagonal 4-in-a-row victory", () => {
    const board: ("" | "red" | "yellow")[][] = Array(6).fill("").map(() => Array(7).fill(""));
    board[5][0] = "red";
    board[4][1] = "red";
    board[3][2] = "red";
    board[2][3] = "red";

    const result = checkConnectFourWinner(board);
    expect(result.winner).toBe("red");
    expect(result.cells).toEqual([[5, 0], [4, 1], [3, 2], [2, 3]]);
  });

  it("should detect descending diagonal 4-in-a-row victory", () => {
    const board: ("" | "red" | "yellow")[][] = Array(6).fill("").map(() => Array(7).fill(""));
    board[2][0] = "yellow";
    board[3][1] = "yellow";
    board[4][2] = "yellow";
    board[5][3] = "yellow";

    const result = checkConnectFourWinner(board);
    expect(result.winner).toBe("yellow");
    expect(result.cells).toEqual([[2, 0], [3, 1], [4, 2], [5, 3]]);
  });

  it("should return null for board with no 4-in-a-row", () => {
    const board: ("" | "red" | "yellow")[][] = Array(6).fill("").map(() => Array(7).fill(""));
    board[5][0] = "red";
    board[5][1] = "yellow";
    board[5][2] = "red";

    const result = checkConnectFourWinner(board);
    expect(result.winner).toBeNull();
    expect(result.cells).toBeNull();
  });

  it("should have AI block immediate win on hard difficulty", () => {
    const board: ("" | "red" | "yellow")[][] = Array(6).fill("").map(() => Array(7).fill(""));
    board[5][2] = "red";
    board[5][3] = "red";
    board[5][4] = "red";

    const move = getBestConnectFourAIMove(board, "yellow", "hard");
    expect([1, 5]).toContain(move);
  });

  describe("Tactical Hint Engine", () => {
    it("should have playHintChime method on gameAudio", () => {
      expect(typeof gameAudio.playHintChime).toBe("function");
      expect(() => gameAudio.playHintChime()).not.toThrow();
    });

    it("should recommend immediate winning drop when 3 in a row", () => {
      const board: ("" | "red" | "yellow")[][] = Array(6).fill("").map(() => Array(7).fill(""));
      board[5][0] = "red";
      board[5][1] = "red";
      board[5][2] = "red";

      const hint = getTacticalConnectFourHint(board, "red");
      expect(hint).not.toBeNull();
      expect(hint?.col).toBe(3);
      expect(hint?.row).toBe(5);
      expect(hint?.badge).toContain("WINNING");
    });

    it("should recommend critical block when opponent has 3 in a row", () => {
      const board: ("" | "red" | "yellow")[][] = Array(6).fill("").map(() => Array(7).fill(""));
      board[5][2] = "yellow";
      board[5][3] = "yellow";
      board[5][4] = "yellow";

      const hint = getTacticalConnectFourHint(board, "red");
      expect(hint).not.toBeNull();
      expect([1, 5]).toContain(hint?.col);
      expect(hint?.badge).toContain("CRITICAL BLOCK");
    });

    it("should recommend center column 3 on an empty board", () => {
      const board: ("" | "red" | "yellow")[][] = Array(6).fill("").map(() => Array(7).fill(""));

      const hint = getTacticalConnectFourHint(board, "red");
      expect(hint).not.toBeNull();
      expect(hint?.col).toBe(3);
      expect(hint?.badge).toContain("CENTER");
      expect(hint?.scoreText).toBeDefined();
      expect(hint?.insight).toBeDefined();
    });

    it("should avoid suicide drop that hands opponent an immediate win directly above", () => {
      const board: ("" | "red" | "yellow")[][] = Array(6).fill("").map(() => Array(7).fill(""));
      // Opponent yellow has 3 in a row horizontally on row 4 (cols 2, 3, 4)
      board[4][2] = "yellow";
      board[4][3] = "yellow";
      board[4][4] = "yellow";
      // Row 5 has empty slots at col 1 and col 5
      // If red plays col 1 row 5, yellow can immediately play col 1 row 4 to get 4-in-a-row!
      // So col 1 is a suicide trap for row 4.
      // Playing col 6 or 0 is safe.
      const hint = getTacticalConnectFourHint(board, "red");
      expect(hint).not.toBeNull();
      // Should not recommend a suicide drop if safe alternatives exist
      expect(hint?.col).not.toBe(1);
    });

    it("should detect tactical fork / double threat setup", () => {
      const board: ("" | "red" | "yellow")[][] = Array(6).fill("").map(() => Array(7).fill(""));
      // Gravity-valid open-ended fork setup:
      // Row 5 (bottom row) has red at Col 2 and Col 4.
      // Col 3 row 5 is empty.
      // If red drops in Col 3, red creates simultaneous winning threats at Col 1 and Col 5!
      board[5][2] = "red";
      board[5][4] = "red";

      const hint = getTacticalConnectFourHint(board, "red");
      expect(hint).not.toBeNull();
      expect(hint?.col).toBe(3);
      expect(hint?.badge).toContain("FORK");
    });

    it("should have AI bot on hard difficulty avoid suicide drops", () => {
      const board: ("" | "red" | "yellow")[][] = Array(6).fill("").map(() => Array(7).fill(""));
      // Human (red) has 3-in-a-row on row 4 (cols 2, 3, 4)
      board[4][2] = "red";
      board[4][3] = "red";
      board[4][4] = "red";
      // Bottom row (row 5) is empty at col 1 and 5.
      // If AI (yellow) drops at col 1 or 5 on row 5, human immediately drops on row 4 and wins!
      // AI on hard should avoid suicide drop at col 1 or 5.
      const move = getBestConnectFourAIMove(board, "yellow", "hard");
      expect([1, 5]).not.toContain(move);
    });
  });

  describe("Connect 4 Dynamic Themes & Chip Representations", () => {
    it("should define distinctive chip labels and emojis for each theme", async () => {
      const { CONNECT4_THEMES } = await import("@/features/games/data/connectFourThemes");
      
      expect(CONNECT4_THEMES.classic.redChip.label).toBe("Ruby Red");
      expect(CONNECT4_THEMES.classic.yellowChip.label).toBe("Solar Gold");

      expect(CONNECT4_THEMES.cyber.redChip.label).toBe("Neon Magenta");
      expect(CONNECT4_THEMES.cyber.yellowChip.label).toBe("Electric Cyan");
      expect(CONNECT4_THEMES.cyber.redChip.emoji).toBe("🌸");
      expect(CONNECT4_THEMES.cyber.yellowChip.emoji).toBe("⚡");

      expect(CONNECT4_THEMES.matrix.redChip.label).toBe("Crimson Core");
      expect(CONNECT4_THEMES.matrix.yellowChip.label).toBe("Lime Laser");
      expect(CONNECT4_THEMES.matrix.yellowChip.emoji).toBe("🟢");

      expect(CONNECT4_THEMES.synthwave.redChip.label).toBe("Sunset Flare");
      expect(CONNECT4_THEMES.synthwave.yellowChip.label).toBe("Arcade Violet");
      expect(CONNECT4_THEMES.synthwave.yellowChip.emoji).toBe("🟣");
    });

    it("should save and load connect four theme from storage", async () => {
      const { getSavedConnectFourTheme, saveConnectFourTheme } = await import("@/features/games/data/connectFourThemes");
      
      saveConnectFourTheme("cyber");
      expect(getSavedConnectFourTheme()).toBe("cyber");

      saveConnectFourTheme("synthwave");
      expect(getSavedConnectFourTheme()).toBe("synthwave");

      saveConnectFourTheme("classic");
      expect(getSavedConnectFourTheme()).toBe("classic");
    });
  });
});


