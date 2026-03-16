import { useRef, useEffect, useState, useCallback } from "react";
import { X, Eraser, Trash2, ArrowLeft, MousePointer2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

interface SharedCanvasProps {
  roomChannel?: RealtimeChannel | null;
  sessionId?: string;
  onClose: () => void;
}

const COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Yellow", value: "#f59e0b" },
  { name: "Red", value: "#ef4444" },
];

const BRUSH_SIZES = [
  { label: "Fine", value: 3 },
  { label: "Medium", value: 6 },
  { label: "Thick", value: 12 },
  { label: "Bold", value: 24 },
];

const SharedCanvas = ({ roomChannel, sessionId, onClose }: SharedCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#7c3aed");
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const clearLocal = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }, []);

  const handleClear = useCallback(() => {
    clearLocal();
    roomChannel?.send({
      type: "broadcast",
      event: "clear_canvas",
      payload: { senderId: sessionId },
    });
  }, [clearLocal, roomChannel, sessionId]);

  const drawLine = useCallback((x0: number, y0: number, x1: number, y1: number, c: string, s: number, isRemote = false) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    
    if (c === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = c;
    }
    
    ctx.lineWidth = s;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.closePath();

    if (!isRemote) {
      roomChannel?.send({
        type: "broadcast",
        event: "drawing",
        payload: { x0, y0, x1, y1, color: isEraser ? "eraser" : color, size: brushSize, senderId: sessionId },
      });
    }
  }, [roomChannel, sessionId, color, brushSize, isEraser]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      contextRef.current = ctx;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleDrawing = (payload: any) => {
      const { x0, y0, x1, y1, color: remoteColor, size: remoteSize, senderId } = payload.payload;
      if (senderId !== sessionId) {
        drawLine(x0, y0, x1, y1, remoteColor, remoteSize, true);
      }
    };

    const handleClearRemote = (payload: any) => {
      if (payload.payload.senderId !== sessionId) clearLocal();
    };

    roomChannel?.on("broadcast", { event: "drawing" }, handleDrawing);
    roomChannel?.on("broadcast", { event: "clear_canvas" }, handleClearRemote);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [roomChannel, sessionId, drawLine, clearLocal]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let x, y;
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    lastPos.current = { x, y };
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPos.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let x, y;
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    drawLine(lastPos.current.x, lastPos.current.y, x, y, isEraser ? "eraser" : color, brushSize);
    lastPos.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-[#050508] safe-area-padding overflow-hidden"
    >
      {/* Responsive Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-black/40 backdrop-blur-xl z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="group flex items-center gap-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-2xl pr-3 sm:pr-4"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden xs:inline text-[10px] sm:text-[11px] font-black uppercase tracking-widest italic">Chat</span>
          </Button>
          <div className="h-6 w-px bg-white/10 shrink-0" />
          <div className="flex flex-col overflow-hidden">
            <h2 className="text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] italic truncate">Doodle Lounge</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-[8px] sm:text-[9px] font-bold text-green-500/80 uppercase tracking-widest">Live Syc</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button 
            variant="glow" 
            size="sm" 
            onClick={onClose}
            className="rounded-xl h-8 sm:h-9 px-3 sm:px-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest italic"
          >
            I'm Done
          </Button>
        </div>
      </div>

      {/* Main Drawing Area */}
      <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#0a0a0f_0%,_#050508_100%)]">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
        />

        {/* Floating Tool Controls - Responsive (becomes pill on desktop, compact bar on mobile) */}
        <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-2 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-[2rem] shadow-2xl z-20 ring-1 ring-white/5 w-[90%] sm:w-auto overflow-hidden">
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            {/* Colors Selection - Horizontal Scroll on small screens */}
            <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-[200px] xs:max-w-none">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    setColor(c.value);
                    setIsEraser(false);
                  }}
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl transition-all active:scale-90 relative shrink-0",
                    color === c.value && !isEraser ? "scale-105 ring-2 ring-primary ring-offset-2 sm:ring-offset-4 ring-offset-black" : "opacity-40 hover:opacity-100"
                  )}
                  style={{ backgroundColor: c.value }}
                >
                  {color === c.value && !isEraser && (
                    <motion.div layoutId="activeColor" className="absolute inset-0 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>

            <div className="hidden sm:block h-8 w-px bg-white/10 mx-1" />

            {/* Actions (Eraser & Trash) */}
            <div className="flex items-center gap-1.5 pr-1">
              <Button
                variant={isEraser ? "glow" : "ghost"}
                size="icon"
                className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl", !isEraser && "text-white/40 hover:text-white")}
                onClick={() => setIsEraser(!isEraser)}
              >
                <Eraser className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
                onClick={handleClear}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="h-px sm:h-8 w-full sm:w-px bg-white/10" />

          {/* Size Selection */}
          <div className="flex items-center gap-1 p-1 w-full sm:w-auto justify-evenly sm:justify-start">
            {BRUSH_SIZES.map((size) => (
              <button
                key={size.value}
                onClick={() => setBrushSize(size.value)}
                className={cn(
                  "w-8 h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all px-2",
                  brushSize === size.value && !isEraser ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
                title={size.label}
              >
                <div 
                  style={{ 
                    width: Math.max(3, size.value / 2.5), 
                    height: Math.max(3, size.value / 2.5), 
                    borderRadius: '50%', 
                    backgroundColor: 'currentColor' 
                  }} 
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Status - Minimal on mobile */}
      <div className="px-4 sm:px-8 py-2.5 sm:py-3 bg-black/40 border-t border-white/5 backdrop-blur-xl flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-white/20">
          <span className="truncate max-w-[60px] xs:max-w-none">{isEraser ? "Eraser" : "Brush"}</span>
          <div className="w-0.5 h-0.5 rounded-full bg-white/5" />
          <span className="hidden xs:inline">{color}</span>
          <div className="w-0.5 h-0.5 rounded-full bg-white/5" />
          <span>{brushSize}px</span>
        </div>
        <div className="text-[7px] sm:text-[8px] font-bold text-white/10 uppercase tracking-[0.2em] sm:tracking-[0.3em] truncate ml-2">
          E2E Synced • Privately Encrypted
        </div>
      </div>
    </motion.div>
  );
};

export default SharedCanvas;
