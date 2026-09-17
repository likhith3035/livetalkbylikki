import { registerPlugin, Capacitor, type PluginListenerHandle } from "@capacitor/core";

export interface ScreenshotEventData {
  timestamp: number;
  source: string;
}

export interface PrivacyProtectionPluginInterface {
  setSecure(options: { enabled: boolean }): Promise<{ secure: boolean }>;
  isSecure(): Promise<{ secure: boolean }>;
  startScreenshotDetection(): Promise<{ listening: boolean }>;
  stopScreenshotDetection(): Promise<{ listening: boolean }>;
  addListener(
    eventName: "screenshotTaken",
    listenerFunc: (info: ScreenshotEventData) => void
  ): Promise<PluginListenerHandle>;
}

const PrivacyProtection = registerPlugin<PrivacyProtectionPluginInterface>("PrivacyProtection");

let activeListenerHandle: PluginListenerHandle | null = null;
const listeners = new Set<(info: ScreenshotEventData) => void>();

/**
 * Toggles Android FLAG_SECURE on the native window.
 * When enabled, screenshots are blocked by the OS and screen recording captures only a black screen.
 */
export async function setNativeScreenSecure(enabled: boolean): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return enabled;
  }
  try {
    const res = await PrivacyProtection.setSecure({ enabled });
    return res.secure;
  } catch (err) {
    console.warn("[PrivacyProtection] setSecure error:", err);
    return false;
  }
}

/**
 * Checks if native FLAG_SECURE is active.
 */
export async function isNativeScreenSecure(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const res = await PrivacyProtection.isSecure();
    return res.secure;
  } catch {
    return false;
  }
}

/**
 * Registers a screenshot listener. Uses multi-subscriber pattern so both
 * Chat-level and SnapMediaModal-level listeners coexist without cancelling each other.
 * Returns an unregister function.
 */
export async function startNativeScreenshotDetection(
  onScreenshot: (info: ScreenshotEventData) => void
): Promise<() => void> {
  listeners.add(onScreenshot);

  if (Capacitor.isNativePlatform()) {
    if (!activeListenerHandle) {
      try {
        await PrivacyProtection.startScreenshotDetection();
        activeListenerHandle = await PrivacyProtection.addListener("screenshotTaken", (data) => {
          listeners.forEach((cb) => {
            try {
              cb(data);
            } catch (err) {
              console.error("[PrivacyProtection] Listener callback error:", err);
            }
          });
        });
      } catch (err) {
        console.warn("[PrivacyProtection] startScreenshotDetection error:", err);
      }
    }
  }

  return () => {
    stopNativeScreenshotDetection(onScreenshot);
  };
}

/**
 * Unsubscribes a screenshot listener. If all listeners are removed, stops native detection.
 */
export async function stopNativeScreenshotDetection(
  onScreenshot?: (info: ScreenshotEventData) => void
): Promise<void> {
  if (onScreenshot) {
    listeners.delete(onScreenshot);
  } else {
    listeners.clear();
  }

  if (listeners.size === 0 && activeListenerHandle) {
    try {
      await activeListenerHandle.remove();
      activeListenerHandle = null;
      if (Capacitor.isNativePlatform()) {
        await PrivacyProtection.stopScreenshotDetection();
      }
    } catch (err) {
      console.warn("[PrivacyProtection] stopScreenshotDetection error:", err);
    }
  }
}

export default PrivacyProtection;
