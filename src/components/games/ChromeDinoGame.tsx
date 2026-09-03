import React, { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw, ArrowLeft, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "cactus_single" | "cactus_double" | "bird";
}

interface Pickup {
  id: number;
  x: number;
  y: number;
  type: "coin" | "shield";
}

interface ChromeDinoGameProps {
  onClose?: () => void;
}

const HIGH_SCORE_KEY = "livetalk_minimal_dino_highscore_v4";

export const ChromeDinoGame: React.FC<ChromeDinoGameProps> = ({ onClose }) => {
  let isDarkMode = true;
  try {
    const { settings } = useSettings();
    isDarkMode = settings.darkMode;
  } catch {
    isDarkMode = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  }

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [hasShield, setHasShield] = useState(false);

  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem(HIGH_SCORE_KEY) || "0");
    } catch {
      return 0;
    }
  });

  // Fast animation refs for 60fps locked physics
  const isPlayingRef = useRef(false);
  const isGameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const coinsRef = useRef(0);
  const speedRef = useRef(5.5);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isDarkRef = useRef(isDarkMode);

  useEffect(() => {
    isDarkRef.current = isDarkMode;
  }, [isDarkMode]);

  // Dino Physics State (Single Jump Only)
  const dinoRef = useRef({
    x: 45,
    y: 0, // 0 = ground level
    vy: 0,
    width: 32,
    height: 38,
    isGrounded: true,
    isDucking: false,
    hasShield: false,
    runFrame: 0,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const pickupsRef = useRef<Pickup[]>([]);
  const lastObstacleTimeRef = useRef(0);
  const lastPickupTimeRef = useRef(0);
  const groundOffsetRef = useRef(0);

  // Soft, calming Web Audio sound synthesis (gentle sine waves)
  const playSoftSfx = useCallback((type: "jump" | "coin" | "shield" | "hit") => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine"; // Pure, calm sine wave

      if (type === "jump") {
        osc.frequency.setValueAtTime(360, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      } else if (type === "coin") {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.05); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      } else if (type === "shield") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      } else if (type === "hit") {
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }, []);

  // Single Jump ONLY (Ignored if in air)
  const jump = useCallback(() => {
    const d = dinoRef.current;
    if (!isPlayingRef.current || isGameOverRef.current) return;

    // Strict single jump check: only allowed when on ground!
    if (d.isGrounded) {
      d.vy = -12.5;
      d.isGrounded = false;
      playSoftSfx("jump");
    }
  }, [playSoftSfx]);

  const setDucking = useCallback((ducking: boolean) => {
    if (isPlayingRef.current && !isGameOverRef.current) {
      dinoRef.current.isDucking = ducking;
      if (ducking && !dinoRef.current.isGrounded) {
        dinoRef.current.vy += 6; // Quick descend
      }
    }
  }, []);

  const startGame = useCallback(() => {
    dinoRef.current = {
      x: 45,
      y: 0,
      vy: 0,
      width: 32,
      height: 38,
      isGrounded: true,
      isDucking: false,
      hasShield: false,
      runFrame: 0,
    };
    obstaclesRef.current = [];
    pickupsRef.current = [];
    scoreRef.current = 0;
    coinsRef.current = 0;
    speedRef.current = 5.5;
    groundOffsetRef.current = 0;
    lastObstacleTimeRef.current = Date.now() + 600;
    lastPickupTimeRef.current = Date.now();

    setScore(0);
    setCoins(0);
    setHasShield(false);
    setIsGameOver(false);
    setIsPlaying(true);
    isPlayingRef.current = true;
    isGameOverRef.current = false;
    playSoftSfx("jump");
  }, [playSoftSfx]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingRef.current || isGameOverRef.current) {
        if (e.code === "Space" || e.key === "Enter") startGame();
        return;
      }

      if (e.code === "Space" || e.code === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        jump();
      } else if (e.code === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        setDucking(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.key === "s" || e.key === "S") {
        setDucking(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [startGame, jump, setDucking]);

  // 60fps Game & Canvas Loop (Adaptive Dark & Bright Mode)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameCount = 0;
    const groundY = 140;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const dark = isDarkRef.current;
      const dinoColor = dark ? "#f8fafc" : "#1e293b";
      const eyeColor = dark ? "#0f172a" : "#ffffff";
      const obsColor = dark ? "#94a3b8" : "#475569";
      const groundColor = dark ? "rgba(148, 163, 184, 0.35)" : "rgba(100, 116, 139, 0.35)";

      // ── 1. Update Game Physics (If Playing) ──
      if (isPlayingRef.current && !isGameOverRef.current) {
        frameCount++;
        const d = dinoRef.current;

        // Score progression
        if (frameCount % 3 === 0) {
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }

        // Smooth speed ramp
        speedRef.current = Math.min(10.5, 5.5 + Math.floor(scoreRef.current / 220) * 0.35);
        groundOffsetRef.current = (groundOffsetRef.current + speedRef.current) % 30;

        // Single Jump Gravity
        if (!d.isGrounded) {
          d.vy += 0.65;
          d.y += d.vy;
          if (d.y >= 0) {
            d.y = 0;
            d.vy = 0;
            d.isGrounded = true;
          }
        }

        // Run animation frame
        if (frameCount % 6 === 0) {
          d.runFrame = (d.runFrame + 1) % 2;
        }

        // Spawn Pickups (Coins & Shields)
        const now = Date.now();
        if (now - lastPickupTimeRef.current > 2400) {
          lastPickupTimeRef.current = now;
          const isShield = Math.random() < 0.18;
          pickupsRef.current.push({
            id: now,
            x: canvas.width + 30,
            y: isShield ? groundY - 50 : groundY - 25 - Math.random() * 35,
            type: isShield ? "shield" : "coin",
          });
        }

        // Spawn Obstacles
        const minSpawn = Math.max(900, 1850 - speedRef.current * 70);
        if (now - lastObstacleTimeRef.current > minSpawn) {
          lastObstacleTimeRef.current = now;
          const rand = Math.random();

          if (scoreRef.current > 350 && rand < 0.3) {
            // Flying Bird
            obstaclesRef.current.push({
              id: now,
              x: canvas.width + 30,
              y: groundY - 58,
              width: 30,
              height: 20,
              type: "bird",
            });
          } else if (rand < 0.6) {
            // Double Cactus
            obstaclesRef.current.push({
              id: now,
              x: canvas.width + 30,
              y: groundY - 36,
              width: 28,
              height: 36,
              type: "cactus_double",
            });
          } else {
            // Single Cactus
            obstaclesRef.current.push({
              id: now,
              x: canvas.width + 30,
              y: groundY - 30,
              width: 16,
              height: 30,
              type: "cactus_single",
            });
          }
        }

        // ── 2. Player vs Pickups Collision ──
        const dinoHeight = d.isDucking ? 22 : 38;
        const dinoBox = {
          x: d.x + 4,
          y: groundY - dinoHeight + d.y + 4,
          w: d.width - 8,
          h: dinoHeight - 6,
        };

        const remainingPickups: Pickup[] = [];
        for (const p of pickupsRef.current) {
          p.x -= speedRef.current;

          // Check pickup collision
          if (
            dinoBox.x < p.x + 20 &&
            dinoBox.x + dinoBox.w > p.x &&
            dinoBox.y < p.y + 20 &&
            dinoBox.y + dinoBox.h > p.y
          ) {
            if (p.type === "coin") {
              coinsRef.current += 1;
              setCoins(coinsRef.current);
              scoreRef.current += 20;
              playSoftSfx("coin");
            } else if (p.type === "shield") {
              d.hasShield = true;
              setHasShield(true);
              playSoftSfx("shield");
            }
            continue;
          }

          if (p.x > -25) remainingPickups.push(p);
        }
        pickupsRef.current = remainingPickups;

        // ── 3. Player vs Obstacle Collision ──
        const remainingObs: Obstacle[] = [];
        let collided = false;

        for (const obs of obstaclesRef.current) {
          obs.x -= speedRef.current;

          const obsBox = {
            x: obs.x + 4,
            y: obs.y + 4,
            w: obs.width - 8,
            h: obs.height - 6,
          };

          if (
            dinoBox.x < obsBox.x + obsBox.w &&
            dinoBox.x + dinoBox.w > obsBox.x &&
            dinoBox.y < obsBox.y + obsBox.h &&
            dinoBox.y + dinoBox.h > obsBox.y
          ) {
            if (d.hasShield) {
              // Shield absorbs hit cleanly
              d.hasShield = false;
              setHasShield(false);
              playSoftSfx("hit");
              continue;
            } else {
              collided = true;
            }
          }

          if (obs.x + obs.width > -30) remainingObs.push(obs);
        }
        obstaclesRef.current = remainingObs;

        if (collided) {
          isGameOverRef.current = true;
          isPlayingRef.current = false;
          setIsGameOver(true);
          setIsPlaying(false);
          playSoftSfx("hit");

          if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            try {
              localStorage.setItem(HIGH_SCORE_KEY, String(scoreRef.current));
            } catch {}
          }
        }
      }

      // ── 4. Render Horizon Line & Scenery ──
      ctx.strokeStyle = groundColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Subtle terrain dots
      ctx.fillStyle = groundColor;
      for (let gx = -groundOffsetRef.current; gx < canvas.width; gx += 28) {
        ctx.fillRect(gx, groundY + 4, 3, 1.5);
        ctx.fillRect(gx + 12, groundY + 8, 2, 1);
      }

      // ── 5. Render Pickups ──
      for (const p of pickupsRef.current) {
        ctx.save();
        if (p.type === "coin") {
          ctx.fillStyle = "#eab308";
          ctx.beginPath();
          ctx.arc(p.x + 8, p.y + 8, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px sans-serif";
          ctx.fillText("¢", p.x + 5.5, p.y + 11);
        } else if (p.type === "shield") {
          ctx.font = "16px sans-serif";
          ctx.fillText("🛡️", p.x, p.y + 14);
        }
        ctx.restore();
      }

      // ── 6. Render Obstacles ──
      ctx.fillStyle = obsColor;
      for (const obs of obstaclesRef.current) {
        if (obs.type === "cactus_single") {
          ctx.fillRect(obs.x + 5, obs.y, 6, obs.height);
          ctx.fillRect(obs.x, obs.y + 8, 5, 4);
          ctx.fillRect(obs.x, obs.y + 4, 4, 5);
          ctx.fillRect(obs.x + 11, obs.y + 12, 5, 4);
          ctx.fillRect(obs.x + 12, obs.y + 8, 4, 5);
        } else if (obs.type === "cactus_double") {
          ctx.fillRect(obs.x + 4, obs.y + 6, 6, obs.height - 6);
          ctx.fillRect(obs.x, obs.y + 12, 4, 4);
          ctx.fillRect(obs.x + 16, obs.y, 6, obs.height);
          ctx.fillRect(obs.x + 22, obs.y + 10, 5, 4);
        } else if (obs.type === "bird") {
          ctx.fillRect(obs.x + 8, obs.y + 8, 14, 6);
          ctx.fillRect(obs.x + 2, obs.y + 6, 6, 4);
          if (frameCount % 12 < 6) {
            ctx.fillRect(obs.x + 12, obs.y, 4, 8); // wing up
          } else {
            ctx.fillRect(obs.x + 12, obs.y + 12, 4, 8); // wing down
          }
        }
      }

      // ── 7. Render Minimalist Dino ──
      const d = dinoRef.current;
      const curY = groundY - (d.isDucking ? 22 : 38) + d.y;
      const dx = d.x;

      ctx.save();
      ctx.fillStyle = dinoColor;

      if (d.isDucking) {
        // Ducking Posture
        ctx.fillRect(dx + 8, curY + 6, 26, 14);
        ctx.fillRect(dx + 30, curY + 4, 10, 8);
        ctx.fillStyle = eyeColor;
        ctx.fillRect(dx + 34, curY + 6, 3, 3);
      } else {
        // Standing Posture
        ctx.fillRect(dx + 8, curY + 10, 18, 20); // body
        ctx.fillRect(dx + 18, curY, 14, 14);     // head
        ctx.fillRect(dx + 28, curY + 4, 4, 6);   // snout
        ctx.fillRect(dx + 22, curY + 18, 6, 4);  // arm

        // Eye
        if (isGameOverRef.current) {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(dx + 22, curY + 3, 3, 3);
        } else {
          ctx.fillStyle = eyeColor;
          ctx.fillRect(dx + 22, curY + 3, 3, 3);
        }

        ctx.fillStyle = dinoColor;
        ctx.fillRect(dx, curY + 14, 8, 8); // tail

        // Running Legs
        if (d.isGrounded) {
          if (d.runFrame === 0) {
            ctx.fillRect(dx + 12, curY + 30, 4, 6);
            ctx.fillRect(dx + 20, curY + 30, 4, 3);
          } else {
            ctx.fillRect(dx + 12, curY + 30, 4, 3);
            ctx.fillRect(dx + 20, curY + 30, 4, 6);
          }
        } else {
          // In-air tucked legs
          ctx.fillRect(dx + 12, curY + 30, 4, 4);
          ctx.fillRect(dx + 18, curY + 30, 4, 4);
        }
      }

      // Shield Ring (if active)
      if (d.hasShield) {
        ctx.strokeStyle = dark ? "rgba(56, 189, 248, 0.7)" : "rgba(2, 132, 199, 0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dx + 18, curY + 16, 24, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [playSoftSfx, highScore]);

  return (
    <div
      className={`w-full max-w-sm sm:max-w-lg mx-auto rounded-3xl border p-4 sm:p-5 shadow-xl relative overflow-hidden select-none transition-colors duration-300 ${
        isDarkMode
          ? "bg-[#0b0f17] border-border/40 text-slate-100"
          : "bg-white border-zinc-200 text-zinc-800"
      }`}
    >
      {/* Top Header & HUD */}
      <div className="flex items-center justify-between mb-3 text-xs font-mono">
        <div className="flex items-center gap-2 font-bold">
          <span>🦖</span>
          <span>DINO RUN</span>
          {hasShield && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1 font-sans">
              <Shield className="w-3 h-3" /> Shield
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-amber-500 font-bold flex items-center gap-1">
            <span>¢</span> {coins}
          </span>
          <span className="text-muted-foreground text-[11px]">HI {highScore}</span>
          <span className="font-black text-sm">{score}</span>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground cursor-pointer ml-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Game Canvas Box */}
      <div
        onClick={() => {
          if (!isPlaying || isGameOver) startGame();
          else jump();
        }}
        className={`relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden cursor-pointer touch-manipulation border transition-colors duration-300 flex items-center justify-center ${
          isDarkMode
            ? "bg-[#070a10] border-border/30"
            : "bg-slate-50 border-zinc-200"
        }`}
      >
        <canvas
          ref={canvasRef}
          width={540}
          height={160}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Start / Game Over Overlay */}
        {(!isPlaying || isGameOver) && (
          <div
            className={`absolute inset-0 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center ${
              isDarkMode ? "bg-black/60" : "bg-white/60"
            }`}
          >
            {isGameOver ? (
              <div className="space-y-2.5 bg-card/95 border border-border p-4 rounded-2xl shadow-xl">
                <span className="text-xs font-mono font-bold tracking-wider text-muted-foreground block">
                  GAME OVER
                </span>
                <p className="text-xs font-mono text-foreground">
                  Score: <strong className="text-primary">{score}</strong> • Coins:{" "}
                  <strong className="text-amber-500">{coins}</strong> (HI: {highScore})
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="rounded-xl font-mono font-bold text-xs gap-1.5 cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>PLAY AGAIN (SPACE)</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2 bg-card/95 border border-border p-4 rounded-2xl shadow-xl">
                <span className="text-2xl block animate-bounce">🦖</span>
                <span className="font-mono font-bold text-xs text-foreground block">
                  TAP OR PRESS SPACE TO JUMP
                </span>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Single jump • Collect coins ¢ & shields 🛡️
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Touch Action Controls */}
      <div className="grid grid-cols-2 gap-2 mt-3 sm:hidden">
        <Button
          type="button"
          variant="outline"
          onPointerDown={() => setDucking(true)}
          onPointerUp={() => setDucking(false)}
          onPointerLeave={() => setDucking(false)}
          className="h-11 rounded-xl bg-card border-border/60 text-xs font-mono font-bold active:scale-95 touch-manipulation cursor-pointer"
        >
          DUCK 🔻
        </Button>

        <Button
          type="button"
          onClick={() => {
            if (!isPlaying || isGameOver) startGame();
            else jump();
          }}
          className="h-11 rounded-xl bg-primary text-primary-foreground font-mono font-bold text-xs gap-1 active:scale-95 touch-manipulation cursor-pointer shadow-md"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>JUMP 🦖</span>
        </Button>
      </div>

      {/* Desktop Keyboard Controls Legend */}
      <div className="hidden sm:flex items-center justify-between text-[11px] text-muted-foreground font-mono mt-2.5 px-1">
        <span>Space / ↑ = Jump</span>
        <span>↓ = Duck</span>
        <span>Collect ¢ and 🛡️</span>
      </div>
    </div>
  );
};
