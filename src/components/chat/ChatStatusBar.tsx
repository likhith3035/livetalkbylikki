import { SkipForward, X, Tags, Video, Phone, Play, Download, Copy, Timer, Shield, EyeOff, Ban, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ReportBlockMenu from "@/components/ReportBlockMenu";
import PrivateRoomDialog from "@/components/chat/PrivateRoomDialog";
import ChatSearchBar from "@/components/chat/ChatSearchBar";
import ChatThemePicker from "@/components/chat/ChatThemePicker";
import ChatTimer from "@/components/chat/ChatTimer";
import type { ChatTheme } from "@/components/chat/ChatThemePicker";
import { cn } from "@/lib/utils";
import type { ChatStatus } from "@/hooks/use-chat";
import type { Message } from "@/hooks/use-chat";
import { exportChatAsText, copyToClipboard, downloadAsFile } from "@/lib/chat-export";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/contexts/ChatContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Switch } from "@/components/ui/switch";

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

      {/* Action buttons with labels */}
      <div className="flex gap-0.5 sm:gap-1.5 items-center shrink-0 overflow-x-auto sm:overflow-visible max-w-[65vw] sm:max-w-none scrollbar-none">
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
            variant="secondary"
            size="sm"
            onClick={onNext}
            className="gap-1 h-8 px-2 sm:px-3 text-xs"
            title="Skip to a new stranger"
          >
            <SkipForward className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Next</span>
          </Button>
        )}
        {status === "connected" && (
          <Button
            variant="danger"
            size="sm"
            onClick={onStop}
            className="gap-1 h-8 px-2 sm:px-3 text-xs"
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
            className="gap-1 h-8 px-2 sm:px-3 text-xs text-muted-foreground"
            title="Cancel auto-reconnect"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cancel</span>
          </Button>
        )}

        {status === "connected" && (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={onAudioCall}
              disabled={isVideoCallActive}
              className="gap-1 h-8 px-2 sm:px-3 text-xs bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 hover:text-primary"
              title="Start an audio call"
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Call</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onVideoCall}
              disabled={isVideoCallActive}
              className="gap-1 h-8 px-2 sm:px-3 text-xs bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 hover:text-primary"
              title="Start a video call"
            >
              <Video className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Video</span>
            </Button>
            {/* Disappearing messages toggle */}
            <Button
              variant={disappearTimer ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                const timers = [null, 30, 60, 300];
                const currentIdx = timers.indexOf(disappearTimer ?? null);
                const next = timers[(currentIdx + 1) % timers.length];
                onSetDisappearTimer?.(next);
              }}
              className={cn(
                "gap-1 h-8 px-2 text-xs",
                disappearTimer && "bg-primary/15 text-primary border border-primary/30"
              )}
              title={disappearTimer ? `Messages disappear after ${disappearTimer}s` : "Enable disappearing messages"}
            >
              <Timer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{disappearTimer ? `${disappearTimer}s` : ""}</span>
            </Button>
            {onThemeChange && <ChatThemePicker onApply={onThemeChange} />}
            
            {/* Privacy Protection Dropdown Toggle */}
            <div className="relative">
              <Button
                variant={localPrivacyModeActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowPrivacyPopover(!showPrivacyPopover)}
                className={cn(
                  "gap-1 h-8 px-2 text-xs relative",
                  localPrivacyModeActive && "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25 hover:text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                )}
                title="Privacy & Screen Protection Settings"
              >
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Privacy</span>
              </Button>

              <AnimatePresence>
                {showPrivacyPopover && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setShowPrivacyPopover(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 glass-heavy flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-1.5 pb-2 border-b border-border/40">
                        <Shield className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Privacy Protection</h4>
                      </div>

                      {/* Row 1: Privacy Mode */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-foreground">Privacy Mode</span>
                          <span className="text-[9px] text-muted-foreground">Encrypt screen & block shots</span>
                        </div>
                        <Switch
                          checked={localPrivacyModeActive}
                          onCheckedChange={(c) => {
                            togglePrivacyMode(c);
                          }}
                        />
                      </div>

                      {/* Row 2: Share Violations (alerts) */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-foreground">Alert Partner</span>
                          <span className="text-[9px] text-muted-foreground">Notify peer on capture attempts</span>
                        </div>
                        <Switch
                          checked={settings.notifyAlerts}
                          onCheckedChange={(c) => updateSetting("notifyAlerts", c)}
                        />
                      </div>

                      {/* Row 3: Auto-Stop */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-foreground">Auto-Stop Chat</span>
                          <span className="text-[9px] text-muted-foreground">Disconnect immediately if captured</span>
                        </div>
                        <Switch
                          checked={settings.autoStopOnScreenshot}
                          onCheckedChange={(c) => updateSetting("autoStopOnScreenshot", c)}
                        />
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <ChatTimer isConnected={status === "connected"} onAutoDisconnect={onStop} />
          </>
        )}

        {/* Search */}
        {messages.length > 0 && (status === "connected" || status === "disconnected") && onSearchResult && (
          <ChatSearchBar messages={messages} onSearchResult={onSearchResult} />
        )}

        {/* Export buttons */}
        {messages.length > 0 && (status === "connected" || status === "disconnected") && (
          <>
            <Button variant="ghost" size="sm" onClick={handleCopyChat} className="gap-1 h-8 px-2 text-xs" title="Copy chat to clipboard">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownloadChat} className="gap-1 h-8 px-2 text-xs" title="Download chat as text">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </>
        )}

        {/* Removed Stop and Next from here, moved to top */}
        {status === "connected" && (
          <ReportBlockMenu onBlock={onBlock} />
        )}
        {(status === "idle" || (status === "disconnected" && !autoReconnectCountdown)) && (
          <Button
            variant="glow"
            size="sm"
            onClick={onStart}
            className="h-8 px-3 sm:px-4 text-xs sm:text-sm gap-1"
            title="Find a random stranger to chat with"
          >
            <Play className="h-3 w-3" />
            Start
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatStatusBar;
