import { useEffect, useRef, useCallback, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, SwitchCamera, Upload, FileImage, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

const QrScannerContent = ({ onScanSuccess, onClose }: { onScanSuccess: (decodedText: string) => void; onClose?: () => void }) => {
  const regionIdRef = useRef(`qr-region-${Math.random().toString(36).substring(2, 9)}`);
  const regionId = regionIdRef.current;

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
        scannerRef.current = new Html5Qrcode(regionId);
      } else {
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
          fps: 15,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (!hasScannedRef.current) {
            hasScannedRef.current = true;
            onScanSuccess(decodedText);
          }
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
        setError("Camera access denied. Allow permission or select a QR image file.");
      } else if (msg.includes("NotFoundError")) {
        setError("No camera found. You can upload a QR code image below.");
      } else {
        setError("Could not start camera. Upload a QR image file instead.");
      }
      setIsScanning(false);
    }
  }, [facingMode, onScanSuccess, regionId]);

  const toggleCamera = useCallback(async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, [stopScanner]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await stopScanner();
      const html5QrCode = new Html5Qrcode(regionId);
      const decodedText = await html5QrCode.scanFile(file, true);
      if (decodedText) {
        onScanSuccess(decodedText);
      }
    } catch (err) {
      toast.error("Could not find a valid QR code in that image. Try another photo.");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
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
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center gap-3 overflow-hidden w-full max-w-sm mx-auto select-none">
      <style>{`
        #${regionId} video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          background-color: #09090b !important;
          border-radius: 1rem !important;
        }
        #${regionId} {
          background-color: #09090b !important;
          border: none !important;
        }
        #${regionId} img {
          display: none !important;
        }
      `}</style>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Scanner Viewport */}
      <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-black/95 border border-primary/30 shadow-xl">
        <div id={regionId} className="w-full h-full" />

        {/* Scan overlay corners */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />

            <motion.div
              className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_#a855f7]"
              animate={{ top: ["15%", "85%", "15%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}

        {/* Error / Fallback State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 z-20 p-5 text-center">
            <CameraOff className="h-10 w-10 text-destructive/80 animate-pulse" />
            <p className="text-xs text-muted-foreground leading-snug">{error}</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="glow"
              size="sm"
              className="gap-1.5 text-xs h-9 rounded-xl font-bold mt-1"
            >
              <FileImage className="h-4 w-4" /> Select QR Image File
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {!isScanning ? (
          <Button
            onClick={startScanner}
            variant="glow"
            size="sm"
            className="gap-1.5 text-xs h-8 rounded-xl"
          >
            <Camera className="h-3.5 w-3.5" />
            Start Camera
          </Button>
        ) : (
          <>
            <Button
              onClick={stopScanner}
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs h-8 rounded-xl"
            >
              <CameraOff className="h-3.5 w-3.5" />
              Stop Camera
            </Button>
            <Button
              onClick={toggleCamera}
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs h-8 rounded-xl"
              title="Switch front/back camera"
            >
              <SwitchCamera className="h-3.5 w-3.5" />
              Flip
            </Button>
          </>
        )}

        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload QR Image
        </Button>

        {onClose && (
          <Button
            onClick={() => { stopScanner(); onClose(); }}
            variant="ghost"
            size="sm"
            className="text-xs h-8 rounded-xl text-muted-foreground"
          >
            Cancel
          </Button>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center max-w-[240px]">
        Scan a QR code with your camera or upload a QR screenshot
      </p>
    </div>
  );
};

const QrScanner = ({ onScanSuccess, onClose, isOpen }: QrScannerProps) => {
  // If isOpen is explicitly false, do not render or activate camera
  if (isOpen === false) return null;

  // If isOpen is a boolean, wrap in a Dialog modal
  if (isOpen === true) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <DialogContent className="max-w-sm p-6 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/50 shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-bold flex items-center justify-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Scan QR Code
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Point your camera at a friend's game QR code or upload a screenshot.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2">
            <QrScannerContent onScanSuccess={onScanSuccess} onClose={onClose} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If isOpen is not provided (standalone usage inside another modal), render content directly
  return <QrScannerContent onScanSuccess={onScanSuccess} onClose={onClose} />;
};

export default QrScanner;
