import { useRef, useCallback, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onChildAdded, push, remove, off, onDisconnect, serverTimestamp } from "firebase/database";

interface SignalingOptions {
  sessionId: string;
  roomId: string | null;
  onEvent: (event: string, payload: any) => void;
}

export function useFirebaseSignaling({ sessionId, roomId, onEvent }: SignalingOptions) {
  const sendEvent = useCallback((event: string, payload: any) => {
    if (!roomId) return;
    const roomSignalingRef = ref(db, `rooms/${roomId}/signaling`);
    push(roomSignalingRef, {
      type: event,
      payload: { ...payload, senderId: sessionId },
      timestamp: Date.now()
    });
  }, [roomId, sessionId]);

  useEffect(() => {
    if (!roomId) return;

    const roomSignalingRef = ref(db, `rooms/${roomId}/signaling`);
    const processedIds = new Set<string>();

    const unsubscribe = onChildAdded(roomSignalingRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Deduplicate — mobile reconnects can re-fire onChildAdded for old events
      const eventId = snapshot.key;
      if (eventId && processedIds.has(eventId)) return;
      if (eventId) processedIds.add(eventId);

      if (data.payload?.senderId !== sessionId) {
        onEvent(data.type, data.payload);
        // Delay removal slightly so both sides can read it
        setTimeout(() => remove(snapshot.ref).catch(() => {}), 2000);
      }
    });

    // DO NOT use onDisconnect().remove() on signaling —
    // mobile background triggers Firebase disconnect and wipes the node,
    // causing the other user to think you left.

    return () => {
      off(roomSignalingRef, "child_added", unsubscribe as any);
    };
  }, [roomId, sessionId, onEvent]);

  return { sendEvent };
}
