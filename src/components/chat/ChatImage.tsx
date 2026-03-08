import { useState } from "react";
import { Download, Copy, Maximize2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChatImageProps {
  src: string;
  isMine: boolean;
}

const ChatImage = ({ src, isMine }: ChatImageProps) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `echo-image-${Date.now()}.${blob.type.split("/")[1] || "png"}`;
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
      // Fallback: copy URL
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
      <div
        className="relative group cursor-pointer"
        onClick={() => setShowOverlay(!showOverlay)}
      >
        <img
          src={src}
          alt="Shared image"
          className="max-w-full rounded-lg mb-1 max-h-48 sm:max-h-60 object-cover"
          loading="lazy"
        />

        {/* Action overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-lg bg-background/60 backdrop-blur-sm flex items-center justify-center gap-2 transition-opacity",
            showOverlay ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="flex items-center gap-1 rounded-lg bg-card border border-border px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-secondary transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            className="flex items-center gap-1 rounded-lg bg-card border border-border px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-secondary transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Save
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setFullscreen(true); setShowOverlay(false); }}
            className="flex items-center gap-1 rounded-lg bg-card border border-border px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-secondary transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            View
          </button>
        </div>
      </div>

      {/* Fullscreen viewer */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-lg animate-fade-in"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 rounded-full bg-card border border-border p-2 text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="flex items-center gap-1.5 rounded-xl bg-card border border-border px-4 py-2 text-sm font-medium text-foreground shadow-lg hover:bg-secondary transition-colors"
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="flex items-center gap-1.5 rounded-xl bg-card border border-border px-4 py-2 text-sm font-medium text-foreground shadow-lg hover:bg-secondary transition-colors"
            >
              <Download className="h-4 w-4" />
              Save
            </button>
          </div>
          <img
            src={src}
            alt="Full view"
            className="max-w-[90vw] max-h-[80vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ChatImage;
