import { describe, it, expect, beforeEach } from "vitest";
import {
  evaluateCricketToss,
  generateCricketCommentary,
  getSmartCricketAIMove,
  CRICKET_AI_PERSONAS,
} from "@/features/games/components/games/HandCricketAI";
import { createInitialGameState } from "@/features/games/services/gameRoomService";
import { HandCricketState } from "@/features/games/types";
import { gameAudio } from "@/features/games/services/gameSoundService";

describe("Hand Cricket 1v1 Engine & Game Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Initial Room State & Config", () => {
    it("should generate valid initial cricket game state", () => {
      const state = createInitialGameState("cricket") as HandCricketState;
      expect(state.phase).toBe("toss");
      expect(state.currentInnings).toBe(1);
      expect(state.maxWickets).toBe(1);
      expect(state.maxOvers).toBe(2);
      expect(state.innings1.runs).toBe(0);
      expect(state.innings1.wickets).toBe(0);
      expect(state.innings1.balls).toBe(0);
      expect(state.innings1.deliveries).toHaveLength(0);
      expect(state.innings2.target).toBe(0);
    });
  });

  describe("Toss Evaluation (Odd / Even)", () => {
    it("should correctly evaluate Odd call when sum is odd", () => {
      const { sum, isEven, callerWon } = evaluateCricketToss("odd", 3, 2);
      expect(sum).toBe(5);
      expect(isEven).toBe(false);
      expect(callerWon).toBe(true);
    });

    it("should correctly evaluate Odd call when sum is even", () => {
      const { sum, isEven, callerWon } = evaluateCricketToss("odd", 4, 2);
      expect(sum).toBe(6);
      expect(isEven).toBe(true);
      expect(callerWon).toBe(false);
    });

    it("should correctly evaluate Even call when sum is even", () => {
      const { sum, isEven, callerWon } = evaluateCricketToss("even", 6, 6);
      expect(sum).toBe(12);
      expect(isEven).toBe(true);
      expect(callerWon).toBe(true);
    });

    it("should correctly evaluate Even call when sum is odd", () => {
      const { sum, isEven, callerWon } = evaluateCricketToss("even", 1, 4);
      expect(sum).toBe(5);
      expect(isEven).toBe(false);
      expect(callerWon).toBe(false);
    });
  });

  describe("Commentary Generator", () => {
    it("should generate high-octane commentary for maximum SIX", () => {
      const comm = generateCricketCommentary(6, 3, false, false);
      expect(comm).toContain("SIX");
    });

    it("should generate boundary commentary for FOUR", () => {
      const comm = generateCricketCommentary(4, 2, false, false);
      expect(comm).toContain("FOUR");
    });

    it("should generate dismissal text on wicket", () => {
      const comm = generateCricketCommentary(6, 6, true, false);
      expect(comm).toContain("OUT");
    });

    it("should describe dot ball on 0", () => {
      const comm = generateCricketCommentary(0, 3, false, false);
      expect(comm).toContain("Dot ball");
    });
  });

  describe("Smart AI Decision Engine", () => {
    const mockState: HandCricketState = {
      phase: "innings_1",
      toss: {
        callerId: "player1",
        choice: "even",
        hostPick: 4,
        guestPick: 2,
        winnerId: "player1",
        elected: "bat",
      },
      currentInnings: 1,
      batsmanId: "ai_player",
      bowlerId: "player1",
      maxWickets: 1,
      maxOvers: 2,
      innings1: {
        battingPlayerId: "ai_player",
        runs: 10,
        wickets: 0,
        balls: 2,
        deliveries: [
          {
            ballNumber: 2,
            batsmanRun: 6,
            bowlerRun: 3,
            isWicket: false,
            runsScored: 6,
            commentary: "SIX!",
            timestamp: Date.now(),
          },
        ],
      },
      innings2: {
        battingPlayerId: "player1",
        runs: 0,
        wickets: 0,
        balls: 0,
        target: 0,
        deliveries: [],
      },
      currentDelivery: {
        hostPick: 4,
        guestPick: null,
        revealed: false,
        lastResult: null,
      },
    };

    it("should provide valid number picks (1 to 6) for all difficulties", () => {
      const easyMove = getSmartCricketAIMove(mockState, "ai_player", "easy");
      expect(easyMove.pick).toBeGreaterThanOrEqual(1);
      expect(easyMove.pick).toBeLessThanOrEqual(6);

      const medMove = getSmartCricketAIMove(mockState, "ai_player", "medium");
      expect(medMove.pick).toBeGreaterThanOrEqual(1);
      expect(medMove.pick).toBeLessThanOrEqual(6);

      const hardMove = getSmartCricketAIMove(mockState, "ai_player", "hard");
      expect(hardMove.pick).toBeGreaterThanOrEqual(1);
      expect(hardMove.pick).toBeLessThanOrEqual(6);
    });

    it("should include personas with appropriate quotes and identities", () => {
      expect(CRICKET_AI_PERSONAS.gully.name).toBe("Gully Boy Raju");
      expect(CRICKET_AI_PERSONAS.spin_king.name).toBe("Spin Wizard Jadeja");
      expect(CRICKET_AI_PERSONAS.captain_cool.name).toBe("Captain Cool Dhoni");
    });
  });

  describe("Cricket Web Audio Synthesizer Triggers", () => {
    it("should execute all cricket audio methods without throwing errors", () => {
      expect(() => {
        gameAudio.playTossCoin();
        gameAudio.playBatHit(1);
        gameAudio.playBatHit(4);
        gameAudio.playBatHit(6);
        gameAudio.playBoundaryFour();
        gameAudio.playBoundarySix();
        gameAudio.playWicket();
        gameAudio.playUmpireWhistle();
      }).not.toThrow();
    });
  });
});
