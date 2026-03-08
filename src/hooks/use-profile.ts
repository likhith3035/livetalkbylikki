import { useState, useCallback, useEffect } from "react";

const AVATAR_OPTIONS = [
  "😀", "😎", "🤠", "🦊", "🐱", "🐶", "🐼", "🦁",
  "🐸", "🐵", "🦄", "🐲", "👻", "🤖", "👽", "🎃",
  "🌈", "⚡", "🔥", "💎", "🎮", "🎧", "🏀", "🎸",
];

export interface UserProfile {
  nickname: string;
  avatar: string;
}

const STORAGE_KEY = "lchat.profile";

const getStoredProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { nickname: "", avatar: "😀" };
};

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const updateNickname = useCallback((nickname: string) => {
    setProfile((p) => ({ ...p, nickname: nickname.slice(0, 20) }));
  }, []);

  const updateAvatar = useCallback((avatar: string) => {
    setProfile((p) => ({ ...p, avatar }));
  }, []);

  const displayName = profile.nickname.trim() || "Anonymous";

  return { profile, displayName, updateNickname, updateAvatar, AVATAR_OPTIONS };
}
