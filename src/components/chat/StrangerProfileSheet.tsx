import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Tag, Shield, MessageSquare, Phone, Video, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface StrangerProfileSheetProps {
  show: boolean;
  onClose: () => void;
  strangerName: string;
  strangerAvatar?: string;
  strangerMood?: string;
  matchedInterests: string[];
  connectedAt: number | null;
  isVerified?: boolean;
  messageCount?: number;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
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

function formatDuration(s: number) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m < 60) return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-600",
  "from-teal-500 to-green-500",
  "from-red-500 to-rose-600",
];

const FALLBACK_EMOJI = ["😎", "🦊", "🐺", "🦁", "🐯", "🦅", "🐉", "🦋", "🌟", "⚡", "🔥", "💎"];

function nameHash(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

export default function StrangerProfileSheet({
  show,
  onClose,
  strangerName,
  strangerAvatar,
  strangerMood,
  matchedInterests,
  connectedAt,
  isVerified = false,
  messageCount = 0,
  onAudioCall,
  onVideoCall,
}: StrangerProfileSheetProps) {
  const elapsed = useElapsed(connectedAt);
  const h = nameHash(strangerName);
  const gradient = GRADIENTS[h % GRADIENTS.length];
  const emoji = strangerAvatar || FALLBACK_EMOJI[h % FALLBACK_EMOJI.length];
  const isImageAvatar = emoji.startsWith("data:image/");

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet sliding up from bottom */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-[91] max-h-[85vh] rounded-t-3xl bg-card border-t border-border/60 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Header gradient banner */}
            <div className={cn("relative h-28 sm:h-32 bg-gradient-to-br overflow-hidden", gradient)}>
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-all active:scale-95 backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile avatar — overlapping the banner */}
            <div className="relative px-5 -mt-12">
              <div className={cn(
                "h-24 w-24 rounded-full border-4 border-card shadow-lg flex items-center justify-center overflow-hidden",
                isImageAvatar ? "bg-muted" : cn("bg-gradient-to-br", gradient)
              )}>
                {isImageAvatar ? (
                  <img src={emoji} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl select-none">{emoji}</span>
                )}
              </div>

              {/* Online indicator */}
              <div className="absolute bottom-1 left-[76px] h-5 w-5 rounded-full bg-green-500 border-[3px] border-card" />
            </div>

            {/* Profile info */}
            <div className="px-5 pt-3 pb-4 space-y-4 overflow-y-auto flex-1">
              {/* Name + mood + verified */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-foreground leading-tight truncate">{strangerName}</h2>
                  {isVerified && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                      <Shield className="h-3 w-3 text-green-500 fill-green-500/20" />
                      <span className="text-[8px] font-black text-green-500 uppercase tracking-wider">Verified</span>
                    </div>
                  )}
                </div>
                {strangerMood && (
                  <p className="text-sm text-muted-foreground font-medium">{strangerMood}</p>
                )}
                <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online now
                </p>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/50 border border-border/40">
                  <Clock className="h-4 w-4 text-primary mb-1" />
                  <span className="text-sm font-bold text-foreground tabular-nums">{formatDuration(elapsed)}</span>
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Duration</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/50 border border-border/40">
                  <MessageSquare className="h-4 w-4 text-primary mb-1" />
                  <span className="text-sm font-bold text-foreground tabular-nums">{messageCount}</span>
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Messages</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/50 border border-border/40">
                  <Tag className="h-4 w-4 text-primary mb-1" />
                  <span className="text-sm font-bold text-foreground tabular-nums">{matchedInterests.length}</span>
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Shared</span>
                </div>
              </div>

              {/* Action buttons: Audio call + Video call */}
              <div className="grid grid-cols-2 gap-2">
                {onAudioCall && (
                  <button
                    onClick={() => { onAudioCall(); onClose(); }}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm hover:bg-primary/20 active:scale-[0.98] transition-all"
                  >
                    <Phone className="h-4 w-4" />
                    Audio Call
                  </button>
                )}
                {onVideoCall && (
                  <button
                    onClick={() => { onVideoCall(); onClose(); }}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm hover:bg-primary/20 active:scale-[0.98] transition-all"
                  >
                    <Video className="h-4 w-4" />
                    Video Call
                  </button>
                )}
              </div>

              {/* Shared interests */}
              {matchedInterests.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Shared Interests</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedInterests.map(interest => (
                      <span
                        key={interest}
                        className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary"
                      >
                        #{interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Encryption notice */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/30">
                <Shield className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                  This is an anonymous chat. Messages are end-to-end encrypted and not stored after the session ends.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
