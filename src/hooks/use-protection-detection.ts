import { useEffect, useState, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";

interface UseProtectionDetectionProps {
  active: boolean;
  onTriggered: (type: string) => void;
}

export function useProtectionDetection({ active, onTriggered }: UseProtectionDetectionProps) {
  const { settings } = useSettings();
  const [isTriggered, setIsTriggered] = useState(false);
  const triggerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reference hooks to avoid stale callback references
  const onTriggeredRef = useRef(onTriggered);
  useEffect(() => {
    onTriggeredRef.current = onTriggered;
  }, [onTriggered]);

  const triggerViolation = (type: string) => {
    if (!settings.protectionEnabled || !active) return;
    
    setIsTriggered(true);
    onTriggeredRef.current(type);

    // Focus/Visibility loss triggers permanent blackout until focus is regained.
    // Transient actions (keystrokes, printscreen, copy) reset after 3 seconds.
    if (type !== "Window Focus Lost" && type !== "Tab Switched") {
      if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
      triggerTimeoutRef.current = setTimeout(() => {
        setIsTriggered(false);
      }, 3000);
    }
  };

  useEffect(() => {
    if (!active || !settings.protectionEnabled) {
      setIsTriggered(false);
      return;
    }

    // 1. Keyboard combinations (F12, PrintScreen, Ctrl+Shift+I, Cmd+Shift+3/4/5 etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === "PrintScreen") {
        e.preventDefault();
        triggerViolation("PrintScreen Key");
      }
      
      // DevTools keys
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
        (e.metaKey && e.altKey && (e.key === "I" || e.key === "i"))
      ) {
        e.preventDefault();
        triggerViolation("DevTools Shortcut");
      }

      // Copy/Cut keys
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C" || e.key === "x" || e.key === "X")) {
        e.preventDefault();
        triggerViolation("Clipboard Action");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        triggerViolation("PrintScreen Release");
      }
    };

    // 2. Tab switching & window focus changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerViolation("Tab Switched");
      } else {
        setIsTriggered(false);
      }
    };

    const handleWindowBlur = () => {
      triggerViolation("Window Focus Lost");
    };

    const handleWindowFocus = () => {
      setIsTriggered(false);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
    };
  }, [active, settings.protectionEnabled]);

  // 4. Overrides for Screen Sharing (getDisplayMedia) and Video Recording (MediaRecorder)
  useEffect(() => {
    if (!active || !settings.protectionEnabled) return;

    // Override navigator.mediaDevices.getDisplayMedia
    const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
    navigator.mediaDevices.getDisplayMedia = async function(options) {
      triggerViolation("Screen Share Blocked");
      throw new Error("Screen sharing is disabled in Protected Mode.");
    };

    // Override MediaRecorder
    const OriginalMediaRecorder = window.MediaRecorder;
    if (OriginalMediaRecorder) {
      // @ts-ignore
      window.MediaRecorder = function(stream, options) {
        triggerViolation("Media Recorder Blocked");
        throw new Error("Recording is disabled in Protected Mode.");
      };
      // Copy static properties/methods if any
      Object.assign(window.MediaRecorder, OriginalMediaRecorder);
      window.MediaRecorder.prototype = OriginalMediaRecorder.prototype;
      window.MediaRecorder.isTypeSupported = OriginalMediaRecorder.isTypeSupported;
    }

    return () => {
      navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      if (OriginalMediaRecorder) {
        window.MediaRecorder = OriginalMediaRecorder;
      }
    };
  }, [active, settings.protectionEnabled]);

  return { isTriggered };
}
