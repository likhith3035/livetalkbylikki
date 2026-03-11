import { useRef, useCallback, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onChildAdded, push, remove, off, onDisconnect } from "firebase/database";

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

    // Listen for new signaling events
    const unsubscribe = onChildAdded(roomSignalingRef, (snapshot) => {
      const data = snapshot.val();
      if (data.payload.senderId !== sessionId) {
        onEvent(data.type, data.payload);
        
        // AGGRESSIVE CLEANUP: Remove the event message immediately after reading it
        // This ensures the signaling queue doesn't grow and no history is kept.
        remove(snapshot.ref);
      }
    });

    // Automatically remove the entire signaling node for this room if the user disconnects
    onDisconnect(roomSignalingRef).remove();

    return () => {
      off(roomSignalingRef);
    };
  }, [roomId, sessionId, onEvent]);

  return { sendEvent };
}
