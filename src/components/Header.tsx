import { forwardRef } from "react";
import { Moon, Sun, ChevronLeft, Video, Phone, Globe, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OnlineBadge from "@/components/OnlineBadge";
import ApkDownloadButton from "@/components/ApkDownloadButton";
import { useSettings } from "@/contexts/SettingsContext";
import { BrandLogo } from "@/components/BrandLogo";
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
        {/* Left: Circular back & home buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onBack ? onBack : () => navigate("/")}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-border/75 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm shrink-0"
            aria-label="Exit chat"
            title="Back"
          >
            <ChevronLeft className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </button>
          <button
            onClick={() => navigate("/")}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-all active:scale-95 shadow-sm shrink-0"
            aria-label="Go to Home"
            title="Go to Home"
          >
            <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>

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
              <span className="text-base sm:text-lg leading-none shrink-0">{strangerAvatar}</span>
            )
          )}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                {strangerName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] text-muted-foreground font-semibold truncate">Connected</span>
              {strangerMood && (
                <span className="text-[10px] text-primary/80 font-medium truncate">
                  • {strangerMood}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {onAudioCall && (
            <button
              onClick={onAudioCall}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-border/75 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm shrink-0"
              aria-label="Start Voice Call"
              title="Voice Call (Talk with Microphone)"
            >
              <Phone className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-primary" />
            </button>
          )}
          {onVideoCall && (
            <button
              onClick={onVideoCall}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-border/75 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm shrink-0"
              aria-label="Start Video Call"
              title="Video Call (Face to Face Camera)"
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
              aria-label="Toggle Language Auto-Translate"
              title="Language Translator (Translate messages automatically)"
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
    <header ref={ref} className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 bg-background border-b border-border/40 sticky top-0 z-50 lg:hidden" style={{ willChange: "transform", contain: "layout style" }}>
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

      {/* Right: Theme + Online */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Theme toggle */}
        <button
          onClick={() => updateSetting("darkMode", !settings.darkMode)}
          className={cn(
            "relative flex h-7 w-12 sm:h-8 sm:w-14 items-center rounded-full p-1 transition-colors duration-300 shrink-0",
            settings.darkMode
              ? "bg-primary/20 border border-primary/30"
              : "bg-secondary border border-border"
          )}
          aria-label="Toggle theme"
        >
          <div
            className={cn(
              "flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-card shadow-md transition-transform duration-300",
              settings.darkMode ? "translate-x-5 sm:translate-x-6" : "translate-x-0"
            )}
          >
            {settings.darkMode
              ? <Moon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
              : <Sun className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-warning" />}
          </div>
        </button>

        <OnlineBadge count={onlineCount} />
      </div>
    </header>
  );
});

Header.displayName = "Header";
export default Header;
