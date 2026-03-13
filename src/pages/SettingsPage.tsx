import { Moon, Sun, Volume2, Bell, Info, Palette, Image, Keyboard } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSettings, CHAT_THEMES, CHAT_WALLPAPERS, type ChatTheme, type ChatWallpaper } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { useSEO } from "@/hooks/use-seo";

const SettingsPage = () => {
  const onlineCount = useOnlineCount();
  const { toast } = useToast();
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
    <div className="flex min-h-screen flex-col bg-background">
      <div className="lg:hidden">
        <Header onlineCount={onlineCount} />
      </div>

      <main className="flex-1 px-5 py-6 pb-24 max-w-2xl mx-auto w-full">
        <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Settings</h1>

        <div className="space-y-6">
          {/* General */}
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">General</h2>
            <div className="space-y-2">
              <SettingRow
                icon={settings.darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                title={settings.darkMode ? "Dark Mode" : "Light Mode"}
                desc="Theme preference"
              >
                <Switch checked={settings.darkMode} onCheckedChange={(c) => handleToggle("darkMode", c)} />
              </SettingRow>
              <SettingRow icon={<Volume2 className="h-5 w-5" />} title="Sound Effects" desc="Connect & message sounds">
                <Switch checked={settings.soundEffects} onCheckedChange={(c) => handleToggle("soundEffects", c)} />
              </SettingRow>
              <SettingRow icon={<Bell className="h-5 w-5" />} title="Notifications" desc="Alerts when tab is inactive">
                <Switch checked={settings.notifications} onCheckedChange={(c) => handleToggle("notifications", c)} />
              </SettingRow>
            </div>
          </section>

          {/* Chat Theme */}
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" /> Bubble Theme
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(Object.keys(CHAT_THEMES) as ChatTheme[]).map((key) => {
                const theme = CHAT_THEMES[key];
                const isActive = settings.chatTheme === key;
                return (
                  <button
                    key={key}
                    onClick={() => updateSetting("chatTheme", key)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-all duration-200",
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-secondary/40 hover:border-primary/30"
                    )}
                  >
                    <div className="h-6 w-6 rounded-full shadow-inner" style={{ background: theme.accent }} />
                    <span className="text-[10px] font-medium text-foreground">{theme.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Wallpaper */}
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" /> Chat Wallpaper
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(CHAT_WALLPAPERS) as ChatWallpaper[]).map((key) => {
                const wp = CHAT_WALLPAPERS[key];
                const isActive = settings.chatWallpaper === key;
                return (
                  <button
                    key={key}
                    onClick={() => updateSetting("chatWallpaper", key)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 transition-all duration-200",
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-secondary/40 hover:border-primary/30"
                    )}
                  >
                    <span className="text-lg">{wp.emoji}</span>
                    <span className="text-[10px] font-medium text-foreground">{wp.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Keyboard shortcuts */}
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
              <Keyboard className="h-3.5 w-3.5" /> Keyboard Shortcuts
            </h2>
            <div className="rounded-xl border border-border bg-secondary/40 divide-y divide-border/50">
              <ShortcutRow keys={["Enter"]} desc="Start chatting (when idle)" />
              <ShortcutRow keys={["Esc"]} desc="Stop / disconnect chat" />
              <ShortcutRow keys={["Ctrl", "N"]} desc="Next stranger" />
              <ShortcutRow keys={["Enter"]} desc="Send message (in input)" />
            </div>
          </section>

          {/* About */}
          <section className="space-y-2">
            <button
              type="button"
              onClick={() => toast({ title: "LiveTalk", description: "v2.0 — Talk to Anyone Instantly" })}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">About LiveTalk</p>
                  <p className="text-xs text-muted-foreground">v2.0 — By Likhith Kami</p>
                </div>
              </div>
            </button>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

const SettingRow = ({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-4">
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
    {children}
  </div>
);

const ShortcutRow = ({ keys, desc }: { keys: string[]; desc: string }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <span className="text-xs text-muted-foreground">{desc}</span>
    <div className="flex gap-1">
      {keys.map((k) => (
        <kbd key={k} className="rounded-md border border-border bg-card px-2 py-0.5 text-[10px] font-mono text-foreground shadow-sm">
          {k}
        </kbd>
      ))}
    </div>
  </div>
);

export default SettingsPage;
