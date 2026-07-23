import { useState, useEffect, useCallback } from "react";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

const GAMIFICATION_KEY = "livetalk_gamification_data";

interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  lastLoginDate: string;
  totalChats: number;
  unlockedBadgeIds: string[];
}

const BADGES_LIST: Omit<Badge, "unlocked">[] = [
  { id: "first_chat", name: "First Spark", description: "Completed your first live chat session", icon: "✨" },
  { id: "streak_3", name: "On Fire", description: "Maintained a 3-day active streak", icon: "🔥" },
  { id: "night_owl", name: "Night Owl", description: "Chatted after midnight", icon: "🦉" },
  { id: "socialite", name: "Social Butterfly", description: "Connected with 10+ strangers", icon: "🦋" },
  { id: "ai_friend", name: "AI Whisperer", description: "Completed a chat session with an AI companion", icon: "🤖" },
  { id: "security_pro", name: "Fort Knox", description: "Enabled Biometric App Lock", icon: "🔒" },
];

export function useGamification() {
  const [data, setData] = useState<GamificationState>(() => {
    try {
      const saved = localStorage.getItem(GAMIFICATION_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      xp: 150,
      level: 2,
      streak: 3,
      lastLoginDate: new Date().toISOString().split("T")[0],
      totalChats: 5,
      unlockedBadgeIds: ["first_chat", "streak_3"],
    };
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("[Gamification] Save failed:", e);
    }
  }, [data]);

  // Check & update daily streak
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (data.lastLoginDate !== today) {
      const last = new Date(data.lastLoginDate);
      const now = new Date(today);
      const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 3600 * 24));

      setData((prev) => {
        const newStreak = diffDays === 1 ? prev.streak + 1 : 1;
        const xpGain = 50;
        return {
          ...prev,
          streak: newStreak,
          xp: prev.xp + xpGain,
          lastLoginDate: today,
        };
      });
    }
  }, [data.lastLoginDate]);

  const addXp = useCallback((amount: number) => {
    setData((prev) => {
      const newXp = prev.xp + amount;
      const newLevel = Math.floor(newXp / 100) + 1;
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
      };
    });
  }, []);

  const recordChat = useCallback(() => {
    setData((prev) => {
      const newTotal = prev.totalChats + 1;
      const newXp = prev.xp + 30;
      const newLevel = Math.floor(newXp / 100) + 1;
      const newBadges = [...prev.unlockedBadgeIds];

      if (!newBadges.includes("first_chat")) newBadges.push("first_chat");
      if (newTotal >= 10 && !newBadges.includes("socialite")) newBadges.push("socialite");

      return {
        ...prev,
        totalChats: newTotal,
        xp: newXp,
        level: newLevel,
        unlockedBadgeIds: newBadges,
      };
    });
  }, []);

  const unlockBadge = useCallback((badgeId: string) => {
    setData((prev) => {
      if (prev.unlockedBadgeIds.includes(badgeId)) return prev;
      return {
        ...prev,
        unlockedBadgeIds: [...prev.unlockedBadgeIds, badgeId],
        xp: prev.xp + 100,
      };
    });
  }, []);

  const badges: Badge[] = BADGES_LIST.map((b) => ({
    ...b,
    unlocked: data.unlockedBadgeIds.includes(b.id),
  }));

  const nextLevelXp = data.level * 100;
  const currentLevelProgress = Math.min(Math.round(((data.xp % 100) / 100) * 100), 100);

  return {
    xp: data.xp,
    level: data.level,
    streak: data.streak,
    totalChats: data.totalChats,
    badges,
    nextLevelXp,
    progressPercent: currentLevelProgress,
    addXp,
    recordChat,
    unlockBadge,
  };
}
