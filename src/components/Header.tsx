import { forwardRef, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import OnlineBadge from "@/components/OnlineBadge";
import { useSettings } from "@/contexts/SettingsContext";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onlineCount: number;
  strangerName?: string;
  strangerAvatar?: string;
  strangerMood?: string;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ onlineCount, strangerName, strangerAvatar, strangerMood }, ref) => {
  const { settings, updateSetting } = useSettings();
  const navigate = useNavigate();
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

        {/* Stranger name (chat page) */}
        {strangerName && (
          <div className="flex items-center gap-2 ml-1 border-l border-border/50 pl-3 h-8">
            {strangerAvatar && (
              strangerAvatar.startsWith("data:image/") ? (
                <img src={strangerAvatar} alt="avatar" className="h-6 w-6 rounded-full object-cover shrink-0 border border-primary/30" />
              ) : (
                <span className="text-sm shrink-0">{strangerAvatar}</span>
              )
            )}
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[8px] sm:text-[9px] font-black uppercase text-primary italic tracking-widest leading-none flex items-center gap-1">
                Stranger
                {strangerMood && (
                  <span className="normal-case text-[8px] font-semibold text-muted-foreground tracking-normal">{strangerMood}</span>
                )}
              </span>
              <span className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[80px] sm:max-w-[120px] leading-tight">
                {strangerName}
              </span>
            </div>
          </div>
        )}
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
