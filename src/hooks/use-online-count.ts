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
    // Safety check: if Firebase is not properly initialized, don't crash
    if (!db) return;

    const sessionId = getSessionId();
    const presenceRef = ref(db, `presence/${sessionId}`);
    const countRef = ref(db, "presence");
    const connectedRef = ref(db, ".info/connected");

    // Handle user's presence state
    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // Set up automatic cleanup on disconnect
        onDisconnect(presenceRef).remove().catch(() => {
          /* fail silently */
        });
        
        // Mark user as online
        set(presenceRef, {
          online_at: serverTimestamp(),
        }).catch(err => {
          if (err.message.includes("permission_denied")) {
            console.warn("[Firebase] Presence permission denied. Please check your Security Rules.");
          }
        });
      }
    });

    // Monitor total online count
    const unsubscribeCount = onValue(countRef, (snap) => {
      if (snap.exists()) {
        const count = Object.keys(snap.val()).length;
        setOnlineCount(count);
      } else {
        setOnlineCount(0);
      }
    }, (error) => {
      if (error.message.includes("permission_denied")) {
        console.warn("[Firebase] Online count read permission denied. Please check your Security Rules.");
      }
    });

    return () => {
      unsubscribeConnected();
      unsubscribeCount();
      // Explicitly remove presence on unmount for faster cleanup
      set(presenceRef, null).catch(() => {});
    };
  }, []);

  return onlineCount;
}
