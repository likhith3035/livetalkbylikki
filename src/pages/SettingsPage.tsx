import { useEffect, useState } from "react";
import { Moon, Volume2, Bell, Info } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useOnlineCount } from "@/hooks/use-online-count";

type SettingsState = {
  darkMode: boolean;
  soundEffects: boolean;
  notifications: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  darkMode: true,
  soundEffects: false,
  notifications: false,
};

const SettingsPage = () => {
  const onlineCount = useOnlineCount();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;

    return {
      darkMode: localStorage.getItem("echo.darkMode")
        ? localStorage.getItem("echo.darkMode") === "true"
        : DEFAULT_SETTINGS.darkMode,
      soundEffects: localStorage.getItem("echo.soundEffects") === "true",
      notifications: localStorage.getItem("echo.notifications") === "true",
    };
  });

  useEffect(() => {
    localStorage.setItem("echo.darkMode", String(settings.darkMode));
    localStorage.setItem("echo.soundEffects", String(settings.soundEffects));
    localStorage.setItem("echo.notifications", String(settings.notifications));

    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings]);

  const handleToggle = async (key: keyof SettingsState, checked: boolean) => {
    if (key !== "notifications") {
      setSettings((prev) => ({ ...prev, [key]: checked }));
      return;
    }

    if (!checked) {
      setSettings((prev) => ({ ...prev, notifications: false }));
      return;
    }

    if (!("Notification" in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser does not support notifications.",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast({
        title: "Permission required",
        description: "Allow notifications in your browser settings first.",
      });
      setSettings((prev) => ({ ...prev, notifications: false }));
      return;
    }

    setSettings((prev) => ({ ...prev, notifications: true }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onlineCount={onlineCount} />

      <main className="flex-1 px-5 py-6 pb-24">
        <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Settings</h1>

        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-4">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Theme preference</p>
              </div>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(checked) => handleToggle("darkMode", checked)}
              aria-label="Toggle dark mode"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-4">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Sound Effects</p>
                <p className="text-xs text-muted-foreground">Message notifications</p>
              </div>
            </div>
            <Switch
              checked={settings.soundEffects}
              onCheckedChange={(checked) => handleToggle("soundEffects", checked)}
              aria-label="Toggle sound effects"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Notifications</p>
                <p className="text-xs text-muted-foreground">Browser alerts</p>
              </div>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => handleToggle("notifications", checked)}
              aria-label="Toggle notifications"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              toast({
                title: "Echo",
                description: "v1.0 — Speak freely",
              })
            }
            className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">About Echo</p>
                <p className="text-xs text-muted-foreground">App information</p>
              </div>
            </div>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;

