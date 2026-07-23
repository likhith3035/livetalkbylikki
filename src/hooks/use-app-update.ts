import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

export interface AppVersionInfo {
  latestVersion: string;
  minimumVersion?: string;
  forceUpdate: boolean;
  downloadUrl: string;
  releaseDate?: string;
  apkSize?: string;
  releaseNotes: string[];
}

export const CURRENT_APP_VERSION = "1.5.0";
const DISMISSED_VERSION_KEY = "livetalk_dismissed_update_version";

/**
 * Compares two semantic version strings (e.g. "1.5.0" vs "1.6.0").
 * Returns:
 *  -1 if v1 < v2 (newer version exists)
 *   0 if v1 === v2
 *   1 if v1 > v2
 */
export function compareSemver(v1: string, v2: string): number {
  const p1 = v1.split(".").map((n) => parseInt(n, 10) || 0);
  const p2 = v2.split(".").map((n) => parseInt(n, 10) || 0);

  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  return 0;
}

export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  const checkForUpdates = useCallback(async (silent = true) => {
    setIsChecking(true);
    try {
      const isNative = Capacitor.isNativePlatform();

      // On website (non-native browser visits), NEVER auto-show the update popup!
      // Website code is always live and latest.
      if (silent && !isNative) {
        setIsUpdateAvailable(false);
        setIsChecking(false);
        return false;
      }

      // Cache-busting fetch request to /version.json
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache" },
      });

      if (!response.ok) {
        if (!silent) console.warn("[AppUpdate] Version server returned non-200 status:", response.status);
        setIsChecking(false);
        return false;
      }

      const data: AppVersionInfo = await response.json();

      if (!data || !data.latestVersion || !data.downloadUrl) {
        if (!silent) console.warn("[AppUpdate] Invalid version payload received:", data);
        setIsChecking(false);
        return false;
      }

      // Check if installed version is less than latestVersion
      const isOutdated = compareSemver(CURRENT_APP_VERSION, data.latestVersion) < 0;

      // Check if forced update is triggered via forceUpdate flag OR minimumVersion threshold
      const isBelowMinimum = data.minimumVersion
        ? compareSemver(CURRENT_APP_VERSION, data.minimumVersion) < 0
        : false;

      const shouldForce = data.forceUpdate || isBelowMinimum;

      const finalInfo: AppVersionInfo = {
        ...data,
        forceUpdate: shouldForce,
      };

      setUpdateInfo(finalInfo);

      // Check if user previously dismissed this version (unless update is forced)
      const lastDismissed = localStorage.getItem(DISMISSED_VERSION_KEY);
      const isDismissed = !shouldForce && lastDismissed === data.latestVersion;

      if (isOutdated) {
        if (!isDismissed || !silent) {
          setIsUpdateAvailable(true);
        }
        setIsChecking(false);
        return true;
      } else {
        setIsUpdateAvailable(false);
        setIsChecking(false);
        return false;
      }
    } catch (err) {
      // Fail silently without interrupting user flow
      if (!silent) console.error("[AppUpdate] Failed to check for app update:", err);
      setIsChecking(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkForUpdates(true);
  }, [checkForUpdates]);

  const dismissUpdate = useCallback(() => {
    setHasDismissed(true);
    setIsUpdateAvailable(false);
    if (updateInfo?.latestVersion) {
      try {
        localStorage.setItem(DISMISSED_VERSION_KEY, updateInfo.latestVersion);
      } catch (e) {
        console.warn("[AppUpdate] Failed to write dismissed version to localStorage", e);
      }
    }
  }, [updateInfo]);

  const resetDismiss = useCallback(() => {
    setHasDismissed(false);
    try {
      localStorage.removeItem(DISMISSED_VERSION_KEY);
    } catch (e) {
      console.warn("[AppUpdate] Failed to clear dismissed version from localStorage", e);
    }
  }, []);

  return {
    currentVersion: CURRENT_APP_VERSION,
    updateInfo,
    isUpdateAvailable: isUpdateAvailable && !hasDismissed,
    isChecking,
    checkForUpdates,
    dismissUpdate,
    resetDismiss,
  };
}
