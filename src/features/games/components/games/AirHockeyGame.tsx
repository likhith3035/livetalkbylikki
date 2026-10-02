import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomState, AirHockeyGameState } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";
import {
  Trophy,
  Flame,
  Zap,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface AirHockeyGameProps {
  room: GameRoomState<AirHockeyGameState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<AirHockeyGameState>) => void;
}

const TABLE_W = 500;
const TABLE_H = 800;
const GOAL_WIDTH = 180;
const GOAL_X_START = (TABLE_W - GOAL_WIDTH) / 2;
const GOAL_X_END = GOAL_X_START + GOAL_WIDTH;

const PUCK_RADIUS = 16;
const PADDLE_RADIUS = 32;
const MAX_PUCK_SPEED = 24;
const FRICTION = 0.992;
const TARGET_SCORE = 5;

export const AirHockeyGame: React.FC<AirHockeyGameProps> = ({
  room,
  myPlayerId,
  isMyTurn,
  onLocalMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isHost = room.players.host.id === myPlayerId;
  const isAIMode = room.mode === "ai";
  const isLocalMode = room.mode === "local";

  const hostColor = "#3b82f6"; // Blue
  const guestColor = "#f43f5e"; // Rose / Red
  const puckColor = "#38bdf8"; // Neon Cyan

  // Live game physics ref (prevents re-renders during 60fps canvas loop)
  const physicsRef = useRef({
    puck: { x: TABLE_W / 2, y: TABLE_H / 2, vx: 0, vy: 0 },
    p1Paddle: { x: TABLE_W / 2, y: TABLE_H - 120, vx: 0, vy: 0, targetX: TABLE_W / 2, targetY: TABLE_H - 120 },
    p2Paddle: { x: TABLE_W / 2, y: 120, vx: 0, vy: 0, targetX: TABLE_W / 2, targetY: 120 },
    p1Score: 0,
    p2Score: 0,
    isPaused: false,
    goalFlash: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    puckTrail: [] as { x: number; y: number }[],
  });

  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [goalText, setGoalText] = useState<string | null>(null);

  // Sync state from room props on initial load or reset
  useEffect(() => {
    const raw = room.gameState as any;
    if (raw) {
      physicsRef.current.p1Score = raw.hostScore || 0;
      physicsRef.current.p2Score = raw.guestScore || 0;
      setScores({ p1: raw.hostScore || 0, p2: raw.guestScore || 0 });
    }
  }, [room.gameState]);

  // Spawn visual sparks
  const spawnSparks = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      physicsRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
      });
    }
  };

  // Reset puck after a goal
  const resetPuck = (towardsPlayer: "p1" | "p2") => {
    physicsRef.current.puck = {
      x: TABLE_W / 2,
      y: TABLE_H / 2,
      vx: 0,
      vy: towardsPlayer === "p1" ? 3 : -3,
    };
    physicsRef.current.puckTrail = [];
    physicsRef.current.isPaused = true;
    setTimeout(() => {
      physicsRef.current.isPaused = false;
    }, 1000);
  };

  // Main 60 FPS Physics & Render Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const p = physicsRef.current;

      // ── 1. UPDATE PADDLES ──
      // P1 Paddle (Bottom)
      const p1Dx = p.p1Paddle.targetX - p.p1Paddle.x;
      const p1Dy = p.p1Paddle.targetY - p.p1Paddle.y;
      p.p1Paddle.vx = p1Dx * 0.4;
      p.p1Paddle.vy = p1Dy * 0.4;
      p.p1Paddle.x += p.p1Paddle.vx;
      p.p1Paddle.y += p.p1Paddle.vy;

      // Clamp P1 to bottom half
      p.p1Paddle.x = Math.max(PADDLE_RADIUS, Math.min(TABLE_W - PADDLE_RADIUS, p.p1Paddle.x));
      p.p1Paddle.y = Math.max(TABLE_H / 2 + PADDLE_RADIUS, Math.min(TABLE_H - PADDLE_RADIUS, p.p1Paddle.y));

      // P2 Paddle (Top) - AI or Player 2
      if (isAIMode) {
        // AI Logic: tracks puck when puck is in top half, defends goal when puck is low
        let aiTargetX = TABLE_W / 2;
        let aiTargetY = 120;

        if (p.puck.y < TABLE_H * 0.6) {
          // Puck is reachable
          aiTargetX = p.puck.x + (p.puck.vx * 4); // Predictive lead
          aiTargetY = Math.min(TABLE_H / 2 - PADDLE_RADIUS - 10, Math.max(80, p.puck.y - 10));
        } else {
          // Guard center goal
          aiTargetX = TABLE_W / 2 + (p.puck.x - TABLE_W / 2) * 0.3;
          aiTargetY = 100;
        }

        const aiDx = aiTargetX - p.p2Paddle.x;
        const aiDy = aiTargetY - p.p2Paddle.y;
        p.p2Paddle.vx = aiDx * 0.18;
        p.p2Paddle.vy = aiDy * 0.18;
        p.p2Paddle.x += p.p2Paddle.vx;
        p.p2Paddle.y += p.p2Paddle.vy;
      } else {
        const p2Dx = p.p2Paddle.targetX - p.p2Paddle.x;
        const p2Dy = p.p2Paddle.targetY - p.p2Paddle.y;
        p.p2Paddle.vx = p2Dx * 0.4;
        p.p2Paddle.vy = p2Dy * 0.4;
        p.p2Paddle.x += p.p2Paddle.vx;
        p.p2Paddle.y += p.p2Paddle.vy;
      }

      // Clamp P2 to top half
      p.p2Paddle.x = Math.max(PADDLE_RADIUS, Math.min(TABLE_W - PADDLE_RADIUS, p.p2Paddle.x));
      p.p2Paddle.y = Math.max(PADDLE_RADIUS, Math.min(TABLE_H / 2 - PADDLE_RADIUS, p.p2Paddle.y));

      // ── 2. UPDATE PUCK ──
      if (!p.isPaused && room.status !== "round_over" && room.status !== "game_over") {
        p.puck.vx *= FRICTION;
        p.puck.vy *= FRICTION;

        // Speed limit
        const curSpeed = Math.sqrt(p.puck.vx * p.puck.vx + p.puck.vy * p.puck.vy);
        if (curSpeed > MAX_PUCK_SPEED) {
          p.puck.vx = (p.puck.vx / curSpeed) * MAX_PUCK_SPEED;
          p.puck.vy = (p.puck.vy / curSpeed) * MAX_PUCK_SPEED;
        }

        p.puck.x += p.puck.vx;
        p.puck.y += p.puck.vy;

        // Trail record
        p.puckTrail.push({ x: p.puck.x, y: p.puck.y });
        if (p.puckTrail.length > 8) p.puckTrail.shift();

        // Wall collisions (Left & Right)
        if (p.puck.x - PUCK_RADIUS <= 0) {
          p.puck.x = PUCK_RADIUS;
          p.puck.vx = -p.puck.vx * 0.95;
          spawnSparks(p.puck.x, p.puck.y, puckColor, 6);
          gameAudio.playClick();
        } else if (p.puck.x + PUCK_RADIUS >= TABLE_W) {
          p.puck.x = TABLE_W - PUCK_RADIUS;
          p.puck.vx = -p.puck.vx * 0.95;
          spawnSparks(p.puck.x, p.puck.y, puckColor, 6);
          gameAudio.playClick();
        }

        // Top Wall Collision or Top Goal
        if (p.puck.y - PUCK_RADIUS <= 0) {
          if (p.puck.x >= GOAL_X_START && p.puck.x <= GOAL_X_END) {
            // GOAL FOR PLAYER 1 (Bottom)!
            p.p1Score += 1;
            setScores({ p1: p.p1Score, p2: p.p2Score });
            spawnSparks(p.puck.x, 20, hostColor, 35);
            gameAudio.playWin();
            setGoalText("🎉 GOAL FOR PLAYER 1!");
            setTimeout(() => setGoalText(null), 1500);

            if (p.p1Score >= TARGET_SCORE) {
              handleMatchEnd(room.players.host.id);
            } else {
              resetPuck("p2");
            }
          } else {
            p.puck.y = PUCK_RADIUS;
            p.puck.vy = -p.puck.vy * 0.95;
            spawnSparks(p.puck.x, p.puck.y, puckColor, 6);
            gameAudio.playClick();
          }
        }

        // Bottom Wall Collision or Bottom Goal
        if (p.puck.y + PUCK_RADIUS >= TABLE_H) {
          if (p.puck.x >= GOAL_X_START && p.puck.x <= GOAL_X_END) {
            // GOAL FOR PLAYER 2 (Top)!
            p.p2Score += 1;
            setScores({ p1: p.p1Score, p2: p.p2Score });
            spawnSparks(p.puck.x, TABLE_H - 20, guestColor, 35);
            gameAudio.playWin();
            setGoalText("🔥 GOAL FOR PLAYER 2!");
            setTimeout(() => setGoalText(null), 1500);

            if (p.p2Score >= TARGET_SCORE) {
              handleMatchEnd(room.players.guest?.id || "guest");
            } else {
              resetPuck("p1");
            }
          } else {
            p.puck.y = TABLE_H - PUCK_RADIUS;
            p.puck.vy = -p.puck.vy * 0.95;
            spawnSparks(p.puck.x, p.puck.y, puckColor, 6);
            gameAudio.playClick();
          }
        }

        // Paddle - Puck Elastic Collisions
        const checkPaddleHit = (pad: { x: number; y: number; vx: number; vy: number }, color: string) => {
          const dx = p.puck.x - pad.x;
          const dy = p.puck.y - pad.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = PUCK_RADIUS + PADDLE_RADIUS;

          if (dist < minDist) {
            // Normal collision vector
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);

            // Separate overlapping circles
            p.puck.x = pad.x + nx * minDist;
            p.puck.y = pad.y + ny * minDist;

            // Velocity reflection + impulse from paddle motion
            const impactSpeed = (pad.vx * nx + pad.vy * ny);
            const reboundVelocity = Math.max(10, Math.abs(impactSpeed) * 1.5 + 8);

            p.puck.vx = nx * reboundVelocity + pad.vx * 0.5;
            p.puck.vy = ny * reboundVelocity + pad.vy * 0.5;

            spawnSparks(p.puck.x, p.puck.y, color, 14);
            gameAudio.playMove();
            if (navigator.vibrate) navigator.vibrate(30);
          }
        };

        checkPaddleHit(p.p1Paddle, hostColor);
        checkPaddleHit(p.p2Paddle, guestColor);
      }

      // ── 3. RENDER CANVAS ──
      ctx.clearRect(0, 0, TABLE_W, TABLE_H);

      // A. Table Floor & Neon Border
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, TABLE_W, TABLE_H);

      // Grid pattern
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      for (let x = 40; x < TABLE_W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, TABLE_H);
        ctx.stroke();
      }
      for (let y = 40; y < TABLE_H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(TABLE_W, y);
        ctx.stroke();
      }

      // Outer glow boundary
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, TABLE_W - 8, TABLE_H - 8);

      // Center Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(0, TABLE_H / 2);
      ctx.lineTo(TABLE_W, TABLE_H / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center Face-Off Circle
      ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(TABLE_W / 2, TABLE_H / 2, 70, 0, Math.PI * 2);
      ctx.stroke();

      // Center Dot
      ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
      ctx.beginPath();
      ctx.arc(TABLE_W / 2, TABLE_H / 2, 6, 0, Math.PI * 2);
      ctx.fill();

      // Top Goal Net
      ctx.fillStyle = "rgba(244, 63, 94, 0.3)";
      ctx.fillRect(GOAL_X_START, 0, GOAL_WIDTH, 14);
      ctx.strokeStyle = guestColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(GOAL_X_START, 0, GOAL_WIDTH, 14);

      // Bottom Goal Net
      ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
      ctx.fillRect(GOAL_X_START, TABLE_H - 14, GOAL_WIDTH, 14);
      ctx.strokeStyle = hostColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(GOAL_X_START, TABLE_H - 14, GOAL_WIDTH, 14);

      // B. Puck Motion Trail
      p.puckTrail.forEach((t, i) => {
        const alpha = (i / p.puckTrail.length) * 0.4;
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, PUCK_RADIUS * (0.6 + (i / p.puckTrail.length) * 0.4), 0, Math.PI * 2);
        ctx.fill();
      });

      // C. Render Puck
      ctx.shadowColor = puckColor;
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(p.puck.x, p.puck.y, PUCK_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = puckColor;
      ctx.beginPath();
      ctx.arc(p.puck.x, p.puck.y, PUCK_RADIUS - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // Reset

      // D. Render Paddles
      // P1 Paddle (Blue Bottom)
      ctx.shadowColor = hostColor;
      ctx.shadowBlur = 20;
      ctx.fillStyle = hostColor;
      ctx.beginPath();
      ctx.arc(p.p1Paddle.x, p.p1Paddle.y, PADDLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(p.p1Paddle.x, p.p1Paddle.y, PADDLE_RADIUS - 10, 0, Math.PI * 2);
      ctx.fill();

      // P2 Paddle (Red / Pink Top)
      ctx.shadowColor = guestColor;
      ctx.shadowBlur = 20;
      ctx.fillStyle = guestColor;
      ctx.beginPath();
      ctx.arc(p.p2Paddle.x, p.p2Paddle.y, PADDLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(p.p2Paddle.x, p.p2Paddle.y, PADDLE_RADIUS - 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // E. Render Particle Sparks
      for (let i = p.particles.length - 1; i >= 0; i--) {
        const part = p.particles[i];
        part.x += part.vx;
        part.y += part.vy;
        part.life -= 0.04;
        if (part.life <= 0) {
          p.particles.splice(i, 1);
        } else {
          ctx.fillStyle = part.color;
          ctx.globalAlpha = part.life;
          ctx.beginPath();
          ctx.arc(part.x, part.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isAIMode, room.status]);

  // Handle Match Winner
  const handleMatchEnd = (winnerId: string) => {
    const raw = room.gameState as any;
    const nextState: AirHockeyGameState = {
      tableWidth: TABLE_W,
      tableHeight: TABLE_H,
      puck: { x: TABLE_W / 2, y: TABLE_H / 2, vx: 0, vy: 0, radius: PUCK_RADIUS, trail: [] },
      hostPaddle: { x: TABLE_W / 2, y: TABLE_H - 120, vx: 0, vy: 0, radius: PADDLE_RADIUS },
      guestPaddle: { x: TABLE_W / 2, y: 120, vx: 0, vy: 0, radius: PADDLE_RADIUS },
      hostScore: physicsRef.current.p1Score,
      guestScore: physicsRef.current.p2Score,
      maxScore: TARGET_SCORE,
      lastScorerId: winnerId,
      isPaused: true,
      pauseRemainingSeconds: 0,
      goalAnimationTrigger: Date.now(),
      winner: winnerId,
    };

    if (isLocalMode) {
      onLocalMove?.({
        ...room,
        gameState: nextState,
        winnerId,
        status: "round_over",
      });
    } else {
      sendGameMove(room.roomCode, nextState, room.currentTurn, winnerId, true);
    }
  };

  // Touch / Pointer Event Handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = TABLE_W / rect.width;
    const scaleY = TABLE_H / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    if (isLocalMode) {
      // In local mode, bottom half moves P1, top half moves P2
      if (canvasY > TABLE_H / 2) {
        physicsRef.current.p1Paddle.targetX = canvasX;
        physicsRef.current.p1Paddle.targetY = canvasY;
      } else {
        physicsRef.current.p2Paddle.targetX = canvasX;
        physicsRef.current.p2Paddle.targetY = canvasY;
      }
    } else {
      // In Online / AI mode, host controls P1, guest controls P2
      if (isHost) {
        physicsRef.current.p1Paddle.targetX = canvasX;
        physicsRef.current.p1Paddle.targetY = canvasY;
      } else {
        physicsRef.current.p2Paddle.targetX = canvasX;
        physicsRef.current.p2Paddle.targetY = canvasY;
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto p-3 sm:p-4 select-none touch-none">
      {/* 1. Score & Match Tracker */}
      <div className="w-full flex items-center justify-between bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-3 mb-3 shadow-xl">
        {/* P1 Bottom Player */}
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black border-2"
            style={{ backgroundColor: `${hostColor}25`, borderColor: hostColor, color: hostColor }}
          >
            {room.players.host.avatar || "👤"}
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">{room.players.host.name}</div>
            <div className="text-2xl font-black text-blue-400">{scores.p1}</div>
          </div>
        </div>

        {/* Center Target Pill */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            FIRST TO {TARGET_SCORE}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">Air Hockey 1v1</span>
        </div>

        {/* P2 Top Player */}
        <div className="flex items-center gap-2 flex-row-reverse text-right">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black border-2"
            style={{ backgroundColor: `${guestColor}25`, borderColor: guestColor, color: guestColor }}
          >
            {room.players.guest?.avatar || "🤖"}
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">
              {room.players.guest?.name || (isAIMode ? "AI Bot" : "Player 2")}
            </div>
            <div className="text-2xl font-black text-pink-400">{scores.p2}</div>
          </div>
        </div>
      </div>

      {/* Goal Celebration Banner */}
      <AnimatePresence>
        {goalText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: -20 }}
            className="absolute z-30 px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white font-black text-sm tracking-wider uppercase shadow-2xl border-2 border-white/60 animate-bounce"
          >
            {goalText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Interactive Neon Air Hockey Canvas Table */}
      <div className="relative rounded-3xl p-2 bg-gradient-to-b from-border/50 to-border/20 shadow-2xl border border-border/80">
        <canvas
          ref={canvasRef}
          width={TABLE_W}
          height={TABLE_H}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
          className="rounded-2xl cursor-crosshair touch-none shadow-inner"
          style={{ width: "min(86vw, 360px)", height: "min(137vw, 576px)" }}
        />
      </div>

      {/* 3. Instructions Footer */}
      <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground mt-2 px-2">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Drag paddle to strike puck into rival net</span>
        </span>
        <span className="font-bold text-cyan-400">⚡ 60 FPS Physics</span>
      </div>
    </div>
  );
};
