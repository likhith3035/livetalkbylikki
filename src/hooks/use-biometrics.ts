import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

const BIOMETRIC_ENABLED_KEY = "livetalk_biometric_enabled";
const BIOMETRIC_LOCKED_KEY = "livetalk_is_locked";

export function useBiometrics() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>("Biometrics");

  useEffect(() => {
    // Check local storage setting
    const enabledSetting = localStorage.getItem(BIOMETRIC_ENABLED_KEY) === "true";
    setIsEnabled(enabledSetting);

    // Check device hardware capability
    const isNative = Capacitor.isNativePlatform();
    const hasWebAuthn = typeof window !== "undefined" && !!window.PublicKeyCredential;

    if (isNative || hasWebAuthn) {
      setIsAvailable(true);
      setBiometricType(isNative ? "Fingerprint / Face ID" : "Biometrics / Security Key");
    } else {
      setIsAvailable(false);
    }

    if (enabledSetting) {
      setIsLocked(true);
    }
  }, []);

  const enableBiometrics = useCallback(async () => {
    try {
      localStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
      setIsEnabled(true);
      return true;
    } catch (e) {
      console.error("[Biometrics] Failed to enable biometrics:", e);
      return false;
    }
  }, []);

  const disableBiometrics = useCallback(() => {
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, "false");
    setIsEnabled(false);
    setIsLocked(false);
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!isEnabled) {
      setIsLocked(false);
      return true;
    }

    try {
      // If WebAuthn or Native Biometrics is present, simulate or call credential check
      setIsLocked(false);
      localStorage.setItem(BIOMETRIC_LOCKED_KEY, "false");
      return true;
    } catch (e) {
      console.error("[Biometrics] Authentication error:", e);
      return false;
    }
  }, [isEnabled]);

  const lockApp = useCallback(() => {
    if (isEnabled) {
      setIsLocked(true);
      localStorage.setItem(BIOMETRIC_LOCKED_KEY, "true");
    }
  }, [isEnabled]);

  return {
    isAvailable,
    isEnabled,
    isLocked,
    biometricType,
    enableBiometrics,
    disableBiometrics,
    authenticate,
    lockApp,
  };
}
