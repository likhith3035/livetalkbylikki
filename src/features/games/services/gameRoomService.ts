import { db } from "@/lib/firebase";
import { ref, set, get, update, onValue, off, onDisconnect, remove, push, limitToLast, query } from "firebase/database";
import {
  GameId,
  GameMode,
  GameRoomState,
  PlayerInfo,
  GameCustomRules,
  GameReaction,
  SpectatorInfo,
  TicTacToeState,
  ConnectFourState,
  RPSState,
  MemoryGameState,
  ReactionGameState,
} from "../types";

const ROOM_CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateGameRoomCode(): string {
  const values = new Uint32Array(6);
  window.crypto.getRandomValues(values);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[values[i] % ROOM_CODE_CHARS.length];
  }
  return code;
}

export function createInitialGameState(gameId: GameId) {
  switch (gameId) {
    case "ttt": {
      const state: TicTacToeState = {
        board: Array(9).fill(""),
        winningLine: null,
      };
      return state;
    }
    case "connect4": {
      const state: ConnectFourState = {
        board: Array(6).fill("").map(() => Array(7).fill("")),
        winningCells: null,
        lastDroppedCol: null,
      };
      return state;
    }
    case "rps": {
      const state: RPSState = {
        hostChoice: "",
        guestChoice: "",
        roundWinner: null,
        revealed: false,
      };
      return state;
    }
    case "memory": {
      const EMOJIS = ["🚀", "⭐", "💎", "🔥", "⚡", "🍀", "🍕", "🎮"];
      const cards = [...EMOJIS, ...EMOJIS]
        .sort(() => Math.random() - 0.5)
        .map((emoji, id) => ({
          id,
          emoji,
          isFlipped: false,
          isMatched: false,
        }));
      const state: MemoryGameState = {
        cards,
        flippedCardIds: [],
        hostPairs: 0,
        guestPairs: 0,
        totalPairs: EMOJIS.length,
      };
      return state;
    }
    case "reaction": {
      const state: ReactionGameState = {
        gameState: "waiting",
        greenAt: null,
        hostTimeMs: null,
        guestTimeMs: null,
        winner: null,
      };
      return state;
    }
  }
}

export async function createGameRoom({
  gameId,
  mode,
  hostPlayer,
  customCode,
  rules = { turnTimerSeconds: 0, maxSeriesWins: 2 },
}: {
  gameId: GameId;
  mode: GameMode;
  hostPlayer: PlayerInfo;
  customCode?: string;
  rules?: GameCustomRules;
}): Promise<GameRoomState> {
  const code = customCode ? customCode.trim().toUpperCase() : generateGameRoomCode();
  const initialGameState = createInitialGameState(gameId);

  const turnExpiresAt = rules.turnTimerSeconds > 0 ? Date.now() + rules.turnTimerSeconds * 1000 : null;

  const roomState: GameRoomState = {
    roomCode: code,
    gameId,
    mode,
    status: mode === "ai" || mode === "local" ? "playing" : "waiting",
    createdAt: Date.now(),
    currentTurn: hostPlayer.id,
    winnerId: null,
    seriesWinnerId: null,
    round: 1,
    maxRounds: rules.maxSeriesWins * 2 - 1,
    rules,
    players: {
      host: { ...hostPlayer, isHost: true, isOnline: true, score: 0 },
      guest: mode === "ai" ? {
        id: "ai_opponent",
        name: "Cyber AI 🤖",
        avatar: "🤖",
        score: 0,
        isHost: false,
        isOnline: true,
        lastActive: Date.now(),
      } : mode === "local" ? {
        id: "local_player_2",
        name: "Player 2",
        avatar: "👤",
        score: 0,
        isHost: false,
        isOnline: true,
        lastActive: Date.now(),
      } : null,
    },
    gameState: initialGameState,
    seq: 1,
    lastMoveTimestamp: Date.now(),
    turnExpiresAt,
    disconnectGraceExpiresAt: null,
  };

  if (db && mode !== "local") {
    const roomRef = ref(db, `rooms/game_${code}`);
    await set(roomRef, roomState);

    // Setup host onDisconnect handler to mark offline with grace period without wiping game
    const hostOnlineRef = ref(db, `rooms/game_${code}/players/host/isOnline`);
    const hostActiveRef = ref(db, `rooms/game_${code}/players/host/lastActive`);
    onDisconnect(hostOnlineRef).set(false);
    onDisconnect(hostActiveRef).set(Date.now());
  }

  return roomState;
}

export async function joinGameRoom({
  roomCode,
  guestPlayer,
}: {
  roomCode: string;
  guestPlayer: PlayerInfo;
}): Promise<GameRoomState | null> {
  if (!db) return null;
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = ref(db, `rooms/game_${cleanCode}`);
  const snap = await get(roomRef);

  if (!snap.exists()) {
    throw new Error("Game room not found. Please verify the code.");
  }

  const room: GameRoomState = snap.val();

  // If host rejoining
  if (room.players.host.id === guestPlayer.id) {
    await update(ref(db, `rooms/game_${cleanCode}/players/host`), {
      isOnline: true,
      lastActive: Date.now(),
    });
    return room;
  }

  if (room.players.guest && room.players.guest.id !== guestPlayer.id) {
    throw new Error("This game room is already full.");
  }

  const updatedGuest: PlayerInfo = {
    ...guestPlayer,
    name: guestPlayer.name === room.players.host.name ? "Guest Player" : (guestPlayer.name || "Guest Player"),
    avatar: guestPlayer.avatar === room.players.host.avatar ? "🎮" : guestPlayer.avatar,
    score: room.players.guest?.score || 0,
    isHost: false,
    isOnline: true,
    lastActive: Date.now(),
  };

  const timerSec = room.rules?.turnTimerSeconds || 0;
  const turnExpiresAt = timerSec > 0 ? Date.now() + timerSec * 1000 : null;

  await update(roomRef, {
    "players/guest": updatedGuest,
    status: "playing",
    turnExpiresAt,
    disconnectGraceExpiresAt: null,
  });

  const guestOnlineRef = ref(db, `rooms/game_${cleanCode}/players/guest/isOnline`);
  const guestActiveRef = ref(db, `rooms/game_${cleanCode}/players/guest/lastActive`);
  onDisconnect(guestOnlineRef).set(false);
  onDisconnect(guestActiveRef).set(Date.now());

  return { ...room, status: "playing", turnExpiresAt, players: { ...room.players, guest: updatedGuest } };
}

// ── Spectator Handling ──

export async function joinAsSpectator(roomCode: string, spectator: SpectatorInfo): Promise<GameRoomState | null> {
  if (!db) return null;
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = ref(db, `rooms/game_${cleanCode}`);
  const snap = await get(roomRef);
  if (!snap.exists()) {
    throw new Error("Room not found for spectating.");
  }

  const specRef = ref(db, `rooms/game_${cleanCode}/spectators/${spectator.id}`);
  await set(specRef, spectator);
  onDisconnect(specRef).remove();

  return snap.val();
}

export async function leaveSpectator(roomCode: string, spectatorId: string): Promise<void> {
  if (!db) return;
  const cleanCode = roomCode.trim().toUpperCase();
  await remove(ref(db, `rooms/game_${cleanCode}/spectators/${spectatorId}`)).catch(() => {});
}

// ── Quick Match Lobby Matchmaking Pool ──

export async function findOrJoinQuickMatch({
  gameId,
  player,
}: {
  gameId: GameId;
  player: PlayerInfo;
}): Promise<{ room: GameRoomState; isMatched: boolean }> {
  if (!db) {
    const localRoom = await createGameRoom({ gameId, mode: "ai", hostPlayer: player });
    return { room: localRoom, isMatched: true };
  }

  const lobbyRef = ref(db, `game_lobby/${gameId}`);
  const snap = await get(lobbyRef);

  if (snap.exists()) {
    const queue = snap.val();
    const now = Date.now();
    for (const [key, entry] of Object.entries<any>(queue)) {
      if (entry && entry.hostId !== player.id && (now - entry.createdAt < 45000)) {
        try {
          const joined = await joinGameRoom({
            roomCode: entry.roomCode,
            guestPlayer: player,
          });
          if (joined) {
            await remove(ref(db, `game_lobby/${gameId}/${key}`)).catch(() => {});
            return { room: joined, isMatched: true };
          }
        } catch {
          // Room might have been claimed or closed, continue search
        }
      }
    }
  }

  // No active match found: create new room and register in lobby
  const newRoom = await createGameRoom({
    gameId,
    mode: "quickmatch",
    hostPlayer: player,
  });

  const myLobbyRef = ref(db, `game_lobby/${gameId}/${player.id}`);
  await set(myLobbyRef, {
    roomCode: newRoom.roomCode,
    hostId: player.id,
    createdAt: Date.now(),
  });
  onDisconnect(myLobbyRef).remove();

  return { room: newRoom, isMatched: false };
}

export async function cancelQuickMatchQueue(gameId: GameId, playerId: string, roomCode?: string) {
  if (!db) return;
  await remove(ref(db, `game_lobby/${gameId}/${playerId}`)).catch(() => {});
  if (roomCode) {
    await remove(ref(db, `rooms/game_${roomCode}`)).catch(() => {});
  }
}

// ── Realtime In-Game Reactions ──

export async function sendGameReaction(roomCode: string, reaction: Omit<GameReaction, "id" | "timestamp">) {
  if (!db) return;
  const reactionsRef = ref(db, `game_reactions/${roomCode.toUpperCase()}`);
  const newReactionRef = push(reactionsRef);
  await set(newReactionRef, {
    ...reaction,
    id: newReactionRef.key,
    timestamp: Date.now(),
  });
}

export function subscribeToGameReactions(
  roomCode: string,
  onReaction: (reaction: GameReaction) => void
): () => void {
  if (!db) return () => {};
  const reactionsRef = query(ref(db, `game_reactions/${roomCode.toUpperCase()}`), limitToLast(5));

  const handler = (snap: any) => {
    if (snap.exists()) {
      const data = snap.val();
      const entries = Object.values(data) as GameReaction[];
      const latest = entries[entries.length - 1];
      if (latest && Date.now() - latest.timestamp < 4000) {
        onReaction(latest);
      }
    }
  };

  onValue(reactionsRef, handler);
  return () => off(reactionsRef, "value", handler);
}

// ── Game Moves & Status Updates ──

export async function sendGameMove<T>(
  roomCode: string,
  updatedGameState: T,
  nextTurnPlayerId: string,
  winnerId: string | null = null,
  isRoundOver = false,
  updatedHostScore?: number,
  updatedGuestScore?: number,
  turnTimerSeconds = 0,
  maxSeriesWins = 2
): Promise<void> {
  if (!db) return;
  const roomRef = ref(db, `rooms/game_${roomCode.toUpperCase()}`);

  const turnExpiresAt = turnTimerSeconds > 0 && !isRoundOver
    ? Date.now() + turnTimerSeconds * 1000
    : null;

  const updates: Record<string, any> = {
    gameState: updatedGameState,
    currentTurn: nextTurnPlayerId,
    lastMoveTimestamp: Date.now(),
    seq: Date.now(),
    turnExpiresAt,
  };

  if (winnerId !== undefined) {
    updates.winnerId = winnerId;
  }

  if (typeof updatedHostScore === "number") {
    updates["players/host/score"] = updatedHostScore;
  }
  if (typeof updatedGuestScore === "number") {
    updates["players/guest/score"] = updatedGuestScore;
  }

  if (isRoundOver) {
    const isSeriesHostWinner = typeof updatedHostScore === "number" && updatedHostScore >= maxSeriesWins;
    const isSeriesGuestWinner = typeof updatedGuestScore === "number" && updatedGuestScore >= maxSeriesWins;

    if (isSeriesHostWinner || isSeriesGuestWinner) {
      updates.status = "game_over";
      updates.seriesWinnerId = isSeriesHostWinner ? "host" : "guest";
    } else {
      updates.status = "round_over";
    }
  }

  await update(roomRef, updates);
}

export function subscribeToGameRoom(
  roomCode: string,
  onUpdate: (room: GameRoomState | null) => void
): () => void {
  if (!db) return () => {};
  const roomRef = ref(db, `rooms/game_${roomCode.toUpperCase()}`);

  const handler = (snap: any) => {
    if (snap.exists()) {
      onUpdate(snap.val());
    } else {
      onUpdate(null);
    }
  };

  onValue(roomRef, handler);
  return () => off(roomRef, "value", handler);
}

export async function resetGameRound(roomCode: string, gameId: GameId, nextRoundNum: number, turnTimerSeconds = 0): Promise<void> {
  if (!db) return;
  const initialGameState = createInitialGameState(gameId);
  const roomRef = ref(db, `rooms/game_${roomCode.toUpperCase()}`);

  const turnExpiresAt = turnTimerSeconds > 0 ? Date.now() + turnTimerSeconds * 1000 : null;

  await update(roomRef, {
    gameState: initialGameState,
    status: "playing",
    winnerId: null,
    round: nextRoundNum,
    lastMoveTimestamp: Date.now(),
    turnExpiresAt,
    seq: Date.now(),
  });
}

export async function leaveGameRoom(roomCode: string, isHost: boolean): Promise<void> {
  if (!db) return;
  const roomRef = ref(db, `rooms/game_${roomCode.toUpperCase()}`);
  if (isHost) {
    await remove(roomRef).catch(() => {});
  } else {
    await update(roomRef, {
      "players/guest": null,
      status: "waiting",
    }).catch(() => {});
  }
}
