import React, { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { toast } from "sonner";

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("Network connection lost. Offline mode active.");
    };

    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Back online! Connection restored.");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive/95 backdrop-blur-md text-destructive-foreground py-2 px-4 shadow-lg flex items-center justify-center gap-2 text-xs font-semibold animate-slide-down border-b border-destructive/40">
      <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
      <span>⚡ Network Disconnected — You are currently offline. Live sharing features will resume automatically when reconnected.</span>
    </div>
  );
};
