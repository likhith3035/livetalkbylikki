import { db } from "@/lib/firebase";
import { ref, set, get, update } from "firebase/database";
import { SESSION_TOKEN_TTL_MS, generateShortCode, HANDOFF_CODE_LENGTH } from "@/features/shared/constants";
import type { SessionToken } from "./types";

const tokenRef = (roomId: string, token: string) =>
  ref(db, `rooms/${roomId}/session_tokens/${token}`);

export async function createSessionToken(
  roomId: string,
  createdBy: string
): Promise<SessionToken> {
  const now = Date.now();
  const token = generateShortCode(HANDOFF_CODE_LENGTH);
  const record: SessionToken = {
    token,
    roomId,
    createdBy,
    createdAt: now,
    expiresAt: now + SESSION_TOKEN_TTL_MS,
    usedBy: null,
  };
  await set(tokenRef(roomId, token), record);
  return record;
}

export async function validateSessionToken(
  roomId: string,
  token: string
): Promise<SessionToken | null> {
  const snap = await get(tokenRef(roomId, token));
  if (!snap.exists()) return null;
  const record = snap.val() as SessionToken;
  if (Date.now() > record.expiresAt) return null;
  return record;
}

export async function consumeSessionToken(
  roomId: string,
  token: string,
  newSessionId: string
): Promise<boolean> {
  const record = await validateSessionToken(roomId, token);
  if (!record) return false;
  if (record.usedBy && record.usedBy !== newSessionId) return false;
  await update(tokenRef(roomId, token), { usedBy: newSessionId });
  return true;
}

export function buildHandoffUrl(roomId: string, token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/handoff?room=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token)}`;
}
