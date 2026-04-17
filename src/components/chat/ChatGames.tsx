import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, X, RotateCcw, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RoomChannel } from "@/lib/types";

interface ChatGamesProps {
  onSendMessage: (text: string) => void;
  isConnected: boolean;
  roomChannel?: RoomChannel;
  sessionId?: string;
  activeGame: "none" | "ttt" | "canvas";
  setActiveGame: (game: "none" | "ttt" | "canvas") => void;
}

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

const ChatGames = ({ onSendMessage, isConnected, roomChannel, sessionId, activeGame, setActiveGame }: ChatGamesProps) => {
  const [showGames, setShowGames] = useState(false);

  // Tic-Tac-Toe state
  const [board, setBoard] = useState<TicTacToeCell[]>(Array(9).fill(null));
  const [mySymbol, setMySymbol] = useState<"X" | "O" | null>(null);
  const [currentTurn, setCurrentTurn] = useState<"X" | "O">("X");
  const winner = checkWinner(board);
  const isDraw = !winner && board.every((c) => c !== null);

  useEffect(() => {
    if (!roomChannel) return;

    roomChannel.on?.("broadcast", { event: "ttt_move" }, (payload) => {
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

    roomChannel.on?.("broadcast", { event: "canvas_start" }, (payload) => {
      if (payload.payload.senderId !== sessionId) {
        setActiveGame("canvas");
        setShowGames(false);
      }
    });

    roomChannel.on?.("broadcast", { event: "canvas_stop" }, (payload) => {
      if (payload.payload.senderId !== sessionId) {
        setActiveGame("none");
      }
    });

    roomChannel.subscribe?.();

    return () => { };
  }, [roomChannel, sessionId, setActiveGame]);

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

  const startCanvas = () => {
    setActiveGame("canvas");
    setShowGames(false);
    roomChannel?.send({ type: "broadcast", event: "canvas_start", payload: { senderId: sessionId } });
    onSendMessage("🎨 I opened the Collaborative Canvas! Let's doodle together!");
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
            className="absolute bottom-14 left-0 z-50 w-64 rounded-2xl border border-border bg-card shadow-xl p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Gamepad2 className="h-3.5 w-3.5 text-primary" /> Games
              </span>
              <button
                onClick={() => {
                  setShowGames(false);
                  if (activeGame !== "ttt" || !mySymbol) setActiveGame("none");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {activeGame === "none" && (
              <div className="space-y-1.5">
                <button
                  onClick={startTTT}
                  className="w-full text-left rounded-xl bg-secondary/60 border border-border/50 px-3 py-2.5 hover:bg-secondary transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">❌⭕ Tic-Tac-Toe</p>
                  <p className="text-[10px] text-muted-foreground">Play with your stranger!</p>
                </button>
                <button
                  onClick={startCanvas}
                  className="w-full text-left rounded-xl bg-secondary/60 border border-border/50 px-3 py-2.5 hover:bg-secondary transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">🎨 Shared Canvas</p>
                  <p className="text-[10px] text-muted-foreground">Doodle in real-time!</p>
                </button>
              </div>
            )}

            {activeGame === "ttt" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
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
                  <button onClick={resetTTT} className="text-muted-foreground hover:text-foreground">
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {board.map((cell, i) => (
                    <button
                      key={i}
                      onClick={() => handleCellClick(i)}
                      disabled={!isMyTurn || !!winner || !!cell}
                      className={cn(
                        "h-12 rounded-lg border border-border bg-secondary/40 text-lg font-bold transition-all",
                        !cell && !winner && isMyTurn && "hover:bg-secondary cursor-pointer",
                        (!isMyTurn || !!cell) && !winner && "cursor-not-allowed opacity-70",
                        cell === "X" && "text-primary",
                        cell === "O" && "text-destructive"
                      )}
                    >
                      {cell}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setActiveGame("none");
                    setMySymbol(null);
                  }}
                  className="text-[10px] text-muted-foreground hover:text-foreground w-full text-center"
                >
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
