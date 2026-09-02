import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GamerProfile, MatchHistoryEntry } from "../types";
import {
  GAMER_AVATARS,
  GAMER_BADGES,
  getXpForNextLevel,
  saveGamerProfile,
} from "../services/gameProgressionService";
import { GameAvatar } from "./GameAvatar";
import { gameAudio } from "../services/gameSoundService";
import { Trophy, Flame, Swords, Check, Sparkles, User, Award, History, Clock } from "lucide-react";
import { toast } from "sonner";

interface GamerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: GamerProfile;
  onProfileUpdated: (updated: GamerProfile) => void;
}

const GAME_ICONS: Record<string, string> = {
  ttt: "⭕",
  connect4: "🔴",
  rps: "✊",
  memory: "🧠",
  reaction: "⚡",
};

const GAME_NAMES: Record<string, string> = {
  ttt: "Tic-Tac-Toe",
  connect4: "Connect 4",
  rps: "Rock Paper Scissors",
  memory: "Memory Duel",
  reaction: "Reaction Dash",
};

export const GamerProfileModal: React.FC<GamerProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "history">("profile");
  const [nickname, setNickname] = useState(profile.nickname);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);

  const xpNeeded = getXpForNextLevel(profile.level);
  const progressPercent = Math.min(Math.round((profile.xp / xpNeeded) * 100), 100);

  const handleSave = () => {
    const cleanNick = nickname.trim();
    if (!cleanNick) {
      toast.error("Please enter a valid gamer nickname.");
      return;
    }

    gameAudio.playWin();
    const updated: GamerProfile = {
      ...profile,
      nickname: cleanNick,
      avatar: selectedAvatar,
    };

    saveGamerProfile(updated);
    onProfileUpdated(updated);
    toast.success("Arcade Profile updated!");
    onClose();
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[92vw] sm:max-w-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col touch-manipulation">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-black flex items-center justify-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Arcade Gamer Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Customize your gamer tag, choose your avatar, and review your battle history.
          </DialogDescription>

          {/* Tab Switcher */}
          <div className="flex items-center justify-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/40 mx-auto mt-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile & Badges</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Battle History ({profile.recentMatches?.length || 0})</span>
            </button>
          </div>
        </DialogHeader>

        {activeTab === "profile" ? (
          <div className="flex-1 overflow-y-auto space-y-5 my-2 pr-1 no-scrollbar">
            {/* Level & XP Banner Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/15 via-muted/40 to-violet-500/10 border border-primary/30 relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-2xl shadow-md overflow-hidden shrink-0">
                    <GameAvatar avatar={selectedAvatar} fallback="👾" className="text-2xl" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground">{nickname || "Gamer"}</span>
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Level {profile.level} • {profile.title}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-foreground">{profile.xp} / {xpNeeded}</span>
                  <span className="text-[10px] text-muted-foreground block font-medium">XP to Level {profile.level + 1}</span>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="w-full h-2 rounded-full bg-muted/80 overflow-hidden border border-border/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
                />
              </div>
            </div>

            {/* Nickname Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Gamer Nickname
              </label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={15}
                placeholder="e.g. PixelKnight"
                className="h-11 rounded-xl bg-muted/60 border-border text-sm font-semibold"
              />
            </div>

            {/* Avatar Picker Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Choose Avatar
              </label>
              <div className="grid grid-cols-6 gap-2 p-2 rounded-2xl bg-muted/30 border border-border/40">
                {GAMER_AVATARS.map((emoji, idx) => {
                  const isSelected = selectedAvatar === emoji;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        gameAudio.playClick();
                        setSelectedAvatar(emoji);
                      }}
                      className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/25 border-2 border-primary shadow-md scale-110"
                          : "hover:bg-muted border border-transparent"
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Badges Showcase */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                Achievements ({profile.unlockedBadges.length} / {GAMER_BADGES.length})
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GAMER_BADGES.map((badge) => {
                  const isUnlocked = profile.unlockedBadges.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                        isUnlocked
                          ? "bg-muted/60 border-border/80 text-foreground"
                          : "bg-muted/20 border-border/30 opacity-40 grayscale"
                      }`}
                    >
                      <span className="text-2xl shrink-0">{badge.icon}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black truncate">{badge.title}</span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {badge.requirement}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Recent Battles History Tab */
          <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1 no-scrollbar">
            {!profile.recentMatches || profile.recentMatches.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground">
                <History className="w-8 h-8 mb-2 opacity-40 text-primary" />
                <span className="text-xs font-bold">No battle history yet</span>
                <span className="text-[11px]">Play your first 1v1 duel or AI match to log results here!</span>
              </div>
            ) : (
              profile.recentMatches.map((match: MatchHistoryEntry) => {
                const isWon = match.outcome === "won";
                const isDraw = match.outcome === "draw";

                return (
                  <div
                    key={match.id}
                    className="p-3 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl shrink-0">
                        {GAME_ICONS[match.gameId] || "🎮"}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-black text-foreground truncate">
                            {GAME_NAMES[match.gameId] || "Arcade Duel"}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            vs {match.opponentName}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/80 capitalize flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(match.timestamp)} • {match.mode}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                          isWon
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : isDraw
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        }`}
                      >
                        {match.outcome}
                      </span>
                      <span className="text-[10px] font-bold text-primary mt-0.5">
                        +{match.xpGained} XP
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Action Footer */}
        {activeTab === "profile" && (
          <div className="pt-3 border-t border-border/40 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border-border text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/25 gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Save Profile
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
