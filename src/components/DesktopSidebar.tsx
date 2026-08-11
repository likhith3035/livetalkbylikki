import { useState, useEffect } from "react";
import {
  Home, MessageSquare, User, Settings, Info, Moon, Sun, Shield, ShieldAlert, Smartphone, Bot, Wand2,
  PanelLeftClose, PanelLeftOpen, Share2
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import OnlineBadge from "@/components/OnlineBadge";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSettings } from "@/contexts/SettingsContext";
import { BrandLogo } from "@/components/BrandLogo";

const navItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: MessageSquare, path: "/chat", label: "Chat" },
  { icon: Bot, path: "/ai-chat", label: "AI Chat" },
  { icon: Wand2, path: "/prompt-analyzer", label: "Prompt Analyzer" },
  { icon: Share2, path: "/file-sharing", label: "File Sharing" },
  { icon: Shield, path: "/safety", label: "Safety" },
  { icon: User, path: "/profile", label: "Profile" },
  { icon: Settings, path: "/settings", label: "Settings" },
  { icon: ShieldAlert, path: "/guidelines", label: "Guidelines" },
  { icon: Info, path: "/info", label: "About" },
];

const DesktopSidebar = () => {
  const { pathname } = useLocation();
  const onlineCount = useOnlineCount();
  const { settings, updateSetting } = useSettings();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("global_sidebar_collapsed");
    return saved !== null ? JSON.parse(saved) : false;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("global_sidebar_collapsed", JSON.stringify(next));
      return next;
    });
  };

  // Global Keyboard Shortcut: Ctrl+\ or Cmd+\ to collapse/expand
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        toggleCollapse();
      }
    };

    const handleCustomEvent = () => toggleCollapse();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle_global_sidebar", handleCustomEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle_global_sidebar", handleCustomEvent);
    };
  }, []);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col shrink-0 z-40 sticky top-0 self-start h-svh border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 select-none overflow-hidden",
        isCollapsed ? "w-[68px]" : "w-[220px]"
      )}
      style={{ willChange: "width" }}
    >
      {/* Logo & Toggle Header */}
      <div
        className={cn(
          "flex items-center border-b border-border/50 transition-all duration-300",
          isCollapsed ? "justify-center p-3" : "justify-between px-4 py-4"
        )}
      >
        {!isCollapsed ? (
          <>
            <Link to="/" className="flex items-center gap-3 group min-w-0">
              <BrandLogo className="h-9 w-9 drop-shadow-md group-hover:scale-105 transition-transform shrink-0" />
              <span className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                LiveTalk
              </span>
            </Link>

            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50 transition-all active:scale-95 shrink-0"
              title="Collapse sidebar (Ctrl + \)"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link to="/" title="LiveTalk Home">
              <BrandLogo className="h-8 w-8 drop-shadow-md hover:scale-105 transition-transform" />
            </Link>
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 transition-all active:scale-95 shadow-sm"
              title="Expand sidebar (Ctrl + \)"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Online Count */}
      <div className={cn("transition-all duration-300", isCollapsed ? "px-2 py-2.5 text-center" : "px-4 pt-4 pb-2")}>
        {!isCollapsed ? (
          <OnlineBadge count={onlineCount} />
        ) : (
          <div
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer"
            title={`${onlineCount} users online`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-bold font-mono text-emerald-400 mt-0.5">{onlineCount}</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1 px-2.5 py-3 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path!}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-xl transition-all duration-200 border border-transparent font-medium text-sm",
                isCollapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-primary/15 text-primary shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer & Theme Controls */}
      <div className={cn("border-t border-border/50 transition-all duration-300", isCollapsed ? "p-2 space-y-2 flex flex-col items-center" : "px-4 py-4 space-y-3")}>
        <button
          onClick={() => updateSetting("darkMode", !settings.darkMode)}
          title={settings.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className={cn(
            "flex items-center rounded-xl text-sm font-medium transition-all duration-200 border border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60",
            isCollapsed ? "justify-center h-10 w-10" : "w-full gap-3 px-3 py-2.5"
          )}
        >
          {settings.darkMode ? <Moon className="h-[18px] w-[18px] shrink-0 text-indigo-400" /> : <Sun className="h-[18px] w-[18px] shrink-0 text-amber-500" />}
          {!isCollapsed && <span>{settings.darkMode ? "Dark Mode" : "Light Mode"}</span>}
        </button>

        {/* Join via Code */}
        <Link
          to="/handoff"
          title="Join via Code (Handoff)"
          className={cn(
            "flex items-center rounded-xl text-sm font-medium transition-all duration-200 border border-transparent",
            isCollapsed ? "justify-center h-10 w-10" : "gap-3 px-3 py-2.5",
            pathname === "/handoff"
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
              : "text-muted-foreground hover:text-amber-600 hover:bg-amber-500/8"
          )}
        >
          <Smartphone className="h-[18px] w-[18px] shrink-0" />
          {!isCollapsed && <span>Join via Code</span>}
        </Link>

        {!isCollapsed && (
          <div className="flex flex-col items-center gap-1 text-[10px] pt-1">
            <a
              href="https://devlikhith.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/70 hover:text-primary transition-colors underline underline-offset-2 font-medium"
              title="Likhith Kami's Portfolio & Websites"
            >
              Kami Likhith Portfolio
            </a>
            <p className="text-muted-foreground/40">© 2026 LiveTalk</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default DesktopSidebar;
