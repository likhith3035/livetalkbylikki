import React, { useState, useRef, useEffect } from "react";
import { Move, ZoomIn, ZoomOut, Check, X, Smartphone, Crop, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AspectRatio = "9:16" | "1:1" | "16:9" | "free";

interface WallpaperCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBase64: string) => void;
  onCancel: () => void;
}

const WallpaperCropper = ({ imageSrc, onCropComplete, onCancel }: WallpaperCropperProps) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [aspect, setAspect] = useState<AspectRatio>("9:16");
  const [dragging, setDragging] = useState(false);
  const startDrag = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset scale and offset when aspect ratio changes
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [aspect]);

  // Handle Pointer Dragging for panning
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    startDrag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({
      x: e.clientX - startDrag.current.x,
      y: e.clientY - startDrag.current.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDragging(false);
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  // Perform Canvas crop based on dragging, scaling, and aspect ratios
  const handleCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Define target crop size based on aspect ratio
    let targetWidth = 1080;
    let targetHeight = 1920;

    if (aspect === "1:1") {
      targetWidth = 1080;
      targetHeight = 1080;
    } else if (aspect === "16:9") {
      targetWidth = 1920;
      targetHeight = 1080;
    } else if (aspect === "free") {
      // For free crop, we output a high-res square crop to prevent excessive memory/localstorage bloat while maintaining clarity
      targetWidth = 1200;
      targetHeight = 1200;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Viewport dimensions in cropper UI
    let viewportWidth = 220;
    let viewportHeight = 391; // 9:16 ratio height
    if (aspect === "1:1") {
      viewportWidth = 220;
      viewportHeight = 220;
    } else if (aspect === "16:9") {
      viewportWidth = 220;
      viewportHeight = 124;
    } else if (aspect === "free") {
      viewportWidth = 280;
      viewportHeight = 280;
    }

    // Calculate crop parameters
    // In our UI, the image is rendered with a fit/cover scale. 
    // We map UI offsets and scale back to natural image coordinates.
    const naturalRatio = img.naturalWidth / img.width;
    
    // Width and height of the cropped region in natural pixels
    const sourceWidth = (viewportWidth / scale) * naturalRatio;
    const sourceHeight = (viewportHeight / scale) * naturalRatio;

    // Top-left corner of the cropped region in natural pixels
    const sourceX = (img.naturalWidth / 2) - (offset.x * naturalRatio / scale) - (sourceWidth / 2);
    const sourceY = (img.naturalHeight / 2) - (offset.y * naturalRatio / scale) - (sourceHeight / 2);

    try {
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        targetWidth,
        targetHeight
      );

      // Save as JPEG with high quality compression (0.92) to keep it crisp and clear
      const croppedBase64 = canvas.toDataURL("image/jpeg", 0.92);
      onCropComplete(croppedBase64);
    } catch (err) {
      console.error("Failed to crop image on canvas:", err);
      // Fallback: send original source if crop fails
      onCropComplete(imageSrc);
    }
  };

  // Get sizing class based on aspect ratio chosen
  const getViewportSizeClass = () => {
    if (aspect === "9:16") return "w-[220px] h-[391px]";
    if (aspect === "1:1") return "w-[220px] h-[220px]";
    if (aspect === "16:9") return "w-[220px] h-[124px]";
    return "w-[280px] h-[280px] rounded-full";
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 select-none animate-fade-in pointer-events-auto">
      <div className="w-full max-w-md bg-card/90 border border-border/30 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center gap-5 relative overflow-hidden">
        {/* Ambient background glow inside modal */}
        <div className="absolute -top-[10%] -left-[10%] w-[35%] h-[35%] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[35%] h-[35%] rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="w-full flex items-center justify-between z-10 border-b border-border/20 pb-2">
          <div className="flex items-center gap-2">
            <Crop className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground leading-none">Crop Wallpaper</h3>
          </div>
          <button 
            type="button" 
            onClick={onCancel}
            className="h-8 w-8 rounded-full bg-secondary/60 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-105"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dynamic Aspect Ratio Toolbar */}
        <div className="flex items-center gap-1.5 bg-secondary/35 p-1 rounded-2xl w-full z-10">
          <button
            type="button"
            onClick={() => setAspect("9:16")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-bold uppercase rounded-xl transition-all",
              aspect === "9:16" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </button>
          <button
            type="button"
            onClick={() => setAspect("1:1")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-bold uppercase rounded-xl transition-all",
              aspect === "1:1" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Minimize2 className="h-3.5 w-3.5" /> Square
          </button>
          <button
            type="button"
            onClick={() => setAspect("16:9")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-bold uppercase rounded-xl transition-all",
              aspect === "16:9" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Crop className="h-3.5 w-3.5 rotate-90" /> Wide
          </button>
          <button
            type="button"
            onClick={() => setAspect("free")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-bold uppercase rounded-xl transition-all",
              aspect === "free" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Move className="h-3.5 w-3.5" /> Full
          </button>
        </div>

        {/* Cropper Interactive Viewport Wrapper */}
        <div 
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-full h-[400px] bg-neutral-950/80 rounded-[2rem] overflow-hidden flex items-center justify-center cursor-move select-none border border-border/20 z-10"
        >
          {/* Sizing frame guide boundary */}
          <div className={cn("crop-mask-container relative z-10 border border-white/20 transition-all duration-300", getViewportSizeClass())}>
            {/* Thirds line overlay grid */}
            {aspect !== "free" && <div className="crop-grid-overlay" />}
            
            {/* The Image inside crop viewport */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              draggable={false}
              className="absolute pointer-events-none select-none max-w-none max-h-none transition-transform duration-75"
              style={{
                left: "50%",
                top: "50%",
                width: "auto",
                height: aspect === "free" ? "280px" : aspect === "9:16" ? "391px" : aspect === "1:1" ? "220px" : "124px",
                objectFit: "cover",
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: "center center"
              }}
            />
          </div>
          
          {/* Ambient touch pointer info overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full flex items-center gap-1.5 pointer-events-none">
            <Move className="h-3 w-3 text-primary animate-pulse" />
            <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">Drag to position image</span>
          </div>
        </div>

        {/* Scale Zoom Sliders */}
        <div className="w-full space-y-1.5 px-2 z-10">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1"><ZoomOut className="h-3 w-3" /> Zoom Out</span>
            <span className="flex items-center gap-1">Zoom In <ZoomIn className="h-3 w-3 text-primary" /></span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
          />
        </div>

        {/* Confirm Footer buttons */}
        <div className="w-full flex items-center gap-3.5 z-10 border-t border-border/20 pt-4">
          <Button 
            onClick={onCancel}
            variant="outline"
            className="flex-1 rounded-2xl h-12 text-xs font-bold uppercase tracking-wider border-border/80 hover:bg-secondary/40"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCrop}
            variant="glow"
            className="flex-1 rounded-2xl h-12 text-xs font-bold uppercase tracking-wider gap-1.5"
          >
            <Check className="h-4 w-4" /> Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WallpaperCropper;
