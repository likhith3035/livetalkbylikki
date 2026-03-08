import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ChatGamesProps {
  onSendMessage: (text: string) => void;
  isConnected: boolean;
  roomChannel?: RealtimeChannel | null;
  sessionId?: string;
}

const TRUTH_OR_DARE = {
  truths: [
    "What's the most embarrassing thing that happened to you?",
    "What's your biggest secret?",
    "What's the weirdest dream you've had?",
    "What's the last lie you told?",
    "What's your guilty pleasure?",
    "What's your biggest fear?",
    "Have you ever stalked someone online?",
    "What's the most childish thing you still do?",
    "What's the worst date you've been on?",
    "What's something you've never told anyone?",
  ],
  dares: [
    "Send a selfie right now 📸",
    "Type your last message with your eyes closed",
    "Say something in a different language",
    "Make up a poem about me in 30 seconds",
    "Tell me your phone password hint 🤫",
    "Type the alphabet backwards",
    "Send a voice message singing any song 🎤",
    "Change your nickname to something funny",
    "Send 10 emojis that describe your day",
    "Tell a joke and make me laugh 😂",
  ],
};

const WOULD_YOU_RATHER = [
  ["be able to fly", "be invisible"],
  ["live 100 years in the past", "100 years in the future"],
  ["always speak your mind", "never speak again"],
  ["have unlimited money", "unlimited love"],
  ["be famous", "be the smartest person alive"],
  ["read minds", "see the future"],
  ["lose all your memories", "never make new ones"],
  ["live without music", "live without movies"],
  ["be a superhero", "be a supervillain"],
  ["never use social media again", "never watch TV again"],
  ["have a rewind button", "a pause button for your life"],
  ["always be 10 minutes late", "always be 20 minutes early"],
];

type TicTacToeCell = "X" | "O" | null;

const checkWinner = (board: TicTacToeCell[]): TicTacToeCell => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
};

const ChatGames = ({ onSendMessage, isConnected, roomChannel, sessionId }: ChatGamesProps) => {
  const [showGames, setShowGames] = useState(false);
  const [activeGame, setActiveGame] = useState<"none" | "ttt" | "tod" | "wyr" | "wc">("none");

  // Tic-Tac-Toe state
  const [board, setBoard] = useState<TicTacToeCell[]>(Array(9).fill(null));
  const [mySymbol, setMySymbol] = useState<"X" | "O" | null>(null);
  const [currentTurn, setCurrentTurn] = useState<"X" | "O">("X");
  const winner = checkWinner(board);
  const isDraw = !winner && board.every((c) => c !== null);

  // Word Chain state
  const [wordChain, setWordChain] = useState<string[]>([]);
  const [wordInput, setWordInput] = useState("");
  const [isMyWordTurn, setIsMyWordTurn] = useState(false);

  useEffect(() => {
    if (!roomChannel) return;

    roomChannel.on("broadcast", { event: "ttt_move" }, (payload) => {
      const data = payload.payload as { senderId: string; index: number; symbol: "X" | "O" };
      if (data.senderId !== sessionId) {
        setBoard((prev) => {
          const newBoard = [...prev];
          newBoard[data.index] = data.symbol;
          return newBoard;
        });
        setCurrentTurn(data.symbol === "X" ? "O" : "X");
      }
    });

    roomChannel.on("broadcast", { event: "ttt_start" }, (payload) => {
      const data = payload.payload as { senderId: string; starterSymbol: "X" | "O" };
      if (data.senderId !== sessionId) {
        setMySymbol(data.starterSymbol === "X" ? "O" : "X");
        setBoard(Array(9).fill(null));
        setCurrentTurn("X");
        setActiveGame("ttt");
        setShowGames(true);
      }
    });

    roomChannel.on("broadcast", { event: "ttt_reset" }, (payload) => {
      const data = payload.payload as { senderId: string };
      if (data.senderId !== sessionId) {
        setBoard(Array(9).fill(null));
        setCurrentTurn("X");
      }
    });

    roomChannel.on("broadcast", { event: "wc_word" }, (payload) => {
      const data = payload.payload as { senderId: string; word: string };
      if (data.senderId !== sessionId) {
        setWordChain((prev) => [...prev, data.word]);
        setIsMyWordTurn(true);
      }
    });

    roomChannel.on("broadcast", { event: "wc_start" }, (payload) => {
      const data = payload.payload as { senderId: string; word: string };
      if (data.senderId !== sessionId) {
        setWordChain([data.word]);
        setIsMyWordTurn(true);
        setActiveGame("wc");
        setShowGames(true);
      }
    });

    return () => {};
  }, [roomChannel, sessionId]);

  const handleCellClick = (i: number) => {
    if (board[i] || winner || !mySymbol || currentTurn !== mySymbol) return;
    const newBoard = [...board];
    newBoard[i] = mySymbol;
    setBoard(newBoard);
    setCurrentTurn(mySymbol === "X" ? "O" : "X");

    roomChannel?.send({
      type: "broadcast",
      event: "ttt_move",
      payload: { senderId: sessionId, index: i, symbol: mySymbol },
    });

    const w = checkWinner(newBoard);
    const d = !w && newBoard.every((c) => c !== null);
    if (w) onSendMessage(`🎮 Tic-Tac-Toe: ${w === mySymbol ? "I" : "You"} won! 🎉`);
    else if (d) onSendMessage("🎮 Tic-Tac-Toe: It's a draw! 🤝");
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

  const handleTruth = useCallback(() => {
    const q = TRUTH_OR_DARE.truths[Math.floor(Math.random() * TRUTH_OR_DARE.truths.length)];
    onSendMessage(`🎯 Truth: ${q}`);
  }, [onSendMessage]);

  const handleDare = useCallback(() => {
    const d = TRUTH_OR_DARE.dares[Math.floor(Math.random() * TRUTH_OR_DARE.dares.length)];
    onSendMessage(`🔥 Dare: ${d}`);
  }, [onSendMessage]);

  const handleWYR = useCallback(() => {
    const pair = WOULD_YOU_RATHER[Math.floor(Math.random() * WOULD_YOU_RATHER.length)];
    onSendMessage(`🤔 Would you rather...\n\nA) ${pair[0]}\nB) ${pair[1]}`);
  }, [onSendMessage]);

  const startWordChain = () => {
    const starters = ["apple", "hello", "ocean", "music", "dream", "light", "river", "storm"];
    const word = starters[Math.floor(Math.random() * starters.length)];
    setWordChain([word]);
    setIsMyWordTurn(false);
    setActiveGame("wc");
    roomChannel?.send({ type: "broadcast", event: "wc_start", payload: { senderId: sessionId, word } });
    onSendMessage(`🔗 Word Chain started! First word: **${word}** — your turn! Say a word starting with "${word.slice(-1).toUpperCase()}"`);
  };

  const submitWord = () => {
    const word = wordInput.trim().toLowerCase();
    if (!word) return;
    const lastWord = wordChain[wordChain.length - 1];
    const requiredLetter = lastWord.slice(-1).toLowerCase();

    if (word[0] !== requiredLetter) {
      onSendMessage(`❌ "${word}" doesn't start with "${requiredLetter.toUpperCase()}"! Try again.`);
      return;
    }
    if (wordChain.includes(word)) {
      onSendMessage(`❌ "${word}" was already used! Try a different word.`);
      return;
    }

    setWordChain((prev) => [...prev, word]);
    setWordInput("");
    setIsMyWordTurn(false);
    roomChannel?.send({ type: "broadcast", event: "wc_word", payload: { senderId: sessionId, word } });
    onSendMessage(`🔗 **${word}** — next word starts with "${word.slice(-1).toUpperCase()}"!`);
  };

  if (!isConnected) return null;

  const isMyTurn = mySymbol === currentTurn;

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

      <AnimatePresence>
        {showGames && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-14 left-0 z-50 w-72 rounded-2xl border border-border bg-card shadow-xl p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Gamepad2 className="h-3.5 w-3.5 text-primary" /> Games
              </span>
              <button onClick={() => { setShowGames(false); if (!["ttt", "wc"].includes(activeGame) || !mySymbol) setActiveGame("none"); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {activeGame === "none" && (
              <div className="space-y-1.5">
                <button onClick={() => setActiveGame("tod")} className="w-full text-left rounded-xl bg-secondary/60 border border-border/50 px-3 py-2.5 hover:bg-secondary transition-colors">
                  <p className="text-sm font-medium text-foreground">🎯 Truth or Dare</p>
                  <p className="text-[10px] text-muted-foreground">Random questions & challenges</p>
                </button>
                <button onClick={startTTT} className="w-full text-left rounded-xl bg-secondary/60 border border-border/50 px-3 py-2.5 hover:bg-secondary transition-colors">
                  <p className="text-sm font-medium text-foreground">❌⭕ Tic-Tac-Toe</p>
                  <p className="text-[10px] text-muted-foreground">Play with your stranger!</p>
                </button>
                <button onClick={() => { setActiveGame("wyr"); }} className="w-full text-left rounded-xl bg-secondary/60 border border-border/50 px-3 py-2.5 hover:bg-secondary transition-colors">
                  <p className="text-sm font-medium text-foreground">🤔 Would You Rather</p>
                  <p className="text-[10px] text-muted-foreground">Tough choices, fun debates!</p>
                </button>
                <button onClick={startWordChain} className="w-full text-left rounded-xl bg-secondary/60 border border-border/50 px-3 py-2.5 hover:bg-secondary transition-colors">
                  <p className="text-sm font-medium text-foreground">🔗 Word Chain</p>
                  <p className="text-[10px] text-muted-foreground">Last letter → next word!</p>
                </button>
              </div>
            )}

            {activeGame === "tod" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button onClick={handleTruth} variant="secondary" size="sm" className="flex-1 text-xs gap-1">🎯 Truth</Button>
                  <Button onClick={handleDare} variant="secondary" size="sm" className="flex-1 text-xs gap-1">🔥 Dare</Button>
                </div>
                <button onClick={() => setActiveGame("none")} className="text-[10px] text-muted-foreground hover:text-foreground w-full text-center">← Back</button>
              </div>
            )}

            {activeGame === "wyr" && (
              <div className="space-y-2">
                <Button onClick={handleWYR} variant="secondary" size="sm" className="w-full text-xs gap-1">🤔 Give me a question!</Button>
                <button onClick={() => setActiveGame("none")} className="text-[10px] text-muted-foreground hover:text-foreground w-full text-center">← Back</button>
              </div>
            )}

            {activeGame === "ttt" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {winner ? `${winner === mySymbol ? "You win" : "They win"}! 🎉` : isDraw ? "Draw! 🤝" : mySymbol ? isMyTurn ? `Your turn (${mySymbol})` : `Their turn (${currentTurn})` : "Waiting..."}
                  </span>
                  <button onClick={resetTTT} className="text-muted-foreground hover:text-foreground"><RotateCcw className="h-3 w-3" /></button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {board.map((cell, i) => (
                    <button key={i} onClick={() => handleCellClick(i)} disabled={!isMyTurn || !!winner || !!cell}
                      className={cn("h-12 rounded-lg border border-border bg-secondary/40 text-lg font-bold transition-all",
                        !cell && !winner && isMyTurn && "hover:bg-secondary cursor-pointer",
                        (!isMyTurn || !!cell) && !winner && "cursor-not-allowed opacity-70",
                        cell === "X" && "text-primary", cell === "O" && "text-destructive"
                      )}>{cell}</button>
                  ))}
                </div>
                <button onClick={() => { setActiveGame("none"); setMySymbol(null); }} className="text-[10px] text-muted-foreground hover:text-foreground w-full text-center">← Back</button>
              </div>
            )}

            {activeGame === "wc" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    Chain: {wordChain.length} words — {isMyWordTurn ? "Your turn!" : "Their turn..."}
                  </span>
                  <button onClick={startWordChain} className="text-muted-foreground hover:text-foreground"><RotateCcw className="h-3 w-3" /></button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {wordChain.slice(-6).map((w, i) => (
                    <span key={i} className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] text-primary font-medium">{w}</span>
                  ))}
                </div>
                {isMyWordTurn && (
                  <div className="flex gap-1.5">
                    <input
                      value={wordInput}
                      onChange={(e) => setWordInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitWord()}
                      placeholder={`Word starting with "${wordChain[wordChain.length - 1]?.slice(-1).toUpperCase()}"...`}
                      className="flex-1 rounded-lg border border-border bg-secondary/50 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <Button onClick={submitWord} variant="default" size="sm" className="text-xs px-3">Go</Button>
                  </div>
                )}
                <button onClick={() => setActiveGame("none")} className="text-[10px] text-muted-foreground hover:text-foreground w-full text-center">← Back</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatGames;
