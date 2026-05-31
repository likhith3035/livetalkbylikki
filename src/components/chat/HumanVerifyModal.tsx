import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, RefreshCw, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HumanVerifyModalProps {
  show: boolean;
  onVerified: () => void;
  onClose: () => void;
}

// Puzzle types
type PuzzleType = "math" | "emoji" | "sequence";

interface Puzzle {
  type: PuzzleType;
  question: string;
  answer: string;
  options: string[];
  hint?: string;
}

const EMOJI_SETS = [
  { q: "Which one is a fruit? 🍕 🍎 🚗 🎸", a: "🍎" },
  { q: "Which one is an animal? 🏠 🌊 🐶 ✈️", a: "🐶" },
  { q: "Which one is a vehicle? 🌸 🍔 🚀 💎", a: "🚀" },
  { q: "Which one is food? 🎯 🍕 🌙 🔑", a: "🍕" },
  { q: "Which one is a plant? 🎮 🌵 🔔 🎲", a: "🌵" },
];

function generatePuzzle(): Puzzle {
  const type = (["math", "emoji", "sequence"] as PuzzleType[])[Math.floor(Math.random() * 3)];

  if (type === "math") {
    const ops = ["+", "-", "×"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 9) + 1;
    let b = Math.floor(Math.random() * 9) + 1;
    let answer: number;
    if (op === "+") answer = a + b;
    else if (op === "-") { if (a < b) [a, b] = [b, a]; answer = a - b; }
    else answer = a * b;

    const correct = String(answer);
    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const w = String(answer + (Math.floor(Math.random() * 7) - 3));
      if (w !== correct && parseInt(w) >= 0) wrongs.add(w);
    }
    const options = [...wrongs, correct].sort(() => Math.random() - 0.5);
    return { type, question: `${a} ${op} ${b} = ?`, answer: correct, options, hint: "Solve the math" };
  }

  if (type === "emoji") {
    const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
    const allEmojis = ["🍎", "🐶", "🚀", "🍕", "🌵", "🏠", "🌊", "🚗", "🎸", "🌸", "🍔", "✈️", "💎", "🎯", "🌙", "🔑", "🎮", "🔔", "🎲"];
    const wrongs = allEmojis.filter(e => e !== set.a).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...wrongs, set.a].sort(() => Math.random() - 0.5);
    return { type, question: set.q, answer: set.a, options, hint: "Pick the correct emoji" };
  }

  // sequence
  const sequences = [
    { q: "2, 4, 6, 8, ?", a: "10", wrongs: ["9", "11", "12"] },
    { q: "1, 3, 5, 7, ?", a: "9", wrongs: ["8", "10", "11"] },
    { q: "5, 10, 15, 20, ?", a: "25", wrongs: ["22", "24", "30"] },
    { q: "3, 6, 9, 12, ?", a: "15", wrongs: ["13", "14", "16"] },
    { q: "10, 8, 6, 4, ?", a: "2", wrongs: ["0", "3", "1"] },
  ];
  const seq = sequences[Math.floor(Math.random() * sequences.length)];
  const options = [...seq.wrongs, seq.a].sort(() => Math.random() - 0.5);
  return { type, question: seq.q, answer: seq.a, options, hint: "Complete the sequence" };
}

export default function HumanVerifyModal({ show, onVerified, onClose }: HumanVerifyModalProps) {
  const [puzzle, setPuzzle] = useState<Puzzle>(generatePuzzle);
  const [selected, setSelected] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "correct" | "wrong">("idle");
  const [attempts, setAttempts] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    setPuzzle(generatePuzzle());
    setSelected(null);
    setState("idle");
  }, []);

  useEffect(() => {
    if (show) refresh();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [show]);

  const handleSelect = useCallback((option: string) => {
    if (state !== "idle") return;
    setSelected(option);

    if (option === puzzle.answer) {
      setState("correct");
      timerRef.current = setTimeout(() => onVerified(), 800);
    } else {
      setState("wrong");
      setAttempts(a => a + 1);
      timerRef.current = setTimeout(() => {
        refresh();
      }, 1000);
    }
  }, [puzzle.answer, state, onVerified, refresh]);

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[301] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm rounded-[2rem] bg-card border border-border/60 shadow-2xl overflow-hidden">
              {/* Top bar */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-primary to-blue-500" />

              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">Human Verification</p>
                      <p className="text-[10px] text-muted-foreground">Prove you're not a bot</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Puzzle */}
                <div className="rounded-2xl bg-secondary/40 border border-border/50 p-4 space-y-3">
                  {puzzle.hint && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">
                      {puzzle.hint}
                    </p>
                  )}
                  <p className="text-center text-lg font-black text-foreground tracking-wide">
                    {puzzle.question}
                  </p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-2">
                  {puzzle.options.map((opt) => (
                    <motion.button
                      key={opt}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelect(opt)}
                      disabled={state !== "idle"}
                      className={cn(
                        "h-12 rounded-xl border text-sm font-bold transition-all",
                        state === "idle" && "bg-secondary/50 border-border hover:bg-primary/10 hover:border-primary/30 hover:text-primary",
                        selected === opt && state === "correct" && "bg-green-500/15 border-green-500/40 text-green-400",
                        selected === opt && state === "wrong" && "bg-destructive/15 border-destructive/40 text-destructive",
                        selected !== opt && state !== "idle" && "opacity-40"
                      )}
                    >
                      {opt}
                    </motion.button>
                  ))}
                </div>

                {/* Status */}
                <AnimatePresence mode="wait">
                  {state === "correct" && (
                    <motion.div
                      key="correct"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 text-green-400 text-sm font-bold"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Verified! You're human ✓
                    </motion.div>
                  )}
                  {state === "wrong" && (
                    <motion.div
                      key="wrong"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 text-destructive text-sm font-bold"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Wrong — try again
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Refresh + attempts */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={refresh}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    New puzzle
                  </button>
                  {attempts > 0 && (
                    <span className="text-[10px] text-muted-foreground/50">
                      {attempts} wrong attempt{attempts > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
