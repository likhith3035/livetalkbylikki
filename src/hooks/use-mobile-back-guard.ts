import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App, PluginListenerHandle } from "@capacitor/app";

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
      } catch {
        // ignore history error
      }
    }

    const handlePopState = () => {
      if (enabled && isPushedRef.current) {
        // Maintain history state so subsequent back attempts are also guarded
        try {
          window.history.pushState({ inChatGuard: true }, "", window.location.href);
        } catch {
          // ignore history error
        }
        onRequestGuardRef.current();
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Support native Capacitor Back Button if running inside mobile app container
    let capacitorListenerPromise: Promise<PluginListenerHandle> | null = null;
    if (Capacitor.isNativePlatform()) {
      try {
        capacitorListenerPromise = App.addListener("backButton", () => {
          if (enabled) {
            onRequestGuardRef.current();
          }
        });
      } catch {
        // Fallback gracefully
      }
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (capacitorListenerPromise) {
        capacitorListenerPromise.then((handle) => handle.remove()).catch(() => {});
      }
    };
  }, [enabled]);
}

export default useMobileBackGuard;
