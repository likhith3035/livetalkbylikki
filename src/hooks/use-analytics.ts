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
      const hour = new Date().getHours();
      const visitRef = ref(db, `analytics/daily_visits/${today}`);
      const hourlyRef = ref(db, `analytics/hourly_visits/${today}/${hour}`);

      try {
        await Promise.all([
          runTransaction(visitRef, (val) => (val || 0) + 1),
          runTransaction(hourlyRef, (val) => (val || 0) + 1)
        ]);
        sessionStorage.setItem(sessionKey, "true");
      } catch (error) {
        console.error("[Analytics] Failed to track visit:", error);
      }
    };

    trackVisit();
  }, []);
}

export const trackMatch = async () => {
  if (!db) return;
  const today = new Date().toISOString().split("T")[0];
  const totalMatchesRef = ref(db, "analytics/total_matches");
  const dailyMatchesRef = ref(db, `analytics/daily_matches/${today}`);
  
  try {
    await Promise.all([
      runTransaction(totalMatchesRef, (val) => (val || 0) + 1),
      runTransaction(dailyMatchesRef, (val) => (val || 0) + 1)
    ]);
  } catch (e) {
    console.error("[Analytics] Failed to track match:", e);
  }
};
