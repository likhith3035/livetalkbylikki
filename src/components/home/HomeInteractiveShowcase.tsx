import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Video,
  Gamepad2,
  Share2,
  Shield,
  Zap,
  Phone,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Send,
  FileText,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ShowcaseTab = "chat" | "arcade" | "files";

export const HomeInteractiveShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("chat");

  // --- TAB 1: Simulated Chat & Call State ---
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Hey! Connecting from Tokyo 🇯🇵", sender: "stranger", time: "Just now" },
    { id: 2, text: "Awesome! How's Tokyo tonight? 🌆", sender: "you", time: "Just now" },
    { id: 3, text: "Vibrant! Want to start an HD video call or play Connect 4?", sender: "stranger", time: "Just now" },
  ]);
  const [showCallPrompt, setShowCallPrompt] = useState(true);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);

  const handleSendReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const x = Math.random() * 80 + 10;
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2000);
  };

  // --- TAB 2: Interactive Mini Arcade Board (Tic-Tac-Toe) ---
  const [board, setBoard] = useState<Array<string | null>>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [aiThinking, setAiThinking] = useState(false);
  const [cheerBanner, setCheerBanner] = useState<string | null>(null);

  const handleCellClick = (idx: number) => {
    if (board[idx] || turn !== "X" || aiThinking) return;

    const newBoard = [...board];
    newBoard[idx] = "X";
    setBoard(newBoard);
    setTurn("O");
    setAiThinking(true);

    // AI Bot makes a turn
    setTimeout(() => {
      const emptyIndices = newBoard
        .map((val, i) => (val === null ? i : null))
        .filter((val) => val !== null) as number[];

      if (emptyIndices.length > 0) {
        const randomEmpty = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        newBoard[randomEmpty] = "O";
        setBoard([...newBoard]);
      }
      setTurn("X");
      setAiThinking(false);
    }, 600);
  };

  const handleResetBoard = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setAiThinking(false);
  };

  const fireCheer = (cheerEmoji: string, label: string) => {
    setCheerBanner(`${cheerEmoji} ${label}!`);
    handleSendReaction(cheerEmoji);
    setTimeout(() => setCheerBanner(null), 1800);
  };

  // --- TAB 3: P2P File Drop Simulation ---
  const [transferProgress, setTransferProgress] = useState(68);
  useEffect(() => {
    if (activeTab === "files") {
      const interval = setInterval(() => {
        setTransferProgress((prev) => (prev >= 100 ? 25 : prev + 15));
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl border border-primary/30 bg-card/80 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl shadow-primary/10 overflow-hidden relative">
      {/* Floating Emojis Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
        <AnimatePresence>
          {floatingEmojis.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 150, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -80, scale: 1.3 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              style={{ left: `${item.x}%` }}
              className="absolute text-3xl select-none"
            >
              {item.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Tab Switcher */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/60 border border-border/40">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "chat"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat & Video</span>
          </button>

          <button
            onClick={() => setActiveTab("arcade")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "arcade"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Arcade 1v1</span>
          </button>

          <button
            onClick={() => setActiveTab("files")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "files"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>P2P File Drop</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Interactive Preview</span>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="py-4 min-h-[280px] flex flex-col justify-between">
        {/* VIEW 1: CHAT & VIDEO */}
        {activeTab === "chat" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-3 flex-1 flex flex-col justify-between"
          >
            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Stranger #4092 (Tokyo 🇯🇵)
              </span>
              <span className="text-[10px] font-mono bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                Encrypted Peer Channel
              </span>
            </div>

            {/* Simulated Chat Messages */}
            <div className="space-y-2.5">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] text-xs ${
                    msg.sender === "you" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl leading-relaxed shadow-sm font-medium ${
                      msg.sender === "you"
                        ? "bg-primary text-primary-foreground rounded-br-xs"
                        : "bg-secondary/90 border border-border/50 text-foreground rounded-bl-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Video Call Banner Simulation */}
            {showCallPrompt && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-2xl bg-gradient-to-r from-primary/20 via-purple-600/15 to-indigo-600/20 border border-primary/40 flex items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/30 text-primary flex items-center justify-center animate-pulse">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Incoming HD Video Call</p>
                    <p className="text-[10px] text-muted-foreground">Stranger requested WebRTC Face Duel</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-7 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-[11px] gap-1"
                    onClick={() => handleSendReaction("🎥")}
                  >
                    <Phone className="w-3 h-3" />
                    Accept
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Interactive Emoji Reaction Bar */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Tap reaction to test:</span>
              <div className="flex items-center gap-1.5">
                {["❤️", "🔥", "😂", "🚀", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendReaction(emoji)}
                    className="h-8 w-8 rounded-xl bg-secondary/60 hover:bg-primary/20 hover:scale-115 active:scale-95 transition-all flex items-center justify-center text-sm cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: ARCADE 1v1 GAME */}
        {activeTab === "arcade" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4 flex-1 flex flex-col justify-between"
          >
            {/* Game Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">Tic-Tac-Toe Duel</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
                  {turn === "X" ? "Your Turn (X)" : "Cyber AI Thinking..."}
                </span>
              </div>
              <button
                onClick={handleResetBoard}
                className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reset Board
              </button>
            </div>

            {/* Interactive 3x3 Board */}
            <div className="flex items-center justify-center my-1">
              <div className="grid grid-cols-3 gap-2 w-44 h-44 sm:w-52 sm:h-52 p-2 rounded-2xl bg-secondary/40 border border-border/60">
                {board.map((cell, i) => (
                  <button
                    key={i}
                    onClick={() => handleCellClick(i)}
                    className={`rounded-xl flex items-center justify-center font-black text-xl sm:text-2xl transition-all cursor-pointer ${
                      cell === "X"
                        ? "bg-primary/20 text-primary border border-primary/40 shadow-sm"
                        : cell === "O"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : "bg-card/70 hover:bg-muted border border-border/30 hover:border-primary/50"
                    }`}
                  >
                    {cell}
                  </button>
                ))}
              </div>
            </div>

            {/* Spectator Cheer Cannon Bar */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] text-muted-foreground">Spectator Cannon:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => fireCheer("🎉", "Confetti Storm")}
                  className="px-2 py-1 rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 text-[10px] font-bold border border-amber-500/30 cursor-pointer"
                >
                  🎉 Confetti
                </button>
                <button
                  onClick={() => fireCheer("🎺", "Stadium Horn")}
                  className="px-2 py-1 rounded-xl bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 text-[10px] font-bold border border-violet-500/30 cursor-pointer"
                >
                  🎺 Horn
                </button>
                <button
                  onClick={() => fireCheer("🚀", "Rocket Boost")}
                  className="px-2 py-1 rounded-xl bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 text-[10px] font-bold border border-blue-500/30 cursor-pointer"
                >
                  🚀 Rocket
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: P2P FILE DROP */}
        {activeTab === "files" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4 flex-1 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Zero-Knowledge P2P Transfer
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                48.2 MB/s
              </span>
            </div>

            {/* Simulated File Card */}
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border/70 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">LiveTalk_HD_Project_Render.mp4</p>
                  <p className="text-[10px] text-muted-foreground">34.8 MB • Direct Device-to-Device WebRTC</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-card overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                    style={{ width: `${transferProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Transferring directly to peer...</span>
                  <span className="font-bold text-foreground">{transferProgress}%</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>🛡️ Zero bytes stored in the cloud. Direct peer pipe.</span>
              <span className="text-primary font-bold">100% Private</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
