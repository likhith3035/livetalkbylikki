import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomState, TapTugGameState, TapTugPowerUp } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { gameHaptics } from "../../services/gameHapticsService";
import { sendGameMove } from "../../services/gameRoomService";
import {
  Zap,
  Flame,
  Snowflake,
  Shield,
  Bomb,
  Cpu,
  Swords,
  Timer,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";

interface TapTugGameProps {
  room: GameRoomState<TapTugGameState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<TapTugGameState>) => void;
}

// ── Particle Sparks Engine for Energy Rope Clashing ──
interface TugParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

// Floating tap feedback number
interface TapFloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

// ── AI Bot Configuration ──
export interface TapTugAIPersona {
  name: string;
  avatar: string;
  title: string;
  color: string;
  tapsPerSec: number;
  burstChance: number;
  burstTapsPerSec: number;
}

export const TUG_AI_PERSONAS: Record<string, TapTugAIPersona> = {
  easy: {
    name: "Cyber-Bolt 🤖",
    avatar: "⚡",
    title: "Novice Bot (Easy)",
    color: "#38bdf8",
    tapsPerSec: 5.0,
    burstChance: 0.15,
    burstTapsPerSec: 7.0,
  },
  medium: {
    name: "Neon Viper 🐍",
    avatar: "🔥",
    title: "Challenger Bot (Medium)",
    color: "#fbbf24",
    tapsPerSec: 8.0,
    burstChance: 0.35,
    burstTapsPerSec: 10.5,
  },
  hard: {
    name: "Quantum Overlord 👑",
    avatar: "👑",
    title: "Grandmaster Bot (Hard)",
    color: "#f43f5e",
    tapsPerSec: 11.5,
    burstChance: 0.55,
    burstTapsPerSec: 14.0,
  },
};

export const TapTugGame: React.FC<TapTugGameProps> = ({
  room,
  myPlayerId,
  onLocalMove,
}) => {
  const isHost = room.players.host.id === myPlayerId;
  const isAIMode = room.mode === "ai";
  const isLocalMode = room.mode === "local";

  const aiDifficulty = room.rules?.aiDifficulty || "medium";
  const aiPersona = TUG_AI_PERSONAS[aiDifficulty] || TUG_AI_PERSONAS.medium;

  // Initial State Factory
  const defaultGameState: TapTugGameState = useMemo(
    () => ({
      ropePosition: 50,
      hostTaps: 0,
      guestTaps: 0,
      hostHeat: 0,
      guestHeat: 0,
      hostOverdrive: false,
      guestOverdrive: false,
      hostPowerUp: null,
      guestPowerUp: null,
      hostFrozenUntil: 0,
      guestFrozenUntil: 0,
      hostShieldUntil: 0,
      guestShieldUntil: 0,
      hostMultiplierTapsLeft: 0,
      guestMultiplierTapsLeft: 0,
      matchDurationSeconds: 30,
      timeRemainingSeconds: 30,
      startedAt: Date.now(),
      lastTapTimestamp: Date.now(),
    }),
    []
  );

  const rawState = room.gameState || defaultGameState;

  // Local Client High-Frequency State (for zero-latency responsiveness)
  const [ropePos, setRopePos] = useState<number>(rawState.ropePosition ?? 50);
  const [hostTaps, setHostTaps] = useState<number>(rawState.hostTaps ?? 0);
  const [guestTaps, setGuestTaps] = useState<number>(rawState.guestTaps ?? 0);
  const [hostHeat, setHostHeat] = useState<number>(rawState.hostHeat ?? 0);
  const [guestHeat, setGuestHeat] = useState<number>(rawState.guestHeat ?? 0);
  const [timeLeft, setTimeLeft] = useState<number>(rawState.timeRemainingSeconds ?? 30);

  // Power-Up inventory (each player gets 1x EMP, 1x Freeze, 1x 2X, 1x Shield per match)
  const [hostPowerUpsAvailable, setHostPowerUpsAvailable] = useState<Record<TapTugPowerUp, boolean>>({
    "2x": true,
    freeze: true,
    bomb: true,
    shield: true,
  });
  const [guestPowerUpsAvailable, setGuestPowerUpsAvailable] = useState<Record<TapTugPowerUp, boolean>>({
    "2x": true,
    freeze: true,
    bomb: true,
    shield: true,
  });

  const [hostFrozenUntil, setHostFrozenUntil] = useState<number>(rawState.hostFrozenUntil ?? 0);
  const [guestFrozenUntil, setGuestFrozenUntil] = useState<number>(rawState.guestFrozenUntil ?? 0);
  const [hostShieldUntil, setHostShieldUntil] = useState<number>(rawState.hostShieldUntil ?? 0);
  const [guestShieldUntil, setGuestShieldUntil] = useState<number>(rawState.guestShieldUntil ?? 0);
  const [hostMultiplierTapsLeft, setHostMultiplierTapsLeft] = useState<number>(rawState.hostMultiplierTapsLeft ?? 0);
  const [guestMultiplierTapsLeft, setGuestMultiplierTapsLeft] = useState<number>(rawState.guestMultiplierTapsLeft ?? 0);

  // Visual Effects & Feedback
  const [floatingTexts, setFloatingTexts] = useState<TapFloatingText[]>([]);
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [lastPushDirection, setLastPushDirection] = useState<"left" | "right" | null>(null);

  // Consecutive tap counter for combo streaks and audio pitch escalation
  const tapStreakRef = useRef<{ count: number; lastTime: number }>({ count: 0, lastTime: 0 });

  // Canvas particle reference
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<TugParticle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Network batch sync refs
  const lastSyncTimeRef = useRef<number>(Date.now());
  const pendingSyncRef = useRef<boolean>(false);
  const isMatchResolvedRef = useRef<boolean>(false);

  // Vibrant neon color scheme: P1 = Cyan Neon, P2 = Rose Neon / Amber
  const hostColor = "#06b6d4";
  const guestColor = "#f43f5e";

  // Re-sync local state when remote round updates
  useEffect(() => {
    if (room.status === "playing") {
      isMatchResolvedRef.current = false;
    }
  }, [room.round, room.status]);

  useEffect(() => {
    if (rawState) {
      if (!isLocalMode && !isAIMode) {
        if (Math.abs(rawState.ropePosition - ropePos) > 4) {
          setRopePos(rawState.ropePosition);
        }
      }
    }
  }, [rawState?.ropePosition, isLocalMode, isAIMode]);

  // ── Particle Sparks Engine ──
  const spawnTugSparks = useCallback((count = 10, dominantColor = "#ffffff") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      particlesRef.current.push({
        x: (ropePos / 100) * w,
        y: h / 2 + (Math.random() * 24 - 12),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 1.5,
        color: dominantColor,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 25 + 15,
      });
    }
  }, [ropePos]);

  // Particle Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;
    const render = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (p.life >= p.maxLife || p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // ── Match Resolution Logic (Sudden-Death KO or Timeout) ──
  const handleResolveMatch = useCallback(
    async (finalWinnerId: string, isKO = false) => {
      if (isMatchResolvedRef.current || room.status !== "playing") return;
      isMatchResolvedRef.current = true;

      const hostWon = finalWinnerId === room.players.host.id;
      let nextHostScore = room.players.host.score;
      let nextGuestScore = room.players.guest?.score || 0;

      if (finalWinnerId === "draw") {
        gameAudio.playDraw();
      } else if (hostWon) {
        nextHostScore += 1;
        if (isHost || isLocalMode) gameAudio.playWin();
        else gameAudio.playLose();
      } else {
        nextGuestScore += 1;
        if ((!isHost && !isAIMode) || isLocalMode) gameAudio.playWin();
        else gameAudio.playLose();
      }

      gameHaptics.victory();

      // Final Shockwave blast
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 800);

      const updatedGameState: TapTugGameState = {
        ropePosition: ropePos,
        hostTaps,
        guestTaps,
        hostHeat,
        guestHeat,
        hostOverdrive: hostHeat >= 90,
        guestOverdrive: guestHeat >= 90,
        hostPowerUp: null,
        guestPowerUp: null,
        hostFrozenUntil: 0,
        guestFrozenUntil: 0,
        hostShieldUntil: 0,
        guestShieldUntil: 0,
        hostMultiplierTapsLeft: 0,
        guestMultiplierTapsLeft: 0,
        matchDurationSeconds: 30,
        timeRemainingSeconds: timeLeft,
        startedAt: rawState.startedAt || Date.now(),
        lastTapTimestamp: Date.now(),
        isKO,
      };

      const updatedRoom: GameRoomState<TapTugGameState> = {
        ...room,
        gameState: updatedGameState,
        status: "round_over",
        winnerId: finalWinnerId,
        players: {
          host: { ...room.players.host, score: nextHostScore },
          guest: room.players.guest ? { ...room.players.guest, score: nextGuestScore } : null,
        },
      };

      if (isLocalMode || isAIMode) {
        onLocalMove?.(updatedRoom);
      } else {
        await sendGameMove(
          room.roomCode,
          updatedGameState,
          room.currentTurn,
          finalWinnerId,
          true,
          nextHostScore,
          nextGuestScore,
          room.rules?.turnTimerSeconds || 0,
          room.rules?.maxSeriesWins || 2
        );
      }
    },
    [
      isHost,
      isAIMode,
      isLocalMode,
      room,
      ropePos,
      hostTaps,
      guestTaps,
      hostHeat,
      guestHeat,
      timeLeft,
      rawState.startedAt,
      onLocalMove,
    ]
  );

  // ── Match Timer Countdown ──
  useEffect(() => {
    if (room.status !== "playing") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Timeout reached: Dominant territory evaluation (>51% vs <49%)
          const guestWinnerId = room.players.guest?.id || (isAIMode ? "ai_opponent" : "local_player_2");
          const winnerId =
            ropePos > 52
              ? room.players.host.id
              : ropePos < 48
              ? guestWinnerId
              : hostTaps > guestTaps
              ? room.players.host.id
              : guestTaps > hostTaps
              ? guestWinnerId
              : "draw";
          handleResolveMatch(winnerId, false);
          return 0;
        }

        // Ticking audio tension in last 5 seconds
        if (prev <= 5) {
          gameAudio.playHeartbeatTick();
        }

        return prev - 1;
      });

      // Passive Heat Dissipation (decays if player pauses)
      setHostHeat((h) => Math.max(0, h - 4));
      setGuestHeat((h) => Math.max(0, h - 4));
    }, 1000);

    return () => clearInterval(interval);
  }, [room.status, ropePos, hostTaps, guestTaps, handleResolveMatch, room.players.guest?.id, isAIMode]);

  // ── High-Octane Tap Action ──
  const executeTap = useCallback(
    (side: "host" | "guest", clientX?: number, clientY?: number) => {
      if (room.status !== "playing" || isMatchResolvedRef.current) return;

      const now = Date.now();

      // Check Freeze lockout
      if (side === "host" && now < hostFrozenUntil) {
        gameHaptics.light();
        return;
      }
      if (side === "guest" && now < guestFrozenUntil) {
        gameHaptics.light();
        return;
      }

      // Combo streak & pitch scaling
      if (now - tapStreakRef.current.lastTime < 350) {
        tapStreakRef.current.count = Math.min(10, tapStreakRef.current.count + 1);
      } else {
        tapStreakRef.current.count = 1;
      }
      tapStreakRef.current.lastTime = now;

      // Play escalated tone or standard click
      if (tapStreakRef.current.count >= 4) {
        gameAudio.playComboAscend(tapStreakRef.current.count);
      } else {
        gameAudio.playClick();
      }
      gameHaptics.light();

      // Defending opponent shield check
      const isOpponentShielded = side === "host" ? now < guestShieldUntil : now < hostShieldUntil;

      // Force calculations
      let force = 1.35;
      let label = "+1.3";
      let labelColor = side === "host" ? "#38bdf8" : "#fb7185";

      if (side === "host") {
        if (hostMultiplierTapsLeft > 0) {
          force *= 2.0;
          setHostMultiplierTapsLeft((m) => Math.max(0, m - 1));
          label = "⚡ 2X CRIT!";
          labelColor = "#fbbf24";
        }
        if (hostHeat >= 90) {
          force *= 1.75; // OVERDRIVE
          label = "🔥 OVERDRIVE!";
          labelColor = "#f59e0b";
        }
      } else {
        if (guestMultiplierTapsLeft > 0) {
          force *= 2.0;
          setGuestMultiplierTapsLeft((m) => Math.max(0, m - 1));
          label = "⚡ 2X CRIT!";
          labelColor = "#fbbf24";
        }
        if (guestHeat >= 90) {
          force *= 1.75; // OVERDRIVE
          label = "🔥 OVERDRIVE!";
          labelColor = "#f59e0b";
        }
      }

      if (isOpponentShielded) {
        force *= 0.25; // 75% absorbed
        label = "🛡️ BLOCKED!";
        labelColor = "#c084fc";
      }

      // Visual floating feedback
      if (clientX !== undefined && clientY !== undefined) {
        const textId = Date.now() + Math.random();
        setFloatingTexts((prev) => [
          ...prev.slice(-5),
          { id: textId, x: clientX, y: clientY, text: label, color: labelColor },
        ]);
        setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((t) => t.id !== textId));
        }, 650);
      }

      setLastPushDirection(side === "host" ? "right" : "left");

      // Physical Push Engine
      setRopePos((prev) => {
        const nextPos = side === "host" ? prev + force : prev - force;
        spawnTugSparks(7, side === "host" ? hostColor : guestColor);

        // Instant Sudden-Death KO Detection
        if (nextPos >= 100) {
          handleResolveMatch(room.players.host.id, true);
          return 100;
        }
        if (nextPos <= 0) {
          const guestWinnerId = room.players.guest?.id || (isAIMode ? "ai_opponent" : "local_player_2");
          handleResolveMatch(guestWinnerId, true);
          return 0;
        }

        return nextPos;
      });

      // Update Taps and Heat
      if (side === "host") {
        setHostTaps((t) => t + 1);
        setHostHeat((h) => Math.min(100, h + 9));
      } else {
        setGuestTaps((t) => t + 1);
        setGuestHeat((h) => Math.min(100, h + 9));
      }

      // Multiplayer Network Sync (Batch 220ms)
      if (!isLocalMode && !isAIMode) {
        pendingSyncRef.current = true;
        if (now - lastSyncTimeRef.current > 220) {
          lastSyncTimeRef.current = now;
          pendingSyncRef.current = false;
          sendGameMove(
            room.roomCode,
            {
              ropePosition: ropePos,
              hostTaps,
              guestTaps,
              hostHeat,
              guestHeat,
              hostOverdrive: hostHeat >= 90,
              guestOverdrive: guestHeat >= 90,
              hostPowerUp: null,
              guestPowerUp: null,
              hostFrozenUntil,
              guestFrozenUntil,
              hostShieldUntil,
              guestShieldUntil,
              hostMultiplierTapsLeft,
              guestMultiplierTapsLeft,
              matchDurationSeconds: 30,
              timeRemainingSeconds: timeLeft,
              startedAt: rawState.startedAt || now,
              lastTapTimestamp: now,
              lastTapPlayerId: myPlayerId,
            },
            room.currentTurn,
            null,
            false
          );
        }
      }
    },
    [
      room.status,
      room.players.host.id,
      room.players.guest?.id,
      room.roomCode,
      room.currentTurn,
      hostFrozenUntil,
      guestFrozenUntil,
      hostShieldUntil,
      guestShieldUntil,
      hostMultiplierTapsLeft,
      guestMultiplierTapsLeft,
      hostHeat,
      guestHeat,
      hostColor,
      guestColor,
      isAIMode,
      isLocalMode,
      myPlayerId,
      ropePos,
      hostTaps,
      guestTaps,
      timeLeft,
      rawState.startedAt,
      spawnTugSparks,
      handleResolveMatch,
    ]
  );

  // ── Power-Up Activation Engine ──
  const handleUsePowerUp = (type: TapTugPowerUp, side: "host" | "guest") => {
    if (room.status !== "playing" || isMatchResolvedRef.current) return;

    const availableMap = side === "host" ? hostPowerUpsAvailable : guestPowerUpsAvailable;
    if (!availableMap[type]) return;

    // Consume from inventory (1x limit)
    if (side === "host") {
      setHostPowerUpsAvailable((prev) => ({ ...prev, [type]: false }));
    } else {
      setGuestPowerUpsAvailable((prev) => ({ ...prev, [type]: false }));
    }

    gameAudio.playPowerUpTrigger();
    gameHaptics.heavy();

    const now = Date.now();
    if (type === "2x") {
      if (side === "host") setHostMultiplierTapsLeft(12);
      else setGuestMultiplierTapsLeft(12);
    } else if (type === "freeze") {
      if (side === "host") setGuestFrozenUntil(now + 1400);
      else setHostFrozenUntil(now + 1400);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 300);
    } else if (type === "shield") {
      if (side === "host") setHostShieldUntil(now + 2500);
      else setGuestShieldUntil(now + 2500);
    } else if (type === "bomb") {
      gameAudio.playBombExplosion();
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 450);

      setRopePos((prev) => {
        const blast = side === "host" ? prev + 12 : prev - 12;
        spawnTugSparks(35, "#f59e0b");
        if (blast >= 100) {
          handleResolveMatch(room.players.host.id, true);
          return 100;
        }
        if (blast <= 0) {
          const guestWinnerId = room.players.guest?.id || (isAIMode ? "ai_opponent" : "local_player_2");
          handleResolveMatch(guestWinnerId, true);
          return 0;
        }
        return blast;
      });
    }
  };

  // ── AI Bot Simulation Loop ──
  useEffect(() => {
    if (!isAIMode || room.status !== "playing") return;

    let aiInterval: any = null;
    const rate = 1000 / aiPersona.tapsPerSec;

    aiInterval = setInterval(() => {
      if (isMatchResolvedRef.current) {
        clearInterval(aiInterval);
        return;
      }

      if (Date.now() < guestFrozenUntil) return;

      const isBursting = Math.random() < aiPersona.burstChance;
      executeTap("guest");

      if (isBursting) {
        setTimeout(() => executeTap("guest"), rate * 0.4);
      }

      // Bot tactical power-ups
      if (ropePos > 68 && guestPowerUpsAvailable.bomb && Math.random() < 0.28) {
        handleUsePowerUp("bomb", "guest");
      } else if (ropePos > 60 && guestPowerUpsAvailable.freeze && Math.random() < 0.22) {
        handleUsePowerUp("freeze", "guest");
      } else if (ropePos > 55 && guestPowerUpsAvailable.shield && Math.random() < 0.18) {
        handleUsePowerUp("shield", "guest");
      }
    }, rate);

    return () => clearInterval(aiInterval);
  }, [isAIMode, room.status, aiPersona, guestFrozenUntil, ropePos, guestPowerUpsAvailable, executeTap]);

  // ── Desktop Keyboard Controls ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (room.status !== "playing") return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space" || e.code === "KeyA" || e.code === "ArrowRight") {
        e.preventDefault();
        if (isLocalMode) {
          executeTap("host");
        } else {
          executeTap(isHost ? "host" : "guest");
        }
      } else if (isLocalMode && (e.code === "KeyL" || e.code === "ArrowLeft")) {
        e.preventDefault();
        executeTap("guest");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [room.status, isLocalMode, isHost, executeTap]);

  // Status variables
  const isHostFrozen = Date.now() < hostFrozenUntil;
  const isGuestFrozen = Date.now() < guestFrozenUntil;
  const isHostShielded = Date.now() < hostShieldUntil;
  const isGuestShielded = Date.now() < guestShieldUntil;

  const hostPlayerName = room.players.host.name;
  const guestPlayerName = room.players.guest?.name || (isAIMode ? aiPersona.name : "Player 2");

  // Prevent mobile double-tap zoom
  const handleTouchZone = (side: "host" | "guest", e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const t = touches[i];
      executeTap(side, t.clientX, t.clientY);
    }
  };

  // Near KO Warning Siren state
  const isP1NearKO = ropePos >= 85;
  const isP2NearKO = ropePos <= 15;

  return (
    <div
      className={`w-full max-w-2xl mx-auto flex flex-col justify-between select-none touch-manipulation relative overflow-hidden transition-all duration-300 h-[calc(100dvh-150px)] max-h-[820px] min-h-[540px] rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-slate-950 via-[#0a0c16] to-slate-950 border border-white/[0.08] shadow-[0_10px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl ${
        screenShake ? "translate-x-1 -translate-y-1 scale-[0.99] transition-transform" : ""
      }`}
    >
      {/* ── Background Grid & Clash Aura ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950/60 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* ── Dynamic Clash Canvas (Energy Sparks) ── */}
      <canvas
        ref={canvasRef}
        width={480}
        height={90}
        className="absolute z-20 pointer-events-none w-full max-w-2xl h-24 top-1/2 -translate-y-1/2 left-0 right-0 mx-auto"
      />

      {/* ── TOP SECTION: Opponent / Player 2 Zone ── */}
      <div
        className={`w-full flex flex-col justify-between p-2.5 sm:p-3.5 rounded-2xl transition-all border relative overflow-hidden shrink-0 ${
          isLocalMode
            ? "rotate-180 bg-rose-950/20 border-rose-500/30 flex-1 max-h-[44%]"
            : "bg-slate-900/50 border-white/[0.08]"
        }`}
      >
        {/* Heat Aura Glow */}
        {guestHeat > 70 && (
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/20 to-transparent pointer-events-none animate-pulse" />
        )}
        {isGuestShielded && (
          <div className="absolute inset-0 border-2 border-purple-400/80 rounded-2xl pointer-events-none shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse" />
        )}

        {/* Top Header: Identity, RPM Tachometer, and Percent */}
        <div className="flex items-center justify-between w-full mb-1.5 z-10 px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-rose-500/30 to-amber-500/30 border border-rose-400/40 flex items-center justify-center text-xs font-black text-rose-300 shadow-inner">
              {isAIMode ? aiPersona.avatar : "P2"}
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm text-rose-300 truncate max-w-[120px] sm:max-w-[170px]">
                  {guestPlayerName}
                </span>
                {guestHeat >= 90 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-[9px] sm:text-[10px] animate-pulse flex items-center gap-0.5 shadow-[0_0_10px_rgba(244,63,94,0.6)]">
                    <Flame className="w-2.5 h-2.5" /> OVERDRIVE
                  </span>
                )}
                {isGuestShielded && (
                  <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 border border-purple-400/60 text-purple-300 font-extrabold text-[9px] flex items-center gap-0.5">
                    <Shield className="w-2.5 h-2.5" /> SHIELD
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground/70 font-mono">
                {isAIMode ? aiPersona.title : `Taps: ${guestTaps}`}
              </span>
            </div>
          </div>

          {/* RPM LED Bar Gauge & Territory Percent */}
          <div className="flex items-center gap-2">
            {/* 5-segment LED tachometer */}
            <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-black/40 border border-white/10">
              <span className="text-[8px] font-mono text-muted-foreground mr-1">HEAT</span>
              {[20, 40, 60, 80, 100].map((step) => (
                <div
                  key={step}
                  className={`w-1.5 h-3 rounded-xs transition-colors ${
                    guestHeat >= step
                      ? step === 100
                        ? "bg-rose-400 shadow-[0_0_6px_#f43f5e]"
                        : "bg-amber-400 shadow-[0_0_4px_#fbbf24]"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            <div className="px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black font-mono text-xs sm:text-sm shadow-sm flex items-center gap-1">
              <span>{Math.round(100 - ropePos)}%</span>
            </div>
          </div>
        </div>

        {/* Local Mode Opponent Power-Ups Bar */}
        {isLocalMode && (
          <div className="flex items-center justify-center gap-1.5 my-1 z-10 w-full flex-wrap">
            <button
              type="button"
              disabled={!guestPowerUpsAvailable["2x"]}
              onClick={() => handleUsePowerUp("2x", "guest")}
              className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all flex items-center gap-1 ${
                guestPowerUpsAvailable["2x"]
                  ? "bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)] active:scale-95 cursor-pointer"
                  : "opacity-30 cursor-not-allowed border-white/10 text-muted-foreground"
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" /> 2X
            </button>
            <button
              type="button"
              disabled={!guestPowerUpsAvailable.freeze}
              onClick={() => handleUsePowerUp("freeze", "guest")}
              className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all flex items-center gap-1 ${
                guestPowerUpsAvailable.freeze
                  ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] active:scale-95 cursor-pointer"
                  : "opacity-30 cursor-not-allowed border-white/10 text-muted-foreground"
              }`}
            >
              <Snowflake className="w-3 h-3 text-cyan-400" /> Freeze
            </button>
            <button
              type="button"
              disabled={!guestPowerUpsAvailable.bomb}
              onClick={() => handleUsePowerUp("bomb", "guest")}
              className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all flex items-center gap-1 ${
                guestPowerUpsAvailable.bomb
                  ? "bg-rose-500/20 border-rose-400/50 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)] active:scale-95 cursor-pointer"
                  : "opacity-30 cursor-not-allowed border-white/10 text-muted-foreground"
              }`}
            >
              <Bomb className="w-3 h-3 text-rose-400" /> EMP
            </button>
            <button
              type="button"
              disabled={!guestPowerUpsAvailable.shield}
              onClick={() => handleUsePowerUp("shield", "guest")}
              className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all flex items-center gap-1 ${
                guestPowerUpsAvailable.shield
                  ? "bg-purple-500/20 border-purple-400/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)] active:scale-95 cursor-pointer"
                  : "opacity-30 cursor-not-allowed border-white/10 text-muted-foreground"
              }`}
            >
              <Shield className="w-3 h-3 text-purple-400" /> Shield
            </button>
          </div>
        )}

        {/* Local Tap Pad (Player 2) */}
        {isLocalMode && (
          <div
            onTouchStart={(e) => handleTouchZone("guest", e)}
            onClick={(e) => executeTap("guest", e.clientX, e.clientY)}
            className={`w-full flex-1 min-h-[70px] sm:min-h-[85px] rounded-2xl flex flex-col items-center justify-center cursor-pointer border transition-all active:scale-[0.98] relative overflow-hidden shadow-inner ${
              isGuestFrozen
                ? "bg-cyan-950/50 border-cyan-400/70 animate-pulse"
                : "bg-gradient-to-b from-rose-500/25 to-rose-900/40 border-rose-500/40 hover:border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.2)] active:shadow-[0_0_35px_rgba(244,63,94,0.4)]"
            }`}
          >
            {isGuestFrozen ? (
              <div className="flex items-center gap-2 text-cyan-300 font-black text-sm sm:text-base">
                <Snowflake className="w-5 h-5 animate-spin" /> FROZEN (WAIT)
              </div>
            ) : (
              <>
                <span className="font-black text-lg sm:text-2xl text-rose-200 tracking-wider flex items-center gap-1.5 drop-shadow-[0_2px_8px_rgba(244,63,94,0.6)]">
                  MASH TO PULL! ⚡
                </span>
                <span className="text-[10px] font-bold text-rose-300/70">
                  Multiple fingers allowed • Press [L] on keyboard
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── CENTER SECTION: High-Voltage Clashing Conduit Arena ── */}
      <div className="w-full my-2 sm:my-3 p-3 sm:p-4 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/[0.12] shadow-2xl relative z-10 shrink-0">
        {/* HUD Top Bar: Dominance Gauge & Countdown */}
        <div className="flex items-center justify-between mb-2 text-xs font-black">
          <div className="flex items-center gap-1.5 text-cyan-400 font-mono">
            <Zap className="w-4 h-4 fill-cyan-400" />
            <span>P1: {Math.round(ropePos)}%</span>
            {isP1NearKO && (
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/30 border border-cyan-400 text-cyan-300 text-[9px] animate-bounce">
                KO IMMINENT!
              </span>
            )}
          </div>

          {/* Central Digital Match Timer */}
          <div
            className={`px-3 py-1 rounded-full font-mono text-xs font-black border flex items-center gap-1.5 shadow-md ${
              timeLeft <= 5
                ? "bg-rose-500/40 border-rose-400 text-rose-200 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]"
                : "bg-slate-950/80 border-white/20 text-white"
            }`}
          >
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
          </div>

          <div className="flex items-center gap-1.5 text-rose-400 font-mono">
            {isP2NearKO && (
              <span className="px-1.5 py-0.5 rounded bg-rose-500/30 border border-rose-400 text-rose-300 text-[9px] animate-bounce">
                KO IMMINENT!
              </span>
            )}
            <span>P2: {Math.round(100 - ropePos)}%</span>
            <Flame className="w-4 h-4 fill-rose-400" />
          </div>
        </div>

        {/* ── The Plasma Tug Conduit ── */}
        <div className="w-full h-9 sm:h-12 rounded-full bg-slate-950 border-2 border-slate-700/80 relative overflow-hidden p-1 shadow-[inset_0_2px_12px_rgba(0,0,0,0.9)] flex items-center">
          {/* Danger Warning Stripes (Active when near KO) */}
          {isP2NearKO && (
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-rose-600/40 to-transparent pointer-events-none animate-pulse" />
          )}
          {isP1NearKO && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-cyan-600/40 to-transparent pointer-events-none animate-pulse" />
          )}

          {/* Grid Scale Marks (25%, 50%, 75%) */}
          <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none z-10 opacity-30">
            <span className="w-0.5 h-3 bg-white" />
            <span className="w-0.5 h-3 bg-white" />
            <span className="w-1 h-5 bg-amber-400 opacity-80" />
            <span className="w-0.5 h-3 bg-white" />
            <span className="w-0.5 h-3 bg-white" />
          </div>

          {/* P1 Energy Beam Fill (Cyan) */}
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-white shadow-[0_0_25px_rgba(6,182,212,0.9)]"
            style={{ width: `${ropePos}%` }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
          />

          {/* Active Tug Fusion Core / Lightning Anchor */}
          <div
            className="absolute top-0 bottom-0 w-5 -ml-2.5 z-20 flex items-center justify-center pointer-events-none"
            style={{ left: `${ropePos}%` }}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-[0_0_25px_#ffffff] border-2 border-amber-300 flex items-center justify-center animate-ping" />
            <div className="absolute w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_12px_#fbbf24]" />
          </div>

          {/* Goal Labels */}
          <div className="absolute left-2.5 top-0 bottom-0 flex items-center text-[9px] sm:text-[10px] font-black text-rose-400/90 pointer-events-none gap-0.5 z-10">
            <ChevronLeft className="w-3 h-3 animate-pulse" /> P2 WIN ZONE
          </div>
          <div className="absolute right-2.5 top-0 bottom-0 flex items-center text-[9px] sm:text-[10px] font-black text-cyan-400/90 pointer-events-none gap-0.5 z-10">
            P1 WIN ZONE <ChevronRight className="w-3 h-3 animate-pulse" />
          </div>
        </div>

        {/* Dynamic Push Chevrons */}
        <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-muted-foreground px-1">
          <span className="flex items-center gap-1 text-rose-400">
            {lastPushDirection === "left" && <span className="animate-pulse">◀◀ PUSHING</span>}
          </span>
          <span className="text-white/60 font-mono">
            {ropePos > 52 ? "P1 ADVANTAGE" : ropePos < 48 ? "P2 ADVANTAGE" : "CLASH DEADLOCK"}
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            {lastPushDirection === "right" && <span className="animate-pulse">PUSHING ▶▶</span>}
          </span>
        </div>
      </div>

      {/* ── BOTTOM SECTION: Main Player Cockpit & Slam Pad ── */}
      <div
        className={`w-full flex flex-col justify-between p-2.5 sm:p-3.5 rounded-2xl transition-all border relative overflow-hidden shrink-0 ${
          isLocalMode ? "flex-1 max-h-[44%]" : "flex-1"
        } bg-slate-900/50 border-white/[0.08]`}
      >
        {/* Heat Aura Glow */}
        {hostHeat > 70 && (
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent pointer-events-none animate-pulse" />
        )}
        {isHostShielded && (
          <div className="absolute inset-0 border-2 border-purple-400/80 rounded-2xl pointer-events-none shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse" />
        )}

        {/* Player Tag, RPM Tachometer, and Percent */}
        <div className="flex items-center justify-between w-full mb-1.5 z-10 px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-400/40 flex items-center justify-center text-xs font-black text-cyan-300 shadow-inner">
              P1
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm text-cyan-300 truncate max-w-[120px] sm:max-w-[170px]">
                  {isLocalMode ? hostPlayerName : "YOU"}
                </span>
                {hostHeat >= 90 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-[9px] sm:text-[10px] animate-pulse flex items-center gap-0.5 shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                    <Flame className="w-2.5 h-2.5" /> OVERDRIVE
                  </span>
                )}
                {isHostShielded && (
                  <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 border border-purple-400/60 text-purple-300 font-extrabold text-[9px] flex items-center gap-0.5">
                    <Shield className="w-2.5 h-2.5" /> SHIELD
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground/70 font-mono">
                Taps: {hostTaps} • Multiplier: {hostMultiplierTapsLeft > 0 ? `${hostMultiplierTapsLeft}x 2X` : "1x"}
              </span>
            </div>
          </div>

          {/* RPM LED Bar Gauge & Territory Percent */}
          <div className="flex items-center gap-2">
            {/* 5-segment LED tachometer */}
            <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-black/40 border border-white/10">
              <span className="text-[8px] font-mono text-muted-foreground mr-1">HEAT</span>
              {[20, 40, 60, 80, 100].map((step) => (
                <div
                  key={step}
                  className={`w-1.5 h-3 rounded-xs transition-colors ${
                    hostHeat >= step
                      ? step === 100
                        ? "bg-cyan-400 shadow-[0_0_6px_#06b6d4]"
                        : "bg-blue-400 shadow-[0_0_4px_#38bdf8]"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            <div className="px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-black font-mono text-xs sm:text-sm shadow-sm flex items-center gap-1">
              <span>{Math.round(ropePos)}%</span>
            </div>
          </div>
        </div>

        {/* Tactical Power-Up Bar (P1) */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-1.5 z-10 w-full flex-wrap">
          <button
            type="button"
            title="2X Overcharge: Next 12 taps deliver double push force"
            disabled={!hostPowerUpsAvailable["2x"]}
            onClick={() => handleUsePowerUp("2x", "host")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
              hostPowerUpsAvailable["2x"]
                ? "bg-amber-500/25 border-amber-400/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95 cursor-pointer hover:bg-amber-500/35"
                : "opacity-30 cursor-not-allowed border-white/10 text-muted-foreground"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>2X {hostPowerUpsAvailable["2x"] ? "(1x)" : "(Used)"}</span>
          </button>

          <button
            type="button"
            title="Glitch Freeze: Locks opponent taps for 1.4 seconds"
            disabled={!hostPowerUpsAvailable.freeze}
            onClick={() => handleUsePowerUp("freeze", "host")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
              hostPowerUpsAvailable.freeze
                ? "bg-cyan-500/25 border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] active:scale-95 cursor-pointer hover:bg-cyan-500/35"
                : "opacity-30 cursor-not-allowed border-white/10 text-muted-foreground"
            }`}
          >
            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
            <span>Freeze {hostPowerUpsAvailable.freeze ? "(1x)" : "(Used)"}</span>
          </button>

          <button
            type="button"
            title="EMP Shockwave: Instant 12% territory blast"
            disabled={!hostPowerUpsAvailable.bomb}
            onClick={() => handleUsePowerUp("bomb", "host")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
              hostPowerUpsAvailable.bomb
                ? "bg-rose-500/25 border-rose-400/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)] active:scale-95 cursor-pointer hover:bg-rose-500/35"
                : "opacity-30 cursor-not-allowed border-white/10 text-muted-foreground"
            }`}
          >
            <Bomb className="w-3.5 h-3.5 text-rose-400" />
            <span>EMP {hostPowerUpsAvailable.bomb ? "(1x)" : "(Used)"}</span>
          </button>

          <button
            type="button"
            title="Kinetic Shield: Absorbs 75% opponent push for 2.5 seconds"
            disabled={!hostPowerUpsAvailable.shield}
            onClick={() => handleUsePowerUp("shield", "host")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
              hostPowerUpsAvailable.shield
                ? "bg-purple-500/25 border-purple-400/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)] active:scale-95 cursor-pointer hover:bg-purple-500/35"
                : "opacity-30 cursor-not-allowed border-white/10 text-muted-foreground"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Shield {hostPowerUpsAvailable.shield ? "(1x)" : "(Used)"}</span>
          </button>
        </div>

        {/* Primary Giant Tactile Mash Pad */}
        <div
          onTouchStart={(e) => handleTouchZone(isLocalMode ? "host" : isHost ? "host" : "guest", e)}
          onClick={(e) => executeTap(isLocalMode ? "host" : isHost ? "host" : "guest", e.clientX, e.clientY)}
          className={`w-full flex-1 min-h-[90px] sm:min-h-[120px] rounded-2xl flex flex-col items-center justify-center cursor-pointer border-2 transition-all active:scale-[0.98] select-none relative overflow-hidden shadow-2xl ${
            isHostFrozen
              ? "bg-cyan-950/60 border-cyan-400 animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.5)]"
              : "bg-gradient-to-b from-cyan-500/25 via-cyan-900/30 to-slate-950 border-cyan-400/50 hover:border-cyan-300 hover:from-cyan-500/35 shadow-[0_0_35px_rgba(6,182,212,0.25)] active:shadow-[0_0_50px_rgba(6,182,212,0.5)]"
          }`}
        >
          {/* Radial Center Light */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent pointer-events-none" />

          {isHostFrozen ? (
            <div className="flex items-center gap-2 text-cyan-200 font-black text-base sm:text-lg">
              <Snowflake className="w-6 h-6 animate-spin text-cyan-300" /> FROZEN! WAIT TO THAW!
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 z-10">
                <span className="font-black text-xl sm:text-3xl text-cyan-200 tracking-wider drop-shadow-[0_2px_10px_rgba(6,182,212,0.8)]">
                  ⚡ RAPID MASH! ⚡
                </span>
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold text-cyan-300/80 mt-1 z-10">
                Use multiple fingers • Keyboard: [SPACE] or [A]
              </span>
            </>
          )}
        </div>
      </div>

      {/* Floating Tap Crit Indicators */}
      <AnimatePresence>
        {floatingTexts.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, scale: 0.8, y: 0 }}
            animate={{ opacity: 0, scale: 1.4, y: -45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="fixed pointer-events-none font-black text-sm sm:text-base z-50 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            style={{
              left: item.x - 20,
              top: item.y - 20,
              color: item.color,
            }}
          >
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
