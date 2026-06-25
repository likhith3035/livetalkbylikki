import type { TttCell } from "../types";

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function getWinner(board: TttCell[]): TttCell {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

export function isBoardFull(board: TttCell[]): boolean {
  return board.every((c) => c !== null);
}

/** Minimax — AI plays as `aiSymbol`, human as the other */
export function bestTttMove(board: TttCell[], aiSymbol: "X" | "O"): number {
  const humanSymbol = aiSymbol === "X" ? "O" : "X";

  const score = (b: TttCell[], depth: number, maximizing: boolean): number => {
    const w = getWinner(b);
    if (w === aiSymbol) return 10 - depth;
    if (w === humanSymbol) return depth - 10;
    if (isBoardFull(b)) return 0;

    const sym = maximizing ? aiSymbol : humanSymbol;
    let best = maximizing ? -Infinity : Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i] !== null) continue;
      const next = [...b] as TttCell[];
      next[i] = sym;
      const s = score(next, depth + 1, !maximizing);
      best = maximizing ? Math.max(best, s) : Math.min(best, s);
    }
    return best;
  };

  let bestIdx = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue;
    const next = [...board] as TttCell[];
    next[i] = aiSymbol;
    const s = score(next, 0, false);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function createInitialTttBoard(): TttCell[] {
  return Array(9).fill(null);
}
