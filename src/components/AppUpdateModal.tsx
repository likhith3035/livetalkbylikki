import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Download, Clock, HardDrive, CheckCircle2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppUpdate } from "@/hooks/use-app-update";

interface AppUpdateModalProps {
  /** Optional custom instance of useAppUpdate hook */
  updateState?: ReturnType<typeof useAppUpdate>;
  /** Force open state for manual trigger in Settings */
  isOpenOverride?: boolean;
  /** Callback on close */
  onCloseOverride?: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  updateState: customUpdateState,
  isOpenOverride,
  onCloseOverride,
}) => {
  const defaultUpdateState = useAppUpdate();
  const updateState = customUpdateState || defaultUpdateState;

  const {
    currentVersion,
    updateInfo,
    isUpdateAvailable,
    dismissUpdate,
  } = updateState;

  const showModal = isOpenOverride !== undefined ? isOpenOverride : isUpdateAvailable;
  const [countdown, setCountdown] = useState<number | null>(5);

  const handleUpdateNow = useCallback(() => {
    if (updateInfo?.downloadUrl) {
      const link = document.createElement("a");
      link.href = updateInfo.downloadUrl;
      link.download = `LiveTalk-v${updateInfo.latestVersion}.apk`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [updateInfo]);

  useEffect(() => {
    if (!showModal || !updateInfo) return;
    setCountdown(5);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          handleUpdateNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showModal, updateInfo, handleUpdateNow]);

  if (!showModal || !updateInfo) return null;

  const {
    latestVersion,
    forceUpdate,
    downloadUrl,
    releaseDate,
    apkSize,
    releaseNotes,
  } = updateInfo;

  const handleDismiss = () => {
    setCountdown(null); // Pause auto-countdown on manual dismiss
    if (forceUpdate) return; // Prevent dismissal if update is required
    if (onCloseOverride) {
      onCloseOverride();
    } else {
      dismissUpdate();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 shadow-2xl shadow-primary/10 text-card-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button (only when forceUpdate is false) */}
          {!forceUpdate && (
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Header Badge & Title */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Rocket className="h-6 w-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Update Available
                </h3>
                {forceUpdate && (
                  <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive ring-1 ring-destructive/20">
                    Required
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                A new version of LiveTalk is ready to install!
              </p>
            </div>
          </div>

          {/* Version Comparison Bar */}
          <div className="my-4 rounded-2xl border border-border/60 bg-muted/40 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Current Version</span>
                <span className="font-mono font-semibold text-foreground">v{currentVersion}</span>
              </div>
              <div className="h-6 w-[1px] bg-border" />
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground">Latest Version</span>
                <span className="font-mono font-bold text-primary">v{latestVersion}</span>
              </div>
            </div>

            {/* Metadata Pills */}
            {(releaseDate || apkSize) && (
              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5 text-[11px] text-muted-foreground">
                {releaseDate && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary/70" />
                    <span>{releaseDate}</span>
                  </div>
                )}
                {apkSize && (
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-primary/70" />
                    <span>{apkSize}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Release Notes */}
          {releaseNotes && releaseNotes.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>What's New in v{latestVersion}</span>
              </div>
              <div className="max-h-44 overflow-y-auto rounded-xl border border-border/40 bg-background/50 p-3 space-y-2 text-xs scrollbar-thin scrollbar-thumb-muted">
                {releaseNotes.map((note, index) => (
                  <div key={index} className="flex items-start gap-2 text-foreground/90 leading-relaxed">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Prompt */}
          <p className="mb-5 text-center text-xs text-muted-foreground font-medium">
            {countdown !== null && countdown > 0 ? (
              <span className="text-primary font-semibold animate-pulse">
                ⚡ Auto-starting update download in {countdown}s...
              </span>
            ) : (
              "Update now to enjoy the latest features, improvements, and bug fixes."
            )}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!forceUpdate && (
              <Button
                variant="outline"
                className="w-1/3 rounded-xl border-border hover:bg-muted font-medium"
                onClick={handleDismiss}
              >
                Later
              </Button>
            )}

            <Button
              className={`rounded-xl font-semibold shadow-lg shadow-primary/20 gap-2 ${
                forceUpdate ? "w-full" : "w-2/3"
              }`}
              onClick={handleUpdateNow}
            >
              <Download className="h-4 w-4" />
              {countdown !== null && countdown > 0 ? `Update Now (${countdown}s)` : "Update Now"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
