import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";

const getSessionId = () => {
  let id = sessionStorage.getItem("echo_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("echo_session_id", id);
  }
  return id;
};

export function useOnlineCount() {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const sessionId = getSessionId();
    const presenceRef = ref(db, `presence/${sessionId}`);
    const countRef = ref(db, "presence");
    const connectedRef = ref(db, ".info/connected");

    // Handle user's presence
    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // We are connected (or reconnected)
        // Remove this node when we disconnect
        onDisconnect(presenceRef).remove();
        
        // Add this user to presence
        set(presenceRef, {
          online_at: serverTimestamp(),
        });
      }
    });

    // Monitor total count
    const unsubscribeCount = onValue(countRef, (snap) => {
      if (snap.exists()) {
        const count = Object.keys(snap.val()).length;
        setOnlineCount(count);
      } else {
        setOnlineCount(0);
      }
    });

    return () => {
      unsubscribeConnected();
      unsubscribeCount();
      // Explicitly remove presence on unmount
      set(presenceRef, null);
    };
  }, []);

  return onlineCount;
}
