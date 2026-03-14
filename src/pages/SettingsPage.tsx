import { Moon, Sun, Volume2, Bell, Info, Palette, Image, Keyboard, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSettings, CHAT_THEMES, CHAT_WALLPAPERS, type ChatTheme, type ChatWallpaper } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { useSEO } from "@/hooks/use-seo";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 260, damping: 20 }
};

const SettingsPage = () => {
  const onlineCount = useOnlineCount();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings, updateSetting } = useSettings();
  useSEO({ 
    title: "Settings – LiveTalk", 
    description: "Customize your LiveTalk experience — themes, wallpapers, sound, notifications and more.",
    keywords: "chat settings, dark mode chat, chat themes, message notifications, customize LiveTalk"
  });

  const handleToggle = async (key: "darkMode" | "soundEffects" | "notifications", checked: boolean) => {
    if (key === "notifications" && checked) {
      if (!("Notification" in window)) {
        toast({ title: "Not supported", description: "Your browser does not support notifications." });
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({ title: "Permission required", description: "Allow notifications in your browser settings first." });
        return;
      }
    }
    updateSetting(key, checked);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      {/* Premium Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="lg:hidden">
        <Header onlineCount={onlineCount} />
      </div>

      <main className="flex-1 px-5 py-8 pb-32 max-w-2xl mx-auto w-full">
        <motion.div {...fadeUp} className="mb-8">
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1.5 text-sm font-medium">Personalize your chat experience</p>
        </motion.div>

        <div className="space-y-8">
          {/* General */}
          <motion.section {...fadeUp} transition={{ delay: 0.1 }} className="space-y-3">
            <h2 className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em] px-1">Preference</h2>
            <div className="space-y-2.5">
              <SettingRow
                icon={settings.darkMode ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
                title={settings.darkMode ? "Dark Appearance" : "Light Appearance"}
                desc="Toggle site-wide theme"
              >
                <Switch 
                  checked={settings.darkMode} 
                  onCheckedChange={(c) => handleToggle("darkMode", c)}
                  className="data-[state=checked]:bg-primary"
                />
              </SettingRow>
              <SettingRow icon={<Volume2 className="h-4.5 w-4.5" />} title="Sound Effects" desc="Connect & message sounds">
                <Switch checked={settings.soundEffects} onCheckedChange={(c) => handleToggle("soundEffects", c)} />
              </SettingRow>
              <SettingRow icon={<Bell className="h-4.5 w-4.5" />} title="Notifications" desc="Alerts when tab is inactive">
                <Switch checked={settings.notifications} onCheckedChange={(c) => handleToggle("notifications", c)} />
              </SettingRow>
            </div>
          </motion.section>

          {/* Style */}
          <motion.section {...fadeUp} transition={{ delay: 0.2 }} className="space-y-4">
            <h2 className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <Palette className="h-3 w-3" /> Visual Style
            </h2>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground/80 px-1">Message Bubbles</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(Object.keys(CHAT_THEMES) as ChatTheme[]).map((key) => {
                    const theme = CHAT_THEMES[key];
                    const isActive = settings.chatTheme === key;
                    return (
                      <button
                        key={key}
                        onClick={() => updateSetting("chatTheme", key)}
                        className={cn(
                          "group flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3.5 transition-all duration-300",
                          isActive
                            ? "border-primary bg-primary/5 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.4)]"
                            : "border-border/50 bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40"
                        )}
                      >
                        <div 
                          className="h-8 w-8 rounded-full shadow-lg transition-transform group-hover:scale-110" 
                          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)` }} 
                        />
                        <span className="text-[10px] font-bold text-foreground/80 truncate w-full text-center">{theme.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground/80 px-1">Chat Background</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {(Object.keys(CHAT_WALLPAPERS) as ChatWallpaper[]).map((key) => {
                    const wp = CHAT_WALLPAPERS[key];
                    const isActive = settings.chatWallpaper === key;
                    return (
                      <button
                        key={key}
                        onClick={() => updateSetting("chatWallpaper", key)}
                        className={cn(
                          "group flex flex-col items-center gap-1 rounded-xl border px-1 py-3 transition-all duration-300",
                          isActive
                            ? "border-primary bg-primary/8 shadow-md"
                            : "border-border/50 bg-secondary/20 hover:border-primary/20"
                        )}
                      >
                        <span className="text-lg group-hover:scale-125 transition-transform">{wp.emoji}</span>
                        <span className="text-[8px] font-bold text-foreground/60 uppercase tracking-tighter">{wp.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Keyboard shortcuts */}
          <motion.section {...fadeUp} transition={{ delay: 0.3 }} className="space-y-3">
            <h2 className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <Keyboard className="h-3 w-3" /> Accessibility
            </h2>
            <div className="rounded-[2rem] border border-border/40 bg-secondary/10 backdrop-blur-md overflow-hidden divide-y divide-border/20">
              <ShortcutRow keys={["Enter"]} desc="Start matching when idle" />
              <ShortcutRow keys={["Esc"]} desc="Quick stop or disconnect" />
              <ShortcutRow keys={["Ctrl", "N"]} desc="Skip to next stranger" />
              <ShortcutRow keys={["Enter"]} desc="Send message in chat box" />
            </div>
          </motion.section>

          {/* Links */}
          <motion.section {...fadeUp} transition={{ delay: 0.4 }} className="space-y-2.5">
             <button
              type="button"
              onClick={() => navigate("/guidelines")}
              className="flex w-full items-center justify-between rounded-3xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 px-5 py-4 text-left transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Community Guidelines</p>
                  <p className="text-xs text-muted-foreground font-medium">Safe use & community rules</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => toast({ title: "LiveTalk v2.0", description: "The #1 premium anonymous chat experience." })}
              className="flex w-full items-center justify-between rounded-3xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 px-5 py-5 text-left transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Version Information</p>
                  <p className="text-xs text-muted-foreground font-medium text-gradient">Build 2.0.42 — Powered by Likki</p>
                </div>
              </div>
            </button>
          </motion.section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

const SettingRow = ({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between rounded-3xl border border-border/30 bg-card/40 backdrop-blur-md px-5 py-4 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/70">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground font-medium">{desc}</p>
      </div>
    </div>
    {children}
  </div>
);

const ShortcutRow = ({ keys, desc }: { keys: string[]; desc: string }) => (
  <div className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
    <span className="text-xs font-medium text-muted-foreground/80">{desc}</span>
    <div className="flex gap-1.5">
      {keys.map((k) => (
        <kbd key={k} className="inline-flex items-center rounded-lg border border-border/60 bg-background px-2.5 py-1 text-[10px] font-bold font-mono text-foreground/80 shadow-[0_2px_0_0_rgba(0,0,0,0.1)]">
          {k}
        </kbd>
      ))}
    </div>
  </div>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);

export default SettingsPage;
