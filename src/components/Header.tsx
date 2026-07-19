import { forwardRef } from "react";
import { Moon, Sun, ChevronLeft, Video, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OnlineBadge from "@/components/OnlineBadge";
import { useSettings } from "@/contexts/SettingsContext";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onlineCount: number;
  strangerName?: string;
  strangerAvatar?: string;
  strangerMood?: string;
  onBack?: () => void;
  onVideoCall?: () => void;
  onAudioCall?: () => void;
  toolsMenu?: React.ReactNode;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ 
  onlineCount, strangerName, strangerAvatar, strangerMood, onBack, onVideoCall, onAudioCall, toolsMenu
}, ref) => {
  const { settings, updateSetting } = useSettings();
  const navigate = useNavigate();

  const isConnectedHeader = !!strangerName;

  if (isConnectedHeader) {
    return (
      <header
        ref={ref}
        className="flex items-center justify-between px-4 py-3 bg-background border-b border-border/30 sticky top-0 z-40 lg:hidden"
        style={{ willChange: "transform" }}
      >
        {/* Left: Circular back button */}
        <button
          onClick={onBack ? onBack : () => navigate("/")}
          className="h-10 w-10 rounded-full border border-border/75 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm"
          aria-label="Exit chat"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Center: Stranger Avatar, Name and Status */}
        <div className="flex items-center gap-2 flex-1 min-w-0 mx-2">
          {strangerAvatar && (
            strangerAvatar.startsWith("data:image/") ? (
              <img
                src={strangerAvatar}
                alt="avatar"
                className="h-8 w-8 rounded-full object-cover shrink-0 border border-primary/20 shadow-sm"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold shrink-0">
                {strangerAvatar}
              </div>
            )
          )}
          <div className="flex flex-col min-w-0 text-left">
            <h1 className="text-sm font-bold text-foreground truncate leading-snug">
              {strangerName || "Stranger"}
            </h1>
            <p className="text-[9px] text-emerald-500 font-bold flex items-center gap-1 leading-none mt-0.5">
              <span className="h-1 w-1 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
              <span className="truncate max-w-[90px]">{strangerMood || "Online"}</span>
            </p>
          </div>
        </div>

        {/* Right: Circular call buttons side-by-side */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onAudioCall && (
            <button
              onClick={onAudioCall}
              className="h-10 w-10 rounded-full border border-border/75 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm"
              aria-label="Start audio call"
            >
              <Phone className="h-4.5 w-4.5 text-primary" />
            </button>
          )}
          {onVideoCall && (
            <button
              onClick={onVideoCall}
              className="h-10 w-10 rounded-full border border-border/75 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm"
              aria-label="Start video call"
            >
              <Video className="h-4.5 w-4.5 text-primary" />
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
