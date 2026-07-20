import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageSquare, Maximize2, PhoneOff, Phone, Video, Mic, MicOff } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
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

  const isConnected = status === "connected" || callStatus !== "idle";
  const shouldShow = isConnected && (isMinimized || pathname !== "/chat");

  if (!shouldShow) return null;

  const handleExpand = () => {
    if (onExpand) onExpand();
    if (pathname !== "/chat") {
      navigate("/chat");
    }
  };

  const handleEnd = () => {
    if (callStatus !== "idle") {
      endCall();
    }
    stopChat();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        drag
        dragConstraints={{ left: -100, right: 100, top: -300, bottom: 50 }}
        className={cn(
          "fixed z-[90] bottom-20 left-4 sm:left-auto sm:right-6",
          "flex items-center gap-3 p-2.5 rounded-full bg-card/90 border border-primary/40 shadow-2xl backdrop-blur-xl",
          "ring-2 ring-primary/20 hover:ring-primary/40 transition-all select-none cursor-grab active:cursor-grabbing"
        )}
      >
        {/* Stranger Avatar with Pulse */}
        <div className="relative shrink-0" onClick={handleExpand}>
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-secondary border border-primary/30 flex items-center justify-center text-sm font-bold overflow-hidden shadow-inner">
            {strangerAvatar ? (
              strangerAvatar.startsWith("data:image/") ? (
                <img src={strangerAvatar} alt={strangerName} className="h-full w-full object-cover" />
              ) : (
                <span>{strangerAvatar}</span>
              )
            ) : (
              <MessageSquare className="h-5 w-5 text-primary" />
            )}
          </div>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card animate-pulse" />
        </div>

        {/* Info Text */}
        <div className="flex flex-col min-w-0 pr-1 cursor-pointer" onClick={handleExpand}>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-foreground truncate max-w-[90px] sm:max-w-[120px]">
              {strangerName || "Stranger"}
            </span>
            {callStatus !== "idle" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/20 text-[9px] font-bold text-primary">
                {isAudioOnly ? <Phone className="h-2.5 w-2.5" /> : <Video className="h-2.5 w-2.5" />}
              </span>
            )}
          </div>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" />
            <span>Active Session</span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 pl-1 border-l border-border/50">
          {callStatus !== "idle" && (
            <button
              onClick={toggleMute}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-colors text-xs",
                isMuted ? "bg-amber-500/20 text-amber-400" : "hover:bg-secondary text-muted-foreground"
              )}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>
          )}

          <button
            onClick={handleExpand}
            className="h-8 w-8 rounded-full bg-primary/15 hover:bg-primary/25 text-primary flex items-center justify-center transition-colors"
            title="Expand to Full Screen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleEnd}
            className="h-8 w-8 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 flex items-center justify-center transition-colors"
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
