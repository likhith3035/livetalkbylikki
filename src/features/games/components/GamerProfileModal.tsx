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
import { GamerProfile } from "../types";
import {
  GAMER_AVATARS,
  GAMER_BADGES,
  getXpForNextLevel,
  saveGamerProfile,
} from "../services/gameProgressionService";
import { GameAvatar } from "./GameAvatar";
import { gameAudio } from "../services/gameSoundService";
import { Trophy, Flame, Swords, Check, Sparkles, User, Award } from "lucide-react";
import { toast } from "sonner";

interface GamerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: GamerProfile;
  onProfileUpdated: (updated: GamerProfile) => void;
}

export const GamerProfileModal: React.FC<GamerProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-black flex items-center justify-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Arcade Gamer Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Customize your gamer tag, choose your avatar, and track achievements.
          </DialogDescription>
        </DialogHeader>

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

        {/* Action Footer */}
        <div className="pt-3 border-t border-border/40 flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border-border text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/25 gap-1.5"
          >
            <Check className="w-4 h-4" />
            Save Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
