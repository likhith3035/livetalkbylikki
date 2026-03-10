import { Home, MessageSquare, User, Settings, Info, Moon, Sun, Users } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import OnlineBadge from "@/components/OnlineBadge";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSettings } from "@/contexts/SettingsContext";
import { Logo } from "@/components/Logo";

const navItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: MessageSquare, path: "/chat", label: "Chat" },
  { icon: Users, path: "/group", label: "Group" },
  { icon: User, path: "/profile", label: "Profile" },
  { icon: Settings, path: "/settings", label: "Settings" },
  { icon: Info, path: "/info", label: "About" },
];

const DesktopSidebar = () => {
  const { pathname } = useLocation();
  const onlineCount = useOnlineCount();
  const { settings, updateSetting } = useSettings();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[220px] flex-col border-r border-border bg-card/50 backdrop-blur-xl z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border/50">
        <Logo className="h-10 w-10 drop-shadow-md" />
        <span className="font-display text-lg font-bold text-foreground">LiveTalk</span>
      </div>

      {/* Online count */}
      <div className="px-4 pt-4 pb-2">
        <OnlineBadge count={onlineCount} />
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle + footer */}
      <div className="px-4 py-4 border-t border-border/50 space-y-3">
        <button
          onClick={() => updateSetting("darkMode", !settings.darkMode)}
          className={cn(
            "flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          {settings.darkMode ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          {settings.darkMode ? "Dark Mode" : "Light Mode"}
        </button>
        <p className="text-[10px] text-muted-foreground/50 text-center">© 2026 LiveTalk</p>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
