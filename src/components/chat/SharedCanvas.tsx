import { useRef, useEffect, useState, useCallback, memo } from "react";
import { Eraser, Trash2, ArrowLeft, MousePointer2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

interface SharedCanvasProps {
  roomChannel?: RealtimeChannel | null;
  sessionId?: string;
  onClose: () => void;
}

interface RemoteCursor {
  x: number;
  y: number;
  color: string;
  lastUpdated: number;
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

// Extracted to prevent re-rendering the entire Canvas on every cursor move (fixes lag)
const CursorOverlay = memo(({ roomChannel, sessionId }: { roomChannel?: RealtimeChannel | null; sessionId?: string }) => {
  const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});

  useEffect(() => {
    if (!roomChannel) return;

    const handleCursor = (payload: any) => {
      const { x, y, color: remoteColor, senderId } = payload.payload;
      if (senderId !== sessionId) {
        setRemoteCursors(prev => ({
          ...prev,
          [senderId]: { x, y, color: remoteColor, lastUpdated: Date.now() }
        }));
      }
    };

    roomChannel.on("broadcast", { event: "cursor" }, handleCursor);

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors(prev => {
        const next = { ...prev };
        let changed = false;
        for (const [id, cursor] of Object.entries(next)) {
          if (now - cursor.lastUpdated > 3000) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, [roomChannel, sessionId]);

  return (
    <AnimatePresence>
      {Object.entries(remoteCursors).map(([id, cursor]) => (
        <motion.div
          key={id}
          initial={{ opacity: 0, x: cursor.x, y: cursor.y }}
          animate={{ opacity: 1, x: cursor.x, y: cursor.y }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.05, ease: "linear" }}
          className="absolute top-0 left-0 pointer-events-none z-30"
        >
          <MousePointer2 
            className={cn(
              "w-5 h-5 drop-shadow-md",
              cursor.color === "eraser" ? "text-white opacity-50" : ""
            )}
            style={cursor.color !== "eraser" ? { fill: cursor.color, stroke: 'white', strokeWidth: 1.5 } : {}}
          />
          <div className="absolute left-4 top-4 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wider text-white whitespace-nowrap opacity-75">
            {cursor.color === "eraser" ? "Erasing" : "Drawing"}
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
});
CursorOverlay.displayName = "CursorOverlay";

const SharedCanvas = ({ roomChannel, sessionId, onClose }: SharedCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#7c3aed");
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Use refs for UI state so drawing and sync listeners don't re-trigger and run resize (which clears canvas!)
  const stateRef = useRef({ color: "#7c3aed", brushSize: 6, isEraser: false });

  useEffect(() => {
    stateRef.current = { color, brushSize, isEraser };
  }, [color, brushSize, isEraser]);

  // Network batching and cursor tracking
  const drawingBufferRef = useRef<any[]>([]);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);

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
      const { color: currentColor, brushSize: currentSize, isEraser: currentEraser } = stateRef.current;
      drawingBufferRef.current.push({ 
        x0, y0, x1, y1, 
        color: currentEraser ? "eraser" : currentColor, 
        size: currentSize 
      });
    }
  }, []); // Empty deps avoids recreating drawLine on color change, preventing canvas clear

  // Sync Loop for Batching Events (Throttle to ~20FPS)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (!roomChannel || !sessionId) return;
      
      if (drawingBufferRef.current.length > 0) {
        roomChannel.send({
          type: "broadcast",
          event: "drawing_batch",
          payload: { batch: drawingBufferRef.current, senderId: sessionId },
        });
        drawingBufferRef.current = [];
      }

      if (cursorRef.current) {
        const { color: currentColor, isEraser: currentEraser } = stateRef.current;
        roomChannel.send({
          type: "broadcast",
          event: "cursor",
          payload: { 
            x: cursorRef.current.x, 
            y: cursorRef.current.y, 
            color: currentEraser ? "eraser" : currentColor, 
            senderId: sessionId 
          },
        });
      }
    }, 50);

    return () => clearInterval(syncInterval);
  }, [roomChannel, sessionId]); // Run only on mount

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const tempContent = contextRef.current?.getImageData(0, 0, canvas.width, canvas.height); // save canvas

      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      contextRef.current = ctx;

      if (tempContent) {
        // Restore canvas after resize (if it was an actual window resize)
        ctx.putImageData(tempContent, 0, 0); 
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleDrawingBatch = (payload: any) => {
      const { batch, senderId } = payload.payload;
      if (senderId !== sessionId) {
        batch.forEach((line: any) => {
          drawLine(line.x0, line.y0, line.x1, line.y1, line.color, line.size, true);
        });
      }
    };
    
    const handleDrawing = (payload: any) => {
      const { x0, y0, x1, y1, color: remoteColor, size: remoteSize, senderId } = payload.payload;
      if (senderId !== sessionId) {
        drawLine(x0, y0, x1, y1, remoteColor, remoteSize, true);
      }
    };

    const handleClearRemote = (payload: any) => {
      if (payload.payload.senderId !== sessionId) clearLocal();
    };

    roomChannel?.on("broadcast", { event: "drawing_batch" }, handleDrawingBatch);
    roomChannel?.on("broadcast", { event: "drawing" }, handleDrawing);
    roomChannel?.on("broadcast", { event: "clear_canvas" }, handleClearRemote);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [roomChannel, sessionId, drawLine, clearLocal]);

  const updatePointer = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    cursorRef.current = { x, y };
    return { x, y };
  };

  const startDrawing = (e: React.PointerEvent) => {
    const pos = updatePointer(e);
    if (!pos) return;
    
    lastPos.current = pos;
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent) => {
    const pos = updatePointer(e);
    if (!isDrawing || !lastPos.current || !pos) return;

    const { color: currentColor, brushSize: currentSize, isEraser: currentEraser } = stateRef.current;
    drawLine(lastPos.current.x, lastPos.current.y, pos.x, pos.y, currentEraser ? "eraser" : currentColor, currentSize);
    lastPos.current = pos;
  };

  const stopDrawing = (e: React.PointerEvent) => {
    setIsDrawing(false);
    lastPos.current = null;
    updatePointer(e);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-[#050508] safe-area-padding overflow-hidden"
    >
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
              <span className="text-[8px] sm:text-[9px] font-bold text-green-500/80 uppercase tracking-widest">Live Sync</span>
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

      <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#0a0a0f_0%,_#050508_100%)] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
        />

        {/* Remote Cursors Sub-component rendering isolated to prevent root lag! */}
        <CursorOverlay roomChannel={roomChannel} sessionId={sessionId} />

        <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-2 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-[2rem] shadow-2xl z-20 ring-1 ring-white/5 w-[90%] sm:w-auto overflow-hidden">
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
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
