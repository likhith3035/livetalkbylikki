import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageSquare, Maximize2, PhoneOff, Phone, Video, Mic, MicOff, GripVertical } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";

interface FloatingChatWidgetProps {
  isMinimized?: boolean;
  onExpand?: () => void;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  isMinimized = false,
  onExpand,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const {
    status,
    callStatus,
    strangerName,
    strangerAvatar,
    stopChat,
    isAudioOnly,
    isMuted,
    toggleMute,
    endCall,
  } = useChatContext();

  const [dragBounds, setDragBounds] = useState({ left: -300, right: 300, top: -600, bottom: 100 });

  useEffect(() => {
    const updateBounds = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 800;
      const h = typeof window !== "undefined" ? window.innerHeight : 600;
      setDragBounds({
        left: -w + 180,
        right: 40,
        top: -h + 160,
        bottom: 40,
      });
    };
    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, []);

  const isConnected = status === "connected" || callStatus !== "idle";
  const shouldShow = isConnected && (isMinimized || pathname !== "/chat");

  if (!shouldShow) return null;

  const handleExpand = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onExpand) onExpand();
    if (pathname !== "/chat") {
      navigate("/chat");
    }
  };

  const handleEnd = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (callStatus !== "idle") {
      endCall();
    }
    stopChat();
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        drag
        dragMomentum={false}
        dragElastic={0.08}
        dragConstraints={dragBounds}
        className={cn(
          "fixed z-[95] bottom-20 right-4 sm:right-8",
          "flex items-center gap-2 p-2 rounded-full bg-card/95 border border-primary/40 shadow-2xl backdrop-blur-2xl",
          "ring-2 ring-primary/20 hover:ring-primary/50 transition-all select-none cursor-grab active:cursor-grabbing touch-none"
        )}
      >
        {/* Drag Handle Icon */}
        <div className="pl-1 text-muted-foreground/60 flex items-center justify-center cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Stranger Avatar with Pulse */}
        <div className="relative shrink-0 cursor-pointer" onClick={handleExpand}>
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-secondary border border-primary/30 flex items-center justify-center text-xs font-bold overflow-hidden shadow-inner">
            {strangerAvatar ? (
              strangerAvatar.startsWith("data:image/") ? (
                <img src={strangerAvatar} alt={strangerName} className="h-full w-full object-cover" />
              ) : (
                <span>{strangerAvatar}</span>
              )
            ) : (
              <MessageSquare className="h-4 w-4 text-primary" />
            )}
          </div>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card animate-pulse" />
        </div>

        {/* Info Text */}
        <div className="flex flex-col min-w-0 pr-1 cursor-pointer" onClick={handleExpand}>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-foreground truncate max-w-[85px] sm:max-w-[120px]">
              {strangerName || "Stranger"}
            </span>
            {callStatus !== "idle" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/20 text-[9px] font-bold text-primary">
                {isAudioOnly ? <Phone className="h-2.5 w-2.5" /> : <Video className="h-2.5 w-2.5" />}
              </span>
            )}
          </div>
          <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" />
            <span>Active Chat</span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 pl-1 border-l border-border/50">
          {callStatus !== "idle" && (
            <button
              onClick={handleMuteToggle}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center transition-colors text-xs",
                isMuted ? "bg-amber-500/20 text-amber-400" : "hover:bg-secondary text-muted-foreground"
              )}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>
          )}

          <button
            onClick={handleExpand}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/15 hover:bg-primary/25 text-primary flex items-center justify-center transition-colors"
            title="Expand to Full Screen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleEnd}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 flex items-center justify-center transition-colors"
            title="End Session"
          >
            <PhoneOff className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingChatWidget;
