import React, { useState } from "react";
import { Fingerprint, ShieldCheck, Lock, Key } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BiometricLockModalProps {
  isOpen: boolean;
  biometricType: string;
  onAuthenticate: () => Promise<boolean>;
}

export const BiometricLockModal: React.FC<BiometricLockModalProps> = ({
  isOpen,
  biometricType,
  onAuthenticate,
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const success = await onAuthenticate();
      if (!success) {
        setError("Authentication failed. Please try again.");
      }
    } catch (err) {
      setError("Biometric scan cancelled or failed.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-xl p-4">
      <div className="w-full max-w-sm rounded-3xl border border-border/50 bg-card p-6 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5">
          <Fingerprint className="h-10 w-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> App Locked
          </h2>
          <p className="text-sm text-muted-foreground">
            Unlock IncogTalk using {biometricType} to access your chats and room.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        <Button
          onClick={handleAuth}
          disabled={isAuthenticating}
          className="w-full py-6 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20 gap-2"
        >
          <ShieldCheck className="h-5 w-5" />
          {isAuthenticating ? "Verifying..." : `Unlock with ${biometricType}`}
        </Button>
      </div>
    </div>
  );
};
