import { Moon, Volume2, Bell, Info } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";

const settingsItems = [
  { icon: Moon, label: "Dark Mode", description: "Always on", enabled: true },
  { icon: Volume2, label: "Sound Effects", description: "Message notifications", enabled: false },
  { icon: Bell, label: "Notifications", description: "Browser alerts", enabled: false },
  { icon: Info, label: "About Echo", description: "v1.0 — Speak freely" },
];

const SettingsPage = () => {
  const onlineCount = useOnlineCount();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onlineCount={onlineCount} />

      <main className="flex-1 px-5 py-6 pb-24">
        <h1 className="text-2xl font-bold font-display text-foreground mb-6">Settings</h1>
        <div className="space-y-2">
          {settingsItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl bg-secondary/40 border border-border px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              {item.enabled !== undefined && (
                <div
                  className={`h-6 w-10 rounded-full transition-colors ${
                    item.enabled ? "bg-primary" : "bg-muted"
                  } relative`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${
                      item.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
