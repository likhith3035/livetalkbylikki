import { useState, useEffect, useRef, useCallback } from "react";

const STATS_KEY = "livetalk_session_stats";
const STREAK_KEY = "livetalk_streak";

interface DayStats {
  date: string; // YYYY-MM-DD
  conversations: number;
  totalSeconds: number;
}

interface StreakData {
  currentStreak: number;
  lastDate: string;
  longestStreak: number;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadStats(): DayStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const data = JSON.parse(raw) as DayStats;
      if (data.date === todayStr()) return data;
    }
  } catch (err) {
    // Ignore localStorage read/parse errors
  }
  return { date: todayStr(), conversations: 0, totalSeconds: 0 };
}

function saveStats(stats: DayStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw) as StreakData;
  } catch (err) {
    // Ignore localStorage read/parse errors
  }
  return { currentStreak: 0, lastDate: "", longestStreak: 0 };
}

function saveStreak(streak: StreakData) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
}

function updateStreak(streak: StreakData): StreakData {
  const today = todayStr();
  if (streak.lastDate === today) return streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const newStreak = streak.lastDate === yesterdayStr ? streak.currentStreak + 1 : 1;
  const longest = Math.max(newStreak, streak.longestStreak);
  const updated = { currentStreak: newStreak, lastDate: today, longestStreak: longest };
  saveStreak(updated);
  return updated;
}

export function useSessionStats() {
  const [stats, setStats] = useState<DayStats>(loadStats);
  const [streak, setStreak] = useState<StreakData>(loadStreak);
  const sessionStartRef = useRef<number | null>(null);

  // Called when a chat session starts
  const onChatStart = useCallback(() => {
    sessionStartRef.current = Date.now();
  }, []);

  // Called when a chat session ends
  const onChatEnd = useCallback(() => {
    const start = sessionStartRef.current;
    sessionStartRef.current = null;

    setStats(prev => {
      const seconds = start ? Math.floor((Date.now() - start) / 1000) : 0;
      const updated: DayStats = {
        date: todayStr(),
        conversations: prev.date === todayStr() ? prev.conversations + 1 : 1,
        totalSeconds: prev.date === todayStr() ? prev.totalSeconds + seconds : seconds,
      };
      saveStats(updated);
      return updated;
    });

    setStreak(prev => updateStreak(prev));
  }, []);

  // Format total time as "Xm Ys"
  const formatTime = useCallback((seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }, []);

  return {
    todayConversations: stats.conversations,
    todayTotalTime: formatTime(stats.totalSeconds),
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    onChatStart,
    onChatEnd,
  };
}
