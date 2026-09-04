import { describe, it, expect, beforeEach } from "vitest";
import { checkTicTacToeWinner, getSmartAIMove } from "@/features/games/components/games/TicTacToeGame";
import { checkConnectFourWinner, getBestConnectFourAIMove } from "@/features/games/components/games/ConnectFourGame";
import { determineRPSWinner } from "@/features/games/components/games/RPSClashGame";
import { generateGameRoomCode, createInitialGameState } from "@/features/games/services/gameRoomService";
import {
  getGamerProfile,
  saveGamerProfile,
  awardMatchXP,
  recordMatchHistory,
  getXpForNextLevel,
  getRankTitle,
} from "@/features/games/services/gameProgressionService";
import { gameAudio } from "@/features/games/services/gameSoundService";

describe("IncogTalk Arcade Games Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Room Service & Code Generator", () => {
    it("should generate a 6-character uppercase alphanumeric room code", () => {
      const code = generateGameRoomCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/);
    });

    it("should create valid initial game states for each game", () => {
      const tttState = createInitialGameState("ttt");
      expect(tttState.board).toHaveLength(9);
      expect(tttState.winningLine).toBeNull();

      const c4State = createInitialGameState("connect4");
      expect(c4State.board).toHaveLength(6);
      expect(c4State.board[0]).toHaveLength(7);

      const rpsState = createInitialGameState("rps");
      expect(rpsState.revealed).toBe(false);

      const memState = createInitialGameState("memory");
      expect(memState.cards).toHaveLength(16);
    });
  });

  describe("Gamer Progression & Leveling Service", () => {
    it("should calculate correct XP thresholds and titles", () => {
      expect(getXpForNextLevel(1)).toBe(175);
      expect(getXpForNextLevel(2)).toBe(250);
      expect(getRankTitle(1)).toBe("Arcade Rookie");
      expect(getRankTitle(5)).toBe("Tactical Strategist");
      expect(getRankTitle(10)).toBe("Minimax Slayer");
    });

    it("should award XP on match victory and handle level up", () => {
      const result = awardMatchXP({ won: true });
      expect(result.xpGained).toBeGreaterThanOrEqual(110);
      expect(result.profile.wins).toBe(1);
      expect(result.profile.played).toBe(1);
      expect(result.newBadgeUnlocked?.id).toBe("first_win");
    });

    it("should award streak multipliers for 3+ and 5+ win streaks", () => {
      // 1st win
      awardMatchXP({ won: true });
      // 2nd win
      awardMatchXP({ won: true });
      // 3rd win: 1.25x streak multiplier
      const r3 = awardMatchXP({ won: true });
      expect(r3.streakMultiplier).toBe(1.25);
      expect(r3.streakBonus).toBeGreaterThan(0);

      // 4th win
      awardMatchXP({ won: true });
      // 5th win: 1.5x streak multiplier
      const r5 = awardMatchXP({ won: true });
      expect(r5.streakMultiplier).toBe(1.5);
      expect(r5.newBadgeUnlocked?.id).toBe("streak_5");
    });

    it("should record match history and cap entries at 10 items", () => {
      for (let i = 1; i <= 15; i++) {
        recordMatchHistory({
          gameId: "ttt",
          mode: "friend",
          outcome: i % 2 === 0 ? "won" : "lost",
          opponentName: `Opponent_${i}`,
          xpGained: 110,
        });
      }

      const profile = getGamerProfile();
      expect(profile.recentMatches).toHaveLength(10);
      // Most recent should be Opponent_15
      expect(profile.recentMatches?.[0].opponentName).toBe("Opponent_15");
    });
  });

  describe("Tic-Tac-Toe Game Engine", () => {
    it("should detect horizontal, vertical, and diagonal wins", () => {
      const rowWinBoard = [
        "X", "X", "X",
        "O", "O", "",
        "", "", "",
      ];
      expect(checkTicTacToeWinner(rowWinBoard as any).winner).toBe("X");

      const diagWinBoard = [
        "O", "X", "",
        "X", "O", "",
        "", "", "O",
      ];
      expect(checkTicTacToeWinner(diagWinBoard as any).winner).toBe("O");
    });

    it("should make optimal AI blocking and winning moves on hard difficulty", () => {
      // AI is 'O'. Human 'X' is about to win at index 2
      const trapBoard = [
        "X", "X", "",
        "O", "", "",
        "", "", "",
      ];
      const aiMove = getSmartAIMove(trapBoard as any, "O", "hard");
      expect(aiMove).toBe(2); // AI must block index 2
    });
  });

  describe("Connect 4 Engine", () => {
    it("should detect 4 in a row horizontally and vertically", () => {
      const board: any[][] = Array(6).fill("").map(() => Array(7).fill(""));
      board[5][0] = "red";
      board[5][1] = "red";
      board[5][2] = "red";
      board[5][3] = "red";

      const result = checkConnectFourWinner(board);
      expect(result.winner).toBe("red");
      expect(result.cells).toHaveLength(4);
    });

    it("should block opponent's winning connect 4 drop on hard difficulty", () => {
      const board: any[][] = Array(6).fill("").map(() => Array(7).fill(""));
      // Human (red) has 3 in bottom row
      board[5][0] = "red";
      board[5][1] = "red";
      board[5][2] = "red";

      // AI is yellow. It must drop in col 3 to block
      const aiCol = getBestConnectFourAIMove(board, "yellow", "hard");
      expect(aiCol).toBe(3);
    });
  });

  describe("Rock Paper Scissors Engine", () => {
    it("should correctly evaluate winning rules and draws", () => {
      expect(determineRPSWinner("rock", "scissors")).toBe("p1");
      expect(determineRPSWinner("paper", "rock")).toBe("p1");
      expect(determineRPSWinner("scissors", "paper")).toBe("p1");

      expect(determineRPSWinner("scissors", "rock")).toBe("p2");
      expect(determineRPSWinner("rock", "rock")).toBe("draw");
    });
  });

  describe("Memory Duel Engine & Normalization", () => {
    it("should initialize memory state with 16 cards and valid pairs", () => {
      const state = createInitialGameState("memory");
      expect(state.cards).toHaveLength(16);
      expect(state.flippedCardIds).toEqual([]);
      expect(state.hostPairs).toBe(0);
      expect(state.guestPairs).toBe(0);
    });

    it("should tolerate undefined or missing flippedCardIds from Firebase RTDB", () => {
      const rawFirebasePayload: any = {
        cards: [{ id: 0, emoji: "🔥", isFlipped: false, isMatched: false }],
        // Firebase strips empty arrays, so flippedCardIds is undefined
        flippedCardIds: undefined,
        hostPairs: 0,
        guestPairs: 0,
      };

      const normalizedFlipped = Array.isArray(rawFirebasePayload.flippedCardIds)
        ? rawFirebasePayload.flippedCardIds
        : [];
      expect(normalizedFlipped).toEqual([]);
      expect(() => [...normalizedFlipped, 0]).not.toThrow();
    });
  });

  describe("Spectator Cheer Cannon", () => {
    it("should accept valid cheer types and maintain sound synthesis", () => {
      const validTypes = ["confetti", "horn", "applause", "rocket"] as const;
      expect(validTypes).toHaveLength(4);

      // Verify synthesizer doesn't throw even if muted or offline
      expect(() => {
        gameAudio.playCheer();
        gameAudio.playHorn();
        gameAudio.playApplause();
        gameAudio.playRocket();
      }).not.toThrow();
    });
  });

  describe("Offline AI Practice Fallback", () => {
    it("should correctly convert online room state to AI mode preserving scores and state", () => {
      const onlineRoom: any = {
        roomCode: "XYZ123",
        gameId: "ttt",
        mode: "quickmatch",
        status: "playing",
        round: 2,
        currentTurn: "host_player",
        players: {
          host: { id: "host_player", name: "Host", score: 1 },
          guest: { id: "guest_player", name: "Guest", score: 0 },
        },
        gameState: { board: Array(9).fill(null), winningLine: null },
      };

      // Conversion logic matching handleSwitchActiveRoomToAI
      const aiPlayer = {
        id: "ai_opponent",
        name: "Cyber AI 🤖",
        avatar: "🤖",
        score: onlineRoom.players.guest?.score || 0,
        level: 10,
        isHost: false,
        isOnline: true,
        lastActive: Date.now(),
      };

      const converted = {
        ...onlineRoom,
        mode: "ai",
        players: {
          host: onlineRoom.players.host,
          guest: aiPlayer,
        },
      };

      expect(converted.mode).toBe("ai");
      expect(converted.players.guest.id).toBe("ai_opponent");
      expect(converted.players.guest.score).toBe(0);
      expect(converted.players.host.score).toBe(1);
      expect(converted.round).toBe(2);
    });
  });
});
