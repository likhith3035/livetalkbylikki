import { forwardRef } from "react";
import { Shield, Moon, Sun } from "lucide-react";
import OnlineBadge from "@/components/OnlineBadge";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onlineCount: number;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ onlineCount }, ref) => {
  const { settings, updateSetting } = useSettings();

  return (
    <header ref={ref} className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 glass">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-base sm:text-lg font-bold text-foreground">Echo</span>
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
