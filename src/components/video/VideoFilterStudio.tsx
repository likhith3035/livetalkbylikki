import React, { useState, useRef, useEffect } from "react";
import { Video, VideoOff, Wand2, Sparkles, RefreshCw } from "lucide-react";
import { VIDEO_FILTERS, type VideoFilter } from "@/components/video/CameraFilterSelector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const VideoFilterStudio: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<VideoFilter>(VIDEO_FILTERS[0]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (e) {
      console.warn("[VideoFilterStudio] Camera access error:", e);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="p-5 rounded-[2rem] border border-border/30 bg-card/25 backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Wand2 className="h-3.5 w-3.5 text-primary animate-pulse" /> Live Camera Filter Studio
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={isCameraActive ? stopCamera : startCamera}
          className="h-8 text-xs font-bold gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
        >
          {isCameraActive ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
          {isCameraActive ? "Stop Preview" : "Test Camera Live"}
        </Button>
      </div>

      {/* Camera Live Canvas Preview Box */}
      <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-black/60 h-48 sm:h-56 flex items-center justify-center shadow-inner">
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100 transition-all duration-300"
            style={{
              filter: selectedFilter.cssFilter !== "none" ? selectedFilter.cssFilter : undefined,
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4 space-y-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Video className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-foreground">Live Video Preview</p>
            <p className="text-[10px] text-muted-foreground max-w-xs leading-normal">
              Click "Test Camera Live" to preview camera filters in real-time before joining video calls.
            </p>
          </div>
        )}

        {/* Filter label badge overlay */}
        {isCameraActive && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold flex items-center gap-1.5 shadow-lg">
            <span>{selectedFilter.emoji}</span>
            <span>{selectedFilter.name} Filter</span>
          </div>
        )}
      </div>

      {/* Filter Presets Grid */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary" /> Select Filter Effect
        </label>
        <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-7 gap-2">
          {VIDEO_FILTERS.map((filter) => {
            const isActive = selectedFilter.id === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center group",
                  isActive
                    ? "border-primary bg-primary/10 text-foreground scale-105 shadow-sm font-bold"
                    : "border-border/40 bg-secondary/20 hover:border-primary/30 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-lg group-hover:scale-125 transition-transform">{filter.emoji}</span>
                <span className="text-[9px] font-bold uppercase tracking-tighter mt-1 truncate w-full">{filter.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
