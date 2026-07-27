import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApkDownload } from "@/hooks/use-apk-download";
import ApkInstallGuide from "@/components/ApkInstallGuide";

interface ApkDownloadButtonProps {
  /** compact = icon + short label, full = full card with version info */
  variant?: "compact" | "full";
  className?: string;
}

// Android robot SVG icon
const AndroidIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.523 15.341a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm-9.546 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM6.5 9.5h11a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1zm-2-1.268A6.978 6.978 0 0 1 12 5a6.978 6.978 0 0 1 7.5 3.232M8.5 9.5V8a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 .5.5v1.5M5 16.5v2a.5.5 0 0 0 .5.5H7a.5.5 0 0 0 .5-.5v-2m9 0v2a.5.5 0 0 0 .5.5h1.5a.5.5 0 0 0 .5-.5v-2M9.5 5.5l-1-2m6 2 1-2" strokeWidth="0" />
    <path d="M15.5 3.5 14 6M8.5 3.5 10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <rect x="5.5" y="8.5" width="13" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="9" cy="12" r="0.75" />
    <circle cx="15" cy="12" r="0.75" />
    <path d="M5.5 16.5v2.25a.75.75 0 0 0 1.5 0V16.5M17 16.5v2.25a.75.75 0 0 0 1.5 0V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

export default function ApkDownloadButton({ variant = "compact", className }: ApkDownloadButtonProps) {
  const { downloadState, progress, showGuide, download, closeGuide, apkInfo } = useApkDownload();

  const isDownloading = downloadState === "downloading";
  const isDone = downloadState === "done";
  const isError = downloadState === "error";

  if (variant === "full") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative rounded-2xl border border-border/60 bg-card overflow-hidden shadow-lg",
            className
          )}
        >
          {/* Top accent */}
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-green-500 via-primary to-blue-500" />

          <div className="p-5 space-y-4">
            {/* App info row */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-background border border-border/50 flex items-center justify-center overflow-hidden shadow-sm">
                <img src="/logo.png" alt="LiveTalk" className="h-9 w-9 object-contain" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-foreground">LiveTalk</p>
                  {apkInfo.isNew && (
                    <span className="px-1.5 py-0.5 rounded-md bg-green-500/15 border border-green-500/25 text-[9px] font-black text-green-400 uppercase tracking-wider">
                      New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">v{apkInfo.version}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span className="text-[10px] text-muted-foreground">{apkInfo.size}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span className="text-[10px] text-muted-foreground">{apkInfo.lastUpdated}</span>
                </div>
              </div>
              <AndroidIcon className="h-8 w-8 text-green-400 shrink-0" />
            </div>

            {/* Progress bar */}
            <AnimatePresence>
              {isDownloading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Downloading...</span>
                    <span className="tabular-nums font-bold text-primary">{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Download button */}
            <button
              onClick={download}
              disabled={isDownloading}
              className={cn(
                "w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-[0.98]",
                isDownloading && "bg-primary/20 text-primary border border-primary/30 cursor-not-allowed",
                isDone && "bg-green-500/15 text-green-400 border border-green-500/25",
                isError && "bg-destructive/15 text-destructive border border-destructive/25",
                !isDownloading && !isDone && !isError && "bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110"
              )}
            >
              {isDownloading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Downloading {progress}%</>
              ) : isDone ? (
                <><CheckCircle2 className="h-4 w-4" /> Downloaded — Tap to Install</>
              ) : isError ? (
                <><AlertCircle className="h-4 w-4" /> Failed — Tap to Retry</>
              ) : (
                <><Download className="h-4 w-4" /> Download APK ({apkInfo.size})</>
              )}
            </button>

            <p className="text-center text-[10px] text-muted-foreground/50">
              Android only · No Play Store needed · Free forever
            </p>
          </div>
        </motion.div>

        <ApkInstallGuide show={showGuide} onClose={closeGuide} />
      </>
    );
  }

  // Compact variant — for header
  return (
    <>
      <motion.button
        onClick={download}
        disabled={isDownloading}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all overflow-hidden",
          "bg-gradient-to-r from-green-500/90 to-emerald-600/90 text-white shadow-md shadow-green-500/20",
          "hover:shadow-green-500/35 hover:brightness-110",
          "border border-green-400/20",
          isDownloading && "opacity-80 cursor-not-allowed",
          className
        )}
      >
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        />

        {isDownloading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin relative z-10" />
            <span className="relative z-10 tabular-nums">{progress}%</span>
          </>
        ) : isDone ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 relative z-10" />
            <span className="relative z-10 hidden sm:inline">Install</span>
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5 relative z-10" />
            <span className="relative z-10 hidden xs:inline">Download App</span>
            <span className="relative z-10 xs:hidden">APK</span>
          </>
        )}

        {/* New badge */}
        {apkInfo.isNew && !isDownloading && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 border border-background flex items-center justify-center">
            <span className="text-[7px] font-black text-white">!</span>
          </span>
        )}
      </motion.button>

      <ApkInstallGuide show={showGuide} onClose={closeGuide} />
    </>
  );
}
