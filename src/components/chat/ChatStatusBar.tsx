import { SkipForward, X, Tags, Video, Play, Download, Copy, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import ReportBlockMenu from "@/components/ReportBlockMenu";
import PrivateRoomDialog from "@/components/chat/PrivateRoomDialog";
import { cn } from "@/lib/utils";
import type { ChatStatus } from "@/hooks/use-chat";
import type { Message } from "@/hooks/use-chat";
import { exportChatAsText, copyToClipboard, downloadAsFile } from "@/lib/chat-export";
import { useToast } from "@/hooks/use-toast";

interface ChatStatusBarProps {
  status: ChatStatus;
  matchedInterests: string[];
  autoReconnectCountdown: number | null;
  searchElapsed: number;
  messages?: Message[];
  onToggleInterests: () => void;
  showInterests: boolean;
  onNext: () => void;
  onStop: () => void;
  onStart: () => void;
  onBlock: () => void;
  onVideoCall: () => void;
  isVideoCallActive: boolean;
  onCreateRoom: () => string;
  onJoinRoom: (code: string) => void;
  disappearTimer?: number | null;
  onSetDisappearTimer?: (t: number | null) => void;
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
  onVideoCall, isVideoCallActive, onCreateRoom, onJoinRoom,
}: ChatStatusBarProps) => {
  const statusInfo = statusMessages[status] || statusMessages.idle;
  const { toast } = useToast();

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
      "flex items-center justify-between border-b border-border/50 px-3 sm:px-5 py-2.5 gap-2 glass transition-all duration-300",
      status === "searching" && "search-shimmer"
    )}>
      {/* Status indicator */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full shrink-0 transition-colors duration-300",
            status === "connected" && "bg-online shadow-[0_0_8px_hsl(var(--online)/0.5)]",
            status === "searching" && "bg-warning animate-pulse shadow-[0_0_8px_hsl(var(--warning)/0.5)]",
            status !== "connected" && status !== "searching" && "bg-muted-foreground"
          )}
        />
        <div className="min-w-0 flex-1">
          <span className="text-xs sm:text-sm text-foreground truncate font-medium block">
            {status === "idle" && statusInfo.text}
            {status === "searching" && `Searching${searchElapsed > 0 ? ` (${searchElapsed}s)` : "..."}`}
            {status === "connected" && statusInfo.text}
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
      <div className="flex gap-1 sm:gap-1.5 items-center shrink-0">
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

        {status === "connected" && (
          <Button
            variant="default"
            size="sm"
            onClick={onVideoCall}
            disabled={isVideoCallActive}
            className="gap-1 h-8 px-2 sm:px-3 text-xs bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 hover:text-primary"
            title="Start a video call with this person"
          >
            <Video className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Video</span>
          </Button>
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

        {(status === "connected" || status === "disconnected") && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onNext}
            className="gap-1 h-8 px-2 sm:px-3 text-xs"
            title="Skip to a new stranger"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Next
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
            Stop
          </Button>
        )}
        {status === "connected" && (
          <ReportBlockMenu onBlock={onBlock} />
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
            Cancel
          </Button>
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
