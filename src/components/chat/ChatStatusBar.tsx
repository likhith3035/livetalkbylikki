import { SkipForward, X, Tags, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportBlockMenu from "@/components/ReportBlockMenu";
import { cn } from "@/lib/utils";
import type { ChatStatus } from "@/hooks/use-chat";

interface ChatStatusBarProps {
  status: ChatStatus;
  matchedInterests: string[];
  autoReconnectCountdown: number | null;
  searchElapsed: number;
  onToggleInterests: () => void;
  showInterests: boolean;
  onNext: () => void;
  onStop: () => void;
  onStart: () => void;
  onBlock: () => void;
  onVideoCall: () => void;
  isVideoCallActive: boolean;
}

const ChatStatusBar = ({
  status, matchedInterests, autoReconnectCountdown, searchElapsed,
  onToggleInterests, showInterests, onNext, onStop, onStart, onBlock,
  onVideoCall, isVideoCallActive,
}: ChatStatusBarProps) => {
  return (
    <div className="flex items-center justify-between border-b border-border px-3 sm:px-5 py-2.5 gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className={cn(
            "h-2 w-2 rounded-full shrink-0",
            status === "connected" ? "bg-online" : status === "searching" ? "bg-warning animate-pulse" : "bg-muted-foreground"
          )}
        />
        <span className="text-xs sm:text-sm text-muted-foreground truncate">
          {status === "idle" && "Ready to chat"}
          {status === "searching" && `Searching${searchElapsed > 0 ? ` (${searchElapsed}s)` : "..."}`}
          {status === "connected" && "Connected"}
          {status === "disconnected" && (
            autoReconnectCountdown
              ? `Reconnecting in ${autoReconnectCountdown}s...`
              : "Disconnected"
          )}
        </span>
        {matchedInterests.length > 0 && status === "connected" && (
          <div className="hidden sm:flex gap-1 ml-1">
            {matchedInterests.map((i) => (
              <span key={i} className="rounded-full bg-primary/20 border border-primary/30 px-2 py-0.5 text-[10px] text-primary">
                {i}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1 sm:gap-2 items-center shrink-0 flex-wrap justify-end">
        {status === "idle" && (
          <Button variant="ghost" size="sm" onClick={onToggleInterests} className="gap-1 h-8 px-2 sm:px-3">
            <Tags className="h-3.5 w-3.5" />
          </Button>
        )}

        {status === "connected" && (
          <Button
            variant="default"
            size="sm"
            onClick={onVideoCall}
            disabled={isVideoCallActive}
            className="gap-1 h-8 px-2 sm:px-3 text-xs bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 hover:text-primary"
          >
            <Video className="h-3.5 w-3.5" />
          </Button>
        )}

        {(status === "connected" || status === "disconnected") && (
          <Button variant="secondary" size="sm" onClick={onNext} className="gap-1 h-8 px-2 sm:px-3 text-xs">
            <SkipForward className="h-3.5 w-3.5" />
            Next
          </Button>
        )}
        {status === "connected" && (
          <Button variant="danger" size="sm" onClick={onStop} className="gap-1 h-8 px-2 sm:px-3 text-xs">
            <X className="h-3.5 w-3.5" />
            Stop
          </Button>
        )}
        {status === "connected" && (
          <ReportBlockMenu onBlock={onBlock} />
        )}
        {status === "disconnected" && autoReconnectCountdown && (
          <Button variant="ghost" size="sm" onClick={onStop} className="gap-1 h-8 px-2 sm:px-3 text-xs text-muted-foreground">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        {(status === "idle" || (status === "disconnected" && !autoReconnectCountdown)) && (
          <Button variant="glow" size="sm" onClick={onStart} className="h-8 px-3 sm:px-4 text-xs sm:text-sm">
            Start
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatStatusBar;
