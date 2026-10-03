import { useState, useEffect } from "react";
import {
  Home, MessageSquare, User, Settings, Info, Moon, Sun, Shield, ShieldAlert,
  Smartphone, Bot, Wand2, PanelLeftClose, PanelLeftOpen, Share2, Gamepad2, Code2,
  FileText, QrCode, ChevronRight
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSettings } from "@/contexts/SettingsContext";
import { BrandLogo } from "@/components/BrandLogo";
import { Switch } from "@/components/ui/switch";

interface NavItem {
  icon: any;
  path: string;
  label: string;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "CONNECT",
    items: [
      { icon: Home, path: "/", label: "Home" },
      { icon: MessageSquare, path: "/chat", label: "Chat" },
    ],
  },
  {
    title: "EXPLORE",
    items: [
      { icon: Gamepad2, path: "/games", label: "Arcade Games", badge: "11", badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
      { icon: Code2, path: "/code", label: "Code Studio" },
      { icon: Bot, path: "/ai-chat", label: "AI Wingman" },
      { icon: Wand2, path: "/prompt-analyzer", label: "Prompt Analyzer" },
      { icon: Share2, path: "/file-sharing", label: "File Sharing" },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { icon: User, path: "/profile", label: "Profile" },
      { icon: Settings, path: "/settings", label: "Settings" },
      { icon: Shield, path: "/safety", label: "Safety" },
      { icon: FileText, path: "/guidelines", label: "Guidelines" },
      { icon: Info, path: "/info", label: "About" },
    ],
  },
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
                IncogTalk
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
            <Link to="/" title="IncogTalk Home">
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
      <div className={cn("transition-all duration-300", isCollapsed ? "px-2 py-2 text-center" : "px-3.5 pt-3 pb-1")}>
        {!isCollapsed ? (
          <Link
            to="/chat"
            className="flex items-center justify-between w-full px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 dark:bg-[#13141a]/90 dark:hover:bg-[#181a22] dark:border-white/8 dark:hover:border-emerald-500/40 transition-all text-xs group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              </span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                {onlineCount} online now
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-600/70 dark:text-muted-foreground/60 group-hover:translate-x-0.5 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-all" />
          </Link>
        ) : (
          <Link
            to="/chat"
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer"
            title={`${onlineCount} users online`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[9px] font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{onlineCount}</span>
          </Link>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-2 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navSections.map((section, sIdx) => (
          <div key={section.title || sIdx} className="flex flex-col gap-0.5">
            {!isCollapsed && section.title && (
              <div className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/60 select-none">
                {section.title}
              </div>
            )}
            {isCollapsed && sIdx > 0 && <div className="my-1.5 mx-auto w-6 h-px bg-border/40" />}

            {section.items.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center rounded-xl transition-all duration-200 border text-sm font-medium",
                    isCollapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2",
                    isActive
                      ? "border-amber-500/60 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-950 dark:text-white font-bold shadow-sm"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110",
                      isActive ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "text-[10px] font-black px-1.5 py-0.5 rounded-md border tracking-wider",
                            item.badgeColor
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer & Theme Controls */}
      <div className={cn("border-t border-border/50 transition-all duration-300", isCollapsed ? "p-2 space-y-2 flex flex-col items-center" : "px-3.5 py-3 space-y-2.5")}>
        {/* Dark Mode with Toggle Switch */}
        <div
          className={cn(
            "flex items-center justify-between rounded-xl text-sm font-medium transition-all duration-200 border border-transparent text-muted-foreground hover:bg-secondary/40 px-3 py-1.5",
            isCollapsed && "justify-center px-1"
          )}
        >
          <div className="flex items-center gap-3">
            <Moon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
            {!isCollapsed && <span className="text-xs font-medium text-foreground/90">Dark Mode</span>}
          </div>
          {!isCollapsed && (
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(checked) => updateSetting("darkMode", checked)}
              className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-400 scale-90 cursor-pointer"
            />
          )}
        </div>

        {/* Join via Code */}
        <Link
          to="/handoff"
          title="Join via Code"
          className={cn(
            "flex items-center rounded-xl text-xs font-medium transition-all duration-200 border border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40",
            isCollapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2",
            pathname === "/handoff" && "border-amber-500/40 bg-amber-500/10 text-amber-500 dark:text-amber-400"
          )}
        >
          <QrCode className="h-[18px] w-[18px] shrink-0" />
          {!isCollapsed && <span>Join via Code</span>}
        </Link>

        {/* Founder Profile Card */}
        {!isCollapsed ? (
          <a
            href="https://devlikhith.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 rounded-2xl bg-secondary/30 hover:bg-secondary/60 border border-border/40 hover:border-amber-500/30 transition-all group cursor-pointer text-left shadow-sm"
            title="Developed with ❤️ by Likhith Kami (Likki)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-black font-black text-xs shrink-0 shadow-sm">
                L
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                  Likhith Kami
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  Built with ❤️ for everyone
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-amber-500 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </a>
        ) : (
          <a
            href="https://devlikhith.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-xs shadow-sm mx-auto cursor-pointer"
            title="Likhith Kami — Built with ❤️ for everyone"
          >
            L
          </a>
        )}
      </div>
    </aside>
  );
};

export default DesktopSidebar;
