import { describe, it, expect } from "vitest";
import { bestTttMove, getWinner, createInitialTttBoard } from "./tttMinimax";
import type { TttCell } from "../types";

describe("tttMinimax", () => {
  it("blocks an immediate human win", () => {
    const board: TttCell[] = ["X", "X", null, "O", null, null, null, null, null];
    expect(bestTttMove(board, "O")).toBe(2);
  });

  it("takes a winning move when available", () => {
    const board: TttCell[] = ["O", "O", null, "X", "X", null, null, null, null];
    expect(bestTttMove(board, "O")).toBe(2);
  });

  it("detects winner", () => {
    const board: TttCell[] = ["X", "X", "X", "O", "O", null, null, null, null];
    expect(getWinner(board)).toBe("X");
  });

  it("starts with empty board", () => {
    expect(createInitialTttBoard().every((c) => c === null)).toBe(true);
  });
});
