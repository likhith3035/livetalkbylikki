import { useState, useEffect } from "react";
import { Bell, BellOff, X, MessageSquare, Users, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";

const FEATURES = [
  { icon: MessageSquare, text: "New messages from strangers" },
  { icon: Users, text: "Stranger connected / disconnected" },
  { icon: Zap, text: "Match found with shared interests" },
];

const NotificationPrompt = () => {
  const [show, setShow] = useState(false);
  const { settings, updateSetting } = useSettings();
  const { toast } = useToast();

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const alreadyAsked = localStorage.getItem("echo.notif_prompt_shown");
    const notifSupported = "Notification" in window;

    if (!notifSupported || alreadyAsked) return;

    // After PWA install event — immediate prompt
    const onInstalled = () => {
      setTimeout(() => setShow(true), 1500);
    };
    window.addEventListener("appinstalled", onInstalled);

    // If already in standalone (PWA) and haven't asked yet
    if (isStandalone && Notification.permission === "default") {
      setTimeout(() => setShow(true), 2000);
    }

    // On mobile browser after a short delay (so they've seen the app first)
    if (isMobile && !isStandalone && Notification.permission === "default") {
      const visitCount = parseInt(localStorage.getItem("echo.visit_count") || "0", 10) + 1;
      localStorage.setItem("echo.visit_count", String(visitCount));
      // Ask on second visit
      if (visitCount >= 2) {
        setTimeout(() => setShow(true), 5000);
      }
    }

    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        updateSetting("notifications", true);
        toast({ title: "🔔 Notifications enabled!", description: "You'll get alerts for new messages and connections." });

        // Send a test notification
        setTimeout(() => {
          new Notification("L Chat", {
            body: "Notifications are working! You'll be alerted for new messages.",
            icon: "/pwa-icon-192.png",
            tag: "lchat-test",
          });
        }, 500);
      } else {
        toast({ title: "Permission denied", description: "You can enable notifications later in Settings.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not enable notifications." });
    }
    localStorage.setItem("echo.notif_prompt_shown", "1");
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("echo.notif_prompt_shown", "1");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-primary/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <motion.div
                animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20"
              >
                <Bell className="h-8 w-8 text-primary" />
              </motion.div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold font-display text-foreground text-center mb-2">
              Stay in the loop!
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Enable notifications so you never miss a message or connection.
            </p>

            {/* Feature list */}
            <div className="space-y-3 mb-6">
              {FEATURES.map((f) => (
                <div key={f.text} className="flex items-center gap-3 rounded-xl bg-secondary/50 border border-border/50 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{f.text}</span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <Button
                variant="glow"
                className="w-full h-12 text-base font-semibold rounded-2xl gap-2"
                onClick={handleEnable}
              >
                <Bell className="h-4 w-4" />
                Enable Notifications
              </Button>
              <Button
                variant="ghost"
                className="w-full h-10 text-sm text-muted-foreground"
                onClick={handleDismiss}
              >
                <BellOff className="h-3.5 w-3.5 mr-1.5" />
                Maybe Later
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPrompt;
