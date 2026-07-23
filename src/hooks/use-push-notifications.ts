import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

const NOTIFICATION_ENABLED_KEY = "livetalk_notifications_enabled";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "granted" | "denied" | "prompt">("prompt");

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const hasWebNotifications = typeof window !== "undefined" && "Notification" in window;

    if (isNative || hasWebNotifications) {
      setIsSupported(true);
      if (hasWebNotifications) {
        setPermissionState(Notification.permission);
      }
    }

    const savedState = localStorage.getItem(NOTIFICATION_ENABLED_KEY) === "true";
    setIsEnabled(savedState);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        const result = await Notification.requestPermission();
        setPermissionState(result);
        if (result === "granted") {
          setIsEnabled(true);
          localStorage.setItem(NOTIFICATION_ENABLED_KEY, "true");
          return true;
        }
      }
      setIsEnabled(true);
      localStorage.setItem(NOTIFICATION_ENABLED_KEY, "true");
      return true;
    } catch (e) {
      console.error("[Notifications] Permission request failed:", e);
      return false;
    }
  }, []);

  const toggleNotifications = useCallback((enable: boolean) => {
    setIsEnabled(enable);
    localStorage.setItem(NOTIFICATION_ENABLED_KEY, enable ? "true" : "false");
  }, []);

  const sendLocalNotification = useCallback((title: string, body: string) => {
    if (!isEnabled) return;

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/logo.png",
        });
      } catch (e) {
        console.warn("[Notifications] Web notification dispatch failed:", e);
      }
    }
  }, [isEnabled]);

  return {
    isSupported,
    isEnabled,
    permissionState,
    requestPermission,
    toggleNotifications,
    sendLocalNotification,
  };
}
