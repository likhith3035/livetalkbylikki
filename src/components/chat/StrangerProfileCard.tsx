import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Tag, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface StrangerProfileCardProps {
  strangerName: string;
  matchedInterests: string[];
  connectedAt: number | null; // timestamp ms
  isVerified?: boolean;
  show: boolean;
  onClose: () => void;
}

function useElapsed(startMs: number | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startMs) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startMs]);
  return elapsed;
}

function formatElapsed(s: number) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

// Deterministic avatar color from name
function nameToColor(name: string) {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-amber-500",
    "from-pink-500 to-rose-500",
    "from-indigo-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Deterministic emoji from name
const AVATARS = ["😎", "🦊", "🐺", "🦁", "🐯", "🦅", "🐉", "🦋", "🌟", "⚡", "🔥", "💎"];
function nameToEmoji(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATARS[Math.abs(hash) % AVATARS.length];
}

export default function StrangerProfileCard({
  strangerName,
  matchedInterests,
  connectedAt,
  isVerified = false,
  show,
  onClose,
}: StrangerProfileCardProps) {
  const elapsed = useElapsed(connectedAt);
  const [expanded, setExpanded] = useState(false);
  const gradient = nameToColor(strangerName);
  const emoji = nameToEmoji(strangerName);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="mx-3 sm:mx-5 mb-1"
        >
          <div className="rounded-2xl bg-card/80 border border-border/50 overflow-hidden shadow-lg backdrop-blur-sm">
            {/* Top gradient strip */}
            <div className={cn("h-0.5 bg-gradient-to-r", gradient)} />

            <div className="px-3 py-2.5">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={cn(
                  "h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl shrink-0 shadow-md",
                  gradient
                )}>
                  {emoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-black text-foreground truncate">
                      {strangerName}
                    </span>
                    {isVerified && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 shrink-0">
                        <Shield className="h-2.5 w-2.5 text-green-400" />
                        <span className="text-[9px] font-black text-green-400 uppercase tracking-wider">Verified</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-online animate-pulse" />
                      <span>Connected</span>
                    </div>
                    {connectedAt && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        <span className="tabular-nums">{formatElapsed(elapsed)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expand / close */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setExpanded(e => !e)}
                    className="h-7 w-7 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={onClose}
                    className="h-7 w-7 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded: interests */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2.5 mt-2.5 border-t border-border/40 space-y-2">
                      {matchedInterests.length > 0 ? (
                        <div>
                          <div className="flex items-center gap-1 mb-1.5">
                            <Tag className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              Shared interests
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {matchedInterests.map(i => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary"
                              >
                                #{i}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/50 italic">
                          No shared interests — but that's what makes it interesting!
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
