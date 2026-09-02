import { GamerProfile, GamerBadge } from "../types";
import { getProfile, saveProfile } from "@/lib/identity";

const STORAGE_KEY = "livetalk_gamer_profile_v2";

export const GAMER_BADGES: GamerBadge[] = [
  {
    id: "first_win",
    title: "First Blood",
    description: "Secured your very first arcade victory.",
    icon: "🥇",
    color: "from-amber-400 to-yellow-600",
    requirement: "Win 1 Match",
  },
  {
    id: "streak_3",
    title: "On Fire",
    description: "Dominated the arena with a 3-win streak.",
    icon: "🔥",
    color: "from-orange-500 to-red-600",
    requirement: "3 Win Streak",
  },
  {
    id: "streak_5",
    title: "Unstoppable",
    description: "Achieved legendary status with a 5-win streak.",
    icon: "⚡",
    color: "from-yellow-400 to-amber-600",
    requirement: "5 Win Streak",
  },
  {
    id: "veteran_10",
    title: "Arcade Veteran",
    description: "Competed in 10 intense multiplayer battles.",
    icon: "👑",
    color: "from-violet-500 to-purple-600",
    requirement: "Play 10 Matches",
  },
  {
    id: "century_master",
    title: "Century Club",
    description: "Accumulated 1,000 Total XP in the Arcade.",
    icon: "🏆",
    color: "from-emerald-400 to-teal-600",
    requirement: "Reach 1,000 XP",
  },
];

export const GAMER_AVATARS = [
  "🤖", "🥷", "👾", "🐉", "🦊", "⚡", "👑", "🎯",
  "🚀", "🔥", "💀", "🦁", "💎", "🎮", "🦄", "⭐",
  "🦾", "🐱", "🐶", "🐼", "🦖", "🌪️", "✨", "🥊",
];

export function getRankTitle(level: number): string {
  if (level <= 2) return "Arcade Rookie";
  if (level <= 4) return "Neon Duelist";
  if (level <= 7) return "Tactical Strategist";
  if (level <= 10) return "Minimax Slayer";
  if (level <= 15) return "Speed Demon";
  if (level <= 20) return "Arcade Legend";
  return "Grandmaster 👑";
}

export function getXpForNextLevel(level: number): number {
  return 100 + level * 75;
}

export function getGamerProfile(): GamerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Clean avatar if base64 leaked
      const safeAvatar = parsed.avatar && (parsed.avatar.startsWith("data:image/") || parsed.avatar.startsWith("http") || parsed.avatar.length <= 8)
        ? parsed.avatar
        : "👾";

      return {
        ...parsed,
        avatar: safeAvatar,
        title: getRankTitle(parsed.level || 1),
      };
    }
  } catch {}

  const baseProfile = getProfile();
  const safeBaseAvatar = baseProfile.avatar && (baseProfile.avatar.startsWith("data:image/") || baseProfile.avatar.startsWith("http") || baseProfile.avatar.length <= 8)
    ? baseProfile.avatar
    : "👾";

  return {
    nickname: baseProfile.nickname || "RetroGamer",
    avatar: safeBaseAvatar,
    level: 1,
    xp: 0,
    title: "Arcade Rookie",
    wins: 0,
    losses: 0,
    draws: 0,
    played: 0,
    streak: 0,
    bestStreak: 0,
    unlockedBadges: [],
  };
}

export function saveGamerProfile(profile: GamerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    // Keep base profile in sync
    saveProfile({
      nickname: profile.nickname,
      avatar: profile.avatar,
    });
  } catch {}
}

export interface MatchOutcomeReward {
  won: boolean;
  draw?: boolean;
}

export function awardMatchXP(outcome: MatchOutcomeReward): {
  profile: GamerProfile;
  xpGained: number;
  leveledUp: boolean;
  newBadgeUnlocked: GamerBadge | null;
} {
  const current = getGamerProfile();
  let xpGained = 30; // base completion XP

  if (outcome.won) {
    xpGained += 80;
  } else if (outcome.draw) {
    xpGained += 40;
  }

  const nextStreak = outcome.won ? current.streak + 1 : outcome.draw ? current.streak : 0;
  if (nextStreak > 1) {
    xpGained += Math.min(nextStreak * 10, 50); // streak bonus XP
  }

  let totalXP = current.xp + xpGained;
  let level = current.level;
  let leveledUp = false;

  let xpNeeded = getXpForNextLevel(level);
  while (totalXP >= xpNeeded) {
    totalXP -= xpNeeded;
    level += 1;
    leveledUp = true;
    xpNeeded = getXpForNextLevel(level);
  }

  const updatedWins = outcome.won ? current.wins + 1 : current.wins;
  const updatedLosses = !outcome.won && !outcome.draw ? current.losses + 1 : current.losses;
  const updatedDraws = outcome.draw ? current.draws + 1 : current.draws;
  const updatedPlayed = current.played + 1;
  const updatedBestStreak = Math.max(current.bestStreak, nextStreak);

  // Check Badges
  const unlocked = [...current.unlockedBadges];
  let newlyUnlockedBadge: GamerBadge | null = null;

  const checkBadge = (id: string, condition: boolean) => {
    if (condition && !unlocked.includes(id)) {
      unlocked.push(id);
      const badge = GAMER_BADGES.find((b) => b.id === id);
      if (badge) newlyUnlockedBadge = badge;
    }
  };

  checkBadge("first_win", updatedWins >= 1);
  checkBadge("streak_3", nextStreak >= 3);
  checkBadge("streak_5", nextStreak >= 5);
  checkBadge("veteran_10", updatedPlayed >= 10);
  checkBadge("century_master", totalXP + (level - 1) * 150 >= 1000);

  const updatedProfile: GamerProfile = {
    ...current,
    level,
    xp: totalXP,
    title: getRankTitle(level),
    wins: updatedWins,
    losses: updatedLosses,
    draws: updatedDraws,
    played: updatedPlayed,
    streak: nextStreak,
    bestStreak: updatedBestStreak,
    unlockedBadges: unlocked,
  };

  saveGamerProfile(updatedProfile);

  return {
    profile: updatedProfile,
    xpGained,
    leveledUp,
    newBadgeUnlocked: newlyUnlockedBadge,
  };
}
