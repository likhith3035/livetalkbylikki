import { db } from "@/lib/firebase";
import { ref, set, get, update, onValue, off, onDisconnect, remove, push, limitToLast, query } from "firebase/database";
import {
  GameId,
  GameMode,
  GameRoomState,
  PlayerInfo,
  GameCustomRules,
  GameReaction,
  GameChatMessage,
  SpectatorInfo,
  TicTacToeState,
  ConnectFourState,
  RPSState,
  MemoryGameState,
  ReactionGameState,
} from "../types";

const ROOM_CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Recursively removes/converts any `undefined` value to `null` to prevent Firebase `update failed: values argument contains undefined` crashes.
 */
export function sanitizeFirebasePayload<T>(obj: T): T {
  if (obj === undefined) return null as any;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeFirebasePayload) as any;
  }
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) {
      result[key] = null;
    } else {
      result[key] = sanitizeFirebasePayload(val);
    }
  }
  return result as T;
}

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
      const cardEmojis = ["🔥", "⚡", "💎", "👾", "🚀", "👑", "🎯", "🍀"];
      const deck = [...cardEmojis, ...cardEmojis]
        .sort(() => Math.random() - 0.5)
        .map((emoji, idx) => ({
          id: idx,
          emoji,
          isFlipped: false,
          isMatched: false,
        }));
      const state: MemoryGameState = {
        cards: deck,
        flippedCardIds: [],
        hostPairs: 0,
        guestPairs: 0,
        totalPairs: 8,
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

// ── Room Creation ──

export interface CreateRoomParams {
  gameId: GameId;
  mode: GameMode;
  hostPlayer: PlayerInfo;
  rules?: GameCustomRules;
}

export async function createGameRoom({
  gameId,
  mode,
  hostPlayer,
  rules,
}: CreateRoomParams): Promise<GameRoomState> {
  const roomCode = generateGameRoomCode();
  const initialGameState = createInitialGameState(gameId);

  const defaultRules: GameCustomRules = {
    turnTimerSeconds: rules?.turnTimerSeconds || 0,
    maxSeriesWins: rules?.maxSeriesWins || 2,
  };

  const initialRoom: GameRoomState = {
    roomCode,
    gameId,
    mode,
    status: mode === "ai" || mode === "local" ? "playing" : "waiting",
    createdAt: Date.now(),
    currentTurn: hostPlayer.id,
    winnerId: null,
    seriesWinnerId: null,
    round: 1,
    maxRounds: 5,
    rules: defaultRules,
    spectators: {},
    players: {
      host: {
        ...hostPlayer,
        isHost: true,
        isOnline: true,
        lastActive: Date.now(),
      },
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
    turnExpiresAt: defaultRules.turnTimerSeconds > 0 ? Date.now() + defaultRules.turnTimerSeconds * 1000 : null,
  };

  if (mode === "local" || mode === "ai") {
    return initialRoom;
  }

  if (!db) {
    throw new Error("Firebase realtime database is offline.");
  }

  const roomRef = ref(db, `rooms/game_${roomCode}`);
  await set(roomRef, sanitizeFirebasePayload(initialRoom));

  const hostStatusRef = ref(db, `rooms/game_${roomCode}/players/host/isOnline`);
  onDisconnect(hostStatusRef).set(false);

  return initialRoom;
}

// ── Room Joining ──

export interface JoinRoomParams {
  roomCode: string;
  guestPlayer: PlayerInfo;
}

export async function joinGameRoom({
  roomCode,
  guestPlayer,
}: JoinRoomParams): Promise<GameRoomState | null> {
  if (!db) throw new Error("Firebase realtime database is offline.");

  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = ref(db, `rooms/game_${cleanCode}`);
  const snap = await get(roomRef);

  if (!snap.exists()) {
    throw new Error("Game room not found. Check the room code.");
  }

  const room = snap.val() as GameRoomState;

  if (room.players.guest && room.players.guest.id !== guestPlayer.id && room.players.guest.isOnline) {
    throw new Error("This game room is already full.");
  }

  const timerSec = room.rules?.turnTimerSeconds || 0;
  const turnExpiresAt = timerSec > 0 ? Date.now() + timerSec * 1000 : null;

  const guestPayload: PlayerInfo = {
    ...guestPlayer,
    isHost: false,
    isOnline: true,
    lastActive: Date.now(),
  };

  await update(
    roomRef,
    sanitizeFirebasePayload({
      "players/guest": guestPayload,
      status: "playing",
      turnExpiresAt,
    })
  );

  const guestStatusRef = ref(db, `rooms/game_${cleanCode}/players/guest/isOnline`);
  onDisconnect(guestStatusRef).set(false);

  return {
    ...room,
    players: {
      ...room.players,
      guest: guestPayload,
    },
    status: "playing",
    turnExpiresAt,
  };
}

// ── Spectator Support ──

export async function joinAsSpectator(
  roomCode: string,
  spectator: SpectatorInfo
): Promise<GameRoomState | null> {
  if (!db) throw new Error("Firebase realtime database is offline.");

  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = ref(db, `rooms/game_${cleanCode}`);
  const snap = await get(roomRef);

  if (!snap.exists()) {
    throw new Error("Game room not found.");
  }

  const specRef = ref(db, `rooms/game_${cleanCode}/spectators/${spectator.id}`);
  await set(specRef, sanitizeFirebasePayload(spectator));
  onDisconnect(specRef).remove();

  return snap.val() as GameRoomState;
}

export async function leaveSpectator(roomCode: string, spectatorId: string): Promise<void> {
  if (!db) return;
  const cleanCode = roomCode.trim().toUpperCase();
  const specRef = ref(db, `rooms/game_${cleanCode}/spectators/${spectatorId}`);
  await remove(specRef).catch(() => {});
}

// ── Matchmaking Quick Match ──

export interface QuickMatchParams {
  gameId: GameId;
  player: PlayerInfo;
}

export async function findOrJoinQuickMatch({
  gameId,
  player,
}: QuickMatchParams): Promise<{ room: GameRoomState; isMatched: boolean }> {
  if (!db) throw new Error("Realtime database unavailable.");

  const lobbyRef = ref(db, `game_lobby/${gameId}`);
  const snap = await get(lobbyRef);

  if (snap.exists()) {
    const queue = snap.val();
    const waitingPlayerIds = Object.keys(queue);

    for (const waitingId of waitingPlayerIds) {
      if (waitingId !== player.id) {
        const item = queue[waitingId];
        if (item && item.roomCode && Date.now() - item.createdAt < 30000) {
          await remove(ref(db, `game_lobby/${gameId}/${waitingId}`)).catch(() => {});
          const joinedRoom = await joinGameRoom({
            roomCode: item.roomCode,
            guestPlayer: player,
          });
          if (joinedRoom) {
            return { room: joinedRoom, isMatched: true };
          }
        }
      }
    }
  }

  // No waiting player found, create a room and wait in queue
  const newRoom = await createGameRoom({
    gameId,
    mode: "quickmatch",
    hostPlayer: player,
  });

  const myQueueRef = ref(db, `game_lobby/${gameId}/${player.id}`);
  await set(myQueueRef, {
    playerId: player.id,
    roomCode: newRoom.roomCode,
    createdAt: Date.now(),
  });
  onDisconnect(myQueueRef).remove();

  return { room: newRoom, isMatched: false };
}

export async function cancelQuickMatchQueue(gameId: GameId, playerId: string, roomCode?: string) {
  if (!db) return;
  await remove(ref(db, `game_lobby/${gameId}/${playerId}`)).catch(() => {});
  if (roomCode) {
    await remove(ref(db, `rooms/game_${roomCode}`)).catch(() => {});
  }
}

// ── Realtime In-Game Reactions (Synced under rooms/game_{roomCode}/reactions) ──

export async function sendGameReaction(roomCode: string, reaction: Omit<GameReaction, "id" | "timestamp">) {
  if (!db) return;
  const cleanCode = roomCode.toUpperCase();
  const reactionsRef = ref(db, `rooms/game_${cleanCode}/reactions`);
  const newReactionRef = push(reactionsRef);
  await set(
    newReactionRef,
    sanitizeFirebasePayload({
      ...reaction,
      id: newReactionRef.key,
      timestamp: Date.now(),
    })
  ).catch((err) => {
    console.warn("Reaction sync notice:", err);
  });
}

export function subscribeToGameReactions(
  roomCode: string,
  onReaction: (reaction: GameReaction) => void
): () => void {
  if (!db) return () => {};
  const cleanCode = roomCode.toUpperCase();
  const reactionsRef = query(ref(db, `rooms/game_${cleanCode}/reactions`), limitToLast(5));

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

// ── Realtime In-Game Chat Messages (Synced under rooms/game_{roomCode}/chat) ──

export async function sendGameChatMessage(
  roomCode: string,
  message: Omit<GameChatMessage, "id" | "timestamp">
): Promise<void> {
  if (!db) return;
  const cleanCode = roomCode.toUpperCase();
  const chatRef = ref(db, `rooms/game_${cleanCode}/chat`);
  const newMsgRef = push(chatRef);
  await set(
    newMsgRef,
    sanitizeFirebasePayload({
      ...message,
      id: newMsgRef.key,
      timestamp: Date.now(),
    })
  ).catch((err) => {
    console.warn("Chat sync notice:", err);
  });
}

export function subscribeToGameChat(
  roomCode: string,
  onMessages: (messages: GameChatMessage[]) => void
): () => void {
  if (!db) return () => {};
  const cleanCode = roomCode.toUpperCase();
  const chatRef = query(ref(db, `rooms/game_${cleanCode}/chat`), limitToLast(50));

  const handler = (snap: any) => {
    if (snap.exists()) {
      const data = snap.val();
      const list = Object.values(data) as GameChatMessage[];
      list.sort((a, b) => a.timestamp - b.timestamp);
      onMessages(list);
    } else {
      onMessages([]);
    }
  };

  onValue(chatRef, handler);
  return () => off(chatRef, "value", handler);
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
  const cleanCode = roomCode.toUpperCase();
  const roomRef = ref(db, `rooms/game_${cleanCode}`);

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

  if (updatedHostScore !== undefined) {
    updates["players/host/score"] = updatedHostScore;
  }
  if (updatedGuestScore !== undefined) {
    updates["players/guest/score"] = updatedGuestScore;
  }

  if (isRoundOver) {
    const isSeriesWon = (updatedHostScore && updatedHostScore >= maxSeriesWins) ||
      (updatedGuestScore && updatedGuestScore >= maxSeriesWins);

    if (isSeriesWon) {
      updates.status = "game_over";
      updates.seriesWinnerId = (updatedHostScore || 0) >= maxSeriesWins ? "host" : "guest";
    } else {
      updates.status = "round_over";
    }
  }

  await update(roomRef, sanitizeFirebasePayload(updates)).catch((err) => {
    console.warn("Game move notice:", err);
  });
}

export async function resetGameRound(
  roomCode: string,
  gameId: GameId,
  nextRound: number,
  turnTimerSeconds = 0
): Promise<void> {
  if (!db) return;
  const cleanCode = roomCode.toUpperCase();
  const roomRef = ref(db, `rooms/game_${cleanCode}`);
  const freshGameState = createInitialGameState(gameId);

  const turnExpiresAt = turnTimerSeconds > 0
    ? Date.now() + turnTimerSeconds * 1000
    : null;

  await update(
    roomRef,
    sanitizeFirebasePayload({
      gameState: freshGameState,
      winnerId: null,
      status: "playing",
      round: nextRound,
      lastMoveTimestamp: Date.now(),
      turnExpiresAt,
    })
  ).catch((err) => {
    console.warn("Reset round notice:", err);
  });
}

// ── Realtime Listener ──

export function subscribeToGameRoom(
  roomCode: string,
  callback: (room: GameRoomState | null) => void
): () => void {
  if (!db) return () => {};

  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = ref(db, `rooms/game_${cleanCode}`);

  const handler = (snap: any) => {
    if (snap.exists()) {
      callback(snap.val() as GameRoomState);
    } else {
      callback(null);
    }
  };

  onValue(roomRef, handler);
  return () => off(roomRef, "value", handler);
}

// ── Room Disconnect / Leave ──

export async function leaveGameRoom(roomCode: string, isHost: boolean): Promise<void> {
  if (!db) return;
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = ref(db, `rooms/game_${cleanCode}`);

  if (isHost) {
    await remove(roomRef).catch(() => {});
  } else {
    await update(
      roomRef,
      sanitizeFirebasePayload({
        "players/guest": null,
        status: "waiting",
      })
    ).catch(() => {});
  }
}
