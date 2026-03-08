import { useEffect } from "react";
import type { ChatStatus } from "@/hooks/use-chat";

interface UseKeyboardShortcutsOptions {
  status: ChatStatus;
  onStart: () => void;
  onNext: () => void;
  onStop: () => void;
}

export function useKeyboardShortcuts({ status, onStart, onNext, onStop }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Escape") {
        e.preventDefault();
        if (status === "connected" || status === "searching") onStop();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        if (status === "connected" || status === "disconnected") onNext();
      }

      if (e.key === "Enter" && (status === "idle" || (status === "disconnected"))) {
        e.preventDefault();
        onStart();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [status, onStart, onNext, onStop]);
}
