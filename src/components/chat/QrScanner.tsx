import { useEffect, useRef, useCallback, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
}

const QR_REGION_ID = "qr-scanner-region";

const QrScanner = ({ onScanSuccess, onClose }: QrScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const hasScannedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch (e) {
        // Ignore stop errors
      }
      setIsScanning(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    hasScannedRef.current = false;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(QR_REGION_ID);
      } else {
        // Stop existing scan first
        try {
          const state = scannerRef.current.getState();
          if (state === 2) {
            await scannerRef.current.stop();
          }
        } catch (_) {}
      }

      await scannerRef.current.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (!hasScannedRef.current) {
            hasScannedRef.current = true;
            onScanSuccess(decodedText);
          }
        },
        () => {
          // Scan failure (no QR found in frame) — ignore
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
        setError("Camera access denied. Please allow camera permission and try again.");
      } else if (msg.includes("NotFoundError")) {
        setError("No camera found on this device.");
      } else {
        setError("Could not start camera. Please try again.");
      }
      setIsScanning(false);
    }
  }, [facingMode, onScanSuccess]);

  const toggleCamera = useCallback(async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, [stopScanner]);

  // Restart scanner when facingMode changes
  useEffect(() => {
    if (isScanning || (!isScanning && !error)) {
      // Small delay for DOM readiness
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === 2) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch (_) {}
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-col items-center gap-3 overflow-hidden"
    >
      {/* Scanner viewport */}
      <div className="relative w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden bg-black/90 border border-border/50">
        <div id={QR_REGION_ID} className="w-full h-full" />

        {/* Scan overlay corners */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Top-left */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            {/* Top-right */}
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            {/* Bottom-left */}
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            {/* Bottom-right */}
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />

            {/* Scanning line animation */}
            <motion.div
              className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
              animate={{ top: ["15%", "85%", "15%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}

        {/* Not scanning placeholder */}
        {!isScanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 z-10">
            <Camera className="h-10 w-10 text-muted-foreground/60" />
            <span className="text-[11px] text-muted-foreground">Tap Start to open camera</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 z-10 p-4">
            <CameraOff className="h-8 w-8 text-destructive/60" />
            <span className="text-[10px] text-muted-foreground text-center leading-snug">{error}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isScanning ? (
          <Button
            onClick={startScanner}
            variant="glow"
            size="sm"
            className="gap-1.5 text-xs h-8"
          >
            <Camera className="h-3.5 w-3.5" />
            Start Scanner
          </Button>
        ) : (
          <>
            <Button
              onClick={stopScanner}
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs h-8"
            >
              <CameraOff className="h-3.5 w-3.5" />
              Stop
            </Button>
            <Button
              onClick={toggleCamera}
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs h-8"
              title="Switch front/back camera"
            >
              <SwitchCamera className="h-3.5 w-3.5" />
              Flip
            </Button>
          </>
        )}
        {onClose && (
          <Button
            onClick={() => { stopScanner(); onClose(); }}
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-muted-foreground"
          >
            Cancel
          </Button>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center max-w-[220px]">
        Point your camera at a LiveTalk QR code to join instantly
      </p>
    </motion.div>
  );
};

export default QrScanner;
