import React, { useState } from "react";
import { Sparkles, Sliders, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VideoFilter {
  id: string;
  name: string;
  cssFilter: string;
  emoji: string;
}

export const VIDEO_FILTERS: VideoFilter[] = [
  { id: "normal", name: "Normal", cssFilter: "none", emoji: "📷" },
  { id: "soft_glow", name: "Soft Glow", cssFilter: "brightness(1.08) contrast(1.05) saturate(1.15) blur(0.3px)", emoji: "✨" },
  { id: "cyberpunk", name: "Cyberpunk", cssFilter: "hue-rotate(190deg) contrast(1.25) saturate(1.4)", emoji: "🌆" },
  { id: "matrix", name: "Matrix", cssFilter: "sepia(0.8) hue-rotate(90deg) saturate(2.5) contrast(1.2)", emoji: "🟢" },
  { id: "vintage", name: "Vintage 70s", cssFilter: "sepia(0.4) contrast(1.1) brightness(0.95) saturate(1.2)", emoji: "🎞️" },
  { id: "warm_sunset", name: "Warm Sunset", cssFilter: "hue-rotate(-20deg) saturate(1.3) brightness(1.05)", emoji: "🌅" },
  { id: "mono_noir", name: "Mono Noir", cssFilter: "grayscale(1) contrast(1.3) brightness(0.95)", emoji: "🎬" },
];

interface CameraFilterSelectorProps {
  activeFilterId: string;
  onSelectFilter: (filter: VideoFilter) => void;
}

export const CameraFilterSelector: React.FC<CameraFilterSelectorProps> = ({
  activeFilterId,
  onSelectFilter,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md backdrop-blur-md border",
          activeFilterId !== "normal"
            ? "bg-primary/20 border-primary/50 text-primary animate-pulse"
            : "bg-background/60 border-border/40 text-foreground hover:bg-secondary"
        )}
        title="Apply Live Video Filters"
      >
        <Wand2 className="h-3.5 w-3.5 text-primary" />
        <span>Filters</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-10 left-0 z-50 w-56 p-3 rounded-2xl border border-border bg-card shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 space-y-2">
          <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" /> Camera Filters
            </span>
            <button onClick={() => setIsOpen(false)} className="text-[10px] font-bold text-muted-foreground hover:text-foreground">
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {VIDEO_FILTERS.map((f) => {
              const isActive = activeFilterId === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    onSelectFilter(f);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 p-2 rounded-xl text-left border transition-all text-xs font-semibold",
                    isActive
                      ? "border-primary bg-primary/10 text-foreground font-bold shadow-sm"
                      : "border-border/40 bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="text-sm">{f.emoji}</span>
                  <span className="truncate text-[11px]">{f.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
