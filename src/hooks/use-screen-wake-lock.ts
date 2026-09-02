import { useEffect, useRef } from "react";

/**
 * Custom hook to keep the mobile or desktop screen awake during active video/audio calls.
 * Automatically re-acquires the wake lock if the user tabs away and returns.
 * Gracefully degrades if the Screen Wake Lock API is not supported.
 */
export function useScreenWakeLock(isActive: boolean) {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!isActive) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      return;
    }

    let isMounted = true;

    const requestLock = async () => {
      if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
      try {
        if (!wakeLockRef.current) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
          wakeLockRef.current.addEventListener?.("release", () => {
            wakeLockRef.current = null;
          });
        }
      } catch (err) {
        // May fail if battery saver is on or page is hidden
        console.warn("[WakeLock] Request failed:", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActive && isMounted) {
        requestLock();
      }
    };

    requestLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isActive]);
}
