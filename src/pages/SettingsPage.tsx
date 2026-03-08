import { Moon, Sun, Volume2, Bell, Info } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSettings } from "@/contexts/SettingsContext";

const SettingsPage = () => {
  const onlineCount = useOnlineCount();
  const { toast } = useToast();
  const { settings, updateSetting } = useSettings();

  const handleToggle = async (key: keyof typeof settings, checked: boolean) => {
    if (key === "notifications" && checked) {
      if (!("Notification" in window)) {
        toast({
          title: "Not supported",
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
        return;
      }
    }

    updateSetting(key, checked);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onlineCount={onlineCount} />

      <main className="flex-1 px-5 py-6 pb-24">
        <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Settings</h1>

        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-4">
            <div className="flex items-center gap-3">
              {settings.darkMode ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {settings.darkMode ? "Dark Mode" : "Light Mode"}
                </p>
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
                <p className="text-xs text-muted-foreground">Connect & message sounds</p>
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
                <p className="text-xs text-muted-foreground">Alerts when tab is inactive</p>
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
                title: "L Chat",
                description: "v1.0 — Speak freely",
              })
            }
            className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">About L Chat</p>
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
