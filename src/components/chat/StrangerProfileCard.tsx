import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Tag, Shield, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface StrangerProfileCardProps {
  strangerName: string;
  matchedInterests: string[];
  connectedAt: number | null;
  isVerified?: boolean;
  show: boolean;
  onClose: () => void;
  strangerAvatar?: string;
  strangerMood?: string;
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

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-600",
];
const AVATARS = ["😎", "🦊", "🐺", "🦁", "🐯", "🦅", "🐉", "🦋", "🌟", "⚡", "🔥", "💎"];

function nameHash(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

export default function StrangerProfileCard({
  strangerName,
  matchedInterests,
  connectedAt,
  isVerified = false,
  show,
  onClose,
  strangerAvatar,
  strangerMood,
}: StrangerProfileCardProps) {
  const elapsed = useElapsed(connectedAt);
  const [expanded, setExpanded] = useState(false);
  const h = nameHash(strangerName);
  const gradient = GRADIENTS[h % GRADIENTS.length];
  const emoji = strangerAvatar || AVATARS[h % AVATARS.length];

  // Auto-collapse after 4s
  useEffect(() => {
    if (!show) { setExpanded(false); return; }
    setExpanded(true);
    const t = setTimeout(() => setExpanded(false), 4000);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -8 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          // Floating overlay — top-right, doesn't push content
          className="absolute top-2 right-3 sm:right-5 z-30 max-w-[220px]"
        >
          <div className="rounded-2xl bg-card/95 border border-border/60 shadow-xl backdrop-blur-md overflow-hidden">
            {/* Gradient top strip */}
            <div className={cn("h-0.5 bg-gradient-to-r", gradient)} />

            {/* Collapsed pill — always visible */}
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-2 px-2.5 py-1.5 w-full"
            >
              {/* Mini avatar */}
              <div className={cn(
                "h-6 w-6 rounded-lg bg-gradient-to-br flex items-center justify-center text-sm shrink-0 overflow-hidden",
                !emoji.startsWith("data:image/") && gradient
              )}>
                {emoji.startsWith("data:image/") ? (
                  <img src={emoji} alt="Avatar" className="h-full w-full object-cover rounded-lg" />
                ) : (
                  emoji
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 truncate">
                  <p className="text-[11px] font-black text-foreground truncate leading-tight">
                    {strangerName}
                  </p>
                  {strangerMood && (
                    <span className="text-[7px] font-bold px-1 rounded bg-primary/10 text-primary border border-primary/20 leading-none shrink-0 normal-case tracking-normal">{strangerMood}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-online animate-pulse shrink-0" />
                  {connectedAt && (
                    <span className="text-[9px] text-muted-foreground tabular-nums">
                      {formatElapsed(elapsed)}
                    </span>
                  )}
                  {isVerified && (
                    <Shield className="h-2.5 w-2.5 text-green-400 shrink-0" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <ChevronDown className={cn(
                  "h-3 w-3 text-muted-foreground/50 transition-transform duration-200",
                  expanded && "rotate-180"
                )} />
              </div>
            </button>

            {/* Expanded details */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-2.5 pb-2.5 pt-1 border-t border-border/30 space-y-2">
                    {/* Verified badge */}
                    {isVerified && (
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-green-400" />
                        <span className="text-[9px] font-black text-green-400 uppercase tracking-wider">Verified Human</span>
                      </div>
                    )}

                    {/* Shared interests */}
                    {matchedInterests.length > 0 ? (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Tag className="h-2.5 w-2.5 text-primary" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Shared</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {matchedInterests.slice(0, 4).map(i => (
                            <span key={i} className="px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary">
                              #{i}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[9px] text-muted-foreground/50 italic">No shared interests</p>
                    )}

                    {/* Close */}
                    <button
                      onClick={onClose}
                      className="flex items-center gap-1 text-[9px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      <X className="h-2.5 w-2.5" />
                      Hide
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
