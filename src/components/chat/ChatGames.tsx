import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, X, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RoomChannel } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { haptics } from "@/lib/sounds";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";

interface ChatGamesProps {
  onSendMessage: (text: string) => void;
  isConnected: boolean;
  roomChannel?: RoomChannel;
  sessionId?: string;
  activeGame: "none" | "ttt" | "canvas" | "rps";
  setActiveGame: (game: "none" | "ttt" | "canvas" | "rps") => void;
  onToggleAI?: () => void;
  customTrigger?: React.ReactNode;
}

type TicTacToeCell = "X" | "O" | null;

interface TttResult {
  winner: TicTacToeCell;
  line: number[] | null;
}

const getTttResult = (board: TicTacToeCell[]): TttResult => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return { winner: null, line: null };
};

const getRpsResult = (p: "R" | "P" | "S", o: "R" | "P" | "S"): "win" | "lose" | "draw" => {
  if (p === o) return "draw";
  if (
    (p === "R" && o === "S") ||
    (p === "P" && o === "R") ||
    (p === "S" && o === "P")
  ) return "win";
  return "lose";
};

const playTone = (frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.15) => {
  try {
    const isMuted = localStorage.getItem("lchat_games_muted") === "true";
    if (isMuted) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Autoplay restrictions or unsupported audio contexts
  }
};

const gameAudio = {
  click: () => playTone(600, 0.04, "sine", 0.08),
  tension: () => {
    playTone(220, 0.08, "triangle", 0.12);
    setTimeout(() => playTone(220, 0.08, "triangle", 0.12), 300);
    setTimeout(() => playTone(220, 0.08, "triangle", 0.12), 600);
    setTimeout(() => playTone(330, 0.15, "triangle", 0.12), 900);
  },
  win: () => {
    playTone(523.25, 0.1, "sine", 0.12); // C5
    setTimeout(() => playTone(659.25, 0.1, "sine", 0.12), 80); // E5
    setTimeout(() => playTone(783.99, 0.1, "sine", 0.12), 160); // G5
    setTimeout(() => playTone(1046.50, 0.25, "sine", 0.1), 240); // C6
  },
  lose: () => {
    playTone(392.00, 0.15, "sawtooth", 0.05); // G4
    setTimeout(() => playTone(349.23, 0.15, "sawtooth", 0.05), 120); // F4
    setTimeout(() => playTone(311.13, 0.35, "sawtooth", 0.05), 240); // Eb4
  },
  draw: () => {
    playTone(440, 0.1, "triangle", 0.08);
    setTimeout(() => playTone(440, 0.1, "triangle", 0.08), 150);
  }
};

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

const FloatingParticles = ({ active }: { active: boolean }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const EMOJIS = ["🎉", "⭐", "🏆", "✨", "👑", "💖"];
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      x: (Math.random() - 0.5) * 180,
      y: -(Math.random() * 140 + 40),
      rotate: (Math.random() - 0.5) * 240,
      scale: Math.random() * 0.4 + 0.8,
    }));
    setParticles(newParticles);
  }, [active]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, p.scale, p.scale * 0.7],
              x: p.x,
              y: p.y,
              rotate: p.rotate
            }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute text-xl select-none"
          >
            {p.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
};

const ChatGames = ({ onSendMessage, isConnected, roomChannel, sessionId, activeGame, setActiveGame, onToggleAI }: ChatGamesProps) => {
  const [showGames, setShowGames] = useState(false);
  const { toast } = useToast();
  const [showConfetti, setShowConfetti] = useState(false);
  const isMobile = useIsMobile();

  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem("lchat_games_muted") === "true";
  });

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem("lchat_games_muted", String(nextMuted));
  };

  const roomId = (roomChannel as any)?.roomId;

  // Tic-Tac-Toe state
  const [board, setBoard] = useState<TicTacToeCell[]>(Array(9).fill(null));
  const [mySymbol, setMySymbol] = useState<"X" | "O" | null>(null);
  const [currentTurn, setCurrentTurn] = useState<"X" | "O">("X");
  const [tttScores, setTttScores] = useState({ xWins: 0, oWins: 0, draws: 0 });

  const { winner, line: tttLine } = getTttResult(board);
  const isDraw = !winner && board.every((c) => c !== null);

  // Rock Paper Scissors state
  const [myRpsChoice, setMyRpsChoice] = useState<"R" | "P" | "S" | null>(null);
  const [strangerRpsChoice, setStrangerRpsChoice] = useState<"R" | "P" | "S" | null>(null);
  const [rpsScores, setRpsScores] = useState({ wins: 0, losses: 0, draws: 0 });
  const [isRpsShaking, setIsRpsShaking] = useState(false);

  const myRpsChoiceRef = useRef<"R" | "P" | "S" | null>(null);
  const strangerRpsChoiceRef = useRef<"R" | "P" | "S" | null>(null);
  const iMadeFinalChoice = useRef(false);

  useEffect(() => { myRpsChoiceRef.current = myRpsChoice; }, [myRpsChoice]);
  useEffect(() => { strangerRpsChoiceRef.current = strangerRpsChoice; }, [strangerRpsChoice]);

  // Load scores on roomId change
  useEffect(() => {
    if (!roomId) {
      setTttScores({ xWins: 0, oWins: 0, draws: 0 });
      setRpsScores({ wins: 0, losses: 0, draws: 0 });
      return;
    }
    
    const savedTtt = sessionStorage.getItem(`ttt_scores_${roomId}`);
    if (savedTtt) {
      try {
        setTttScores(JSON.parse(savedTtt));
      } catch (e) {
        setTttScores({ xWins: 0, oWins: 0, draws: 0 });
      }
    } else {
      setTttScores({ xWins: 0, oWins: 0, draws: 0 });
    }

    const savedRps = sessionStorage.getItem(`rps_scores_${roomId}`);
    if (savedRps) {
      try {
        setRpsScores(JSON.parse(savedRps));
      } catch (e) {
        setRpsScores({ wins: 0, losses: 0, draws: 0 });
      }
    } else {
      setRpsScores({ wins: 0, losses: 0, draws: 0 });
    }
  }, [roomId]);

  // Save scores on change
  useEffect(() => {
    if (roomId) {
      sessionStorage.setItem(`ttt_scores_${roomId}`, JSON.stringify(tttScores));
    }
  }, [tttScores, roomId]);

  useEffect(() => {
    if (roomId) {
      sessionStorage.setItem(`rps_scores_${roomId}`, JSON.stringify(rpsScores));
    }
  }, [rpsScores, roomId]);

  // RPS Tension Shake & Score update effect
  useEffect(() => {
    if (myRpsChoice !== null && strangerRpsChoice !== null) {
      setIsRpsShaking(true);
      gameAudio.tension();
      
      const timer = setTimeout(() => {
        setIsRpsShaking(false);
        const res = getRpsResult(myRpsChoice, strangerRpsChoice);
        
        // Update score
        setRpsScores((prev) => {
          if (res === "win") return { ...prev, wins: prev.wins + 1 };
          if (res === "lose") return { ...prev, losses: prev.losses + 1 };
          return { ...prev, draws: prev.draws + 1 };
        });

        // Trigger Audio & Visual Confetti
        if (res === "win") {
          haptics.vibrate([100, 50, 100]);
          gameAudio.win();
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);
        } else if (res === "lose") {
          haptics.vibrate(80);
          gameAudio.lose();
        } else {
          haptics.vibrate(60);
          gameAudio.draw();
        }

        // Post chat message once
        if (iMadeFinalChoice.current) {
          const choiceEmojis = { R: "✊", P: "✋", S: "✌️" };
          if (res === "win") {
            onSendMessage(`🎮 Rock Paper Scissors: I won! ${choiceEmojis[myRpsChoice]} beats ${choiceEmojis[strangerRpsChoice]} 🎉`);
          } else if (res === "lose") {
            onSendMessage(`🎮 Rock Paper Scissors: You won! ${choiceEmojis[strangerRpsChoice]} beats ${choiceEmojis[myRpsChoice]} 🎉`);
          } else {
            onSendMessage(`🎮 Rock Paper Scissors: It's a draw! Both chose ${choiceEmojis[myRpsChoice]} 🤝`);
          }
          iMadeFinalChoice.current = false;
        }
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [myRpsChoice, strangerRpsChoice, onSendMessage]);

  useEffect(() => {
    if (!roomChannel) return;

    // --- Tic-Tac-Toe listeners ---
    roomChannel.on?.("broadcast", { event: "ttt_move" }, (payload) => {
      const data = payload.payload as { senderId: string; index: number; symbol: "X" | "O" };
      if (data.senderId !== sessionId) {
        setBoard((prev) => {
          const newBoard = [...prev];
          newBoard[data.index] = data.symbol;

          const wResult = getTttResult(newBoard);
          if (wResult.winner) {
            setTttScores((prevScores) => {
              const isStrangerX = data.symbol === "X";
              return {
                ...prevScores,
                xWins: isStrangerX ? prevScores.xWins + 1 : prevScores.xWins,
                oWins: !isStrangerX ? prevScores.oWins + 1 : prevScores.oWins
              };
            });
            if (wResult.winner === mySymbol) {
              haptics.vibrate([100, 50, 100]);
              gameAudio.win();
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 2000);
            } else {
              haptics.vibrate(80);
              gameAudio.lose();
            }
          } else if (!wResult.winner && newBoard.every(c => c !== null)) {
            setTttScores((prevScores) => ({ ...prevScores, draws: prevScores.draws + 1 }));
            haptics.vibrate(60);
            gameAudio.draw();
          }

          return newBoard;
        });
        setCurrentTurn(data.symbol === "X" ? "O" : "X");
      }
    });

    roomChannel.on?.("broadcast", { event: "ttt_start" }, (payload) => {
      const data = payload.payload as { senderId: string; starterSymbol: "X" | "O" };
      if (data.senderId !== sessionId) {
        setMySymbol(data.starterSymbol === "X" ? "O" : "X");
        setBoard(Array(9).fill(null));
        setCurrentTurn("X");
        setActiveGame("ttt");
        setShowGames(true);
      }
    });

    roomChannel.on?.("broadcast", { event: "ttt_reset" }, (payload) => {
      const data = payload.payload as { senderId: string };
      if (data.senderId !== sessionId) {
        setBoard(Array(9).fill(null));
        setCurrentTurn("X");
      }
    });

    // --- Shared Canvas listeners ---
    roomChannel.on?.("broadcast", { event: "canvas_start" }, (payload) => {
      if (payload.payload.senderId !== sessionId) {
        setActiveGame("canvas");
        setShowGames(false);
      }
    });

    // --- Rock Paper Scissors listeners ---
    roomChannel.on?.("broadcast", { event: "rps_start" }, (payload) => {
      if (payload.payload.senderId !== sessionId) {
        setMyRpsChoice(null);
        setStrangerRpsChoice(null);
        setActiveGame("rps");
        setShowGames(true);
      }
    });

    roomChannel.on?.("broadcast", { event: "rps_choice" }, (payload) => {
      const data = payload.payload as { senderId: string; choice: "R" | "P" | "S" };
      if (data.senderId !== sessionId) {
        setStrangerRpsChoice(data.choice);
      }
    });

    roomChannel.on?.("broadcast", { event: "rps_next" }, (payload) => {
      if (payload.payload.senderId !== sessionId) {
        setMyRpsChoice(null);
        setStrangerRpsChoice(null);
      }
    });

    // --- General Stop Game listener ---
    roomChannel.on?.("broadcast", { event: "game_stop" }, (payload) => {
      if (payload.payload.senderId !== sessionId) {
        setActiveGame("none");
        const gameLabel = 
          payload.payload.game === 'ttt' ? 'Tic-Tac-Toe' : 
          payload.payload.game === 'rps' ? 'Rock Paper Scissors' : 
          'Canvas';
        toast({
          title: "Game Ended",
          description: `Stranger left the ${gameLabel} game.`,
        });
      }
    });

    roomChannel.subscribe?.();

    return () => { };
  }, [roomChannel, sessionId, setActiveGame, toast, mySymbol]);

  // --- Tic-Tac-Toe actions ---
  const handleCellClick = (i: number) => {
    if (board[i] || winner || !mySymbol || currentTurn !== mySymbol) return;
    haptics.vibrate(40);
    gameAudio.click();
    const newBoard = [...board];
    newBoard[i] = mySymbol;
    setBoard(newBoard);
    setCurrentTurn(mySymbol === "X" ? "O" : "X");

    roomChannel?.send({
      type: "broadcast",
      event: "ttt_move",
      payload: { senderId: sessionId, index: i, symbol: mySymbol },
    });

    const wResult = getTttResult(newBoard);
    if (wResult.winner) {
      setTttScores((prev) => {
        const isX = mySymbol === "X";
        return {
          ...prev,
          xWins: isX ? prev.xWins + 1 : prev.xWins,
          oWins: !isX ? prev.oWins + 1 : prev.oWins
        };
      });
      onSendMessage(`🎮 Tic-Tac-Toe: ${wResult.winner === mySymbol ? "I" : "You"} won! 🎉`);
      if (wResult.winner === mySymbol) {
        haptics.gameVictory();
        gameAudio.win();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      } else {
        haptics.gameDefeat();
        gameAudio.lose();
      }
    } else if (!wResult.winner && newBoard.every(c => c !== null)) {
      setTttScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
      onSendMessage("🎮 Tic-Tac-Toe: It's a draw! 🤝");
      haptics.impactMedium();
      gameAudio.draw();
    }
  };

  const startTTT = () => {
    setMySymbol("X");
    setBoard(Array(9).fill(null));
    setCurrentTurn("X");
    setActiveGame("ttt");
    roomChannel?.send({ type: "broadcast", event: "ttt_start", payload: { senderId: sessionId, starterSymbol: "X" } });
    onSendMessage("🎮 I started a Tic-Tac-Toe game! Let's play!");
  };

  const resetTTT = () => {
    setBoard(Array(9).fill(null));
    setCurrentTurn("X");
    roomChannel?.send({ type: "broadcast", event: "ttt_reset", payload: { senderId: sessionId } });
  };

  // --- Shared Canvas actions ---
  const startCanvas = () => {
    setActiveGame("canvas");
    setShowGames(false);
    roomChannel?.send({ type: "broadcast", event: "canvas_start", payload: { senderId: sessionId } });
    onSendMessage("🎨 I opened the Collaborative Canvas! Let's doodle together!");
  };

  // --- Rock Paper Scissors actions ---
  const startRPS = () => {
    setMyRpsChoice(null);
    setStrangerRpsChoice(null);
    setActiveGame("rps");
    roomChannel?.send({ type: "broadcast", event: "rps_start", payload: { senderId: sessionId } });
    onSendMessage("🎮 I started Rock Paper Scissors! Let's play!");
  };

  const selectRpsChoice = (choice: "R" | "P" | "S") => {
    if (myRpsChoice) return;
    haptics.vibrate(40);
    gameAudio.click();
    iMadeFinalChoice.current = strangerRpsChoiceRef.current !== null;
    setMyRpsChoice(choice);
    roomChannel?.send({
      type: "broadcast",
      event: "rps_choice",
      payload: { senderId: sessionId, choice },
    });
  };

  const nextRpsRound = () => {
    setMyRpsChoice(null);
    setStrangerRpsChoice(null);
    roomChannel?.send({ type: "broadcast", event: "rps_next", payload: { senderId: sessionId } });
  };

  if (!isConnected) return null;

  const isMyTurn = mySymbol === currentTurn;
  const isRpsRevealed = myRpsChoice !== null && strangerRpsChoice !== null && !isRpsShaking;

  const renderGameContent = () => {
    switch (activeGame) {
      case "none":
        return (
          <div className="space-y-2 relative z-10">
            <button
              onClick={startTTT}
              className="w-full text-left rounded-xl bg-secondary/60 border border-border/50 px-3 py-3 hover:bg-secondary transition-colors"
            >
              <p className="text-sm font-medium text-foreground">❌⭕ Tic-Tac-Toe</p>
              <p className="text-[10px] text-muted-foreground">Play with your stranger!</p>
            </button>
            <button
              onClick={startCanvas}
              className="w-full text-left rounded-xl bg-secondary/60 border border-border/50 px-3 py-3 hover:bg-secondary transition-colors"
            >
              <p className="text-sm font-medium text-foreground">🎨 Shared Canvas</p>
              <p className="text-[10px] text-muted-foreground">Doodle in real-time!</p>
            </button>
            <button
              onClick={startRPS}
              className="w-full text-left rounded-xl bg-secondary/60 border border-border/50 px-3 py-3 hover:bg-secondary transition-colors"
            >
              <p className="text-sm font-medium text-foreground">✊✋✌️ Rock Paper Scissors</p>
              <p className="text-[10px] text-muted-foreground">Co-op hand challenge!</p>
            </button>
            {onToggleAI && (
              <button
                type="button"
                onClick={() => {
                  setShowGames(false);
                  onToggleAI();
                }}
                className="w-full text-left rounded-xl bg-primary/10 border border-primary/20 px-3 py-3 hover:bg-primary/20 transition-colors"
              >
                <p className="text-sm font-medium text-primary">🤖 Play vs AI Bot</p>
                <p className="text-[10px] text-primary/80">Play mini-games against AI opponent!</p>
              </button>
            )}
            <div className="pt-1">
              <a
                href="/games"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-2 text-xs font-bold text-amber-400 transition-colors"
              >
                🎮 Explore All Games in Arcade Hub →
              </a>
            </div>
          </div>
        );
      case "ttt":
        return (
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-semibold">
                {winner
                  ? `${winner === mySymbol ? "You win" : "They win"}! 🎉`
                  : isDraw
                    ? "Draw! 🤝"
                    : mySymbol
                      ? isMyTurn
                        ? `Your turn (${mySymbol})`
                        : `Their turn (${currentTurn})`
                      : "Waiting..."}
              </span>
              <div className="text-[10px] font-bold text-primary font-mono uppercase tracking-wider">
                {tttScores.xWins}X - {tttScores.oWins}O - {tttScores.draws}D
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 max-w-[280px] mx-auto">
              {board.map((cell, i) => {
                const isWinning = tttLine?.includes(i);
                return (
                  <motion.button
                    key={i}
                    onClick={() => handleCellClick(i)}
                    disabled={!isMyTurn || !!winner || !!cell}
                    animate={isWinning ? { scale: [1, 1.1, 1], rotate: [0, 2, -2, 0] } : {}}
                    transition={isWinning ? { duration: 0.6, repeat: Infinity } : {}}
                    className={cn(
                      "h-12 sm:h-16 rounded-xl border text-lg sm:text-xl font-bold transition-all relative overflow-hidden",
                      isWinning 
                        ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_hsl(var(--primary)/0.2)]" 
                        : "bg-secondary/40 border-border",
                      !cell && !winner && isMyTurn && "hover:bg-secondary cursor-pointer",
                      (!isMyTurn || !!cell) && !winner && "cursor-not-allowed opacity-75",
                      cell === "X" && !isWinning && "text-primary",
                      cell === "O" && !isWinning && "text-destructive"
                    )}
                  >
                    {cell}
                  </motion.button>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border/40">
              <button
                onClick={() => setTttScores({ xWins: 0, oWins: 0, draws: 0 })}
                className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors font-bold uppercase tracking-wider"
              >
                Reset Score
              </button>
              <div className="flex gap-2">
                {winner || isDraw ? (
                  <button
                    onClick={resetTTT}
                    className="text-[10px] text-primary hover:text-primary-foreground font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3 animate-spin-hover" /> Play Again
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    setActiveGame("none");
                    setMySymbol(null);
                    roomChannel?.send({ type: "broadcast", event: "game_stop", payload: { senderId: sessionId, game: "ttt" } });
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground font-semibold"
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
        );
      case "rps":
        return (
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-semibold">
                {isRpsShaking 
                  ? "Shaking hands..."
                  : isRpsRevealed 
                    ? "Round Complete!"
                    : myRpsChoice 
                      ? "Waiting for stranger..." 
                      : "Make your choice!"}
              </span>
              <div className="text-[11px] font-mono font-bold text-primary">
                {rpsScores.wins}W - {rpsScores.losses}L - {rpsScores.draws}D
              </div>
            </div>

            {isRpsShaking ? (
              <div className="flex items-center justify-center gap-12 py-5 bg-secondary/20 rounded-2xl border border-border/40">
                <motion.span 
                  animate={{ y: [0, -15, 0, -15, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                  className="text-5xl filter drop-shadow select-none"
                >
                  ✊
                </motion.span>
                <span className="text-sm font-bold text-primary/40 animate-pulse font-mono uppercase tracking-widest">GO!</span>
                <motion.span 
                  animate={{ y: [0, -15, 0, -15, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                  className="text-5xl filter drop-shadow select-none"
                >
                  ✊
                </motion.span>
              </div>
            ) : isRpsRevealed ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-8 py-3">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">You</span>
                    <motion.span 
                      initial={{ scale: 0.5, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-5xl filter drop-shadow"
                    >
                      {myRpsChoice === "R" ? "✊" : myRpsChoice === "P" ? "✋" : "✌️"}
                    </motion.span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground/30 font-mono">VS</span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Stranger</span>
                    <motion.span 
                      initial={{ scale: 0.5, rotate: 15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-5xl filter drop-shadow"
                    >
                      {strangerRpsChoice === "R" ? "✊" : strangerRpsChoice === "P" ? "✋" : "✌️"}
                    </motion.span>
                  </div>
                </div>

                <div className={cn(
                  "text-center py-2 rounded-xl text-xs font-bold uppercase tracking-wider",
                  getRpsResult(myRpsChoice, strangerRpsChoice) === "win" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  getRpsResult(myRpsChoice, strangerRpsChoice) === "lose" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                  "bg-secondary text-muted-foreground border border-border"
                )}>
                  {getRpsResult(myRpsChoice, strangerRpsChoice) === "win" ? "You Won! 🎉" :
                   getRpsResult(myRpsChoice, strangerRpsChoice) === "lose" ? "You Lost! 😢" :
                   "Draw! 🤝"}
                </div>

                <Button size="sm" onClick={nextRpsRound} className="w-full h-9 rounded-xl text-xs font-semibold">
                  Next Round
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center gap-3 py-1">
                  {[
                    { id: "R" as const, emoji: "✊", name: "Rock" },
                    { id: "P" as const, emoji: "✋", name: "Paper" },
                    { id: "S" as const, emoji: "✌️", name: "Scissors" }
                  ].map((opt) => (
                    <motion.button
                      key={opt.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={myRpsChoice !== null}
                      onClick={() => selectRpsChoice(opt.id)}
                      className={cn(
                        "h-14 w-14 sm:h-18 sm:w-18 rounded-2xl flex flex-col items-center justify-center border transition-all shadow-sm",
                        myRpsChoice === opt.id 
                          ? "bg-primary/20 border-primary text-primary scale-105 shadow-primary/10" 
                          : myRpsChoice !== null 
                            ? "opacity-45 border-border bg-secondary/40 cursor-not-allowed" 
                            : "bg-secondary/40 border-border/80 hover:bg-secondary hover:border-border text-foreground"
                      )}
                    >
                      <span className="text-2xl leading-none">{opt.emoji}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider mt-1 opacity-60">{opt.name}</span>
                    </motion.button>
                  ))}
                </div>

                {myRpsChoice && (
                  <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] text-muted-foreground font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                    <span>Stranger is choosing...</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-border/40">
              <button
                onClick={() => setRpsScores({ wins: 0, losses: 0, draws: 0 })}
                className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors font-bold uppercase tracking-wider"
              >
                Reset Score
              </button>
              <button
                onClick={() => {
                  setActiveGame("none");
                  setMyRpsChoice(null);
                  setStrangerRpsChoice(null);
                  roomChannel?.send({ type: "broadcast", event: "game_stop", payload: { senderId: sessionId, game: "rps" } });
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground font-semibold"
              >
                ← Back
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowGames(!showGames)}
        className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0"
        title="Games"
      >
        <Gamepad2 className="h-4 w-4" />
      </Button>

      {isMobile ? (
        <Drawer open={showGames} onOpenChange={setShowGames}>
          <DrawerContent className="px-4 pb-6 bg-card border-t border-border">
            <DrawerHeader className="text-left px-0 pb-2">
              <DrawerTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Gamepad2 className="h-3.5 w-3.5 text-primary animate-pulse" />
                  {activeGame === "ttt" ? "Tic-Tac-Toe" : activeGame === "rps" ? "Rock Paper Scissors" : "Games"}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowGames(false);
                      if (activeGame === "ttt" && !mySymbol) setActiveGame("none");
                      if (activeGame === "rps" && !myRpsChoice) setActiveGame("none");
                    }}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                Play mini-games with your matched stranger.
              </DrawerDescription>
            </DrawerHeader>

            <div className="relative overflow-hidden pb-4">
              <FloatingParticles active={showConfetti} />
              {renderGameContent()}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <AnimatePresence>
          {showGames && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-14 left-0 z-50 w-64 rounded-2xl border border-border bg-card shadow-xl p-3 relative overflow-hidden"
            >
              <FloatingParticles active={showConfetti} />

              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Gamepad2 className="h-3.5 w-3.5 text-primary" /> Games
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleMute}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setShowGames(false);
                      if (activeGame === "ttt" && !mySymbol) setActiveGame("none");
                      if (activeGame === "rps" && !myRpsChoice) setActiveGame("none");
                    }}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {renderGameContent()}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default ChatGames;
