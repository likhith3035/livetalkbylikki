import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatGamesProps {
  onSendMessage: (text: string) => void;
  isConnected: boolean;
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

const ChatGames = ({ onSendMessage, isConnected }: ChatGamesProps) => {
  const [showGames, setShowGames] = useState(false);
  const [activeGame, setActiveGame] = useState<"none" | "ttt" | "tod">("none");
  
  // Tic Tac Toe state (local single-device play for fun)
  const [board, setBoard] = useState<TicTacToeCell[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const winner = checkWinner(board);
  const isDraw = !winner && board.every((c) => c !== null);

  const handleCellClick = (i: number) => {
    if (board[i] || winner) return;
    const newBoard = [...board];
    newBoard[i] = isXTurn ? "X" : "O";
    setBoard(newBoard);
    setIsXTurn(!isXTurn);

    const w = checkWinner(newBoard);
    const d = !w && newBoard.every((c) => c !== null);
    if (w) {
      onSendMessage(`🎮 Tic-Tac-Toe: ${w} wins! 🎉`);
    } else if (d) {
      onSendMessage("🎮 Tic-Tac-Toe: It's a draw! 🤝");
    }
  };

  const resetTTT = () => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
  };

  // Truth or Dare
  const handleTruth = useCallback(() => {
    const q = TRUTH_OR_DARE.truths[Math.floor(Math.random() * TRUTH_OR_DARE.truths.length)];
    onSendMessage(`🎯 Truth: ${q}`);
  }, [onSendMessage]);

  const handleDare = useCallback(() => {
    const d = TRUTH_OR_DARE.dares[Math.floor(Math.random() * TRUTH_OR_DARE.dares.length)];
    onSendMessage(`🔥 Dare: ${d}`);
  }, [onSendMessage]);

  if (!isConnected) return null;

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
            className="absolute bottom-14 left-0 z-50 w-64 rounded-2xl border border-border bg-card shadow-xl p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Gamepad2 className="h-3.5 w-3.5 text-primary" /> Games
              </span>
              <button onClick={() => { setShowGames(false); setActiveGame("none"); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {activeGame === "none" && (
              <div className="space-y-1.5">
                <button
                  onClick={() => setActiveGame("tod")}
                  className="w-full text-left rounded-xl bg-secondary/60 border border-border/50 px-3 py-2.5 hover:bg-secondary transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">🎯 Truth or Dare</p>
                  <p className="text-[10px] text-muted-foreground">Random questions & challenges</p>
                </button>
                <button
                  onClick={() => { setActiveGame("ttt"); resetTTT(); }}
                  className="w-full text-left rounded-xl bg-secondary/60 border border-border/50 px-3 py-2.5 hover:bg-secondary transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">❌⭕ Tic-Tac-Toe</p>
                  <p className="text-[10px] text-muted-foreground">Classic game on your screen</p>
                </button>
              </div>
            )}

            {activeGame === "tod" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button onClick={handleTruth} variant="secondary" size="sm" className="flex-1 text-xs gap-1">
                    🎯 Truth
                  </Button>
                  <Button onClick={handleDare} variant="secondary" size="sm" className="flex-1 text-xs gap-1">
                    🔥 Dare
                  </Button>
                </div>
                <button onClick={() => setActiveGame("none")} className="text-[10px] text-muted-foreground hover:text-foreground w-full text-center">
                  ← Back
                </button>
              </div>
            )}

            {activeGame === "ttt" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {winner ? `${winner} wins! 🎉` : isDraw ? "Draw! 🤝" : `Turn: ${isXTurn ? "X" : "O"}`}
                  </span>
                  <button onClick={resetTTT} className="text-muted-foreground hover:text-foreground">
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {board.map((cell, i) => (
                    <button
                      key={i}
                      onClick={() => handleCellClick(i)}
                      className={cn(
                        "h-12 rounded-lg border border-border bg-secondary/40 text-lg font-bold transition-all",
                        !cell && !winner && "hover:bg-secondary cursor-pointer",
                        cell === "X" && "text-primary",
                        cell === "O" && "text-destructive"
                      )}
                    >
                      {cell}
                    </button>
                  ))}
                </div>
                <button onClick={() => setActiveGame("none")} className="text-[10px] text-muted-foreground hover:text-foreground w-full text-center">
                  ← Back
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatGames;
