import { db } from "@/lib/firebase";
import { ref, set, get, remove, onValue, off, onDisconnect } from "firebase/database";
import { ROOM_TTL_MS, generateShortCode } from "@/features/shared/constants";
import type { RoomMeta } from "./types";

const metaRef = (roomId: string) => ref(db, `rooms/${roomId}/meta`);
const mediaRef = (roomId: string) => ref(db, `rooms/${roomId}/media`);

/** Create ephemeral room metadata — streams stay on WebRTC, only metadata in Firebase */
export async function createTempRoom(roomId: string, code?: string): Promise<RoomMeta> {
  const now = Date.now();
  const roomCode = code ?? generateShortCode(6);
  const meta: RoomMeta = {
    roomId,
    code: roomCode,
    createdAt: now,
    expiresAt: now + ROOM_TTL_MS,
    type: code ? "private" : "temp",
    participantCount: 0,
  };
  await set(metaRef(roomId), meta);
  return meta;
}

export async function getRoomMeta(roomId: string): Promise<RoomMeta | null> {
  const snap = await get(metaRef(roomId));
  if (!snap.exists()) return null;
  return snap.val() as RoomMeta;
}

export async function isRoomExpired(roomId: string): Promise<boolean> {
  const meta = await getRoomMeta(roomId);
  if (!meta) return false;
  return Date.now() > meta.expiresAt;
}

export async function touchRoomExpiry(roomId: string): Promise<void> {
  const meta = await getRoomMeta(roomId);
  if (!meta) return;
  await set(metaRef(roomId), {
    ...meta,
    expiresAt: Date.now() + ROOM_TTL_MS,
  });
}

export async function registerRoomMedia(roomId: string, storagePath: string): Promise<void> {
  const entryRef = ref(db, `rooms/${roomId}/media/${crypto.randomUUID().replace(/-/g, "")}`);
  await set(entryRef, { path: storagePath, uploadedAt: Date.now() });
}

export async function listRoomMediaPaths(roomId: string): Promise<string[]> {
  const snap = await get(mediaRef(roomId));
  if (!snap.exists()) return [];
  const entries = snap.val() as Record<string, { path: string }>;
  return Object.values(entries).map((e) => e.path);
}

export async function deleteRoomTree(roomId: string): Promise<void> {
  await remove(ref(db, `rooms/${roomId}`));
}

export function subscribeRoomMeta(
  roomId: string,
  onUpdate: (meta: RoomMeta | null) => void
): () => void {
  const r = metaRef(roomId);
  const handler = (snap: { exists: () => boolean; val: () => RoomMeta }) => {
    onUpdate(snap.exists() ? snap.val() : null);
  };
  onValue(r, handler);
  return () => off(r, "value", handler);
}

/** Firebase presence + onDisconnect cleanup for a participant slot */
export async function attachRoomPresence(
  roomId: string,
  sessionId: string,
  onEmpty?: () => void
): Promise<() => void> {
  const participantRef = ref(db, `rooms/${roomId}/participants/${sessionId}`);
  await set(participantRef, { online: true, joinedAt: Date.now() });
  onDisconnect(participantRef).remove();

  const participantsRoot = ref(db, `rooms/${roomId}/participants`);
  const handler = (snap: { exists: () => boolean; val: () => Record<string, unknown> }) => {
    if (!snap.exists()) {
      onEmpty?.();
      return;
    }
    const count = Object.keys(snap.val()).length;
    get(metaRef(roomId)).then((metaSnap) => {
      if (metaSnap.exists()) {
        set(metaRef(roomId), { ...metaSnap.val(), participantCount: count });
      }
    });
  };
  onValue(participantsRoot, handler);

  return () => {
    off(participantsRoot, "value", handler);
    remove(participantRef).catch(() => {});
  };
}
