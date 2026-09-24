import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Swords, Eye, Dices, Sparkles, UserCheck } from "lucide-react";
import { gameAudio } from "../services/gameSoundService";

const RANDOM_NICKNAMES = [
  "NeonStriker",
  "PixelChamp",
  "BlitzNinja",
  "CyberTiger",
  "ArcadeKing",
  "HyperViper",
  "SonicMaster",
  "ShadowDuelist",
  "GalaxyRider",
  "TurboAce",
  "MysticStar",
  "VortexGamer",
];

const QUICK_AVATARS = [
  "👾", "🦊", "⚡", "👑", "🎯", "🚀", "🦁", "🤖", "🐱", "🐼", "🎮", "🔥",
];

export interface QuickJoinModalProps {
  isOpen: boolean;
  roomCode: string;
  initialName?: string;
  initialAvatar?: string;
  onJoin: (code: string, name: string, avatar: string) => Promise<void> | void;
  onSpectate?: (code: string) => Promise<void> | void;
  onClose: () => void;
}

export const QuickJoinModal: React.FC<QuickJoinModalProps> = ({
  isOpen,
  roomCode,
  initialName = "",
  initialAvatar = "👾",
  onJoin,
  onSpectate,
  onClose,
}) => {
  const [nickname, setNickname] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fallback = initialName && initialName !== "RetroGamer" && initialName !== "Player 1"
        ? initialName
        : "Player 2";
      setNickname(fallback);
      setAvatar(initialAvatar || "👾");
      setIsSubmitting(false);
    }
  }, [isOpen, initialName, initialAvatar]);

  const handleRandomizeName = () => {
    gameAudio.playClick();
    const pick = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    setNickname(pick);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanName = nickname.trim() || "Player 2";
    setIsSubmitting(true);
    gameAudio.playWin();
    try {
      await onJoin(roomCode, cleanName, avatar);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[94vw] sm:max-w-md p-5 sm:p-6 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/60 shadow-2xl overflow-hidden select-none touch-manipulation">
        <DialogHeader className="text-center pb-1">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-indigo-500/20 border border-primary/40 flex items-center justify-center text-3xl shadow-lg shadow-primary/20 mb-2">
            <span>{avatar}</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center justify-center gap-2">
            <span>Join Match</span>
            <span className="px-2 py-0.5 rounded-lg bg-primary/15 text-primary text-xs font-mono font-bold border border-primary/30">
              #{roomCode}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            You've been invited via QR code / link. Enter your nickname to jump in!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 my-2">
          {/* Nickname Input with Randomizer */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Your Nickname</span>
              <button
                type="button"
                onClick={handleRandomizeName}
                className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Randomize</span>
              </button>
            </label>
            <div className="relative">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter player name"
                maxLength={18}
                autoFocus
                className="h-11 rounded-xl font-bold text-sm bg-muted/60 border-border/80 pr-10 focus:ring-2 focus:ring-primary"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Quick 1-Tap Avatar Picker */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Choose Avatar
            </label>
            <div className="grid grid-cols-6 gap-1.5 p-2 rounded-2xl bg-muted/30 border border-border/40">
              {QUICK_AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => {
                    gameAudio.playClick();
                    setAvatar(av);
                  }}
                  className={`h-10 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                    avatar === av
                      ? "bg-primary text-white scale-110 shadow-md shadow-primary/30 ring-2 ring-primary/60"
                      : "hover:bg-muted/60 hover:scale-105"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-primary via-indigo-600 to-primary hover:from-primary/90 hover:to-indigo-500 text-primary-foreground font-black shadow-xl shadow-primary/25 rounded-2xl h-12 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>Join Match Now 🚀</span>
            </Button>

            {onSpectate && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onSpectate(roomCode)}
                className="h-12 rounded-2xl text-xs font-bold border-amber-500/40 text-amber-500 hover:bg-amber-500/10 px-4 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Spectate</span>
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
