import { useState } from "react";
import { Download, Copy, Maximize2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatImageProps {
  src: string;
  isMine: boolean;
}

const ChatImage = ({ src, isMine }: ChatImageProps) => {
  const [fullscreen, setFullscreen] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lchat-image-${Date.now()}.${blob.type.split("/")[1] || "png"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "📥 Saved!", description: "Image downloaded successfully." });
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
        toast({ title: "📋 Copied!", description: "Image URL copied to clipboard." });
      } catch {
        toast({ title: "Error", description: "Failed to copy image.", variant: "destructive" });
      }
    }
  };

  return (
    <>
      {/* Thumbnail View */}
      <div
        className="relative cursor-pointer overflow-hidden rounded-xl border border-border/40 hover:opacity-95 transition-all shadow-sm max-w-[280px] my-1"
        onClick={() => setFullscreen(true)}
      >
        <img
          src={src}
          alt="Shared image"
          className="w-full max-h-72 object-cover rounded-xl"
          loading="lazy"
        />
        {/* Subtle magnifying glass icon on hover */}
        <div className="absolute inset-0 bg-black/15 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
          <div className="bg-black/50 p-2.5 rounded-full backdrop-blur-sm">
            <Maximize2 className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Viewer with Drag-to-Dismiss */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-between py-6 bg-black/85 backdrop-blur-md select-none"
            onClick={() => setFullscreen(false)}
          >
            {/* Top Header Close Button */}
            <div className="w-full flex justify-end px-6 shrink-0">
              <button
                onClick={() => setFullscreen(false)}
                className="rounded-full bg-white/10 hover:bg-white/20 p-2.5 text-white transition-all active:scale-95 shadow-md"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Draggable Lightbox Image Container */}
            <div className="relative flex-1 w-full flex items-center justify-center p-4 min-h-0">
              <motion.img
                src={src}
                alt="Full view"
                initial={{ scale: 0.92, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: 15, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.65}
                onDragEnd={(e, info) => {
                  if (Math.abs(info.offset.y) > 120) {
                    setFullscreen(false);
                  }
                }}
                className="max-w-[95vw] max-h-[70vh] rounded-2xl object-contain shadow-2xl cursor-grab active:cursor-grabbing select-none"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="absolute bottom-2 text-white/35 text-[9px] uppercase font-bold tracking-widest pointer-events-none">
                Drag up or down to close
              </span>
            </div>

            {/* Bottom Actions Floating Bar */}
            <motion.div
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 25, opacity: 0 }}
              transition={{ delay: 0.05 }}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2.5 shadow-2xl backdrop-blur-md shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-bold text-white transition-all active:scale-95"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
              <div className="h-4 w-px bg-white/10" />
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white hover:brightness-110 transition-all active:scale-95 shadow-md"
              >
                <Download className="h-3.5 w-3.5" />
                Save
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatImage;
