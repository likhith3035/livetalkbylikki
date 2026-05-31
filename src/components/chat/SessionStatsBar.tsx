import { motion, AnimatePresence } from "framer-motion";
import { Flame, MessageSquare, Clock, Trophy, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SessionStatsBarProps {
  todayConversations: number;
  todayTotalTime: string;
  currentStreak: number;
  longestStreak: number;
  isVerified: boolean;
}

export default function SessionStatsBar({
  todayConversations,
  todayTotalTime,
  currentStreak,
  longestStreak,
  isVerified,
}: SessionStatsBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show if there's something meaningful to display
  const hasContent = isVerified || todayConversations > 0 || currentStreak > 0;
  if (!hasContent || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden border-b border-border/30"
      >
        {/* Compact single-line bar */}
        <div className="flex items-center gap-2 px-3 sm:px-5 py-1.5 bg-card/40">
          {/* Chips row */}
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-none">
            {isVerified && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 shrink-0">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                <span className="text-[9px] font-black text-green-400 uppercase tracking-wider whitespace-nowrap">✓ Human</span>
              </span>
            )}
            {todayConversations > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                <MessageSquare className="h-2.5 w-2.5 text-primary" />
                <span className="font-bold text-foreground">{todayConversations}</span>
                <span className="hidden xs:inline">today</span>
              </span>
            )}
            {currentStreak > 0 && (
              <span className="flex items-center gap-1 text-[10px] shrink-0">
                <Flame className={cn("h-2.5 w-2.5", currentStreak >= 7 ? "text-orange-400" : "text-amber-400")} />
                <span className={cn("font-black", currentStreak >= 7 ? "text-orange-400" : "text-amber-400")}>
                  {currentStreak}d
                </span>
              </span>
            )}
          </div>

          {/* Expand + dismiss */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setExpanded(e => !e)}
              className="h-5 w-5 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="h-5 w-5 flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Expanded panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden bg-card/30 border-b border-border/20"
            >
              <div className="px-3 sm:px-5 py-3 grid grid-cols-3 gap-2">
                <MiniStat icon={<MessageSquare className="h-3 w-3 text-primary" />} value={String(todayConversations)} label="Today" />
                <MiniStat icon={<Clock className="h-3 w-3 text-blue-400" />} value={todayTotalTime} label="Time" />
                <MiniStat icon={<Trophy className="h-3 w-3 text-yellow-400" />} value={`${longestStreak}d`} label="Best" />
              </div>
              {currentStreak > 0 && (
                <div className="px-3 sm:px-5 pb-3">
                  <div className="flex gap-1 mb-1">
                    {[1, 3, 7, 14, 30].map((m) => (
                      <div key={m} className={cn("flex-1 h-1 rounded-full", currentStreak >= m ? "bg-amber-400" : "bg-border")} />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    {[1, 3, 7, 14, 30].map((m) => (
                      <span key={m} className={cn("text-[8px] font-bold", currentStreak >= m ? "text-amber-400" : "text-muted-foreground/30")}>
                        {m}d
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-secondary/40 py-1.5">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-xs font-black text-foreground">{value}</span>
      </div>
      <span className="text-[8px] text-muted-foreground/50 uppercase tracking-wider font-bold">{label}</span>
    </div>
  );
}
