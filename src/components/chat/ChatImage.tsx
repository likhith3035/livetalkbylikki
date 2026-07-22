import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, Copy, Maximize2, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatImageProps {
  src: string;
  isMine: boolean;
}

const ChatImage = ({ src, isMine }: ChatImageProps) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setZoomLevel(1);
      setRotation(0);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  const handleDownload = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `livetalk-image-${Date.now()}.${blob.type.split("/")[1] || "png"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "📥 Saved!", description: "Image saved to your device." });
    } catch {
      toast({ title: "Error", description: "Failed to download image.", variant: "destructive" });
    }
  };

  const handleCopy = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast({ title: "📋 Copied!", description: "Image copied to clipboard." });
    } catch {
      try {
        await navigator.clipboard.writeText(src);
        toast({ title: "📋 Copied!", description: "Image link copied to clipboard." });
      } catch {
        toast({ title: "Error", description: "Failed to copy image.", variant: "destructive" });
      }
    }
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleDoubleTapZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => (prev > 1 ? 1 : 2));
  };

  return (
    <>
      {/* Chat Thumbnail */}
      <div
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 shadow-md my-1 group max-w-full w-full sm:max-w-[280px] max-h-[300px] bg-black/10 dark:bg-white/5",
          isMine ? "border-white/20" : "border-border/60"
        )}
        onClick={() => setFullscreen(true)}
      >
        <img
          src={src}
          alt="Shared content"
          className="w-full h-full max-h-[280px] object-contain rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        {/* Subtle magnifying indicator overlay */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
          <div className="bg-black/60 p-2.5 rounded-full backdrop-blur-md border border-white/20 text-white shadow-lg">
            <Maximize2 className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Portal */}
      {fullscreen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[99999] flex flex-col justify-between bg-black/90 backdrop-blur-xl select-none p-4 sm:p-6"
              onClick={() => setFullscreen(false)}
            >
              {/* Top Navigation & Controls Bar */}
              <div 
                className="w-full flex items-center justify-between z-10 shrink-0 gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur-md">
                  <span className="text-xs font-bold text-white/90 px-1">Photo Preview</span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                    className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-all active:scale-95 border border-white/10"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-all active:scale-95 border border-white/10"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    onClick={handleRotate}
                    className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 border border-white/10"
                    title="Rotate"
                  >
                    <RotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    onClick={() => setFullscreen(false)}
                    className="p-2 sm:p-2.5 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white transition-all active:scale-95 border border-rose-400/30 shadow-lg ml-1"
                    title="Close"
                  >
                    <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>

              {/* Main Image Stage */}
              <div 
                className="relative flex-1 w-full flex items-center justify-center min-h-0 my-2 overflow-hidden"
                onDoubleClick={toggleDoubleTapZoom}
              >
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                <motion.img
                  src={src}
                  alt="Full view"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: zoomLevel, rotate: rotation, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onLoad={() => setLoading(false)}
                  className="max-w-[92vw] max-h-[78vh] object-contain rounded-2xl shadow-2xl transition-transform duration-200 cursor-zoom-in"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Bottom Actions Floating Dock */}
              <div className="w-full flex justify-center z-10 shrink-0">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="flex items-center gap-2 sm:gap-3 bg-white/10 border border-white/20 rounded-full px-4 sm:px-6 py-2 shadow-2xl backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white transition-all active:scale-95"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                  <div className="h-4 w-px bg-white/20" />
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 rounded-full bg-primary px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-bold text-white hover:brightness-110 transition-all active:scale-95 shadow-md"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Save Image
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export default ChatImage;
