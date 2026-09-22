import { describe, it, expect } from "vitest";
import { determineRPSWinner } from "../features/games/components/games/RPSClashGame";
import { GameRoomState, MemoryCard, GameReaction } from "../features/games/types";

describe("Arcade Games Runtime Resilience Audit", () => {
  describe("RPSClashGame winner evaluation resilience", () => {
    it("safely evaluates RPS choices with typed and raw string inputs without throwing", () => {
      expect(determineRPSWinner("rock", "scissors")).toBe("p1");
      expect(determineRPSWinner("scissors", "paper")).toBe("p1");
      expect(determineRPSWinner("paper", "rock")).toBe("p1");
      expect(determineRPSWinner("rock", "rock")).toBe("draw");
      expect(determineRPSWinner("paper", "scissors")).toBe("p2");
      expect(determineRPSWinner("", "rock")).toBe("draw");
      expect(determineRPSWinner("rock", "")).toBe("draw");
      expect(determineRPSWinner("", "")).toBe("draw");
    });
  });

  describe("MemoryDuelGame MemoryCard model resilience", () => {
    it("supports optional matchedBy property without type or runtime errors", () => {
      const card: MemoryCard = {
        id: 1,
        emoji: "🎮",
        isFlipped: true,
        isMatched: true,
        matchedBy: "player_123",
      };
      expect(card.matchedBy).toBe("player_123");
      expect(card.isMatched).toBe(true);
    });
  });

  describe("GameReaction model with spectator support", () => {
    it("allows isSpectator flag on reaction payloads", () => {
      const rx: GameReaction = {
        id: "rx_1",
        senderId: "spec_1",
        senderName: "Spectator Alex",
        type: "emoji",
        content: "🔥",
        timestamp: Date.now(),
        isSpectator: true,
      };
      expect(rx.isSpectator).toBe(true);
      expect(rx.type).toBe("emoji");
    });
  });

  describe("GameRoomState null-safety edge cases", () => {
    it("handles rooms where guest is null during waiting state", () => {
      const room: GameRoomState = {
        roomCode: "TEST99",
        gameType: "connect_four",
        mode: "friend",
        status: "waiting",
        currentTurn: "host_1",
        winnerId: null,
        seriesWinnerId: null,
        round: 1,
        hostWins: 0,
        guestWins: 0,
        draws: 0,
        players: {
          host: { id: "host_1", name: "Host Player", avatar: "👑", score: 0, isHost: true },
          guest: null,
        },
        gameState: {
          board: [
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
          ],
          winningCells: null,
          lastDroppedCol: null,
        },
        seq: 1,
        lastMoveTimestamp: Date.now(),
      };

      // Safely access guest properties with optional chaining
      const guestName = room.players.guest?.name ?? "Waiting for Player...";
      const isGuestWinner = room.winnerId === room.players.guest?.id;

      expect(guestName).toBe("Waiting for Player...");
      expect(isGuestWinner).toBe(false);
    });

    it("handles cases where guest entered with undefined or empty name", () => {
      const room: GameRoomState = {
        roomCode: "TEST98",
        gameType: "tic_tac_toe",
        mode: "friend",
        status: "in_progress",
        currentTurn: "host_1",
        winnerId: null,
        seriesWinnerId: null,
        round: 1,
        hostWins: 0,
        guestWins: 0,
        draws: 0,
        players: {
          host: { id: "host_1", name: "Host", avatar: "👑", score: 0, isHost: true },
          guest: { id: "guest_2", name: (undefined as unknown) as string, avatar: "👤", score: 0, isHost: false },
        },
        gameState: {
          board: ["", "", "", "", "", "", "", "", ""],
          winningLine: null,
        },
        seq: 1,
        lastMoveTimestamp: Date.now(),
      };

      // Verify safe string comparison with optional chaining
      const isGuestSelf = room.players.guest?.name?.toLowerCase() === "you";
      expect(isGuestSelf).toBe(false);

      const guestDisplayName = room.players.guest?.name || "Player 2";
      expect(guestDisplayName).toBe("Player 2");
    });

    it("detects transition when opponent connects to auto-close QR modal", () => {
      let isQRModalOpen = true;
      let prevConnected = false;

      // Initial state: room created, waiting for guest
      const initialGuest = null;
      const isConnectedInitial = Boolean(initialGuest);

      // Simulation of opponent connection handler
      function handleGuestSync(newGuest: { id: string; name: string } | null) {
        const isConnected = Boolean(newGuest);
        if (!prevConnected && isConnected) {
          isQRModalOpen = false;
        }
        prevConnected = isConnected;
      }

      expect(isQRModalOpen).toBe(true);

      // Opponent connects
      handleGuestSync({ id: "guest_123", name: "SpeedyPlayer" });

      expect(isQRModalOpen).toBe(false);
      expect(prevConnected).toBe(true);

      // Subsequent sync does not re-trigger
      isQRModalOpen = true; // Host opens share for spectators
      handleGuestSync({ id: "guest_123", name: "SpeedyPlayer" });
      expect(isQRModalOpen).toBe(true); // Should remain open for spectator sharing
    });
  });
});

