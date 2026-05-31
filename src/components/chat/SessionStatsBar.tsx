import { motion, AnimatePresence } from "framer-motion";
import { Flame, MessageSquare, Clock, Trophy, ChevronDown, ChevronUp } from "lucide-react";
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

  if (todayConversations === 0 && !isVerified) return null;

  return (
    <div className="px-3 sm:px-5 py-1.5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card/60 border border-border/40 overflow-hidden"
      >
        {/* Compact row */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-3 py-2 gap-3"
        >
          <div className="flex items-center gap-3 flex-wrap">
            {/* Verified badge */}
            {isVerified && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">✓ Verified Human</span>
              </div>
            )}

            {/* Today's chats */}
            {todayConversations > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MessageSquare className="h-3 w-3 text-primary" />
                <span className="font-bold text-foreground">{todayConversations}</span>
                <span>chat{todayConversations !== 1 ? "s" : ""} today</span>
              </div>
            )}

            {/* Streak */}
            {currentStreak > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Flame className={cn("h-3 w-3", currentStreak >= 7 ? "text-orange-400" : "text-amber-400")} />
                <span className={cn("font-black", currentStreak >= 7 ? "text-orange-400" : "text-amber-400")}>
                  {currentStreak}
                </span>
                <span>day streak</span>
              </div>
            )}
          </div>

          <div className="text-muted-foreground/40 shrink-0">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>
        </button>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                <StatCard
                  icon={<MessageSquare className="h-3.5 w-3.5 text-primary" />}
                  value={String(todayConversations)}
                  label="Today"
                />
                <StatCard
                  icon={<Clock className="h-3.5 w-3.5 text-blue-400" />}
                  value={todayTotalTime}
                  label="Chat time"
                />
                <StatCard
                  icon={<Trophy className="h-3.5 w-3.5 text-yellow-400" />}
                  value={`${longestStreak}d`}
                  label="Best streak"
                />
              </div>

              {/* Streak milestones */}
              {currentStreak > 0 && (
                <div className="px-3 pb-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Flame className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {currentStreak} day streak
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 3, 7, 14, 30].map((milestone) => (
                      <div
                        key={milestone}
                        className={cn(
                          "flex-1 h-1.5 rounded-full transition-colors",
                          currentStreak >= milestone ? "bg-amber-400" : "bg-border"
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {[1, 3, 7, 14, 30].map((m) => (
                      <span key={m} className={cn(
                        "text-[8px] font-bold",
                        currentStreak >= m ? "text-amber-400" : "text-muted-foreground/30"
                      )}>
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
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-secondary/40 border border-border/30 py-2">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-sm font-black text-foreground">{value}</span>
      </div>
      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-bold">{label}</span>
    </div>
  );
}
