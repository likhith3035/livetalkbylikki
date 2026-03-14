import { forwardRef } from "react";
import { Shield, Moon, Sun, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import OnlineBadge from "@/components/OnlineBadge";
import { useSettings } from "@/contexts/SettingsContext";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onlineCount: number;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ onlineCount }, ref) => {
  const { settings, updateSetting } = useSettings();
  const { pathname } = useLocation();

  return (
    <header ref={ref} className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 glass">
      <div className="flex items-center gap-3">
        {pathname === "/profile" && (
          <Link 
            to="/chat" 
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all font-semibold text-sm mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Back to Chat</span>
          </Link>
        )}
        <Link to="/" className="flex items-center gap-3 group">
          <BrandLogo className="h-9 w-9 sm:h-10 sm:w-10 drop-shadow-md group-hover:scale-105 transition-transform" aria-label="LiveTalk Home" />
          <span className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">LiveTalk</span>
        </Link>
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
