import { db } from "@/lib/firebase";
import { ref, set, get, onValue, off, onDisconnect, remove } from "firebase/database";
import type { ParticipantRecord } from "./types";

const participantsRef = (roomId: string) => ref(db, `rooms/${roomId}/participants`);

export async function registerParticipant(
  roomId: string,
  sessionId: string,
  deviceLabel: string,
  isPrimary = false
): Promise<void> {
  const record: ParticipantRecord = {
    sessionId,
    deviceLabel,
    joinedAt: Date.now(),
    isPrimary,
    online: true,
  };
  const slotRef = ref(db, `rooms/${roomId}/participants/${sessionId}`);
  await set(slotRef, record);
  onDisconnect(slotRef).update({ online: false });
}

/** Presence slot with onDisconnect removal — used when last device leaves */
export async function attachParticipantPresence(
  roomId: string,
  sessionId: string
): Promise<() => void> {
  const slotRef = ref(db, `rooms/${roomId}/participants/${sessionId}`);
  onDisconnect(slotRef).remove();
  return () => {
    remove(slotRef).catch(() => {});
  };
}

export async function listParticipants(roomId: string): Promise<ParticipantRecord[]> {
  const snap = await get(participantsRef(roomId));
  if (!snap.exists()) return [];
  return Object.values(snap.val() as Record<string, ParticipantRecord>);
}

export function subscribeParticipants(
  roomId: string,
  onUpdate: (participants: ParticipantRecord[]) => void
): () => void {
  const r = participantsRef(roomId);
  const handler = (snap: { exists: () => boolean; val: () => Record<string, ParticipantRecord> }) => {
    onUpdate(snap.exists() ? Object.values(snap.val()) : []);
  };
  onValue(r, handler);
  return () => off(r, "value", handler);
}

export function getDeviceLabel(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
  if (/iPhone|iPad/i.test(ua)) return "iPhone/iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "Browser";
}
