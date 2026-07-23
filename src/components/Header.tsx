import { forwardRef } from "react";
import { Moon, Sun, ChevronLeft, Video, Phone, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OnlineBadge from "@/components/OnlineBadge";
import { useSettings } from "@/contexts/SettingsContext";
import { BrandLogo } from "@/components/BrandLogo";
import ChatMoodMeter from "@/components/chat/ChatMoodMeter";
import { GamificationWidget } from "@/components/GamificationWidget";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onlineCount: number;
  strangerName?: string;
  strangerAvatar?: string;
  strangerMood?: string;
  messages?: { text: string; sender: string }[];
  onBack?: () => void;
  onVideoCall?: () => void;
  onAudioCall?: () => void;
  onProfileTap?: () => void;
  onTranslateToggle?: () => void;
  targetLang?: string;
  toolsMenu?: React.ReactNode;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ 
  onlineCount, strangerName, strangerAvatar, strangerMood, messages, onBack, onVideoCall, onAudioCall, onProfileTap, onTranslateToggle, targetLang, toolsMenu
}, ref) => {
  const { settings, updateSetting } = useSettings();
  const navigate = useNavigate();

  const isConnectedHeader = !!strangerName;

  if (isConnectedHeader) {
    return (
      <header
        ref={ref}
        className="flex items-center justify-between px-2.5 sm:px-4 py-1.5 sm:py-3 bg-background border-b border-border/30 sticky top-0 z-40 lg:hidden"
        style={{ willChange: "transform" }}
      >
        {/* Left: Circular back button */}
        <button
          onClick={onBack ? onBack : () => navigate("/")}
          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-border/75 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm shrink-0"
          aria-label="Exit chat"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Center: Stranger Avatar, Name and Status — tappable */}
        <button
          onClick={onProfileTap}
          className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 mx-1.5 sm:mx-2 active:scale-[0.98] transition-transform text-left"
          aria-label="View profile"
        >
          {strangerAvatar && (
            strangerAvatar.startsWith("data:image/") ? (
              <img
                src={strangerAvatar}
                alt="avatar"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover shrink-0 border border-primary/20 shadow-sm"
              />
            ) : (
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0">
                {strangerAvatar}
              </div>
            )
          )}
          <div className="flex flex-col min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-foreground truncate leading-snug">
              {strangerName || "Stranger"}
            </h1>
            <p className="text-[8px] sm:text-[9px] text-emerald-500 font-bold flex items-center gap-1 leading-none mt-0.5">
              <span className="h-1 w-1 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-[90px]">{strangerMood || "Online"}</span>
            </p>
          </div>
          {messages && messages.length >= 3 && (
            <div className="hidden sm:block shrink-0 ml-1">
              <ChatMoodMeter messages={messages} />
            </div>
          )}
        </button>

        {/* Right: Circular call buttons side-by-side */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {onAudioCall && (
            <button
              onClick={onAudioCall}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-border/75 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm shrink-0"
              aria-label="Start audio call"
            >
              <Phone className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-primary" />
            </button>
          )}
          {onVideoCall && (
            <button
              onClick={onVideoCall}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-border/75 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm shrink-0"
              aria-label="Start video call"
            >
              <Video className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-primary" />
            </button>
          )}
          {onTranslateToggle && (
            <button
              onClick={onTranslateToggle}
              className={cn(
                "h-8 w-8 sm:h-10 sm:w-10 rounded-full border flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0",
                targetLang && targetLang !== "off"
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : "border-border/75 bg-card text-foreground hover:bg-secondary"
              )}
              aria-label="Toggle Auto Translate"
              title="Auto-Translate Stranger Messages"
            >
              <Globe className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
            </button>
          )}
          {toolsMenu}
        </div>
      </header>
    );
  }

  return (
    <header ref={ref} className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 glass sticky top-0 z-40 lg:hidden" style={{ willChange: "transform", contain: "layout style" }}>
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
          <BrandLogo
            className="h-8 w-8 sm:h-9 sm:w-9 drop-shadow-md hover:scale-105 transition-transform"
            aria-label="LiveTalk Home"
          />
          <span className="font-display text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors select-none">
            LiveTalk
          </span>
        </div>
      </div>

      {/* Right: Theme + Gamification + Online */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <GamificationWidget />
        <OnlineBadge count={onlineCount} />
      </div>
    </header>
  );
});

Header.displayName = "Header";
export default Header;
