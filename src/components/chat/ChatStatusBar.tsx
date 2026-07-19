import { SkipForward, X, Tags, Video, Phone, Play, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ReportBlockMenu from "@/components/ReportBlockMenu";
import PrivateRoomDialog from "@/components/chat/PrivateRoomDialog";
import ChatTimer from "@/components/chat/ChatTimer";
import type { ChatTheme } from "@/components/chat/ChatThemePicker";
import { cn } from "@/lib/utils";
import type { ChatStatus } from "@/hooks/use-chat";
import type { Message } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/contexts/ChatContext";
import { useSettings } from "@/contexts/SettingsContext";
import { ChatToolsMenu } from "@/components/chat/ChatToolsMenu";

interface ChatStatusBarProps {
  status: ChatStatus;
  matchedInterests: string[];
  autoReconnectCountdown: number | null;
  searchElapsed: number;
  messages?: Message[];
  strangerName?: string;
  onToggleInterests: () => void;
  showInterests: boolean;
  onNext: () => void;
  onStop: () => void;
  onStart: () => void;
  onBlock: () => void;
  onVideoCall: () => void;
  onAudioCall: () => void;
  isVideoCallActive: boolean;
  onCreateRoom: () => string;
  onJoinRoom: (code: string) => void;
  disappearTimer?: number | null;
  onSetDisappearTimer?: (t: number | null) => void;
  onSearchResult?: (messageId: string | null) => void;
  onThemeChange?: (theme: ChatTheme) => void;
}

const statusMessages: Record<string, { text: string; hint?: string }> = {
  idle: { text: "Ready to chat", hint: "Tap Start to find someone" },
  searching: { text: "Searching", hint: "Looking for a stranger..." },
  connected: { text: "Connected", hint: "You're chatting with a stranger" },
  disconnected: { text: "Disconnected", hint: "Stranger left the chat" },
};

const ChatStatusBar = ({
  status, matchedInterests, autoReconnectCountdown, searchElapsed,
  messages = [],
  onToggleInterests, showInterests, onNext, onStop, onStart, onBlock,
  onVideoCall, onAudioCall, isVideoCallActive, onCreateRoom, onJoinRoom,
  disappearTimer, onSetDisappearTimer,
  onSearchResult, onThemeChange, strangerName,
}: ChatStatusBarProps) => {
  const statusInfo = statusMessages[status] || statusMessages.idle;
  const { toast } = useToast();
  const { 
    localPrivacyModeActive, 
    strangerPrivacyModeActive, 
    privacyModeActive, 
    togglePrivacyMode, 
    userName 
  } = useChatContext();
  const { settings, updateSetting } = useSettings();
  const [showPrivacyPopover, setShowPrivacyPopover] = useState(false);

  const handleCopyChat = async () => {
    if (messages.length === 0) return;
    const text = exportChatAsText(messages);
    const ok = await copyToClipboard(text);
    toast({ title: ok ? "📋 Copied!" : "Failed to copy", description: ok ? "Chat copied to clipboard" : "Try downloading instead" });
  };

  const handleDownloadChat = () => {
    if (messages.length === 0) return;
    const text = exportChatAsText(messages);
    downloadAsFile(text, `lchat-${Date.now()}.txt`);
    toast({ title: "💾 Downloaded!", description: "Chat saved as text file" });
  };

  return (
    <div className={cn(
      "flex items-center justify-between border-b border-border/50 px-2 sm:px-5 py-2 sm:py-2.5 gap-1.5 sm:gap-2 glass transition-all duration-300 relative z-30",
      status === "searching" && "search-shimmer"
    )}>
      {/* Status indicator */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full shrink-0 transition-colors duration-300",
            status === "connected" && "bg-online shadow-[0_0_8px_hsl(var(--online)/0.5)]",
            status === "searching" && "bg-warning animate-pulse shadow-[0_0_8px_hsl(var(--warning)/0.5)]",
            status !== "connected" && status !== "searching" && "bg-muted-foreground"
          )}
        />
        <div className="min-w-0 flex-1">
          <span className="text-xs sm:text-sm text-foreground truncate font-medium flex items-center gap-1.5">
            {status === "idle" && statusInfo.text}
            {status === "searching" && `Searching${searchElapsed > 0 ? ` (${searchElapsed}s)` : "..."}`}
            {status === "connected" && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="flex items-center gap-1">
                  {userName || "You"}
                  {localPrivacyModeActive && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center justify-center p-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                      title="Your Privacy Mode Enabled"
                    >
                      <Shield className="h-2.5 w-2.5 text-emerald-400 fill-emerald-400/10 animate-pulse" />
                    </motion.span>
                  )}
                </span>
                <span className="text-muted-foreground text-[10px] mx-0.5">&</span>
                <span className="flex items-center gap-1">
                  {strangerName || "Stranger"}
                  {strangerPrivacyModeActive && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center justify-center p-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                      title="Stranger Privacy Mode Enabled"
                    >
                      <Shield className="h-2.5 w-2.5 text-emerald-400 fill-emerald-400/10 animate-pulse" />
                    </motion.span>
                  )}
                </span>
              </div>
            )}
            {status === "disconnected" && (
              autoReconnectCountdown
                ? `Reconnecting in ${autoReconnectCountdown}s...`
                : statusInfo.text
            )}
          </span>
          <span className="text-[10px] text-muted-foreground truncate block leading-tight">
            {status === "disconnected" && autoReconnectCountdown
              ? "Finding a new stranger..."
              : statusInfo.hint}
          </span>
        </div>
        <AnimatePresence>
          {matchedInterests.length > 0 && status === "connected" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden sm:flex gap-1 ml-1"
            >
              {matchedInterests.map((i) => (
                <span key={i} className="rounded-full bg-primary/20 border border-primary/30 px-2 py-0.5 text-[10px] text-primary font-medium">
                  {i}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable Action bar container with fading gradient overlays on mobile */}
      <div className="relative flex items-center min-w-0">
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none lg:hidden opacity-50" />
        <div className="flex gap-0.5 sm:gap-1.5 items-center shrink-0 overflow-x-auto sm:overflow-visible max-w-[65vw] sm:max-w-none scrollbar-none pr-4">
        {status === "idle" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleInterests}
              className="gap-1 h-8 px-2 sm:px-3 text-xs"
              title="Add topics you're interested in"
            >
              <Tags className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Topics</span>
            </Button>
            <PrivateRoomDialog
              onCreateRoom={onCreateRoom}
              onJoinRoom={onJoinRoom}
            />
          </>
        )}

        {/* ALWAYS VISIBLE ACTIONS (Next / Stop) */}
        {(status === "connected" || status === "disconnected") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            className={cn(
              "gap-1.5 h-8 px-3 text-xs font-bold transition-all hover:scale-[1.03]",
              settings.liquidGlassEnabled
                ? "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 dark:border-primary/20 shadow-sm"
                : "bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20"
            )}
            title="Skip to a new stranger"
          >
            <SkipForward className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Next</span>
          </Button>
        )}
        {status === "connected" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            className={cn(
              "gap-1.5 h-8 px-3 text-xs font-bold transition-all hover:scale-[1.03]",
              settings.liquidGlassEnabled
                ? "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 shadow-sm"
                : "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
            )}
            title="End this conversation"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Stop</span>
          </Button>
        )}
        {status === "disconnected" && autoReconnectCountdown && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            className={cn(
              "gap-1.5 h-8 px-3 text-xs font-bold transition-all hover:scale-[1.03]",
              settings.liquidGlassEnabled
                ? "bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground"
                : "bg-muted border border-border hover:bg-secondary text-muted-foreground"
            )}
            title="Cancel auto-reconnect"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cancel</span>
          </Button>
        )}

        {status === "connected" && (
          <>
            <ChatToolsMenu
              messages={messages}
              onSearchResult={onSearchResult}
              disappearTimer={disappearTimer}
              onSetDisappearTimer={onSetDisappearTimer}
              onBlock={onBlock}
              onThemeChange={onThemeChange}
              triggerClassName="h-8 w-8"
            />

            <ChatTimer isConnected={status === "connected"} onAutoDisconnect={onStop} />
          </>
        )}

        {(status === "idle" || (status === "disconnected" && !autoReconnectCountdown)) && (
          <Button
            variant="glow"
            size="sm"
            onClick={onStart}
            className={cn(
              "h-8 px-4 text-xs font-bold transition-all hover:scale-[1.03] gap-1.5 shadow-lg",
              settings.liquidGlassEnabled
                ? "bg-primary text-primary-foreground border border-primary/20 hover:bg-primary/95 hover:shadow-primary/10"
                : "h-8 px-3 sm:px-4 text-xs sm:text-sm gap-1"
            )}
            title="Find a random stranger to chat with"
          >
            <Play className="h-3 w-3" />
            Start
          </Button>
        )}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none lg:hidden" />
      </div>
    </div>
  );
};

export default ChatStatusBar;
