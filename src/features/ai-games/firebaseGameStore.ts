import { db } from "@/lib/firebase";
import { ref, set, get, onValue, off, update, remove } from "firebase/database";
import { AI_BOT_SESSION_ID } from "@/features/shared/constants";
import type { AIGameMeta, AIGameType } from "./types";

const gameRef = (roomId: string, gameType: AIGameType) =>
  ref(db, `rooms/${roomId}/game_state/${gameType}`);

export async function writeGameState<T extends object>(
  roomId: string,
  gameType: AIGameType,
  state: T,
  updatedBy: string,
  aiThinking = false
): Promise<void> {
  await set(gameRef(roomId, gameType), {
    ...state,
    _meta: {
      gameType,
      aiThinking,
      updatedAt: Date.now(),
      updatedBy,
    } satisfies AIGameMeta,
  });
}

export async function patchGameState(
  roomId: string,
  gameType: AIGameType,
  patch: Record<string, unknown>,
  updatedBy: string,
  aiThinking = false
): Promise<void> {
  await update(gameRef(roomId, gameType), {
    ...patch,
    "_meta/aiThinking": aiThinking,
    "_meta/updatedAt": Date.now(),
    "_meta/updatedBy": updatedBy,
  });
}

export async function readGameState<T>(roomId: string, gameType: AIGameType): Promise<T | null> {
  const snap = await get(gameRef(roomId, gameType));
  if (!snap.exists()) return null;
  const { _meta, ...state } = snap.val();
  void _meta;
  return state as T;
}

export function subscribeGameState<T>(
  roomId: string,
  gameType: AIGameType,
  onUpdate: (state: T | null, meta: AIGameMeta | null) => void
): () => void {
  const r = gameRef(roomId, gameType);
  const handler = (snap: { exists: () => boolean; val: () => T & { _meta?: AIGameMeta } }) => {
    if (!snap.exists()) {
      onUpdate(null, null);
      return;
    }
    const val = snap.val();
    const { _meta, ...state } = val;
    onUpdate(state as T, _meta ?? null);
  };
  onValue(r, handler);
  return () => off(r, "value", handler);
}

export async function setAIThinking(
  roomId: string,
  gameType: AIGameType,
  thinking: boolean
): Promise<void> {
  await update(gameRef(roomId, gameType), {
    "_meta/aiThinking": thinking,
    "_meta/updatedAt": Date.now(),
    "_meta/updatedBy": AI_BOT_SESSION_ID,
  });
}

export async function clearGameState(roomId: string, gameType: AIGameType): Promise<void> {
  await remove(gameRef(roomId, gameType));
}
