import { useEffect, useRef } from "react";

interface UseMobileBackGuardProps {
  enabled: boolean;
  onRequestGuard: () => void;
}

export function useMobileBackGuard({ enabled, onRequestGuard }: UseMobileBackGuardProps) {
  const isPushedRef = useRef(false);
  const onRequestGuardRef = useRef(onRequestGuard);
  onRequestGuardRef.current = onRequestGuard;

  useEffect(() => {
    if (!enabled) {
      isPushedRef.current = false;
      return;
    }

    // Push state ONCE to catch native back swipe / hardware back button
    if (!isPushedRef.current) {
      try {
        window.history.pushState({ inChatGuard: true }, "", window.location.href);
        isPushedRef.current = true;
      } catch {}
    }

    const handlePopState = (e: PopStateEvent) => {
      if (enabled && isPushedRef.current) {
        // Maintain history state so subsequent back attempts are also guarded
        try {
          window.history.pushState({ inChatGuard: true }, "", window.location.href);
        } catch {}
        onRequestGuardRef.current();
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Support native Capacitor Back Button if running inside mobile app container
    let capacitorListener: any = null;
    const windowWithCapacitor = window as any;
    if (windowWithCapacitor.Capacitor && windowWithCapacitor.Capacitor.isPluginAvailable("App")) {
      try {
        const { App } = windowWithCapacitor.Capacitor.Plugins;
        if (App && typeof App.addListener === "function") {
          capacitorListener = App.addListener("backButton", () => {
            if (enabled) {
              onRequestGuardRef.current();
            }
          });
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (capacitorListener && typeof capacitorListener.remove === "function") {
        capacitorListener.remove();
      }
    };
  }, [enabled]);
}

export default useMobileBackGuard;
