import { useState, useEffect, forwardRef } from "react";
import {
  Moon, Sun, ChevronLeft, Video, Phone, Globe, Home, Megaphone, Menu,
  MessageSquare, User, Settings as SettingsIcon, Info, Shield, ShieldAlert,
  Bot, Wand2, Share2, Smartphone, Sparkles, Gamepad2
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import OnlineBadge from "@/components/OnlineBadge";
import ApkDownloadButton from "@/components/ApkDownloadButton";
import { useSettings } from "@/contexts/SettingsContext";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { ref as firebaseRef, onValue } from "firebase/database";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose
} from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChromeDinoGame } from "@/components/games/ChromeDinoGame";

const drawerNavItems = [
  { icon: Home,          path: "/",                 label: "Home Page",       accent: "#10b981" },
  { icon: MessageSquare, path: "/chat",              label: "Start Chat",      accent: "hsl(var(--primary))" },
  { icon: Gamepad2,      path: "/games",             label: "Arcade Games",    accent: "#f59e0b" },
  { icon: Bot,           path: "/ai-chat",           label: "AI Wingman",      accent: "#ec4899" },
  { icon: Wand2,         path: "/prompt-analyzer",   label: "Prompt Analyzer", accent: "#a855f7" },
  { icon: Share2,        path: "/file-sharing",      label: "File Sharing",    accent: "#3b82f6" },
  { icon: Shield,        path: "/safety",            label: "Safety Center",   accent: "#14b8a6" },
  { icon: User,          path: "/profile",           label: "My Profile",      accent: "#8b5cf6" },
  { icon: SettingsIcon,  path: "/settings",          label: "App Settings",    accent: "#64748b" },
  { icon: ShieldAlert,   path: "/guidelines",        label: "Community Rules", accent: "#f59e0b" },
  { icon: Info,          path: "/info",              label: "Help & FAQ",      accent: "#0ea5e9" },
];

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
  const location = useLocation();
  const [announcement, setAnnouncement] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showMiniGame, setShowMiniGame] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("echo_global_announcement") || "";
    if (saved) setAnnouncement(saved);

    const handleCustom = (e: any) => {
      setAnnouncement(e.detail || localStorage.getItem("echo_global_announcement") || "");
    };
    const handleStorage = () => {
      setAnnouncement(localStorage.getItem("echo_global_announcement") || "");
    };

    window.addEventListener("echo_announcement_change", handleCustom);
    window.addEventListener("storage", handleStorage);

    let unsub: () => void = () => {};
    if (db) {
      const annRef = firebaseRef(db, "settings/global_announcement");
      unsub = onValue(annRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          setAnnouncement(val);
          localStorage.setItem("echo_global_announcement", val);
        }
      }, () => {});
    }

    return () => {
      window.removeEventListener("echo_announcement_change", handleCustom);
      window.removeEventListener("storage", handleStorage);
      unsub();
    };
  }, []);

  const isConnectedHeader = !!strangerName;

  if (isConnectedHeader) {
    return (
      <header
        ref={ref}
        className="flex items-center justify-between px-2.5 sm:px-4 py-1.5 sm:py-3 bg-background border-b border-border/30 sticky top-0 z-40 lg:hidden"
        style={{ willChange: "transform" }}
      >
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onBack ? onBack : () => navigate("/")}
            className="h-10 w-10 rounded-full border border-border/75 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm shrink-0 min-h-[40px] min-w-[40px]"
            aria-label="Exit chat"
            title="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate("/")}
            className="h-10 w-10 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-all active:scale-95 shadow-sm shrink-0 min-h-[40px] min-w-[40px]"
            aria-label="Go to Home"
            title="Go to Home"
          >
            <Home className="h-4 w-4" />
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
    <>
      {announcement && (
        <div className="w-full bg-gradient-to-r from-purple-600 via-primary to-indigo-600 text-white text-[11px] font-bold py-1 px-3 flex items-center justify-center gap-2 shadow-md relative z-50 overflow-hidden">
          <Megaphone className="h-3.5 w-3.5 animate-bounce shrink-0 text-yellow-300" />
          <span className="truncate">{announcement}</span>
        </div>
      )}
      <header ref={ref} className="flex items-center justify-between px-2.5 sm:px-5 py-2 sm:py-3 glass sticky top-0 z-40 lg:hidden safe-area-top" style={{ willChange: "transform", contain: "layout style" }}>
      {/* Left: Hamburger Drawer + Optional Back + Logo */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl border border-border/80 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm shrink-0"
            aria-label="Go Back"
            title="Back"
          >
            <ChevronLeft className="h-4.5 w-4.5 text-foreground" />
          </button>
        )}

        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl border border-border/80 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm shrink-0"
              aria-label="Open Navigation Menu"
              title="Menu"
            >
              <Menu className="h-4.5 w-4.5 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-xs p-4 sm:p-5 bg-card/95 backdrop-blur-2xl border-r border-border/50 flex flex-col justify-between z-50 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-[max(env(safe-area-inset-bottom,0px),1rem)]">
            <div className="flex flex-col flex-1 min-h-0 space-y-4">
              <SheetHeader className="text-left pb-3 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setDrawerOpen(false); navigate("/"); }}>
                  <BrandLogo className="h-8 w-8 drop-shadow-md" aria-label="IncogTalk" />
                  <div>
                    <SheetTitle className="text-base font-display font-bold text-foreground">
                      IncogTalk
                    </SheetTitle>
                    <p className="text-[10px] text-muted-foreground font-mono">Speak Freely. Stay Incognito.</p>
                  </div>
                </div>
              </SheetHeader>

              {/* Navigation Items */}
              <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0 pr-1 touch-scroll">
                {drawerNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setDrawerOpen(false);
                        navigate(item.path);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl w-full text-left transition-all active:scale-95",
                        isActive
                          ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
                          : "text-foreground hover:bg-secondary/80 font-medium"
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                          isActive ? "bg-white/20" : "bg-secondary"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-foreground")} />
                      </div>
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}

                <div className="my-2 h-px bg-border/40" />

                {/* Handoff Utility */}
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate("/handoff");
                  }}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl w-full text-left transition-all active:scale-95 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs"
                >
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/15">
                    <Smartphone className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Phone Transfer</p>
                    <p className="text-[10px] text-muted-foreground">Transfer chat to phone</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Footer inside Drawer */}
            <div className="pt-4 border-t border-border/40 text-center space-y-2">
              <ApkDownloadButton className="w-full h-9 text-xs" />
              <p className="text-[10px] text-muted-foreground">Speak Freely. Stay Incognito.</p>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
          <BrandLogo
            className="h-8 w-8 sm:h-9 sm:w-9 drop-shadow-md hover:scale-105 transition-transform"
            aria-label="IncogTalk Home"
          />
          <span className="font-display text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors select-none">
            IncogTalk
          </span>
        </div>
      </div>

      {/* Right: Dino Mini-Game + Theme + Online */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Quick Minimal Dino Runner Launch Button */}
        <button
          type="button"
          onClick={() => setShowMiniGame(true)}
          className="h-7 sm:h-8 px-1.5 sm:px-2.5 rounded-full bg-secondary/80 hover:bg-secondary border border-border/60 text-foreground font-medium text-xs flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0"
          title="Play Dino Runner Mini-Game"
        >
          <span className="text-sm">🦖</span>
          <span className="hidden sm:inline text-[11px] font-semibold">Dino</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => updateSetting("darkMode", !settings.darkMode)}
          className={cn(
            "relative flex h-7 w-11 sm:h-8 sm:w-14 items-center rounded-full p-0.5 sm:p-1 transition-colors duration-300 shrink-0",
            settings.darkMode
              ? "bg-primary/20 border border-primary/30"
              : "bg-secondary border border-border"
          )}
          aria-label="Toggle theme"
        >
          <div
            className={cn(
              "flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-card shadow-md transition-transform duration-300",
              settings.darkMode ? "translate-x-4 sm:translate-x-6" : "translate-x-0"
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

    {/* Classic Chrome Dino Mini-Game Modal */}
    <Dialog open={showMiniGame} onOpenChange={setShowMiniGame}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg p-2 sm:p-4 rounded-3xl bg-transparent border-0 shadow-none">
        <ChromeDinoGame onClose={() => setShowMiniGame(false)} />
      </DialogContent>
    </Dialog>
    </>
  );
});

Header.displayName = "Header";
export default Header;
