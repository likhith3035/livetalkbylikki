import { useEffect, useRef } from "react";

interface UseMobileBackGuardProps {
  enabled: boolean;
  onRequestGuard: () => void;
}

export function useMobileBackGuard({ enabled, onRequestGuard }: UseMobileBackGuardProps) {
  const isPushedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      isPushedRef.current = false;
      return;
    }

    // Push state to prevent browser history back from immediately exiting
    if (!isPushedRef.current) {
      window.history.pushState({ inChatGuard: true }, "", window.location.href);
      isPushedRef.current = true;
    }

    const handlePopState = (e: PopStateEvent) => {
      if (enabled) {
        // Prevent default navigation by re-pushing state and popping modal prompt
        window.history.pushState({ inChatGuard: true }, "", window.location.href);
        onRequestGuard();
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Support native Capacitor Back Button if available
    let capacitorListener: any = null;
    const windowWithCapacitor = window as any;
    if (windowWithCapacitor.Capacitor && windowWithCapacitor.Capacitor.isPluginAvailable("App")) {
      try {
        const { App } = windowWithCapacitor.Capacitor.Plugins;
        if (App && typeof App.addListener === "function") {
          capacitorListener = App.addListener("backButton", () => {
            if (enabled) {
              onRequestGuard();
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
  }, [enabled, onRequestGuard]);
}

export default useMobileBackGuard;
