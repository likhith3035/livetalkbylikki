import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, runTransaction } from "firebase/database";

export function useAnalytics() {
  useEffect(() => {
    if (!db) return;

    const trackVisit = async () => {
      // Check if this visit has already been counted in this session
      const sessionKey = "livetalk_visit_counted";
      if (sessionStorage.getItem(sessionKey)) return;

      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const visitRef = ref(db, `analytics/daily_visits/${today}`);

      try {
        await runTransaction(visitRef, (currentValue) => {
          return (currentValue || 0) + 1;
        });
        sessionStorage.setItem(sessionKey, "true");
      } catch (error) {
        console.error("[Analytics] Failed to track visit:", error);
      }
    };

    trackVisit();
  }, []);
}
