import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  opacity: number;
  emoji: string;
}

interface EmojiExplosionOverlayProps {
  emoji: string | null;
  onComplete?: () => void;
}

export const EmojiExplosionOverlay: React.FC<EmojiExplosionOverlayProps> = ({
  emoji,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!emoji) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Create particles radiating from center
    const particleCount = 45;
    const particles: Particle[] = [];
    const emojiSymbol = emoji || "✨";

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 14 + 6;
      particles.push({
        id: i,
        x: width / 2,
        y: height / 2 + 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6, // Initial upward velocity
        size: Math.random() * 24 + 20,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        opacity: 1,
      });
    }

    let animationFrameId: number;
    let startTime = performance.now();

    const render = (time: number) => {
      const elapsed = time - startTime;
      ctx.clearRect(0, 0, width, height);

      let alive = false;
      particles.forEach((p) => {
        if (p.opacity > 0.02) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.35; // Gravity
          p.vx *= 0.98; // Friction
          p.rotation += p.vRot;
          p.opacity -= 0.015;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.font = `${p.size}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(emojiSymbol, 0, 0);
          ctx.restore();
        }
      });

      if (alive && elapsed < 2500) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        if (onComplete) onComplete();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [emoji, onComplete]);

  if (!emoji) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[110] pointer-events-none w-full h-full"
    />
  );
};

export default EmojiExplosionOverlay;
