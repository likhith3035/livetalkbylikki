import { db } from "@/lib/firebase";
import { ref, set, get, update, onValue, off, push, onDisconnect, remove } from "firebase/database";
import { BeamSession, BeamDeviceInfo, BeamTransferItem, SharedFileItem } from "../types";
import { generateShareCode } from "../utils/cryptoCode";
import { uploadFileWithProgress } from "./fileSharingService";

const BEAM_LOCAL_STORAGE_PREFIX = "livetalk_beam_session_";
const BEAM_CHANNEL_NAME = "incogtalk_beam_channel";

let localBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    localBroadcastChannel = new BroadcastChannel(BEAM_CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel unavailable in some private browsing modes
}

/**
 * Detect a human-friendly name and device form-factor
 */
export function getDeviceSummary(): { name: string; type: "mobile" | "desktop" | "tablet" } {
  if (typeof navigator === "undefined") {
    return { name: "Web Browser", type: "desktop" };
  }
  const ua = navigator.userAgent;
  let type: "mobile" | "desktop" | "tablet" = "desktop";
  let platform = "PC";

  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    type = "tablet";
    platform = "Tablet";
  } else if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) {
    type = "mobile";
    platform = "Phone";
  }

  if (/iphone/i.test(ua)) platform = "iPhone";
  else if (/ipad/i.test(ua)) platform = "iPad";
  else if (/android/i.test(ua)) platform = "Android Device";
  else if (/macintosh|mac os x/i.test(ua)) platform = "Mac";
  else if (/windows/i.test(ua)) platform = "Windows PC";
  else if (/linux/i.test(ua)) platform = "Linux";

  let browser = "Browser";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";

  return { name: `${platform} (${browser})`, type };
}

/**
 * Helper to get device ID
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "dev-" + Math.random().toString(36).slice(2);
  let devId = localStorage.getItem("livetalk_beam_device_id");
  if (!devId) {
    devId = "dev-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    try {
      localStorage.setItem("livetalk_beam_device_id", devId);
    } catch {
      /* ignore */
    }
  }
  return devId;
}

/**
 * Create a new Live Beam Drop Session (Receiver Side)
 */
export async function createBeamSession(
  customReceiverName?: string,
  durationMinutes = 15,
  requireApproval = false
): Promise<BeamSession> {
  const code = generateShareCode(4); // e.g. 7K9M
  const sessionId = `BEAM-${code}`;
  const device = getDeviceSummary();
  const deviceId = getOrCreateDeviceId();

  const receiver: BeamDeviceInfo = {
    id: deviceId,
    name: customReceiverName || device.name,
    type: device.type,
    joinedAt: Date.now(),
    isOnline: true,
  };

  const session: BeamSession = {
    id: sessionId,
    code,
    createdAt: Date.now(),
    expiresAt: Date.now() + durationMinutes * 60 * 1000,
    status: "waiting",
    requireApproval,
    receiver,
    sender: null,
    senders: {},
    transfers: {},
  };

  // 1. Save in local cache & storage
  try {
    localStorage.setItem(BEAM_LOCAL_STORAGE_PREFIX + code, JSON.stringify(session));
  } catch {
    /* ignore */
  }

  // 2. Broadcast locally for multi-tab testing
  if (localBroadcastChannel) {
    localBroadcastChannel.postMessage({ type: "session_created", session });
  }

  // 3. Sync to Firebase Realtime Database (/rooms/beam_<code_or_id>)
  try {
    const sessionRef = ref(db, `rooms/beam_${code}`);
    await set(sessionRef, session);

    // Set offline on disconnect
    try {
      const receiverOnlineRef = ref(db, `rooms/beam_${code}/receiver/isOnline`);
      onDisconnect(receiverOnlineRef).set(false);
    } catch {
      /* ignore */
    }
  } catch (err) {
    console.warn("[BeamService] Firebase RTDB sync fallback:", err);
  }

  return session;
}

/**
 * Pair a device to an active Beam Session (Sender Side - Supports Multiple Peers)
 */
export async function joinBeamSession(
  codeOrId: string,
  customSenderName?: string
): Promise<BeamSession> {
  const code = codeOrId.toUpperCase().replace(/^BEAM-/, "").trim();
  const device = getDeviceSummary();
  const deviceId = getOrCreateDeviceId();

  const sender: BeamDeviceInfo = {
    id: deviceId,
    name: customSenderName || device.name,
    type: device.type,
    joinedAt: Date.now(),
    isOnline: true,
  };

  let session: BeamSession | null = null;

  // 1. Check Firebase RTDB
  try {
    const snap = await get(ref(db, `rooms/beam_${code}`));
    if (snap.exists()) {
      session = snap.val() as BeamSession;
    }
  } catch (err) {
    console.warn("[BeamService] Firebase fetch error:", err);
  }

  // 2. Check LocalStorage fallback
  if (!session) {
    try {
      const raw = localStorage.getItem(BEAM_LOCAL_STORAGE_PREFIX + code);
      if (raw) session = JSON.parse(raw);
    } catch {
      /* ignore */
    }
  }

  if (!session) {
    throw new Error(`Live Beam Drop session "${code}" not found or expired.`);
  }

  if (session.status === "closed") {
    throw new Error(`This Live Beam Drop session has ended.`);
  }

  if (session.expiresAt && Date.now() > session.expiresAt) {
    throw new Error(`This Live Beam Drop session has expired.`);
  }

  // Update session to paired with multi-peer support
  session.sender = sender;
  session.senders = session.senders || {};
  session.senders[deviceId] = sender;
  session.status = "paired";

  // Save to Firebase
  try {
    await update(ref(db, `rooms/beam_${code}`), {
      sender,
      [`senders/${deviceId}`]: sender,
      status: "paired",
    });

    try {
      const senderOnlineRef = ref(db, `rooms/beam_${code}/senders/${deviceId}/isOnline`);
      onDisconnect(senderOnlineRef).set(false);
    } catch {
      /* ignore */
    }
  } catch {
    /* fallback */
  }

  // Save to local storage
  try {
    localStorage.setItem(BEAM_LOCAL_STORAGE_PREFIX + code, JSON.stringify(session));
  } catch {
    /* ignore */
  }

  // Broadcast locally
  if (localBroadcastChannel) {
    localBroadcastChannel.postMessage({ type: "session_paired", session });
  }

  return session;
}

/**
 * Listen for live updates on a Beam Session
 */
export function listenBeamSession(
  codeOrId: string,
  onUpdate: (session: BeamSession | null) => void
): () => void {
  const code = codeOrId.toUpperCase().replace(/^BEAM-/, "").trim();
  let isUnsubscribed = false;

  // 1. Firebase listener
  const sessionRef = ref(db, `rooms/beam_${code}`);
  const firebaseHandler = (snapshot: any) => {
    if (isUnsubscribed) return;
    if (snapshot.exists()) {
      const val = snapshot.val() as BeamSession;
      try {
        localStorage.setItem(BEAM_LOCAL_STORAGE_PREFIX + code, JSON.stringify(val));
      } catch {
        /* ignore */
      }
      onUpdate(val);
    }
  };

  try {
    onValue(sessionRef, firebaseHandler);
  } catch (err) {
    console.warn("[BeamService] Firebase onValue error:", err);
  }

  // 2. Local BroadcastChannel listener
  const channelHandler = (ev: MessageEvent) => {
    if (isUnsubscribed) return;
    const msg = ev.data;
    if (msg && msg.session && msg.session.code === code) {
      onUpdate(msg.session);
    }
  };

  if (localBroadcastChannel) {
    localBroadcastChannel.addEventListener("message", channelHandler);
  }

  // 3. Storage event listener (same-browser cross-tab)
  const storageHandler = (e: StorageEvent) => {
    if (isUnsubscribed) return;
    if (e.key === BEAM_LOCAL_STORAGE_PREFIX + code && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        onUpdate(parsed);
      } catch {
        /* ignore */
      }
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", storageHandler);
  }

  // Initial local read if available
  try {
    const raw = localStorage.getItem(BEAM_LOCAL_STORAGE_PREFIX + code);
    if (raw) onUpdate(JSON.parse(raw));
  } catch {
    /* ignore */
  }

  return () => {
    isUnsubscribed = true;
    try {
      off(sessionRef, "value", firebaseHandler);
    } catch {
      /* ignore */
    }
    if (localBroadcastChannel) {
      localBroadcastChannel.removeEventListener("message", channelHandler);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", storageHandler);
    }
  };
}

/**
 * Send a transfer payload across the active Beam session (files, text, camera snap, secret, voice)
 */
export async function sendBeamTransfer(
  codeOrId: string,
  transfer: Omit<BeamTransferItem, "id" | "timestamp">
): Promise<BeamTransferItem> {
  const code = codeOrId.toUpperCase().replace(/^BEAM-/, "").trim();
  const transferId = "tx-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);

  // Check if session requires approval
  let requiresApproval = false;
  try {
    const snap = await get(ref(db, `rooms/beam_${code}/requireApproval`));
    if (snap.exists()) {
      requiresApproval = !!snap.val();
    }
  } catch {
    /* ignore */
  }

  if (!requiresApproval) {
    try {
      const raw = localStorage.getItem(BEAM_LOCAL_STORAGE_PREFIX + code);
      if (raw) {
        const cached = JSON.parse(raw) as BeamSession;
        requiresApproval = !!cached.requireApproval;
      }
    } catch {
      /* ignore */
    }
  }

  const transferItem: BeamTransferItem = {
    ...transfer,
    id: transferId,
    timestamp: Date.now(),
    status: transfer.status || (requiresApproval ? "pending" : "accepted"),
  };

  // 1. Push into Firebase RTDB
  try {
    const transfersRef = ref(db, `rooms/beam_${code}/transfers/${transferId}`);
    await set(transfersRef, transferItem);
  } catch (err) {
    console.warn("[BeamService] Firebase transfer push fallback:", err);
  }

  // 2. Update local storage
  try {
    const raw = localStorage.getItem(BEAM_LOCAL_STORAGE_PREFIX + code);
    if (raw) {
      const session = JSON.parse(raw) as BeamSession;
      session.transfers = session.transfers || {};
      session.transfers[transferId] = transferItem;
      localStorage.setItem(BEAM_LOCAL_STORAGE_PREFIX + code, JSON.stringify(session));

      if (localBroadcastChannel) {
        localBroadcastChannel.postMessage({ type: "transfer_added", session });
      }
    }
  } catch {
    /* ignore */
  }

  return transferItem;
}

/**
 * Accept or decline an incoming transfer when Public Screen Approval Gate is enabled
 */
export async function updateTransferApprovalStatus(
  codeOrId: string,
  transferId: string,
  status: "accepted" | "declined"
): Promise<void> {
  const code = codeOrId.toUpperCase().replace(/^BEAM-/, "").trim();
  try {
    const statusRef = ref(db, `rooms/beam_${code}/transfers/${transferId}/status`);
    await set(statusRef, status);
  } catch {
    /* ignore */
  }

  try {
    const raw = localStorage.getItem(BEAM_LOCAL_STORAGE_PREFIX + code);
    if (raw) {
      const session = JSON.parse(raw) as BeamSession;
      if (session.transfers?.[transferId]) {
        session.transfers[transferId].status = status;
        localStorage.setItem(BEAM_LOCAL_STORAGE_PREFIX + code, JSON.stringify(session));
        if (localBroadcastChannel) {
          localBroadcastChannel.postMessage({ type: "transfer_approval_updated", session });
        }
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * Extend active Beam Session by additional minutes
 */
export async function extendBeamSession(codeOrId: string, extraMinutes = 15): Promise<number> {
  const code = codeOrId.toUpperCase().replace(/^BEAM-/, "").trim();
  const addedMs = extraMinutes * 60 * 1000;
  let newExpiresAt = Date.now() + addedMs;

  try {
    const snap = await get(ref(db, `rooms/beam_${code}/expiresAt`));
    if (snap.exists()) {
      const current = snap.val() as number;
      newExpiresAt = Math.max(current, Date.now()) + addedMs;
    }
    await update(ref(db, `rooms/beam_${code}`), { expiresAt: newExpiresAt });
  } catch {
    /* ignore */
  }

  try {
    const raw = localStorage.getItem(BEAM_LOCAL_STORAGE_PREFIX + code);
    if (raw) {
      const session = JSON.parse(raw) as BeamSession;
      session.expiresAt = newExpiresAt;
      localStorage.setItem(BEAM_LOCAL_STORAGE_PREFIX + code, JSON.stringify(session));
      if (localBroadcastChannel) {
        localBroadcastChannel.postMessage({ type: "session_extended", session });
      }
    }
  } catch {
    /* ignore */
  }

  return newExpiresAt;
}

/**
 * Toggle Require Approval for incoming items (Public Screen Protection Mode)
 */
export async function toggleSessionApproval(codeOrId: string, requireApproval: boolean): Promise<void> {
  const code = codeOrId.toUpperCase().replace(/^BEAM-/, "").trim();
  try {
    await update(ref(db, `rooms/beam_${code}`), { requireApproval });
  } catch {
    /* ignore */
  }

  try {
    const raw = localStorage.getItem(BEAM_LOCAL_STORAGE_PREFIX + code);
    if (raw) {
      const session = JSON.parse(raw) as BeamSession;
      session.requireApproval = requireApproval;
      localStorage.setItem(BEAM_LOCAL_STORAGE_PREFIX + code, JSON.stringify(session));
      if (localBroadcastChannel) {
        localBroadcastChannel.postMessage({ type: "session_approval_toggled", session });
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * Burn/mark secret as viewed in a Beam session
 */
export async function burnSecretInBeam(codeOrId: string, transferId: string): Promise<void> {
  const code = codeOrId.toUpperCase().replace(/^BEAM-/, "").trim();
  try {
    const secretRef = ref(db, `rooms/beam_${code}/transfers/${transferId}/secretPayload/hasBeenViewed`);
    await set(secretRef, true);
  } catch {
    /* ignore */
  }

  try {
    const raw = localStorage.getItem(BEAM_LOCAL_STORAGE_PREFIX + code);
    if (raw) {
      const session = JSON.parse(raw) as BeamSession;
      if (session.transfers?.[transferId]?.secretPayload) {
        session.transfers[transferId].secretPayload!.hasBeenViewed = true;
        localStorage.setItem(BEAM_LOCAL_STORAGE_PREFIX + code, JSON.stringify(session));
        if (localBroadcastChannel) {
          localBroadcastChannel.postMessage({ type: "secret_burned", session });
        }
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * Close/End an active Beam session
 */
export async function closeBeamSession(codeOrId: string): Promise<void> {
  const code = codeOrId.toUpperCase().replace(/^BEAM-/, "").trim();
  try {
    await update(ref(db, `rooms/beam_${code}`), { status: "closed" });
  } catch {
    /* ignore */
  }

  try {
    const raw = localStorage.getItem(BEAM_LOCAL_STORAGE_PREFIX + code);
    if (raw) {
      const session = JSON.parse(raw) as BeamSession;
      session.status = "closed";
      localStorage.setItem(BEAM_LOCAL_STORAGE_PREFIX + code, JSON.stringify(session));
      if (localBroadcastChannel) {
        localBroadcastChannel.postMessage({ type: "session_closed", session });
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * Upload single file for beam transfer
 */
export async function uploadBeamFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<SharedFileItem> {
  return uploadFileWithProgress({
    file,
    onProgress,
  });
}

/**
 * Upload audio voice memo for beam transfer
 */
export async function uploadBeamAudio(
  audioBlob: Blob,
  durationSec: number,
  onProgress?: (percent: number) => void
): Promise<SharedFileItem> {
  const ext = audioBlob.type.includes("mp4") ? "m4a" : "webm";
  const fileName = `Voice_Memo_${Date.now()}.${ext}`;
  const file = new File([audioBlob], fileName, { type: audioBlob.type || "audio/webm" });

  return uploadFileWithProgress({
    file,
    onProgress,
  });
}

