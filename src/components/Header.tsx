import { forwardRef } from "react";
import { Shield, Moon, Sun } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import OnlineBadge from "@/components/OnlineBadge";
import { useSettings } from "@/contexts/SettingsContext";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onlineCount: number;
  strangerName?: string;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ onlineCount, strangerName }, ref) => {
  const { settings, updateSetting } = useSettings();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = (e: React.MouseEvent | React.TouchEvent) => {
    setLogoClicks(prev => {
      const newVal = prev + 1;
      if (newVal >= 5) {
        const password = window.prompt("Enter Admin Password:");
        if (password === "88854") {
          navigate("/admin/dashboard");
        } else {
          alert("You're not the admin");
        }
        return 0;
      }
      return newVal;
    });

    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      setLogoClicks(0);
    }, 2000); 
  };



  return (
    <header ref={ref} className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 glass">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleLogoClick}>
          <BrandLogo className="h-9 w-9 sm:h-10 sm:w-10 drop-shadow-md hover:scale-105 transition-transform" aria-label="LiveTalk Home" />
          <span className="font-display text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors select-none">LiveTalk</span>
        </div>
        {strangerName && (
          <div className="flex flex-col ml-1 border-l border-border/50 pl-4 h-8 justify-center">
            <span className="text-[10px] sm:text-xs font-black uppercase text-primary italic tracking-widest leading-none">Stranger</span>
            <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[100px] sm:max-w-[150px] leading-tight">{strangerName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => updateSetting("darkMode", !settings.darkMode)}
          className={cn(
            "relative flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-300",
            settings.darkMode
              ? "bg-primary/20 border border-primary/30"
              : "bg-secondary border border-border"
          )}
          aria-label="Toggle theme"
        >
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full bg-card shadow-md transition-transform duration-300",
              settings.darkMode ? "translate-x-6" : "translate-x-0"
            )}
          >
            {settings.darkMode ? (
              <Moon className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-warning" />
            )}
          </div>
        </button>
        <OnlineBadge count={onlineCount} />
      </div>
    </header>
  );
});

Header.displayName = "Header";

export default Header;
