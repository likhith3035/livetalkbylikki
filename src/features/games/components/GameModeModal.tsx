import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GameId, GameMode, GameCustomRules } from "../types";
import { GameMetadata } from "./GameCard";
import {
  QrCode,
  Bot,
  Users,
  Zap,
  ChevronRight,
  SlidersHorizontal,
  Clock,
  Trophy,
  User,
  Sparkles,
  Edit2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getGamerProfile,
  saveGamerProfile,
  GAMER_AVATARS,
} from "../services/gameProgressionService";

interface GameModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameMetadata | null;
  onSelectMode: (gameId: GameId, mode: GameMode, rules?: GameCustomRules) => void;
}

const BOT_PERSONAS = [
  {
    id: "easy",
    name: "Lucky Lucy 🍀",
    avatar: "🍀",
    diff: "easy" as const,
    tagline: "Casual & friendly matches",
    badge: "Easy 🟢",
  },
  {
    id: "medium",
    name: "Cyber Bot 🎩",
    avatar: "🤖",
    diff: "medium" as const,
    tagline: "Smart tactical duels",
    badge: "Medium 🟡",
  },
  {
    id: "hard",
    name: "Omega Grandmaster 👑",
    avatar: "👑",
    diff: "hard" as const,
    tagline: "Unbeatable Minimax master",
    badge: "Hard 🔴",
  },
];

export const GameModeModal: React.FC<GameModeModalProps> = ({
  isOpen,
  onClose,
  game,
  onSelectMode,
}) => {
  const [gamerProfile, setGamerProfileState] = useState(() => getGamerProfile());
  const [userName, setUserName] = useState(gamerProfile.nickname || "Player 1");
  const [userAvatar, setUserAvatar] = useState(gamerProfile.avatar || "👾");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Selected Mode State & Options
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  // Rules State
  const [turnTimer, setTurnTimer] = useState<number>(0); // 0 = unlimited, 10, 15, 30
  const [maxWins, setMaxWins] = useState<number>(2);     // 1 = single, 2 = Best of 3, 3 = Best of 5
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // Bot Customization State
  const [botPersona, setBotPersona] = useState(BOT_PERSONAS[1]);
  const [customBotName, setCustomBotName] = useState("");

  // Pass & Play Customization State
  const [player1Name, setPlayer1Name] = useState(userName);
  const [player2Name, setPlayer2Name] = useState("Player 2");
  const [player2Avatar, setPlayer2Avatar] = useState("👤");
  const [showP2AvatarPicker, setShowP2AvatarPicker] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const p = getGamerProfile();
      setGamerProfileState(p);
      const name = p.nickname && p.nickname !== "RetroGamer" ? p.nickname : "Player 1";
      setUserName(name);
      setUserAvatar(p.avatar || "👾");
      setPlayer1Name(name);
      setSelectedMode(null);
      setShowAvatarPicker(false);
      setShowP2AvatarPicker(false);
    }
  }, [isOpen]);

  if (!game) return null;

  const handleSaveUserName = (newName: string) => {
    const trimmed = newName.trim() || "Player 1";
    setUserName(trimmed);
    setPlayer1Name(trimmed);
    const updated = { ...gamerProfile, nickname: trimmed };
    setGamerProfileState(updated);
    saveGamerProfile(updated);
  };

  const handleSelectAvatar = (av: string) => {
    setUserAvatar(av);
    setShowAvatarPicker(false);
    const updated = { ...gamerProfile, avatar: av };
    setGamerProfileState(updated);
    saveGamerProfile(updated);
  };

  const handleLaunch = (mode: GameMode) => {
    // Save latest player name
    handleSaveUserName(userName);

    const activeBotName = customBotName.trim() || botPersona.name;
    const rules: GameCustomRules = {
      turnTimerSeconds: turnTimer,
      maxSeriesWins: maxWins,
      aiDifficulty: mode === "ai" ? botPersona.diff : aiDifficulty,
      botName: activeBotName,
      botAvatar: botPersona.avatar,
      player2Name: player2Name.trim() || "Player 2",
      player2Avatar,
    };

    onSelectMode(game.id, mode, rules);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[94vw] sm:max-w-lg p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/50 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar touch-manipulation">
        <DialogHeader className="text-left pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl">{game.icon}</span>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-foreground">
                  {game.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                  {game.tagline}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* ── 1. Your Gamer Identity Header ── */}
        <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              Your Gamer Profile:
            </span>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Level {gamerProfile.level || 1} • {gamerProfile.title}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Clickable Avatar */}
            <button
              type="button"
              onClick={() => setShowAvatarPicker((p) => !p)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-card border border-primary/40 flex items-center justify-center text-xl shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 relative group"
              title="Click to change avatar"
            >
              <span>{userAvatar}</span>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Edit2 className="w-2.5 h-2.5" />
              </div>
            </button>

            {/* Name Input */}
            <div className="flex-1">
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={() => handleSaveUserName(userName)}
                placeholder="Enter your gamer name..."
                maxLength={20}
                className="h-10 text-sm font-black bg-card/80 border-border/60 focus:border-primary rounded-xl"
              />
            </div>
          </div>

          {/* Expandable Avatar Grid */}
          <AnimatePresence>
            {showAvatarPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 border-t border-border/40 overflow-hidden"
              >
                <span className="text-[11px] font-bold text-muted-foreground mb-1.5 block">
                  Choose your avatar:
                </span>
                <div className="grid grid-cols-8 gap-1.5 max-h-28 overflow-y-auto p-1">
                  {GAMER_AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => handleSelectAvatar(av)}
                      className={`h-8 rounded-lg flex items-center justify-center text-base border transition-all cursor-pointer ${
                        userAvatar === av
                          ? "bg-primary/20 border-primary scale-110 shadow-sm"
                          : "bg-card hover:bg-muted border-border/40"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 2. Mode Selection Options ── */}
        <div className="space-y-3 my-1">
          {/* Option A: Play vs AI Bot */}
          <div
            className={`rounded-2xl border transition-all overflow-hidden ${
              selectedMode === "ai"
                ? "border-cyan-500 bg-cyan-500/5 shadow-md"
                : "border-border/50 bg-card/60 hover:border-cyan-500/40"
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedMode(selectedMode === "ai" ? null : "ai")}
              className="w-full flex items-center justify-between p-3.5 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-foreground">Play vs Smart AI Bot</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 font-bold uppercase">
                      Solo Practice
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    Duel AI personas ({botPersona.name}) with zero lag
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  selectedMode === "ai" ? "rotate-90 text-cyan-400" : ""
                }`}
              />
            </button>

            {/* AI Bot Setup Drawer */}
            <AnimatePresence>
              {selectedMode === "ai" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3.5 pb-3.5 pt-1 border-t border-cyan-500/20 space-y-3"
                >
                  {/* Select AI Persona */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-foreground">Choose AI Opponent:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {BOT_PERSONAS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setBotPersona(b);
                            setCustomBotName("");
                          }}
                          className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                            botPersona.id === b.id && !customBotName
                              ? "bg-cyan-500/20 border-cyan-400 text-foreground shadow-sm"
                              : "bg-card/70 border-border/40 hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base">{b.avatar}</span>
                            <span className="text-[9px] font-bold px-1 rounded bg-muted">
                              {b.badge}
                            </span>
                          </div>
                          <span className="text-[11px] font-black leading-tight truncate">
                            {b.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Bot Name Input (Optional) */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={customBotName}
                      onChange={(e) => setCustomBotName(e.target.value)}
                      placeholder={`Custom bot name (e.g. ${botPersona.name})...`}
                      className="h-8 text-xs bg-card/90 rounded-lg"
                      maxLength={20}
                    />
                  </div>

                  {/* Match Rules: Series Length & Turn Timer */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-primary" /> Series Length:
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { wins: 1, label: "1 Rd" },
                          { wins: 2, label: "Best 3" },
                          { wins: 3, label: "Best 5" },
                        ].map((s) => (
                          <button
                            key={s.wins}
                            type="button"
                            onClick={() => setMaxWins(s.wins)}
                            className={`py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                              maxWins === s.wins
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-border/40"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" /> Turn Timer:
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { sec: 0, label: "∞" },
                          { sec: 10, label: "10s" },
                          { sec: 15, label: "15s" },
                        ].map((t) => (
                          <button
                            key={t.sec}
                            type="button"
                            onClick={() => setTurnTimer(t.sec)}
                            className={`py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                              turnTimer === t.sec
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-border/40"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Launch Bot Match Button */}
                  <Button
                    type="button"
                    onClick={() => handleLaunch("ai")}
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Start Battle vs {customBotName.trim() || botPersona.name}</span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Option B: Pass & Play (Local 2-Player) */}
          {game.id !== "bingo" && (
            <div
              className={`rounded-2xl border transition-all overflow-hidden ${
                selectedMode === "local"
                  ? "border-violet-500 bg-violet-500/5 shadow-md"
                  : "border-border/50 bg-card/60 hover:border-violet-500/40"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedMode(selectedMode === "local" ? null : "local")}
                className="w-full flex items-center justify-between p-3.5 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-foreground">Pass & Play (Local 2-Player)</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-400 font-bold uppercase">
                        Same Device
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {player1Name} vs {player2Name} taking turns on 1 screen
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    selectedMode === "local" ? "rotate-90 text-violet-400" : ""
                  }`}
                />
              </button>

              {/* Pass & Play Setup Drawer */}
              <AnimatePresence>
                {selectedMode === "local" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3.5 pb-3.5 pt-1 border-t border-violet-500/20 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {/* Player 1 Name */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                          <span>{userAvatar}</span> Player 1:
                        </span>
                        <Input
                          value={player1Name}
                          onChange={(e) => {
                            setPlayer1Name(e.target.value);
                            setUserName(e.target.value);
                          }}
                          placeholder="Player 1 Name"
                          className="h-8 text-xs bg-card/90 rounded-lg font-bold"
                          maxLength={15}
                        />
                      </div>

                      {/* Player 2 Name & Avatar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setShowP2AvatarPicker((p) => !p)}
                              className="hover:scale-110 cursor-pointer"
                              title="Change Player 2 avatar"
                            >
                              {player2Avatar}
                            </button>
                            Player 2:
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowP2AvatarPicker((p) => !p)}
                            className="text-[10px] text-violet-400 font-bold underline cursor-pointer"
                          >
                            icon
                          </button>
                        </div>
                        <Input
                          value={player2Name}
                          onChange={(e) => setPlayer2Name(e.target.value)}
                          placeholder="Player 2 Name"
                          className="h-8 text-xs bg-card/90 rounded-lg font-bold"
                          maxLength={15}
                        />
                      </div>
                    </div>

                    {/* Expandable Player 2 Avatar Picker */}
                    <AnimatePresence>
                      {showP2AvatarPicker && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-1 overflow-hidden"
                        >
                          <span className="text-[10px] font-bold text-muted-foreground block mb-1">
                            Choose Player 2 Avatar:
                          </span>
                          <div className="grid grid-cols-8 gap-1 max-h-24 overflow-y-auto p-1">
                            {GAMER_AVATARS.map((av) => (
                              <button
                                key={av}
                                type="button"
                                onClick={() => {
                                  setPlayer2Avatar(av);
                                  setShowP2AvatarPicker(false);
                                }}
                                className={`h-7 rounded text-sm border cursor-pointer ${
                                  player2Avatar === av
                                    ? "bg-violet-500/20 border-violet-400 scale-110"
                                    : "bg-card border-border/40 hover:bg-muted"
                                }`}
                              >
                                {av}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Series Length & Turn Timer */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-primary" /> Series Length:
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { wins: 1, label: "1 Rd" },
                            { wins: 2, label: "Best 3" },
                            { wins: 3, label: "Best 5" },
                          ].map((s) => (
                            <button
                              key={s.wins}
                              type="button"
                              onClick={() => setMaxWins(s.wins)}
                              className={`py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                                maxWins === s.wins
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-card text-muted-foreground border-border/40"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" /> Turn Timer:
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { sec: 0, label: "∞" },
                            { sec: 10, label: "10s" },
                            { sec: 15, label: "15s" },
                          ].map((t) => (
                            <button
                              key={t.sec}
                              type="button"
                              onClick={() => setTurnTimer(t.sec)}
                              className={`py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                                turnTimer === t.sec
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-card text-muted-foreground border-border/40"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Launch Local Match Button */}
                    <Button
                      type="button"
                      onClick={() => handleLaunch("local")}
                      className="w-full h-10 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Users className="w-4 h-4" />
                      <span>Start {player1Name} vs {player2Name} Duel</span>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Option C: Play with Friend (QR / Link) */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLaunch("friend")}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-foreground">Play with Friend (QR / Code)</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                    Host Room
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Generate an instant QR code or 6-character room code to invite a friend
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>

          {/* Option D: Quick Match (Online Stranger) */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLaunch("quickmatch")}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-foreground">Quick Match (Online Stranger)</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold uppercase">
                    Live Queue
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  1-tap matchmaking queue to instantly duel other active players
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
