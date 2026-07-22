import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "livetalk_human_verified";
const VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useHumanVerify() {
  const [isVerified, setIsVerified] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { ts } = JSON.parse(raw);
        if (Date.now() - ts < VERIFY_EXPIRY_MS) {
          setIsVerified(true);
          return;
        }
      }
    } catch {
      /* ignore storage read error */
    }
    setIsVerified(false);
  }, []);

  // Call this before starting a chat — if not verified, shows the modal
  const requireVerification = useCallback((onVerified: () => void) => {
    if (isVerified) {
      onVerified();
      return;
    }
    setPendingAction(() => onVerified);
    setShowVerify(true);
  }, [isVerified]);

  const onVerifySuccess = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() }));
    setIsVerified(true);
    setShowVerify(false);
    pendingAction?.();
    setPendingAction(null);
  }, [pendingAction]);

  const onVerifyClose = useCallback(() => {
    setShowVerify(false);
    setPendingAction(null);
  }, []);

  return { isVerified, showVerify, requireVerification, onVerifySuccess, onVerifyClose };
}
