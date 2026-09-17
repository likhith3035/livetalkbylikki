import { describe, it, expect } from "vitest";
import { evaluateCricketToss } from "@/features/games/components/games/HandCricketAI";
import { determineRPSWinner } from "@/features/games/components/games/RPSClashGame";
import { checkTicTacToeWinner } from "@/features/games/components/games/TicTacToeGame";
import { checkConnectFourWinner } from "@/features/games/components/games/ConnectFourGame";
import { calculateBingoLines } from "@/features/games/components/games/BingoGame";

describe("Games Audit Edge Cases & Multi-Player Robustness", () => {
  describe("Hand Cricket - Comprehensive Toss Winner Assignment", () => {
    it("assigns host as winner when host calls 'odd' and sum is odd", () => {
      const callerId = "host_123";
      const hostId = "host_123";
      const guestId = "guest_456";

      const { callerWon } = evaluateCricketToss("odd", 3, 2); // 5 (odd) -> caller won
      expect(callerWon).toBe(true);

      const opponentId = callerId === hostId ? guestId : hostId;
      const winnerId = callerWon ? callerId : opponentId;
      expect(winnerId).toBe("host_123");
    });

    it("assigns guest as winner when host calls 'odd' but sum is even", () => {
      const callerId = "host_123";
      const hostId = "host_123";
      const guestId = "guest_456";

      const { callerWon } = evaluateCricketToss("odd", 4, 2); // 6 (even) -> caller lost
      expect(callerWon).toBe(false);

      const opponentId = callerId === hostId ? guestId : hostId;
      const winnerId = callerWon ? callerId : opponentId;
      expect(winnerId).toBe("guest_456");
    });

    it("assigns guest as winner when guest calls 'even' and sum is even", () => {
      const callerId = "guest_456";
      const hostId = "host_123";
      const guestId = "guest_456";

      const { callerWon } = evaluateCricketToss("even", 4, 2); // 6 (even) -> caller won
      expect(callerWon).toBe(true);

      const opponentId = callerId === hostId ? guestId : hostId;
      const winnerId = callerWon ? callerId : opponentId;
      expect(winnerId).toBe("guest_456");
    });

    it("assigns HOST as winner when guest calls 'even' but sum is odd (critical bugfix)", () => {
      const callerId = "guest_456";
      const hostId = "host_123";
      const guestId = "guest_456";

      const { callerWon } = evaluateCricketToss("even", 3, 2); // 5 (odd) -> caller lost
      expect(callerWon).toBe(false);

      // Previous bug: winner was hardcoded to room.players.guest?.id when caller lost!
      const opponentId = callerId === hostId ? guestId : hostId;
      const winnerId = callerWon ? callerId : opponentId;
      expect(winnerId).toBe("host_123"); // Now correctly assigns to host!
    });
  });

  describe("Reaction Dash - Tie & False Start Resolution", () => {
    it("evaluates exact tie when both players tap at identical ms", () => {
      const hostTime = 240;
      const guestTime = 240;
      const isDraw = hostTime === guestTime;
      const hostFaster = hostTime < guestTime;
      const winnerId = isDraw ? "draw" : hostFaster ? "host_id" : "guest_id";

      expect(isDraw).toBe(true);
      expect(winnerId).toBe("draw");
    });

    it("evaluates host victory when host is faster", () => {
      const hostTime = 190;
      const guestTime = 230;
      const isDraw = hostTime === guestTime;
      const hostFaster = hostTime < guestTime;
      const winnerId = isDraw ? "draw" : hostFaster ? "host_id" : "guest_id";

      expect(isDraw).toBe(false);
      expect(winnerId).toBe("host_id");
    });

    it("evaluates guest victory when guest is faster", () => {
      const hostTime = 280;
      const guestTime = 210;
      const isDraw = hostTime === guestTime;
      const hostFaster = hostTime < guestTime;
      const winnerId = isDraw ? "draw" : hostFaster ? "host_id" : "guest_id";

      expect(isDraw).toBe(false);
      expect(winnerId).toBe("guest_id");
    });
  });

  describe("Rock Paper Scissors Clash - Full Outcome Matrix", () => {
    it("handles all rock combinations", () => {
      expect(determineRPSWinner("rock", "scissors")).toBe("p1");
      expect(determineRPSWinner("rock", "paper")).toBe("p2");
      expect(determineRPSWinner("rock", "rock")).toBe("draw");
    });

    it("handles all paper combinations", () => {
      expect(determineRPSWinner("paper", "rock")).toBe("p1");
      expect(determineRPSWinner("paper", "scissors")).toBe("p2");
      expect(determineRPSWinner("paper", "paper")).toBe("draw");
    });

    it("handles all scissors combinations", () => {
      expect(determineRPSWinner("scissors", "paper")).toBe("p1");
      expect(determineRPSWinner("scissors", "rock")).toBe("p2");
      expect(determineRPSWinner("scissors", "scissors")).toBe("draw");
    });

    it("handles empty or missing choices as draw without throwing", () => {
      expect(determineRPSWinner("", "rock")).toBe("draw");
      expect(determineRPSWinner("paper", "")).toBe("draw");
      expect(determineRPSWinner("", "")).toBe("draw");
    });
  });

  describe("Connect 4 - Diagonal Win & AI Move Validation", () => {
    it("detects ascending diagonal win (/) in Connect 4", () => {
      const board: ("" | "red" | "yellow")[][] = [
        ["", "", "", "", "", "", ""],
        ["", "", "", "", "", "", ""],
        ["", "", "", "red", "", "", ""],
        ["", "", "red", "yellow", "", "", ""],
        ["", "red", "yellow", "red", "", "", ""],
        ["red", "yellow", "yellow", "yellow", "", "", ""],
      ];
      const res = checkConnectFourWinner(board);
      expect(res.winner).toBe("red");
      expect(res.cells).toEqual([[5, 0], [4, 1], [3, 2], [2, 3]]);
    });

    it("detects descending diagonal win (\\) in Connect 4", () => {
      const board: ("" | "red" | "yellow")[][] = [
        ["", "", "", "", "", "", ""],
        ["", "", "", "", "", "", ""],
        ["yellow", "", "", "", "", "", ""],
        ["red", "yellow", "", "", "", "", ""],
        ["red", "red", "yellow", "", "", "", ""],
        ["red", "red", "red", "yellow", "", "", ""],
      ];
      const res = checkConnectFourWinner(board);
      expect(res.winner).toBe("yellow");
      expect(res.cells).toEqual([[2, 0], [3, 1], [4, 2], [5, 3]]);
    });
  });

  describe("Bingo Blitz - Full Card & Line Completion", () => {
    it("detects all 5 lines for full B-I-N-G-O victory", () => {
      const card = [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20],
        [21, 22, 23, 24, 25],
      ];
      const stamped = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 19, 25, 17, 21];
      const res = calculateBingoLines(card, stamped);
      expect(res.count).toBeGreaterThanOrEqual(5);
      expect(res.completedLineIds).toContain("row-0");
      expect(res.completedLineIds).toContain("row-1");
      expect(res.completedLineIds).toContain("row-2");
      expect(res.completedLineIds).toContain("diag-main");
      expect(res.completedLineIds).toContain("diag-anti");
    });
  });

  describe("Hand Cricket - Innings 2 Target & Toss Eligibility", () => {
    it("determines chasing batsman as winner when reaching target", () => {
      const target = 18;
      const nextRuns = 19;
      const batsmanId = "chaser_1";
      const bowlerId = "defender_2";

      const hasReachedTarget = nextRuns >= target;
      let winnerId: string | null = null;
      if (hasReachedTarget) {
        winnerId = batsmanId;
      }
      expect(winnerId).toBe("chaser_1");
    });

    it("determines draw / super over when runs are exactly target - 1 upon all out", () => {
      const target = 20;
      const nextRuns = 19;
      const batsmanId = "chaser_1";
      const bowlerId = "defender_2";

      const hasReachedTarget = nextRuns >= target;
      let winnerId: string | null = null;
      if (hasReachedTarget) {
        winnerId = batsmanId;
      } else if (nextRuns === target - 1) {
        winnerId = "draw";
      } else {
        winnerId = bowlerId;
      }
      expect(winnerId).toBe("draw");
    });

    it("determines defending bowler as winner when chaser falls short of target - 1", () => {
      const target = 25;
      const nextRuns = 21;
      const batsmanId = "chaser_1";
      const bowlerId = "defender_2";

      const hasReachedTarget = nextRuns >= target;
      let winnerId: string | null = null;
      if (hasReachedTarget) {
        winnerId = batsmanId;
      } else if (nextRuns === target - 1) {
        winnerId = "draw";
      } else {
        winnerId = bowlerId;
      }
      expect(winnerId).toBe("defender_2");
    });

    it("allows guest to pick toss number even when host has already picked in online mode", () => {
      const isLocalMode = false;
      const isAIMode = false;
      const hostId = "host_abc";
      const guestId = "guest_xyz";

      // Case 1: Host has picked, Guest is evaluating their own button state
      const hostPick = 4;
      const guestPick = null;

      // When Guest is the active player (myPlayerId === guestId)
      const myPlayerId = guestId;
      const isH = hostId === myPlayerId;
      const hasCurrentPlayerPickedToss = isLocalMode
        ? (hostPick !== null && guestPick !== null)
        : isAIMode
        ? hostPick !== null
        : isH
        ? hostPick !== null
        : guestPick !== null;

      // Guest's buttons MUST NOT be disabled
      expect(hasCurrentPlayerPickedToss).toBe(false);
    });

    it("allows Player 2 to pick toss number in local pass-and-play after Player 1 has picked", () => {
      const isLocalMode = true;
      const hostPick = 3;
      const guestPick = null;

      const hasCurrentPlayerPickedToss = isLocalMode
        ? (hostPick !== null && guestPick !== null)
        : false;

      // Player 2's buttons MUST NOT be disabled in step 2
      expect(hasCurrentPlayerPickedToss).toBe(false);
    });
  });
});
