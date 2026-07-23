import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { NativeBiometric, BiometryType } from "capacitor-native-biometric";

const BIOMETRIC_ENABLED_KEY = "livetalk_biometric_enabled";
const BIOMETRIC_LOCKED_KEY = "livetalk_is_locked";

export function useBiometrics() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>("Biometrics");

  useEffect(() => {
    const enabledSetting = localStorage.getItem(BIOMETRIC_ENABLED_KEY) === "true";
    setIsEnabled(enabledSetting);

    // Check real device biometric hardware
    const checkBiometrics = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const result = await NativeBiometric.isAvailable();
          setIsAvailable(result.isAvailable);

          // Map biometry type to friendly name
          switch (result.biometryType) {
            case BiometryType.FINGERPRINT:
              setBiometricType("Fingerprint");
              break;
            case BiometryType.FACE_AUTHENTICATION:
              setBiometricType("Face Unlock");
              break;
            case BiometryType.IRIS_AUTHENTICATION:
              setBiometricType("Iris Scanner");
              break;
            default:
              setBiometricType("Biometrics");
          }
        } catch (e) {
          console.warn("[Biometrics] Hardware check failed:", e);
          setIsAvailable(false);
        }
      } else {
        // Web fallback — check for WebAuthn support
        const hasWebAuthn = typeof window !== "undefined" && !!window.PublicKeyCredential;
        setIsAvailable(hasWebAuthn);
        setBiometricType("Biometrics / Security Key");
      }
    };

    checkBiometrics();

    if (enabledSetting) {
      setIsLocked(true);
    }
  }, []);

  const enableBiometrics = useCallback(async () => {
    try {
      // Verify user can authenticate before enabling
      if (Capacitor.isNativePlatform()) {
        await NativeBiometric.verifyIdentity({
          reason: "Verify your identity to enable biometric lock",
          title: "LiveTalk Security",
          subtitle: "Authenticate to enable app lock",
          description: "Place your finger on the sensor or use face unlock",
        });
      }

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
      if (Capacitor.isNativePlatform()) {
        // Trigger the real Android fingerprint / face unlock dialog
        await NativeBiometric.verifyIdentity({
          reason: "Unlock LiveTalk",
          title: "LiveTalk Locked",
          subtitle: "Authenticate to continue",
          description: "Use your fingerprint or face to unlock the app",
        });
      }

      setIsLocked(false);
      localStorage.setItem(BIOMETRIC_LOCKED_KEY, "false");
      return true;
    } catch (e) {
      console.error("[Biometrics] Authentication failed:", e);
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
