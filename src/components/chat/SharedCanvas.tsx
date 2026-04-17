import { useRef, useEffect, useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { Eraser, Trash2, ArrowLeft, MousePointer2, CheckCircle2, Download, Sparkles, Pencil, Square, Circle, Minus, ArrowUpRight, Type, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RoomChannel } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface SharedCanvasProps {
  roomChannel?: RoomChannel;
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
  { name: "Rainbow", value: "rainbow" },
];

const BRUSH_SIZES = [
  { label: "Fine", value: 3 },
  { label: "Medium", value: 6 },
  { label: "Thick", value: 12 },
  { label: "Bold", value: 24 },
];

// Extracted to prevent re-rendering the entire Canvas on every cursor move (fixes lag)
const CursorOverlay = memo(({ roomChannel, sessionId }: { roomChannel?: RoomChannel; sessionId?: string }) => {
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

    roomChannel.on?.("broadcast", { event: "cursor" }, handleCursor);
    roomChannel.subscribe?.();

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
  const draftCanvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const draftContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#7c3aed");
  const [brushSize, setBrushSize] = useState(6);
  const [activeTool, setActiveTool] = useState<"draw" | "eraser" | "line" | "arrow" | "rect" | "circle" | "text">("draw");
  const [isGlow, setIsGlow] = useState(false);
  const hueRef = useRef(0);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  // Undo/Redo history
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Text tool overlay
  const [textOverlay, setTextOverlay] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState("");

  // Use refs for UI state so drawing and sync listeners don't re-trigger and run resize (which clears canvas!)
  const stateRef = useRef({ color: "#7c3aed", brushSize: 6, activeTool: "draw", isGlow: false });

  useEffect(() => {
    stateRef.current = { color, brushSize, activeTool, isGlow };
  }, [color, brushSize, activeTool, isGlow]);

  // Network batching and cursor tracking
  const drawingBufferRef = useRef<any[]>([]);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snapshot = canvas.toDataURL();
    // Drop any redo history when new action is taken
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(snapshot);
    // Keep max 30 snapshots to avoid memory bloat
    if (historyRef.current.length > 30) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const applySnapshot = useCallback((snapshot: string) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    const img = new Image();
    img.src = snapshot;
    img.onload = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.drawImage(img, 0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
    };
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    applySnapshot(historyRef.current[historyIndexRef.current]);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(true);
  }, [applySnapshot]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    applySnapshot(historyRef.current[historyIndexRef.current]);
    setCanUndo(true);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, [applySnapshot]);

  const clearLocal = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    saveSnapshot();
  }, [saveSnapshot]);

  const handleClear = useCallback(() => {
    clearLocal();
    roomChannel?.send({
      type: "broadcast",
      event: "clear_canvas",
      payload: { senderId: sessionId },
    });
  }, [clearLocal, roomChannel, sessionId]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    // Fill dark background
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const dpr = window.devicePixelRatio || 1;
    const logoSize = 28 * dpr;
    const padding = 14 * dpr;
    const textFontSize = 11 * dpr;
    const subFontSize = 9 * dpr;
    const labelHeight = textFontSize + subFontSize + 6 * dpr;
    const totalWidth = logoSize + 8 * dpr + 120 * dpr;
    const totalHeight = logoSize + padding * 2;

    // Watermark background pill
    const bgX = tempCanvas.width - totalWidth - padding;
    const bgY = tempCanvas.height - totalHeight - padding;
    const bgW = totalWidth + padding;
    const bgH = totalHeight;
    const bgRadius = 12 * dpr;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(bgX + bgRadius, bgY);
    ctx.lineTo(bgX + bgW - bgRadius, bgY);
    ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + bgRadius);
    ctx.lineTo(bgX + bgW, bgY + bgH - bgRadius);
    ctx.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - bgRadius, bgY + bgH);
    ctx.lineTo(bgX + bgRadius, bgY + bgH);
    ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - bgRadius);
    ctx.lineTo(bgX, bgY + bgRadius);
    ctx.quadraticCurveTo(bgX, bgY, bgX + bgRadius, bgY);
    ctx.closePath();
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fill();
    ctx.restore();

    const logoX = bgX + padding / 1.5;
    const logoY = bgY + (totalHeight - logoSize) / 2;
    const textX = logoX + logoSize + 8 * dpr;
    const textY = bgY + (totalHeight - labelHeight) / 2;

    const logoImg = new Image();
    logoImg.src = "/logo.png";
    logoImg.onload = () => {
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

      ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
      ctx.font = `700 ${textFontSize}px Inter, sans-serif`;
      ctx.fillText("LiveTalk by Likki", textX, textY + textFontSize);

      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.font = `500 ${subFontSize}px Inter, sans-serif`;
      ctx.fillText("livetalkbylikki.netlify.app", textX, textY + textFontSize + subFontSize + 4 * dpr);

      const url = tempCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `LiveTalk-Doodle-${Date.now()}.png`;
      a.click();
    };

    logoImg.onerror = () => {
      // Fallback if logo can't load — download without watermark branding image
      ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
      ctx.font = `700 ${textFontSize}px Inter, sans-serif`;
      ctx.fillText("LiveTalk by Likki", textX, textY + textFontSize);

      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.font = `500 ${subFontSize}px Inter, sans-serif`;
      ctx.fillText("livetalkbylikki.netlify.app", textX, textY + textFontSize + subFontSize + 4 * dpr);

      const url = tempCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `LiveTalk-Doodle-${Date.now()}.png`;
      a.click();
    };
  };

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, tool: string, x0: number, y0: number, x1: number, y1: number, c: string, s: number, glow = false) => {
    let actualColor = c;
    if (c === "rainbow") {
      actualColor = `hsl(${hueRef.current}, 100%, 60%)`;
      // We don't advance the hue here so the draft shape stays one color, it will advance on commit
    }

    ctx.beginPath();
    ctx.strokeStyle = actualColor;
    ctx.lineWidth = s;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (glow) {
      ctx.shadowBlur = s * 2.5;
      ctx.shadowColor = actualColor;
    } else {
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    }

    if (tool === "line") {
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
    } else if (tool === "arrow") {
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      const angle = Math.atan2(y1 - y0, x1 - x0);
      const headLength = s * 3;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - headLength * Math.cos(angle - Math.PI / 6), y1 - headLength * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - headLength * Math.cos(angle + Math.PI / 6), y1 - headLength * Math.sin(angle + Math.PI / 6));
    } else if (tool === "rect") {
      ctx.rect(x0, y0, x1 - x0, y1 - y0);
    } else if (tool === "circle") {
      const r = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
      ctx.arc(x0, y0, r, 0, 2 * Math.PI);
    }

    ctx.stroke();
    ctx.closePath();
    ctx.shadowBlur = 0;
  }, []);

  const commitShape = useCallback((tool: string, x0: number, y0: number, x1: number, y1: number, c: string, s: number, isRemote = false, glow = false) => {
    const ctx = contextRef.current;
    if (!ctx) return;
    
    if (c === "rainbow" && !isRemote) hueRef.current = (hueRef.current + 15) % 360;
    
    drawShape(ctx, tool, x0, y0, x1, y1, c, s, glow);
    
    if (!isRemote) {
      const { color: currentColor, brushSize: currentSize, isGlow: currentGlow } = stateRef.current;
      roomChannel?.send({
        type: "broadcast",
        event: "shape",
        payload: { tool, x0, y0, x1, y1, color: currentColor, size: currentSize, glow: currentGlow, senderId: sessionId },
      });
      saveSnapshot();
    }
  }, [drawShape, roomChannel, sessionId, saveSnapshot]);

  const drawLine = useCallback((x0: number, y0: number, x1: number, y1: number, c: string, s: number, isRemote = false, glow = false) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    let actualColor = c;
    if (c === "rainbow") {
      actualColor = `hsl(${hueRef.current}, 100%, 60%)`;
      hueRef.current = (hueRef.current + 3) % 360; 
    }

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    
    if (c === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.shadowBlur = 0;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = actualColor;
      
      if (glow) {
        ctx.shadowBlur = s * 2.5;
        ctx.shadowColor = actualColor;
      } else {
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      }
    }
    
    ctx.lineWidth = s;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.closePath();
    
    ctx.shadowBlur = 0;

    if (!isRemote) {
      const { color: currentColor, brushSize: currentSize, activeTool, isGlow: currentGlow } = stateRef.current;
      drawingBufferRef.current.push({ 
        x0, y0, x1, y1, 
        color: activeTool === "eraser" ? "eraser" : currentColor, 
        size: currentSize,
        glow: currentGlow
      });
      // Save snapshot after each freehand batch flush — done in syncInterval
    }
  }, []); // Empty deps avoids recreating drawLine on color change, preventing canvas clear

  // Save snapshot periodically when freehand buffer empties
  const lastBufferLenRef = useRef(0);
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (!roomChannel || !sessionId) return;
      
      const batchLen = drawingBufferRef.current.length;
      if (batchLen > 0) {
        roomChannel.send({
          type: "broadcast",
          event: "drawing_batch",
          payload: { batch: drawingBufferRef.current, senderId: sessionId },
        });
        drawingBufferRef.current = [];
        lastBufferLenRef.current = 0;
      } else if (lastBufferLenRef.current > 0) {
        // Buffer just flushed, save snapshot
        saveSnapshot();
        lastBufferLenRef.current = 0;
      }

      if (cursorRef.current) {
        const { color: currentColor, activeTool } = stateRef.current;
        roomChannel.send({
          type: "broadcast",
          event: "cursor",
          payload: { 
            x: cursorRef.current.x, 
            y: cursorRef.current.y, 
            color: activeTool === "eraser" ? "eraser" : currentColor, 
            senderId: sessionId 
          },
        });
      }
    }, 50);

    return () => clearInterval(syncInterval);
  }, [roomChannel, sessionId, saveSnapshot]); // Run only on mount

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Store current drawing before resizing using a temporary canvas.
      // This is much safer than getImageData/putImageData for keeping scale correct.
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (canvas.width > 0 && canvas.height > 0) {
        tempCtx?.drawImage(canvas, 0, 0);
      }

      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      if (draftCanvasRef.current) {
        draftCanvasRef.current.width = rect.width * window.devicePixelRatio;
        draftCanvasRef.current.height = rect.height * window.devicePixelRatio;
        const draftCtx = draftCanvasRef.current.getContext("2d", { willReadFrequently: true });
        if (draftCtx) {
          draftCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
          draftCtx.lineCap = "round";
          draftCtx.lineJoin = "round";
          draftContextRef.current = draftCtx;
        }
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      contextRef.current = ctx;

      // Restore the drawing
      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(
          tempCanvas,
          0,
          0,
          tempCanvas.width / window.devicePixelRatio,
          tempCanvas.height / window.devicePixelRatio
        );
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => handleResize());
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    } else {
      resizeObserver.observe(canvas);
    }

    const handleDrawingBatch = (payload: any) => {
      const { batch, senderId } = payload.payload;
      if (senderId !== sessionId) {
        batch.forEach((line: any) => {
          drawLine(line.x0, line.y0, line.x1, line.y1, line.color, line.size, true, line.glow);
        });
      }
    };
    
    const handleDrawing = (payload: any) => {
      const { x0, y0, x1, y1, color: remoteColor, size: remoteSize, senderId, glow } = payload.payload;
      if (senderId !== sessionId) {
        drawLine(x0, y0, x1, y1, remoteColor, remoteSize, true, glow);
      }
    };

    const handleShape = (payload: any) => {
      const { tool, x0, y0, x1, y1, color: remoteColor, size: remoteSize, senderId, glow } = payload.payload;
      if (senderId !== sessionId) {
        commitShape(tool, x0, y0, x1, y1, remoteColor, remoteSize, true, glow);
      }
    };

    const handleClearRemote = (payload: any) => {
      if (payload.payload.senderId !== sessionId) clearLocal();
    };

    const handleTextRemote = (payload: any) => {
      const { text, x, y, color: remoteColor, size, senderId, glow } = payload.payload;
      if (senderId !== sessionId) {
        const ctx = contextRef.current;
        if (!ctx) return;
        ctx.save();
        ctx.font = `bold ${size}px Inter, sans-serif`;
        ctx.fillStyle = remoteColor;
        if (glow) { ctx.shadowBlur = 12; ctx.shadowColor = remoteColor; }
        ctx.fillText(text, x, y);
        ctx.restore();
      }
    };


    roomChannel?.on?.("broadcast", { event: "drawing_batch" }, handleDrawingBatch);
    roomChannel?.on?.("broadcast", { event: "drawing" }, handleDrawing);
    roomChannel?.on?.("broadcast", { event: "shape" }, handleShape);
    roomChannel?.on?.("broadcast", { event: "text_draw" }, handleTextRemote);
    roomChannel?.on?.("broadcast", { event: "clear_canvas" }, handleClearRemote);
    roomChannel?.subscribe?.();

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [roomChannel, sessionId, drawLine, clearLocal]);

  // Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z / Ctrl+Y (redo)
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey && e.shiftKey && e.key === "z") || (e.ctrlKey && e.key === "y")) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "Escape" && textOverlay) {
        setTextOverlay(null);
        setTextInput("");
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [handleUndo, handleRedo, textOverlay]);

  // Commit text to canvas
  const commitText = useCallback(() => {
    if (!textInput.trim() || !textOverlay || !contextRef.current) return;
    const ctx = contextRef.current;
    const { color: currentColor, brushSize: currentSize, isGlow: currentGlow } = stateRef.current;
    const actualColor = currentColor === "rainbow" ? `hsl(${hueRef.current}, 100%, 60%)` : currentColor;
    const fontSize = Math.max(14, currentSize * 3);

    ctx.save();
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = actualColor;
    if (currentGlow) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = actualColor;
    }
    ctx.fillText(textInput.trim(), textOverlay.x, textOverlay.y);
    ctx.restore();

    // Sync text to remote
    roomChannel?.send({
      type: "broadcast",
      event: "text_draw",
      payload: { text: textInput.trim(), x: textOverlay.x, y: textOverlay.y, color: actualColor, size: fontSize, glow: currentGlow, senderId: sessionId },
    });

    saveSnapshot();
    setTextOverlay(null);
    setTextInput("");
  }, [textInput, textOverlay, roomChannel, sessionId, saveSnapshot]);

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
    
    const { activeTool } = stateRef.current;

    // Text tool: show overlay at click position, don't start drawing
    if (activeTool === "text") {
      setTextOverlay({ x: pos.x, y: pos.y });
      setTextInput("");
      return;
    }
    
    lastPos.current = pos;
    startPos.current = pos;
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent) => {
    const pos = updatePointer(e);
    if (!isDrawing || !lastPos.current || !pos || !startPos.current) return;

    const { activeTool, color: currentColor, brushSize: currentSize, isGlow: currentGlow } = stateRef.current;
    
    if (activeTool === "draw" || activeTool === "eraser") {
      drawLine(lastPos.current.x, lastPos.current.y, pos.x, pos.y, activeTool === "eraser" ? "eraser" : currentColor, currentSize, false, currentGlow);
      lastPos.current = pos;
    } else {
      // Draw shape onto draft canvas
      const draftCtx = draftContextRef.current;
      const draftCanvas = draftCanvasRef.current;
      if (draftCtx && draftCanvas) {
        draftCtx.clearRect(0, 0, draftCanvas.width, draftCanvas.height);
        drawShape(draftCtx, activeTool, startPos.current.x, startPos.current.y, pos.x, pos.y, currentColor, currentSize, currentGlow);
      }
    }
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (isDrawing) {
      const pos = updatePointer(e);
      const { activeTool, color: currentColor, brushSize: currentSize, isGlow: currentGlow } = stateRef.current;
      
      if (activeTool !== "draw" && activeTool !== "eraser" && startPos.current && pos) {
        // Clear draft canvas
        const draftCtx = draftContextRef.current;
        const draftCanvas = draftCanvasRef.current;
        if (draftCtx && draftCanvas) draftCtx.clearRect(0, 0, draftCanvas.width, draftCanvas.height);
        
        // Commit shape to main canvas
        commitShape(activeTool, startPos.current.x, startPos.current.y, pos.x, pos.y, currentColor, currentSize, false, currentGlow);
      }
    }
    
    setIsDrawing(false);
    lastPos.current = null;
    startPos.current = null;
    updatePointer(e);
  };

  const canvasContent = (
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
          className="absolute inset-0 w-full h-full touch-none"
        />
        
        <canvas
          ref={draftCanvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair z-10"
        />

        {/* Text Tool Input Overlay */}
        <AnimatePresence>
          {textOverlay && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-40 pointer-events-auto"
              style={{ left: textOverlay.x, top: textOverlay.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitText();
                  if (e.key === "Escape") {
                    setTextOverlay(null);
                    setTextInput("");
                  }
                }}
                onBlur={commitText}
                placeholder="Type here..."
                className="bg-black/80 backdrop-blur-md border border-primary/50 text-white rounded-lg px-3 py-1.5 focus:outline-none ring-2 ring-primary/20 shadow-2xl min-w-[120px]"
                style={{
                  color: color === "rainbow" ? `hsl(${hueRef.current}, 100%, 60%)` : color,
                  fontSize: Math.max(14, brushSize * 3),
                  fontWeight: 'bold'
                }}
              />
              <div className="mt-1 flex gap-1 justify-end">
                <button onClick={() => { setTextOverlay(null); setTextInput(""); }} className="text-[10px] text-white/40 hover:text-white bg-white/5 px-1.5 rounded uppercase font-bold tracking-tighter">Cancel</button>
                <button onClick={commitText} className="text-[10px] text-primary hover:text-primary/80 bg-primary/10 px-1.5 rounded uppercase font-bold tracking-tighter">Done</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Remote Cursors Sub-component rendering isolated to prevent root lag! */}
        <CursorOverlay roomChannel={roomChannel} sessionId={sessionId} />

        <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-row items-center gap-2 sm:gap-3 p-2 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-[2rem] shadow-2xl z-20 ring-1 ring-white/5 w-[95%] sm:w-auto overflow-x-auto no-scrollbar pointer-events-auto">
          
          <div className="flex flex-row items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/5 shrink-0">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    setColor(c.value);
                    if (activeTool === "eraser") setActiveTool("draw");
                  }}
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl transition-all active:scale-90 relative shrink-0",
                    color === c.value && activeTool !== "eraser" ? "scale-105 ring-2 ring-primary ring-offset-2 sm:ring-offset-4 ring-offset-black" : "opacity-40 hover:opacity-100"
                  )}
                  style={c.value === "rainbow" ? { background: "linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)" } : { backgroundColor: c.value }}
                >
                  {color === c.value && activeTool !== "eraser" && (
                    <motion.div layoutId="activeColor" className="absolute inset-0 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white drop-shadow-md" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>

            <div className="h-8 w-px bg-white/10 shrink-0 mx-1" />

            <div className="flex items-center gap-1.5 pr-1 shrink-0">
              {[
                { id: "draw", icon: Pencil },
                { id: "line", icon: Minus },
                { id: "arrow", icon: ArrowUpRight },
                { id: "rect", icon: Square },
                { id: "circle", icon: Circle },
                { id: "text", icon: Type }
              ].map(t => (
                <Button
                  key={t.id}
                  variant={activeTool === t.id ? "glow" : "ghost"}
                  size="icon"
                  className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl shrink-0", activeTool !== t.id && "text-white/40 hover:text-white")}
                  onClick={() => setActiveTool(t.id as any)}
                  title={`Tool: ${t.id}`}
                >
                  <t.icon className="h-4 w-4" />
                </Button>
              ))}
              
              <div className="h-6 w-px bg-white/10 mx-0.5 shrink-0" />

              <Button
                variant={activeTool === "eraser" ? "glow" : "ghost"}
                size="icon"
                className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl shrink-0", activeTool !== "eraser" && "text-white/40 hover:text-white")}
                onClick={() => setActiveTool("eraser")}
                title="Eraser"
              >
                <Eraser className="h-4 w-4" />
              </Button>
              <Button
                variant={isGlow ? "glow" : "ghost"}
                size="icon"
                className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl shrink-0", !isGlow && "text-white/40 hover:text-white")}
                onClick={() => setIsGlow(!isGlow)}
                title="Neon Glow"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl text-red-500/60 hover:text-red-500 hover:bg-red-500/10 shrink-0"
                onClick={handleClear}
                title="Clear Canvas"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <div className="h-6 w-px bg-white/10 mx-0.5 shrink-0" />

              <Button
                variant="ghost"
                size="icon"
                className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl shrink-0", !canUndo && "opacity-20 pointer-events-none")}
                onClick={handleUndo}
                title="Undo (Ctrl+Z)"
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl shrink-0", !canRedo && "opacity-20 pointer-events-none")}
                onClick={handleRedo}
                title="Redo (Ctrl+Y)"
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10 shrink-0 mx-1" />

          <div className="flex items-center gap-1 p-1 shrink-0">
            {BRUSH_SIZES.map((size) => (
              <button
                key={size.value}
                onClick={() => setBrushSize(size.value)}
                className={cn(
                  "w-8 h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all px-2 shrink-0",
                  brushSize === size.value && activeTool !== "eraser" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-white/40 hover:bg-white/5 hover:text-white"
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
            
            <div className="h-8 w-px bg-white/10 mx-1 shrink-0" />
            
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg sm:rounded-xl text-white/40 hover:text-white hover:bg-white/5 shrink-0 mx-1"
              onClick={handleDownload}
              title="Download Masterpiece"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-2.5 sm:py-3 bg-black/40 border-t border-white/5 backdrop-blur-xl flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-white/20">
          <span className="truncate max-w-[60px] xs:max-w-none">{activeTool}</span>
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

  return createPortal(canvasContent, document.body);
};

export default SharedCanvas;
