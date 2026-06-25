import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AI_BOT_NAME } from "@/features/shared/constants";
import { AIThinkingIndicator } from "./AIThinkingIndicator";
import { useAIGameSession } from "./useAIGameSession";

interface AIOpponentPanelProps {
  roomId: string | null;
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage?: (text: string) => void;
}

export function AIOpponentPanel({
  roomId,
  sessionId,
  isOpen,
  onClose,
  onSendMessage,
}: AIOpponentPanelProps) {
  const ai = useAIGameSession({ roomId, sessionId, enabled: isOpen && !!roomId });

  const handleClose = () => {
    ai.stopAI();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-x-4 bottom-20 lg:bottom-6 lg:left-[240px] lg:right-6 z-50 max-w-lg mx-auto lg:mx-0 lg:ml-auto rounded-[1.75rem] border border-primary/25 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-primary/5">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">AI Opponent</p>
              <p className="text-[10px] text-muted-foreground">{AI_BOT_NAME} · rule-based · no account</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <AIThinkingIndicator visible={ai.aiThinking} />

          {!ai.activeGame && (
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "ttt" as const, label: "Tic-Tac-Toe", emoji: "⭕", action: ai.startTtt },
                  { id: "rps" as const, label: "RPS", emoji: "✊", action: ai.startRps },
                  { id: "trivia" as const, label: "Trivia", emoji: "🧠", action: ai.startTrivia },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    g.action();
                    onSendMessage?.(`🤖 Started ${g.label} vs AI`);
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/40 bg-secondary/30 px-2 py-4 hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-[10px] font-bold text-foreground/80">{g.label}</span>
                </button>
              ))}
            </div>
          )}

          {ai.activeGame === "ttt" && ai.ttt && (
            <div className="space-y-3">
              <p className="text-xs text-center text-muted-foreground">
                You are <strong>{ai.ttt.humanSymbol}</strong>
                {ai.ttt.status === "playing" && ai.ttt.turn === ai.ttt.humanSymbol ? " — your turn" : ""}
              </p>
              <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
                {ai.ttt.board.map((cell, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={!!cell || ai.ttt!.status !== "playing" || ai.ttt!.turn !== ai.ttt!.humanSymbol || ai.aiThinking}
                    onClick={() => ai.playTttMove(i)}
                    className={cn(
                      "aspect-square rounded-xl border text-xl font-bold transition-all",
                      cell ? "border-primary/20 bg-primary/5" : "border-border/50 hover:border-primary/40 hover:bg-secondary/50",
                      "disabled:opacity-60"
                    )}
                  >
                    {cell}
                  </button>
                ))}
              </div>
              {ai.ttt.status === "won" && (
                <p className="text-center text-sm font-bold text-primary">
                  {ai.ttt.winner === ai.ttt.humanSymbol ? "You win! 🎉" : "AI wins!"}
                </p>
              )}
              {ai.ttt.status === "draw" && (
                <p className="text-center text-sm text-muted-foreground">Draw 🤝</p>
              )}
              <Button size="sm" variant="outline" className="w-full" onClick={ai.startTtt}>
                Rematch
              </Button>
            </div>
          )}

          {ai.activeGame === "rps" && ai.rps && (
            <div className="space-y-3 text-center">
              <p className="text-xs text-muted-foreground">
                Score: You {ai.rps.humanScore} — AI {ai.rps.aiScore} (draws {ai.rps.draws})
              </p>
              {ai.rps.status === "revealed" && ai.rps.humanChoice && ai.rps.aiChoice && (
                <p className="text-lg">
                  {ai.rpsEmoji[ai.rps.humanChoice]} vs {ai.rpsEmoji[ai.rps.aiChoice]}
                </p>
              )}
              <div className="flex justify-center gap-3">
                {(["R", "P", "S"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={ai.rps!.status === "thinking" || ai.aiThinking}
                    onClick={() => ai.playRps(c)}
                    className="h-14 w-14 rounded-2xl border border-border/50 text-2xl hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                  >
                    {ai.rpsEmoji[c]}
                  </button>
                ))}
              </div>
              {ai.rps.status === "revealed" && (
                <Button size="sm" variant="outline" onClick={ai.resetRpsRound}>
                  Next round
                </Button>
              )}
            </div>
          )}

          {ai.activeGame === "trivia" && ai.trivia && (
            <div className="space-y-3">
              {ai.trivia.status === "loading" && (
                <p className="text-xs text-center text-muted-foreground">Loading question from Open Trivia DB…</p>
              )}
              {ai.trivia.question && (
                <>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {ai.trivia.question.category} · {ai.trivia.question.difficulty}
                  </p>
                  <p className="text-sm font-medium leading-snug">{ai.trivia.question.question}</p>
                  <div className="grid gap-2">
                    {ai.trivia.question.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        disabled={ai.trivia!.status !== "playing" || ai.aiThinking}
                        onClick={() => ai.answerTrivia(opt)}
                        className={cn(
                          "text-left text-xs rounded-xl border px-3 py-2.5 transition-all",
                          ai.trivia!.selectedAnswer === opt
                            ? ai.trivia!.wasCorrect
                              ? "border-green-500/50 bg-green-500/10"
                              : "border-destructive/50 bg-destructive/10"
                            : "border-border/40 hover:border-primary/30"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Score: {ai.trivia.score} · Round {ai.trivia.round}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border/20 flex items-center gap-1.5 text-[9px] text-muted-foreground/70">
          <Gamepad2 className="h-3 w-3" />
          Moves synced via Firebase metadata · streams stay P2P
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
