import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GameRoomState,
  PenFightGameState,
  PenRigidBody,
  PenModelId,
  PenFlickMove,
  PenSurfaceType,
  PenSkinId,
  PenPowerUpOnDesk,
  DeskDamageMark,
  TrickShotEvent,
  ReplayFrame,
} from "../../types";
import {
  PEN_MODELS,
  TABLE_DIMENSIONS,
  createInitialPenRigidBody,
  PenDefinition,
  SURFACE_TYPES,
  SurfaceDefinition,
  PEN_SKINS,
  SkinDefinition,
  POWER_UP_DEFINITIONS,
  isPenUnlocked,
  isSurfaceUnlocked,
  isSkinUnlocked,
  getPenFightWins,
  incrementPenFightWins,
} from "../../data/penFightData";
import {
  simulatePhysicsStep,
  applyFlickImpulse,
  getSmartPenAIFlick,
  getPenEndpoints,
  captureReplayFrame,
  detectTrickShots,
} from "../../services/penPhysicsEngine";
import { gameAudio } from "../../services/gameSoundService";
import { gameHaptics } from "../../services/gameHapticsService";
import { sendGameMove } from "../../services/gameRoomService";
import { triggerConfetti } from "../../services/confettiEffect";
import { Button } from "@/components/ui/button";
import {
  Swords,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Target,
  Zap,
  Info,
  ChevronRight,
  Shield,
  Layers,
  Award,
  Maximize2,
  Minimize2,
  Lock,
  Play,
  Palette,
} from "lucide-react";

interface PenFightGameProps {
  room: GameRoomState<PenFightGameState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<PenFightGameState>) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const PenFightGame: React.FC<PenFightGameProps> = ({
  room,
  myPlayerId,
  isMyTurn,
  onLocalMove,
}) => {
  const isHost = room.players.host.id === myPlayerId;
  const isAIMode = room.mode === "ai";
  const isLocalMode = room.mode === "local";

  const rawState = room.gameState as PenFightGameState;

  // Stable Fallback Initial State with resilient currentTurn resolution
  const state: PenFightGameState = useMemo(() => {
    const turn = rawState?.currentTurn || room.currentTurn || room.players.host.id;
    if (rawState && rawState.phase) {
      return {
        ...rawState,
        currentTurn: turn,
        totalRounds: rawState.totalRounds || 3,
        surfaceType: rawState.surfaceType || "classic_wood",
      };
    }
    return {
      phase: "aiming",
      roundNumber: 1,
      totalRounds: 3,
      hostPen: createInitialPenRigidBody("host", "pilot_v5", true),
      guestPen: createInitialPenRigidBody("guest", "reynolds_045", true),
      currentTurn: turn,
      hostWins: 0,
      guestWins: 0,
      lastFlick: null,
      roundWinnerId: null,
      commentary: "Classroom Duel Ready! Aim your pen and flick to strike!",
      surfaceType: "classic_wood",
      powerUps: [],
      hostActivePowerUp: null,
      guestActivePowerUp: null,
      deskDamage: [],
      trickShots: [],
      hostTrickScore: 0,
      guestTrickScore: 0,
    };
  }, [rawState, room.currentTurn, room.players.host.id]);

  const activeTurnPlayerId = state.currentTurn || room.currentTurn || room.players.host.id;
  const isHostTurn = useMemo(() => {
    const t = state.currentTurn || room.currentTurn;
    if (!t || t === "host" || t === "p1" || t === room.players.host.id) return true;
    if (
      t === "guest" ||
      t === "p2" ||
      t === room.players.guest?.id ||
      t === "ai_opponent" ||
      t === "local_player_2"
    ) {
      return false;
    }
    return t === room.players.host.id;
  }, [state.currentTurn, room.currentTurn, room.players.host.id, room.players.guest?.id]);

  const isCurrentTurnMine = useMemo(() => {
    if (room.spectators?.[myPlayerId]) return false;
    if (isLocalMode) return true;
    if (isHost) return isHostTurn;
    return !isHostTurn;
  }, [room.spectators, myPlayerId, isLocalMode, isHost, isHostTurn]);

  // Active player names
  const hostName = room.players.host.name;
  const guestName = room.players.guest?.name || (isAIMode ? "Backbench King AI 🤖" : "Player 2");
  const activePlayerName = isHostTurn ? hostName : guestName;

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time Physics Simulation State (Decoupled from React render cycle)
  const hostPenRef = useRef<PenRigidBody>(state.hostPen);
  const guestPenRef = useRef<PenRigidBody>(state.guestPen);
  const animFrameIdRef = useRef<number | null>(null);
  const isSimulatingRef = useRef<boolean>(false);
  const lastExecutedFlickTimestamp = useRef<number>(state.lastFlick?.timestamp || 0);

  // Real-time Aiming Refs (Zero React state updates during drag for 100% 60fps fluidity)
  const isAimingRef = useRef<boolean>(false);
  const aimStartRef = useRef<{ x: number; y: number } | null>(null);
  const aimCurrentRef = useRef<{ x: number; y: number } | null>(null);
  const aimPowerRef = useRef<number>(0);
  const aimAngleRef = useRef<number>(0);

  // Kinetic Particles & Screen Tremor
  const particlesRef = useRef<Particle[]>([]);
  const screenShakeRef = useRef<number>(0);

  // Replay System
  const replayBufferRef = useRef<ReplayFrame[]>([]);
  const isReplayingRef = useRef<boolean>(false);
  const replayFrameIndexRef = useRef<number>(0);

  // Desk damage marks (persistent across rounds)
  const deskDamageRef = useRef<DeskDamageMark[]>(state.deskDamage || []);

  // Ambient sound stop function
  const stopAmbienceRef = useRef<(() => void) | null>(null);

  // React UI States (For modals and overlays only, never per-frame physics)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPenSelectorOpen, setIsPenSelectorOpen] = useState<boolean>(false);
  const [selectorTab, setSelectorTab] = useState<"pens" | "surfaces" | "skins">("pens");
  const [selectedPenModel, setSelectedPenModel] = useState<PenModelId>(
    isHost ? state.hostPen.modelId : state.guestPen.modelId
  );
  const [isCapOn, setIsCapOn] = useState<boolean>(
    isHost ? state.hostPen.capOn : state.guestPen.capOn
  );
  const [selectedSkin, setSelectedSkin] = useState<PenSkinId>(
    isHost ? (state.hostPen.skinId || "default") : (state.guestPen.skinId || "default")
  );
  const [selectedSurface, setSelectedSurface] = useState<PenSurfaceType>(state.surfaceType || "classic_wood");
  const [roundOverBanner, setRoundOverBanner] = useState<string | null>(null);
  const [trickShotBanner, setTrickShotBanner] = useState<TrickShotEvent | null>(null);
  const [showReplayBadge, setShowReplayBadge] = useState<boolean>(false);
  const [totalRoundsChoice, setTotalRoundsChoice] = useState<number>(state.totalRounds);
  const [aimMode, setAimMode] = useState<"slingshot" | "direct">("slingshot");
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => gameAudio.isMuted());

  // Keep physics refs in sync with external state updates when not simulating
  useEffect(() => {
    if (!isSimulatingRef.current) {
      hostPenRef.current = state.hostPen;
      guestPenRef.current = state.guestPen;
    }
  }, [state.hostPen, state.guestPen]);

  // Start ambient classroom sounds
  useEffect(() => {
    stopAmbienceRef.current = gameAudio.startClassroomAmbience();
    return () => {
      if (stopAmbienceRef.current) {
        stopAmbienceRef.current();
      }
    };
  }, []);

  // ── Fullscreen Toggle ──
  const toggleFullscreen = useCallback(() => {
    gameAudio.playClick();
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen((prev) => !prev);
        });
      } else {
        setIsFullscreen((prev) => !prev);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  }, []);

  // Listen to fullscreen changes & 'F' hotkey
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        ) {
          return;
        }
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleFullscreen]);

  // Synchronize game room state with room status, winnerId, and progression
  const syncGameState = useCallback(
    async (
      nextState: PenFightGameState,
      nextTurn?: string,
      roomStatus: "playing" | "round_over" | "game_over" = "playing",
      winnerId: string | null = null
    ) => {
      if (isLocalMode && onLocalMove) {
        onLocalMove({
          ...room,
          status: roomStatus,
          winnerId: winnerId,
          gameState: nextState,
          currentTurn: nextTurn || nextState.currentTurn,
          players: {
            ...room.players,
            host: {
              ...room.players.host,
              score: nextState.hostWins,
            },
            guest: room.players.guest
              ? {
                  ...room.players.guest,
                  score: nextState.guestWins,
                }
              : undefined,
          },
          lastMoveTimestamp: Date.now(),
        });
      } else {
        await sendGameMove(
          room.roomCode,
          nextState,
          nextTurn || nextState.currentTurn,
          null,
          false,
          nextState.hostWins,
          nextState.guestWins
        );
      }
    },
    [isLocalMode, onLocalMove, room]
  );

  // Spawn kinetic particles
  const spawnParticles = (x: number, y: number, count: number, color: string, speed: number = 6) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = (Math.random() * 0.7 + 0.3) * speed;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        life: 0,
        maxLife: Math.floor(Math.random() * 22 + 16),
        color,
        size: Math.random() * 3 + 1.5,
      });
    }
  };

  // Spawn skin-specific trail particles
  const spawnSkinTrail = (pen: PenRigidBody) => {
    const speed = Math.hypot(pen.vx, pen.vy);
    if (speed < 5 || pen.isFallen) return;

    const skin = PEN_SKINS[pen.skinId || "default"];
    if (!skin || skin.overlayType === "none") return;

    if (skin.overlayType === "particles") {
      if (Math.random() < 0.5) {
        const trailX = pen.x - pen.vx * 0.5 + (Math.random() - 0.5) * pen.width;
        const trailY = pen.y - pen.vy * 0.5 + (Math.random() - 0.5) * pen.width;
        particlesRef.current.push({
          x: trailX, y: trailY,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 0,
          maxLife: Math.floor(Math.random() * 16 + 10),
          color: Math.random() > 0.5 ? skin.color1 : skin.color2,
          size: Math.random() * 2.5 + 1,
        });
      }
    }
  };

  // Add desk damage mark at collision point
  const addDeskDamage = (x: number, y: number, intensity: number) => {
    const types: DeskDamageMark["type"][] = ["ink_splatter", "scratch", "dent"];
    const mark: DeskDamageMark = {
      x, y,
      type: types[Math.floor(Math.random() * types.length)],
      radius: 8 + intensity * 25,
      color: `rgba(30, 58, 138, ${0.15 + intensity * 0.2})`,
      angle: Math.random() * Math.PI * 2,
      opacity: 0.3 + intensity * 0.4,
    };
    deskDamageRef.current = [...deskDamageRef.current, mark].slice(-30); // Cap at 30 marks
  };

  // ── Hyper-Realistic Model-Specific Pen Rendering ──
  const drawPen = (
    ctx: CanvasRenderingContext2D,
    pen: PenRigidBody,
    isTarget: boolean
  ) => {
    ctx.save();
    ctx.translate(pen.x, pen.y);
    ctx.rotate(pen.angle);

    const halfL = pen.length / 2;
    const halfW = pen.width / 2;
    const fallenZ = pen.fallenZ || 0;
    const teeter = pen.teeterProgress || 0;

    // ── 1. Physical Cast Drop Shadow on Wood ──
    ctx.save();
    if (!pen.isFallen) {
      const shadowOffsetX = 8 + teeter * 18;
      const shadowOffsetY = 12 + teeter * 20;
      const shadowBlur = 8 + teeter * 10;
      ctx.shadowColor = `rgba(35, 15, 5, ${0.42 * (1 - teeter * 0.3)})`;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = shadowOffsetX;
      ctx.shadowOffsetY = shadowOffsetY;
      ctx.fillStyle = `rgba(35, 15, 5, ${0.42 * (1 - teeter * 0.3)})`;
      ctx.beginPath();
      ctx.roundRect(-halfL, -halfW, pen.length, pen.width, halfW * 0.9);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      const shadowScale = Math.max(0.2, 1 - fallenZ * 0.007);
      ctx.translate(fallenZ * 1.5, fallenZ * 2.2);
      ctx.scale(shadowScale, shadowScale);
      ctx.shadowColor = `rgba(15, 10, 5, ${Math.max(0, 0.45 - fallenZ * 0.005)})`;
      ctx.shadowBlur = Math.min(25, 8 + fallenZ * 0.25);
      ctx.fillStyle = `rgba(15, 10, 5, ${Math.max(0, 0.45 - fallenZ * 0.005)})`;
      ctx.beginPath();
      ctx.roundRect(-halfL, -halfW, pen.length, pen.width, halfW);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // 3D Perspective Shrinkage when tumbling off table
    if (pen.isFallen) {
      const fallScale = Math.max(0.35, 1 - fallenZ * 0.006);
      ctx.scale(fallScale, fallScale);
    }

    // ── 2. Active Pen Turn Pulsing Halo ──
    if (isTarget && !pen.isFallen && state.phase === "aiming") {
      ctx.save();
      const pulseTime = Date.now() * 0.004;
      const haloAlpha = 0.5 + Math.sin(pulseTime) * 0.25;
      ctx.strokeStyle = `rgba(245, 158, 11, ${haloAlpha})`;
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 6]);
      ctx.lineDashOffset = -Date.now() * 0.02;
      ctx.beginPath();
      ctx.roundRect(-halfL - 9, -halfW - 9, pen.length + 18, pen.width + 18, halfW + 9);
      ctx.stroke();
      ctx.restore();
    }

    // ── Shield Power-Up Visual ──
    if (pen.hasShield && !pen.isFallen) {
      ctx.save();
      const shieldPulse = 0.6 + Math.sin(Date.now() * 0.006) * 0.3;
      ctx.strokeStyle = `rgba(59, 130, 246, ${shieldPulse})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = "#3b82f6";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(-halfL - 6, -halfW - 6, pen.length + 12, pen.width + 12, halfW + 6);
      ctx.stroke();
      ctx.restore();
    }

    // ── Skin Glow Effect ──
    const skin = PEN_SKINS[pen.skinId || "default"];
    if (skin && skin.overlayType === "glow" && !pen.isFallen) {
      ctx.save();
      const glowPulse = 0.4 + Math.sin(Date.now() * 0.005) * 0.3;
      ctx.shadowColor = skin.color1;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = `${skin.color1}${Math.round(glowPulse * 255).toString(16).padStart(2, "0")}`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-halfL - 4, -halfW - 4, pen.length + 8, pen.width + 8, halfW + 4);
      ctx.stroke();
      ctx.restore();
    }

    // ── 3. High-Speed Motion Blur Streaks ──
    const speed = Math.hypot(pen.vx, pen.vy);
    if (speed > 10 && !pen.isFallen) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = pen.width * 0.7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-halfL, 0);
      ctx.lineTo(-halfL - speed * 3.5, 0);
      ctx.stroke();
      ctx.restore();
    }

    // ── 4. Detailed Pen Construction by Model ──
    if (pen.modelId === "reynolds_045") {
      // ════════ REYNOLDS 045 FINE CARBURE (Hexagonal White Barrel) ════════
      const facetH = pen.width / 3;

      const topGrad = ctx.createLinearGradient(0, -halfW, 0, -halfW + facetH);
      topGrad.addColorStop(0, "#cbd5e1");
      topGrad.addColorStop(0.5, "#f1f5f9");
      topGrad.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = topGrad;
      ctx.fillRect(-halfL + 20, -halfW, pen.length - 42, facetH);

      const midGrad = ctx.createLinearGradient(0, -halfW + facetH, 0, halfW - facetH);
      midGrad.addColorStop(0, "#ffffff");
      midGrad.addColorStop(0.3, "#f8fafc");
      midGrad.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = midGrad;
      ctx.fillRect(-halfL + 20, -halfW + facetH, pen.length - 42, facetH);

      const botGrad = ctx.createLinearGradient(0, halfW - facetH, 0, halfW);
      botGrad.addColorStop(0, "#cbd5e1");
      botGrad.addColorStop(1, "#94a3b8");
      ctx.fillStyle = botGrad;
      ctx.fillRect(-halfL + 20, halfW - facetH, pen.length - 42, facetH);

      ctx.strokeStyle = "rgba(100, 116, 139, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-halfL + 20, -halfW + facetH);
      ctx.lineTo(halfL - 22, -halfW + facetH);
      ctx.moveTo(-halfL + 20, halfW - facetH);
      ctx.lineTo(halfL - 22, halfW - facetH);
      ctx.stroke();

      ctx.save();
      ctx.fillStyle = "#1e40af";
      ctx.font = "italic bold 8px 'Brush Script MT', cursive, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Reynolds 045", 2, 0);
      ctx.restore();

      const brassGrad = ctx.createLinearGradient(halfL - 22, -halfW, halfL, halfW);
      brassGrad.addColorStop(0, "#d97706");
      brassGrad.addColorStop(0.5, "#fef08a");
      brassGrad.addColorStop(1, "#b45309");
      ctx.fillStyle = brassGrad;
      ctx.beginPath();
      ctx.moveTo(halfL - 22, -halfW + 2);
      ctx.lineTo(halfL + 8, -1.5);
      ctx.lineTo(halfL + 8, 1.5);
      ctx.lineTo(halfL - 22, halfW - 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.arc(halfL + 9, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();

      if (pen.capOn) {
        const capGrad = ctx.createLinearGradient(-halfL, -halfW - 2, -halfL + 34, halfW + 2);
        capGrad.addColorStop(0, "#1d4ed8");
        capGrad.addColorStop(0.3, "#60a5fa");
        capGrad.addColorStop(0.8, "#1e40af");
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW - 1.5, 34, pen.width + 3, 4);
        ctx.fill();

        ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
        for (let cg = -halfL + 6; cg < -halfL + 24; cg += 5) {
          ctx.fillRect(cg, -halfW - 1, 2, pen.width + 2);
        }

        ctx.fillStyle = "#1e3a8a";
        ctx.beginPath();
        ctx.roundRect(-halfL + 8, -halfW - 6, 22, 4.5, 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#1d4ed8";
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW + 2, 8, pen.width - 4, 3);
        ctx.fill();
      }
    } else if (pen.modelId === "pilot_v5") {
      // ════════ PILOT V5 HI-TECPOINT (Gloss Navy & Stainless Needle Point) ════════
      const barrelGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
      barrelGrad.addColorStop(0, "#1e3a8a");
      barrelGrad.addColorStop(0.25, "#3b82f6");
      barrelGrad.addColorStop(0.5, "#ffffff");
      barrelGrad.addColorStop(0.75, "#1d4ed8");
      barrelGrad.addColorStop(1, "#0f172a");

      ctx.fillStyle = barrelGrad;
      ctx.beginPath();
      ctx.roundRect(-halfL + 26, -halfW, pen.length - 56, pen.width, 3);
      ctx.fill();

      ctx.fillStyle = "rgba(226, 232, 240, 0.75)";
      ctx.fillRect(halfL - 50, -halfW + 1, 16, pen.width - 2);
      ctx.fillStyle = "#1e40af";
      ctx.fillRect(halfL - 48, -halfW + 3, 12, pen.width - 6);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      for (let fw = halfL - 46; fw < halfL - 36; fw += 3) {
        ctx.beginPath();
        ctx.moveTo(fw, -halfW + 2);
        ctx.lineTo(fw, halfW - 2);
        ctx.stroke();
      }

      const collarGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
      collarGrad.addColorStop(0, "#94a3b8");
      collarGrad.addColorStop(0.5, "#ffffff");
      collarGrad.addColorStop(1, "#475569");
      ctx.fillStyle = collarGrad;
      ctx.fillRect(halfL - 34, -halfW, 10, pen.width);

      ctx.fillStyle = collarGrad;
      ctx.beginPath();
      ctx.moveTo(halfL - 24, -halfW + 4);
      ctx.lineTo(halfL - 10, -2);
      ctx.lineTo(halfL + 12, -1.2);
      ctx.lineTo(halfL + 14, 0);
      ctx.lineTo(halfL + 12, 1.2);
      ctx.lineTo(halfL - 10, 2);
      ctx.lineTo(halfL - 24, halfW - 4);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PILOT V5", 0, 0);
      ctx.restore();

      if (pen.capOn) {
        const capGrad = ctx.createLinearGradient(-halfL, -halfW, -halfL + 30, halfW);
        capGrad.addColorStop(0, "#1e3a8a");
        capGrad.addColorStop(0.4, "#60a5fa");
        capGrad.addColorStop(1, "#172554");
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW - 1, 30, pen.width + 2, 4);
        ctx.fill();

        ctx.fillStyle = collarGrad;
        ctx.beginPath();
        ctx.roundRect(-halfL + 6, -halfW - 5, 22, 4, 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW + 2, 8, pen.width - 4, 3);
        ctx.fill();
      }
    } else if (pen.modelId === "trimax") {
      // ════════ TRIMAX GOLD GEL (Matte Black & Mirror Gold Trim) ════════
      const trimaxGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
      trimaxGrad.addColorStop(0, "#1e293b");
      trimaxGrad.addColorStop(0.3, "#334155");
      trimaxGrad.addColorStop(0.7, "#0f172a");
      trimaxGrad.addColorStop(1, "#020617");
      ctx.fillStyle = trimaxGrad;
      ctx.beginPath();
      ctx.roundRect(-halfL + 26, -halfW, pen.length - 56, pen.width, 3);
      ctx.fill();

      ctx.fillStyle = "#020617";
      ctx.beginPath();
      ctx.roundRect(halfL - 46, -halfW + 0.5, 26, pen.width - 1, 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      for (let tx = halfL - 42; tx < halfL - 22; tx += 4) {
        ctx.fillRect(tx, -halfW + 2, 1.5, pen.width - 4);
      }

      const goldGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
      goldGrad.addColorStop(0, "#f59e0b");
      goldGrad.addColorStop(0.5, "#fef08a");
      goldGrad.addColorStop(1, "#b45309");

      ctx.fillStyle = goldGrad;
      ctx.fillRect(-halfL + 28, -halfW - 0.5, 4, pen.width + 1);
      ctx.fillRect(halfL - 48, -halfW - 0.5, 4, pen.width + 1);

      const tipGrad = ctx.createLinearGradient(halfL - 20, -halfW, halfL, halfW);
      tipGrad.addColorStop(0, "#94a3b8");
      tipGrad.addColorStop(0.5, "#ffffff");
      tipGrad.addColorStop(1, "#475569");
      ctx.fillStyle = tipGrad;
      ctx.beginPath();
      ctx.moveTo(halfL - 20, -halfW + 3);
      ctx.lineTo(halfL + 7, -2);
      ctx.lineTo(halfL + 9, 0);
      ctx.lineTo(halfL + 7, 2);
      ctx.lineTo(halfL - 20, halfW - 3);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TRIMAX", -4, 0);
      ctx.restore();

      if (pen.capOn) {
        ctx.fillStyle = trimaxGrad;
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW - 1, 30, pen.width + 2, 4);
        ctx.fill();
        ctx.fillStyle = goldGrad;
        ctx.fillRect(-halfL + 4, -halfW - 1, 3, pen.width + 2);
        ctx.fillStyle = goldGrad;
        ctx.beginPath();
        ctx.roundRect(-halfL + 8, -halfW - 5.5, 20, 4.5, 2);
        ctx.fill();
      } else {
        ctx.fillStyle = goldGrad;
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW + 2, 6, pen.width - 4, 3);
        ctx.fill();
      }
    } else if (pen.modelId === "parker_vector") {
      // ════════ PARKER VECTOR STEEL (Brushed Metal & Arrow Clip) ════════
      const steelGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
      steelGrad.addColorStop(0, "#64748b");
      steelGrad.addColorStop(0.2, "#cbd5e1");
      steelGrad.addColorStop(0.5, "#f8fafc");
      steelGrad.addColorStop(0.8, "#94a3b8");
      steelGrad.addColorStop(1, "#475569");

      ctx.fillStyle = steelGrad;
      ctx.beginPath();
      ctx.roundRect(-halfL + 24, -halfW, pen.length - 52, pen.width, 3);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-halfL + 24, -halfW * 0.4);
      ctx.lineTo(halfL - 28, -halfW * 0.4);
      ctx.moveTo(-halfL + 24, 0);
      ctx.lineTo(halfL - 28, 0);
      ctx.stroke();

      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.roundRect(halfL - 32, -halfW + 1, 16, pen.width - 2, 2);
      ctx.fill();

      ctx.fillStyle = steelGrad;
      ctx.beginPath();
      ctx.moveTo(halfL - 16, -halfW + 3);
      ctx.lineTo(halfL + 8, -2);
      ctx.lineTo(halfL + 10, 0);
      ctx.lineTo(halfL + 8, 2);
      ctx.lineTo(halfL - 16, halfW - 3);
      ctx.closePath();
      ctx.fill();

      if (pen.capOn) {
        ctx.fillStyle = steelGrad;
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW - 1, 30, pen.width + 2, 3);
        ctx.fill();
        const arrowGrad = ctx.createLinearGradient(0, -halfW - 6, 0, -halfW);
        arrowGrad.addColorStop(0, "#ffffff");
        arrowGrad.addColorStop(1, "#94a3b8");
        ctx.fillStyle = arrowGrad;
        ctx.beginPath();
        ctx.moveTo(-halfL + 6, -halfW - 5);
        ctx.lineTo(-halfL + 24, -halfW - 5);
        ctx.lineTo(-halfL + 28, -halfW - 3);
        ctx.lineTo(-halfL + 24, -halfW - 1);
        ctx.lineTo(-halfL + 6, -halfW - 1);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW + 2, 7, pen.width - 4, 2);
        ctx.fill();
      }
    } else if (pen.modelId === "montblanc") {
      // ════════ MONTBLANC MEISTERSTÜCK (Deep Black Resin & Gold Bands) ════════
      const resinGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
      resinGrad.addColorStop(0, "#1a1a2e");
      resinGrad.addColorStop(0.3, "#2d2d44");
      resinGrad.addColorStop(0.5, "#3d3d5c");
      resinGrad.addColorStop(0.7, "#1a1a2e");
      resinGrad.addColorStop(1, "#0a0a14");
      ctx.fillStyle = resinGrad;
      ctx.beginPath();
      ctx.roundRect(-halfL + 24, -halfW, pen.length - 52, pen.width, 4);
      ctx.fill();

      // Gold accent bands
      const mbGold = ctx.createLinearGradient(0, -halfW, 0, halfW);
      mbGold.addColorStop(0, "#d4af37");
      mbGold.addColorStop(0.5, "#ffd700");
      mbGold.addColorStop(1, "#b8860b");
      ctx.fillStyle = mbGold;
      ctx.fillRect(-halfL + 28, -halfW - 0.5, 3, pen.width + 1);
      ctx.fillRect(halfL - 36, -halfW - 0.5, 3, pen.width + 1);
      ctx.fillRect(0 - 1, -halfW - 0.5, 3, pen.width + 1);

      // Gold nib
      ctx.fillStyle = mbGold;
      ctx.beginPath();
      ctx.moveTo(halfL - 20, -halfW + 4);
      ctx.lineTo(halfL + 10, -1.5);
      ctx.lineTo(halfL + 12, 0);
      ctx.lineTo(halfL + 10, 1.5);
      ctx.lineTo(halfL - 20, halfW - 4);
      ctx.closePath();
      ctx.fill();

      // White star logo
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✦ MB", 0, 0);
      ctx.restore();

      if (pen.capOn) {
        ctx.fillStyle = resinGrad;
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW - 1, 32, pen.width + 2, 4);
        ctx.fill();
        // White star emblem on cap
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-halfL + 10, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a1a2e";
        ctx.beginPath();
        ctx.arc(-halfL + 10, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (pen.modelId === "lamy_safari") {
      // ════════ LAMY SAFARI (Signature Red ABS Plastic & Wire Clip) ════════
      const lamyGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
      lamyGrad.addColorStop(0, "#dc2626");
      lamyGrad.addColorStop(0.3, "#ef4444");
      lamyGrad.addColorStop(0.7, "#b91c1c");
      lamyGrad.addColorStop(1, "#991b1b");
      ctx.fillStyle = lamyGrad;
      ctx.beginPath();
      ctx.roundRect(-halfL + 22, -halfW, pen.length - 46, pen.width, 3);
      ctx.fill();

      // Ink window
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(halfL - 40, -halfW + 2, 12, pen.width - 4);

      // Steel nib
      const steelNib = ctx.createLinearGradient(halfL - 16, -halfW, halfL + 8, halfW);
      steelNib.addColorStop(0, "#94a3b8");
      steelNib.addColorStop(0.5, "#f1f5f9");
      steelNib.addColorStop(1, "#64748b");
      ctx.fillStyle = steelNib;
      ctx.beginPath();
      ctx.moveTo(halfL - 16, -halfW + 3);
      ctx.lineTo(halfL + 6, -1);
      ctx.lineTo(halfL + 8, 0);
      ctx.lineTo(halfL + 6, 1);
      ctx.lineTo(halfL - 16, halfW - 3);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 7px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("LAMY", 0, 0);
      ctx.restore();

      if (pen.capOn) {
        ctx.fillStyle = lamyGrad;
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW - 1, 26, pen.width + 2, 3);
        ctx.fill();
        // Wire clip
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-halfL + 6, -halfW - 5);
        ctx.lineTo(-halfL + 22, -halfW - 5);
        ctx.stroke();
      }
    } else if (pen.modelId === "camlin_flora") {
      // ════════ CAMLIN FLORA (Green Body & Yellow Flower Print) ════════
      const floraGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
      floraGrad.addColorStop(0, "#059669");
      floraGrad.addColorStop(0.3, "#10b981");
      floraGrad.addColorStop(0.7, "#047857");
      floraGrad.addColorStop(1, "#064e3b");
      ctx.fillStyle = floraGrad;
      ctx.beginPath();
      ctx.roundRect(-halfL + 22, -halfW, pen.length - 46, pen.width, 3);
      ctx.fill();

      // Flower pattern dots
      ctx.fillStyle = "#fef08a";
      for (let fx = -halfL + 30; fx < halfL - 30; fx += 16) {
        ctx.beginPath();
        ctx.arc(fx, -halfW * 0.3, 2, 0, Math.PI * 2);
        ctx.arc(fx + 8, halfW * 0.3, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Brass tip
      const brassTip = ctx.createLinearGradient(halfL - 18, -halfW, halfL + 6, halfW);
      brassTip.addColorStop(0, "#d97706");
      brassTip.addColorStop(0.5, "#fef08a");
      brassTip.addColorStop(1, "#b45309");
      ctx.fillStyle = brassTip;
      ctx.beginPath();
      ctx.moveTo(halfL - 18, -halfW + 3);
      ctx.lineTo(halfL + 4, -1.5);
      ctx.lineTo(halfL + 6, 0);
      ctx.lineTo(halfL + 4, 1.5);
      ctx.lineTo(halfL - 18, halfW - 3);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 7px cursive";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Flora", 0, 0);
      ctx.restore();

      if (pen.capOn) {
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW - 1, 26, pen.width + 2, 4);
        ctx.fill();
        // Flower emblem
        ctx.fillStyle = "#059669";
        ctx.beginPath();
        ctx.arc(-halfL + 10, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // ════════ CELLO GRIPPER (Translucent Body & Rubber Grip Dimples) ════════
      const transGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
      transGrad.addColorStop(0, "#94a3b8");
      transGrad.addColorStop(0.3, "#f1f5f9");
      transGrad.addColorStop(0.7, "#64748b");
      transGrad.addColorStop(1, "#334155");

      ctx.fillStyle = transGrad;
      ctx.beginPath();
      ctx.roundRect(-halfL + 24, -halfW, pen.length - 50, pen.width, 3);
      ctx.fill();

      ctx.fillStyle = "#1e40af";
      ctx.fillRect(-halfL + 28, -1.5, pen.length - 62, 3);

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(halfL - 46, -halfW + 0.5, 24, pen.width - 1, 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      for (let gx = halfL - 42; gx < halfL - 24; gx += 5) {
        ctx.beginPath();
        ctx.arc(gx, -halfW * 0.4, 1.2, 0, Math.PI * 2);
        ctx.arc(gx, halfW * 0.4, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(halfL - 22, -halfW + 3);
      ctx.lineTo(halfL + 7, -1.8);
      ctx.lineTo(halfL + 8, 0);
      ctx.lineTo(halfL + 7, 1.8);
      ctx.lineTo(halfL - 22, halfW - 3);
      ctx.closePath();
      ctx.fill();

      if (pen.capOn) {
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW - 1, 28, pen.width + 2, 4);
        ctx.fill();
      } else {
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW + 2, 8, pen.width - 4, 3);
        ctx.fill();
      }
    }

    // ── Carbon Fiber Skin Pattern Overlay ──
    if (skin && skin.overlayType === "pattern" && !pen.isFallen) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = skin.color2;
      ctx.lineWidth = 0.8;
      for (let px = -halfL + 24; px < halfL - 24; px += 6) {
        ctx.beginPath();
        ctx.moveTo(px, -halfW + 2);
        ctx.lineTo(px + 3, halfW - 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  };

  // ── Draw Power-Up Items on Desk ──
  const drawPowerUp = (ctx: CanvasRenderingContext2D, powerUp: PenPowerUpOnDesk) => {
    if (powerUp.collectedBy) return;

    const def = POWER_UP_DEFINITIONS[powerUp.type];
    const pulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
    const bobY = Math.sin(Date.now() * 0.003) * 4;

    ctx.save();
    ctx.translate(powerUp.x, powerUp.y + bobY);

    // Glow ring
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fillStyle = `${def.color}33`;
    ctx.fill();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = pulse;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Inner circle
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Emoji
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(def.emoji, 0, 1);

    ctx.restore();
  };

  // ── Render Scene to Canvas ──
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Coordinate scale from virtual table (1000 x 1800) to Canvas pixels
    const scaleX = w / TABLE_DIMENSIONS.width;
    const scaleY = h / TABLE_DIMENSIONS.height;

    ctx.save();

    // Screen Shake on Heavy Impact
    if (screenShakeRef.current > 0) {
      const shakeAmt = screenShakeRef.current;
      const shakeX = (Math.random() - 0.5) * shakeAmt * 12;
      const shakeY = (Math.random() - 0.5) * shakeAmt * 12;
      ctx.translate(shakeX, shakeY);
      screenShakeRef.current = Math.max(0, screenShakeRef.current - 0.08);
    }

    ctx.scale(scaleX, scaleY);

    const surface = SURFACE_TYPES[state.surfaceType || "classic_wood"] || SURFACE_TYPES.classic_wood;

    // ════════ 1. THE BATTLE DESK SURFACE (Surface-Type Aware) ════════
    const deskGrad = ctx.createLinearGradient(0, 0, TABLE_DIMENSIONS.width, TABLE_DIMENSIONS.height);
    deskGrad.addColorStop(0, surface.deskColorPrimary);
    deskGrad.addColorStop(0.35, surface.deskColorSecondary);
    deskGrad.addColorStop(0.7, surface.deskColorTertiary);
    deskGrad.addColorStop(1, surface.deskColorQuaternary);

    ctx.fillStyle = deskGrad;
    ctx.fillRect(0, 0, TABLE_DIMENSIONS.width, TABLE_DIMENSIONS.height);

    // Ambient Radial Lighting
    const sunGrad = ctx.createRadialGradient(
      TABLE_DIMENSIONS.width * 0.45,
      TABLE_DIMENSIONS.height * 0.48,
      80,
      TABLE_DIMENSIONS.width * 0.5,
      TABLE_DIMENSIONS.height * 0.5,
      TABLE_DIMENSIONS.height * 0.65
    );
    sunGrad.addColorStop(0, surface.ambientLight);
    sunGrad.addColorStop(0.5, surface.ambientLight.replace("0.18", "0.06").replace("0.15", "0.05").replace("0.12", "0.04"));
    sunGrad.addColorStop(1, "rgba(0, 0, 0, 0.28)");
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, TABLE_DIMENSIONS.width, TABLE_DIMENSIONS.height);

    // Procedural Wood Grain Lines (only for wood/velvet surfaces)
    if (state.surfaceType === "classic_wood" || state.surfaceType === "wet_desk") {
      ctx.strokeStyle = `rgba(80, 30, 8, ${surface.grainOpacity})`;
      ctx.lineWidth = 2;
      for (let gy = 40; gy < TABLE_DIMENSIONS.height; gy += 75) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(
          TABLE_DIMENSIONS.width * 0.32,
          gy - 30 + Math.sin(gy) * 15,
          TABLE_DIMENSIONS.width * 0.68,
          gy + 28 - Math.cos(gy) * 18,
          TABLE_DIMENSIONS.width,
          gy - 8
        );
        ctx.stroke();
      }
    }

    // Glass desk reflections
    if (state.surfaceType === "glass_desk") {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(300, 600, 200, 400, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(700, 1200, 150, 350, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Velvet mat texture
    if (state.surfaceType === "velvet_mat") {
      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = "#ffffff";
      for (let vx = 0; vx < TABLE_DIMENSIONS.width; vx += 8) {
        for (let vy = 0; vy < TABLE_DIMENSIONS.height; vy += 8) {
          if (Math.random() < 0.3) {
            ctx.fillRect(vx, vy, 1, 1);
          }
        }
      }
      ctx.restore();
    }

    // Wet desk water puddles
    if (state.surfaceType === "wet_desk") {
      ctx.save();
      ctx.fillStyle = "rgba(186, 230, 253, 0.12)";
      ctx.beginPath();
      ctx.ellipse(350, 500, 120, 80, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(700, 1100, 100, 60, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(200, 1400, 80, 50, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Wood Knots (only for wood)
    if (state.surfaceType === "classic_wood") {
      const drawWoodKnot = (kx: number, ky: number, rad: number) => {
        ctx.save();
        for (let r = rad; r > 3; r -= 5) {
          ctx.strokeStyle = "rgba(67, 20, 7, 0.22)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(kx, ky, r * 1.5, r, Math.PI / 12, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(45, 15, 5, 0.35)";
        ctx.beginPath();
        ctx.ellipse(kx, ky, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawWoodKnot(240, 680, 22);
      drawWoodKnot(810, 1150, 18);
    }

    // ════════ DESK DAMAGE MARKS (Accumulated) ════════
    if (deskDamageRef.current.length > 0) {
      ctx.save();
      for (const mark of deskDamageRef.current) {
        ctx.save();
        ctx.translate(mark.x, mark.y);
        ctx.rotate(mark.angle);
        ctx.globalAlpha = mark.opacity;

        if (mark.type === "ink_splatter") {
          ctx.fillStyle = mark.color;
          ctx.beginPath();
          ctx.arc(0, 0, mark.radius, 0, Math.PI * 2);
          ctx.fill();
          // Splatter drops
          for (let s = 0; s < 4; s++) {
            const sx = (Math.random() - 0.5) * mark.radius * 2;
            const sy = (Math.random() - 0.5) * mark.radius * 2;
            ctx.beginPath();
            ctx.arc(sx, sy, mark.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (mark.type === "scratch") {
          ctx.strokeStyle = "rgba(50, 20, 5, 0.3)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-mark.radius, 0);
          ctx.lineTo(mark.radius, 0);
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(30, 15, 5, 0.25)";
          ctx.beginPath();
          ctx.arc(0, 0, mark.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();
    }

    // ════════ 2. CARVED PENCIL TROUGH & HB PENCIL (Classic Wood only) ════════
    if (state.surfaceType === "classic_wood") {
      ctx.save();
      ctx.fillStyle = "rgba(45, 15, 5, 0.4)";
      ctx.beginPath();
      ctx.roundRect(45, 200, 32, 420, 16);
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 5, 2, 0.7)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.strokeStyle = "rgba(254, 215, 170, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(47, 202, 28, 416, 14);
      ctx.stroke();

      // Nataraj HB Pencil
      const pencilGrad = ctx.createLinearGradient(54, 250, 68, 250);
      pencilGrad.addColorStop(0, "#dc2626");
      pencilGrad.addColorStop(0.4, "#1e293b");
      pencilGrad.addColorStop(0.7, "#dc2626");
      pencilGrad.addColorStop(1, "#991b1b");
      ctx.fillStyle = pencilGrad;
      ctx.fillRect(55, 260, 12, 300);

      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.moveTo(55, 260);
      ctx.lineTo(61, 235);
      ctx.lineTo(67, 260);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.moveTo(59, 242);
      ctx.lineTo(61, 235);
      ctx.lineTo(63, 242);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 3D ENGRAVED COMPASS CARVINGS
      const draw3DCarving = (
        text: string,
        x: number,
        y: number,
        font: string,
        rotation: number = 0
      ) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.font = font;
        ctx.fillStyle = "rgba(45, 12, 4, 0.75)";
        ctx.fillText(text, -1, -1);
        ctx.fillStyle = "rgba(254, 243, 199, 0.65)";
        ctx.fillText(text, 1, 1);
        ctx.restore();
      };

      draw3DCarving("LAST BENCHERS 👑", 680, 390, "bold 26px 'Courier New', monospace", -0.06);
      draw3DCarving("AJ + SK", 750, 1520, "bold 32px 'Courier New', monospace", 0.08);
      draw3DCarving("Raju ❤️ Priya", 150, 1420, "bold 24px 'Courier New', monospace", -0.04);

      // Rosette Flower Mandala
      ctx.save();
      ctx.strokeStyle = "rgba(254, 243, 199, 0.4)";
      ctx.lineWidth = 1.8;
      const cx = 500;
      const cy = 900;
      const cr = 65;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.stroke();
      for (let p = 0; p < 6; p++) {
        const pAngle = (p * Math.PI) / 3;
        const px = cx + Math.cos(pAngle) * cr;
        const py = cy + Math.sin(pAngle) * cr;
        ctx.beginPath();
        ctx.arc(px, py, cr, pAngle + Math.PI * 0.65, pAngle + Math.PI * 1.35);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(35, 10, 3, 0.9)";
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Ink Splatters
      ctx.save();
      ctx.fillStyle = "rgba(30, 58, 138, 0.38)";
      ctx.beginPath();
      ctx.arc(630, 680, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(655, 665, 7, 0, Math.PI * 2);
      ctx.arc(618, 705, 9, 0, Math.PI * 2);
      ctx.arc(660, 698, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Chai Cup Moisture Ring
      ctx.save();
      ctx.strokeStyle = "rgba(100, 45, 10, 0.28)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(600, 560, 58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Metric Ruler Scratches
      ctx.save();
      ctx.strokeStyle = "rgba(30, 41, 59, 0.45)";
      ctx.lineWidth = 1.5;
      for (let rx = 120; rx <= 880; rx += 20) {
        const isMajor = (rx - 120) % 100 === 0;
        const tickH = isMajor ? 18 : 10;
        ctx.beginPath();
        ctx.moveTo(rx, TABLE_DIMENSIONS.height - 45);
        ctx.lineTo(rx, TABLE_DIMENSIONS.height - 45 + tickH);
        ctx.stroke();
        if (isMajor) {
          ctx.fillStyle = "rgba(30, 41, 59, 0.55)";
          ctx.font = "bold 11px monospace";
          ctx.fillText(`${(rx - 120) / 20}`, rx - 6, TABLE_DIMENSIONS.height - 50);
        }
      }
      ctx.restore();
    }

    // ════════ 3D BEVELED DESK BOUNDARIES ════════
    ctx.save();
    ctx.strokeStyle = state.surfaceType === "glass_desk"
      ? "rgba(30, 41, 59, 0.9)"
      : state.surfaceType === "velvet_mat"
      ? "rgba(5, 46, 22, 0.9)"
      : "rgba(50, 18, 4, 0.9)";
    ctx.lineWidth = TABLE_DIMENSIONS.beveledEdgeWidth;
    ctx.strokeRect(
      TABLE_DIMENSIONS.beveledEdgeWidth / 2,
      TABLE_DIMENSIONS.beveledEdgeWidth / 2,
      TABLE_DIMENSIONS.width - TABLE_DIMENSIONS.beveledEdgeWidth,
      TABLE_DIMENSIONS.height - TABLE_DIMENSIONS.beveledEdgeWidth
    );

    ctx.strokeStyle = state.surfaceType === "glass_desk"
      ? "rgba(147, 197, 253, 0.25)"
      : state.surfaceType === "velvet_mat"
      ? "rgba(74, 222, 128, 0.25)"
      : "rgba(254, 215, 170, 0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(TABLE_DIMENSIONS.beveledEdgeWidth, TABLE_DIMENSIONS.height - TABLE_DIMENSIONS.beveledEdgeWidth);
    ctx.lineTo(TABLE_DIMENSIONS.beveledEdgeWidth, TABLE_DIMENSIONS.beveledEdgeWidth);
    ctx.lineTo(TABLE_DIMENSIONS.width - TABLE_DIMENSIONS.beveledEdgeWidth, TABLE_DIMENSIONS.beveledEdgeWidth);
    ctx.stroke();

    ctx.strokeStyle = state.surfaceType === "glass_desk"
      ? "rgba(15, 23, 42, 0.5)"
      : "rgba(30, 10, 2, 0.6)";
    ctx.beginPath();
    ctx.moveTo(TABLE_DIMENSIONS.width - TABLE_DIMENSIONS.beveledEdgeWidth, TABLE_DIMENSIONS.beveledEdgeWidth);
    ctx.lineTo(TABLE_DIMENSIONS.width - TABLE_DIMENSIONS.beveledEdgeWidth, TABLE_DIMENSIONS.height - TABLE_DIMENSIONS.beveledEdgeWidth);
    ctx.lineTo(TABLE_DIMENSIONS.beveledEdgeWidth, TABLE_DIMENSIONS.height - TABLE_DIMENSIONS.beveledEdgeWidth);
    ctx.stroke();

    const drawScrew = (sx: number, sy: number) => {
      ctx.fillStyle = state.surfaceType === "glass_desk" ? "#64748b" : "#ca8a04";
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = state.surfaceType === "glass_desk" ? "#1e293b" : "#451a03";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx - 4, sy);
      ctx.lineTo(sx + 4, sy);
      ctx.stroke();
    };
    drawScrew(18, 18);
    drawScrew(TABLE_DIMENSIONS.width - 18, 18);
    drawScrew(18, TABLE_DIMENSIONS.height - 18);
    drawScrew(TABLE_DIMENSIONS.width - 18, TABLE_DIMENSIONS.height - 18);
    ctx.restore();

    // ════════ POWER-UPS ON DESK ════════
    if (state.powerUps && state.powerUps.length > 0) {
      for (const pu of state.powerUps) {
        drawPowerUp(ctx, pu);
      }
    }

    // ════════ DRAW THE TWO BATTLING PENS ════════
    const currentHostPen = hostPenRef.current;
    const currentGuestPen = guestPenRef.current;
    const isHostTurn = activeTurnPlayerId === room.players.host.id;

    drawPen(ctx, currentHostPen, isHostTurn);
    drawPen(ctx, currentGuestPen, !isHostTurn);

    // ════════ KINETIC PARTICLES ════════
    if (particlesRef.current.length > 0) {
      ctx.save();
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life++;

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.fillStyle = p.color.replace(")", `, ${alpha})`).replace("rgb", "rgba");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife * 0.5), 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }
      ctx.restore();
    }

    // ════════ REPLAY OVERLAY ════════
    if (isReplayingRef.current) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, TABLE_DIMENSIONS.width, TABLE_DIMENSIONS.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px monospace";
      ctx.textAlign = "center";
      ctx.fillText("⏪ INSTANT REPLAY", TABLE_DIMENSIONS.width / 2, 80);
      ctx.font = "16px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillText("0.3x SPEED", TABLE_DIMENSIONS.width / 2, 110);
      ctx.restore();
    }

    // ════════ SLINGSHOT TRAJECTORY & POWER GAUGE UI ════════
    if (isAimingRef.current && isCurrentTurnMine && state.phase === "aiming") {
      const activePen = isHostTurn ? currentHostPen : currentGuestPen;
      const power = aimPowerRef.current;
      const angle = aimAngleRef.current;

      ctx.save();

      if (power <= 5) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 15px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          aimMode === "slingshot" ? "🏹 Pull back to charge & aim" : "👆 Swipe forward towards target",
          activePen.x,
          activePen.y + (isHostTurn ? 65 : -65)
        );
      } else {
        // In Slingshot mode, draw the elastic pull cord behind the pen
        if (aimMode === "slingshot") {
          const pullDist = Math.max(0, (power / 100) * 165);
          const pullX = activePen.x - Math.cos(angle) * pullDist;
          const pullY = activePen.y - Math.sin(angle) * pullDist;

          ctx.strokeStyle = "rgba(245, 158, 11, 0.95)";
          ctx.lineWidth = 5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(activePen.x, activePen.y);
          ctx.lineTo(pullX, pullY);
          ctx.stroke();

          // Slingshot Tension Finger Grip Handle
          ctx.fillStyle = "#f59e0b";
          ctx.shadowColor = "rgba(245, 158, 11, 0.6)";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(pullX, pullY, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Forward Projected Trajectory Line
        const projDist = (power / 100) * 440 + 80;
        const endX = activePen.x + Math.cos(angle) * projDist;
        const endY = activePen.y + Math.sin(angle) * projDist;

        ctx.strokeStyle = power > 70 ? "rgba(239, 68, 68, 0.9)" : "rgba(56, 189, 248, 0.9)";
        ctx.lineWidth = 3.5;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(activePen.x, activePen.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Side Bevel Bank Shot Ricochet Projection
        const wallLeft = TABLE_DIMENSIONS.beveledEdgeWidth;
        const wallRight = TABLE_DIMENSIONS.width - TABLE_DIMENSIONS.beveledEdgeWidth;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        if (Math.abs(cosA) > 0.05) {
          const targetWall = cosA > 0 ? wallRight : wallLeft;
          const distToWall = (targetWall - activePen.x) / cosA;
          if (distToWall > 0 && distToWall < projDist) {
            const hitX = targetWall;
            const hitY = activePen.y + sinA * distToWall;
            const reflectAngle = Math.atan2(sinA, -cosA);
            const remainDist = projDist - distToWall;
            const reflectEndX = hitX + Math.cos(reflectAngle) * remainDist;
            const reflectEndY = hitY + Math.sin(reflectAngle) * remainDist;

            ctx.save();
            ctx.strokeStyle = "rgba(245, 158, 11, 0.75)";
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(hitX, hitY);
            ctx.lineTo(reflectEndX, reflectEndY);
            ctx.stroke();

            ctx.fillStyle = "#f59e0b";
            ctx.beginPath();
            ctx.arc(hitX, hitY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // Directional Trajectory Arrowhead
        ctx.setLineDash([]);
        ctx.fillStyle = power > 70 ? "#ef4444" : "#38bdf8";
        const arrowLen = 16;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - Math.cos(angle - Math.PI / 6) * arrowLen,
          endY - Math.sin(angle - Math.PI / 6) * arrowLen
        );
        ctx.lineTo(
          endX - Math.cos(angle + Math.PI / 6) * arrowLen,
          endY - Math.sin(angle + Math.PI / 6) * arrowLen
        );
        ctx.closePath();
        ctx.fill();

        // Trajectory Landing Impact Ring
        ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(endX, endY, 14, 0, Math.PI * 2);
        ctx.stroke();

        // Dynamic Power Gauge Arc
        const gaugeRadius = 55;
        const arcSpread = (power / 100) * (Math.PI * 0.85);
        ctx.strokeStyle =
          power > 75
            ? "#ef4444"
            : power > 45
            ? "#f59e0b"
            : "#10b981";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(activePen.x, activePen.y, gaugeRadius, angle - arcSpread, angle + arcSpread);
        ctx.stroke();

        // Power Percentage Text Badge
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${power}%`, activePen.x, activePen.y - 75);

        // Cancel zone reminder if dragging very lightly
        if (power < 15) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
          ctx.font = "12px monospace";
          ctx.fillText("Release to cancel", activePen.x, activePen.y + 75);
        }
      }

      ctx.restore();
    }

    ctx.restore();
  }, [activeTurnPlayerId, isCurrentTurnMine, isHostTurn, state.phase, state.surfaceType, state.powerUps]);

  // Handle Canvas Resize and High-DPI Sharpness with locked Aspect Ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      drawScene();
    };

    resize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => resize());
      ro.observe(canvas);
    }
    window.addEventListener("resize", resize);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [drawScene, isFullscreen]);

  // Decoupled Continuous 60fps Animation Loop (Zero frame tearing or re-creation lag)
  useEffect(() => {
    let animId: number;
    const loop = () => {
      drawScene();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [drawScene]);

  // Spawn power-ups periodically during aiming phase (only host client manages spawning)
  useEffect(() => {
    if (!isHost || state.phase !== "aiming" || (state.powerUps && state.powerUps.length >= 2)) return;

    const timer = setInterval(() => {
      if (Math.random() > 0.35 || (state.powerUps && state.powerUps.length >= 2)) return;

      const types: Array<"eraser_shield" | "ink_splash" | "compass_spin"> = ["eraser_shield", "ink_splash", "compass_spin"];
      const type = types[Math.floor(Math.random() * types.length)];
      const newPowerUp: PenPowerUpOnDesk = {
        id: `pu_${Date.now()}`,
        type,
        x: 150 + Math.random() * 700,
        y: 450 + Math.random() * 900,
        spawnedAt: Date.now(),
        collectedBy: null,
      };

      syncGameState({
        ...state,
        powerUps: [...(state.powerUps || []), newPowerUp],
      }, activeTurnPlayerId, "playing", null);
    }, 9000);

    return () => clearInterval(timer);
  }, [isHost, state, activeTurnPlayerId, syncGameState]);

  // ── Physics Simulation Step Runner with 3D Falling Tumble Sequence ──
  const startPhysicsSimulation = useCallback(
    (flickedHost: PenRigidBody, flickedGuest: PenRigidBody) => {
      isSimulatingRef.current = true;
      hostPenRef.current = flickedHost;
      guestPenRef.current = flickedGuest;

      // Clear replay buffer and start recording
      replayBufferRef.current = [];

      let stepCount = 0;
      const maxSteps = 240; // 4 seconds max
      let fallingTumbleSteps = 0;
      let detectedLoserId: "host" | "guest" | "both" | null = null;

      const simTick = () => {
        stepCount++;
        const result = simulatePhysicsStep(
          hostPenRef.current,
          guestPenRef.current,
          1 / 60,
          state.surfaceType || "classic_wood"
        );

        hostPenRef.current = result.hostPen;
        guestPenRef.current = result.guestPen;

        // Record replay frame
        replayBufferRef.current.push(
          captureReplayFrame(result.hostPen, result.guestPen, result.hasCollision)
        );
        // Cap buffer at 240 frames
        if (replayBufferRef.current.length > 240) {
          replayBufferRef.current.shift();
        }

        // Collision audio & kinetic spark particles
        if (result.hasCollision) {
          gameAudio.playPenClack(result.collisionIntensity);
          gameHaptics.medium();

          if (result.collisionPoint) {
            spawnParticles(result.collisionPoint.x, result.collisionPoint.y, 16, "rgb(254, 240, 138)", 8);
            addDeskDamage(result.collisionPoint.x, result.collisionPoint.y, result.collisionIntensity);
          }

          if (result.collisionIntensity > 0.3) {
            screenShakeRef.current = Math.min(1, result.collisionIntensity * 1.5);
          }
        }

        // Edge bounce sound
        if (result.edgeBounced) {
          gameAudio.playEdgeScrape();
        }

        // Skin trail particles
        spawnSkinTrail(result.hostPen);
        spawnSkinTrail(result.guestPen);

        // Sliding wood friction dust
        const hostSpeed = Math.hypot(result.hostPen.vx, result.hostPen.vy);
        if (hostSpeed > 15 && Math.random() < 0.4) {
          spawnParticles(result.hostPen.x, result.hostPen.y, 2, "rgb(254, 215, 170)", 2);
        }

        // Power-up collision check
        if (state.powerUps && state.powerUps.length > 0) {
          for (const pu of state.powerUps) {
            if (pu.collectedBy) continue;
            const dH = Math.hypot(result.hostPen.x - pu.x, result.hostPen.y - pu.y);
            const dG = Math.hypot(result.guestPen.x - pu.x, result.guestPen.y - pu.y);
            if (dH < 35) {
              pu.collectedBy = "host";
              applyPowerUp("host", pu.type);
              gameAudio.playPowerUpPickup();
            } else if (dG < 35) {
              pu.collectedBy = "guest";
              applyPowerUp("guest", pu.type);
              gameAudio.playPowerUpPickup();
            }
          }
        }

        // 3D Falling off desk detection: run tumble animation sequence
        if (result.fallenPenId && !detectedLoserId) {
          detectedLoserId = result.fallenPenId;
          gameAudio.playPenFall();
        }

        if (detectedLoserId) {
          fallingTumbleSteps++;
          // Allow 35 frames (~0.6s) of dramatic 3D tumble down to floor before concluding round
          if (fallingTumbleSteps >= 35) {
            isSimulatingRef.current = false;
            handleRoundFinished(detectedLoserId, result.hostPen, result.guestPen);
            return;
          }
        } else if (result.isMotionSettled || stepCount >= maxSteps) {
          isSimulatingRef.current = false;
          handleFlickSettled(result.hostPen, result.guestPen);
          return;
        }

        animFrameIdRef.current = requestAnimationFrame(simTick);
      };

      animFrameIdRef.current = requestAnimationFrame(simTick);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, room.players]
  );

  // Apply power-up effect
  const applyPowerUp = (penId: "host" | "guest", type: "eraser_shield" | "ink_splash" | "compass_spin") => {
    if (type === "eraser_shield") {
      if (penId === "host") {
        hostPenRef.current = { ...hostPenRef.current, hasShield: true };
      } else {
        guestPenRef.current = { ...guestPenRef.current, hasShield: true };
      }
      gameAudio.playShieldBlock();
    } else if (type === "ink_splash") {
      // Apply debuff to OPPONENT
      if (penId === "host") {
        guestPenRef.current = { ...guestPenRef.current, isInkSplashed: true };
      } else {
        hostPenRef.current = { ...hostPenRef.current, isInkSplashed: true };
      }
      gameAudio.playInkSplash();
    }
    // compass_spin handled separately as an auto-flick
  };

  // ── Handle Flick Settled (Switch turns smoothly) ──
  const handleFlickSettled = useCallback(
    (finalHost: PenRigidBody, finalGuest: PenRigidBody) => {
      const nextTurn = isHostTurn
        ? room.players.guest?.id || (isLocalMode ? "local_player_2" : "guest")
        : room.players.host.id;

      // Detect trick shots
      const activePen = isHostTurn ? finalHost : finalGuest;
      const trickShot = detectTrickShots(activePen, false, activeTurnPlayerId);
      const newTrickShots = trickShot ? [...(state.trickShots || []), { ...trickShot, playerId: activeTurnPlayerId, timestamp: Date.now() }] : (state.trickShots || []);

      if (trickShot) {
        gameAudio.playTrickShot();
        setTrickShotBanner({ ...trickShot, playerId: activeTurnPlayerId, timestamp: Date.now() });
        setTimeout(() => setTrickShotBanner(null), 3000);
      }

      const nextTurnName = nextTurn === room.players.host.id ? hostName : guestName;

      syncGameState(
        {
          ...state,
          phase: "aiming",
          hostPen: finalHost,
          guestPen: finalGuest,
          currentTurn: nextTurn,
          commentary: `${activePlayerName} completed flick! Next turn: ${nextTurnName}`,
          deskDamage: deskDamageRef.current,
          trickShots: newTrickShots,
        },
        nextTurn,
        "playing",
        null
      );
    },
    [isHostTurn, room.players, isLocalMode, activeTurnPlayerId, state, hostName, guestName, activePlayerName, syncGameState]
  );

  // Play instant replay
  const playInstantReplay = useCallback(() => {
    if (replayBufferRef.current.length < 10) return;
    isReplayingRef.current = true;
    setShowReplayBadge(true);
    gameAudio.playReplayWhoosh();

    // Take last 60 frames (1 second of action) and play at 0.3x speed
    const frames = replayBufferRef.current.slice(-60);
    replayFrameIndexRef.current = 0;

    const replayTick = () => {
      const idx = replayFrameIndexRef.current;
      if (idx >= frames.length) {
        isReplayingRef.current = false;
        setShowReplayBadge(false);
        // Restore final positions
        hostPenRef.current = { ...hostPenRef.current, ...frames[frames.length - 1].hostPen } as PenRigidBody;
        guestPenRef.current = { ...guestPenRef.current, ...frames[frames.length - 1].guestPen } as PenRigidBody;
        return;
      }

      const frame = frames[idx];
      hostPenRef.current = { ...hostPenRef.current, ...frame.hostPen } as PenRigidBody;
      guestPenRef.current = { ...guestPenRef.current, ...frame.guestPen } as PenRigidBody;

      if (frame.hasCollision) {
        spawnParticles(
          (frame.hostPen.x + frame.guestPen.x) / 2,
          (frame.hostPen.y + frame.guestPen.y) / 2,
          8, "rgb(254, 240, 138)", 5
        );
      }

      replayFrameIndexRef.current++;
      // 0.3x speed = ~3.3x slower
      setTimeout(replayTick, 55);
    };

    replayTick();
  }, []);

  // ── Handle Round Finished (Table Drop Knockout) ──
  const handleRoundFinished = useCallback(
    (
      loserPenId: "host" | "guest" | "both",
      finalHost: PenRigidBody,
      finalGuest: PenRigidBody
    ) => {
      // In both-fall scenario, active turn player loses
      const isHostKnocked =
        loserPenId === "host" ||
        (loserPenId === "both" && isHostTurn);

      const hostWonRound = !isHostKnocked;
      const nextHostWins = state.hostWins + (hostWonRound ? 1 : 0);
      const nextGuestWins = state.guestWins + (!hostWonRound ? 1 : 0);

      const winnerName = hostWonRound ? hostName : guestName;
      const loserName = hostWonRound ? guestName : hostName;
      const winnerId = hostWonRound ? room.players.host.id : (room.players.guest?.id || (isLocalMode ? "local_player_2" : "guest"));

      // Detect trick shots
      const winnerPen = hostWonRound ? finalHost : finalGuest;
      const trickShot = detectTrickShots(winnerPen, true, winnerId);
      const newTrickShots = trickShot ? [...(state.trickShots || []), { ...trickShot, playerId: winnerId, timestamp: Date.now() }] : (state.trickShots || []);

      if (trickShot) {
        gameAudio.playTrickShot();
        setTrickShotBanner({ ...trickShot, playerId: winnerId, timestamp: Date.now() });
        setTimeout(() => setTrickShotBanner(null), 4000);
      }

      gameAudio.playWin();
      gameHaptics.victory();

      triggerConfetti({
        particleCount: 110,
        spread: 90,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#f59e0b", "#d97706", "#3b82f6", "#10b981", "#ef4444"],
      });

      const targetWins = Math.ceil(state.totalRounds / 2);
      const isMatchOver = nextHostWins >= targetWins || nextGuestWins >= targetWins;
      const matchWinner = isMatchOver ? (nextHostWins > nextGuestWins ? room.players.host.id : room.players.guest?.id || (isLocalMode ? "local_player_2" : "guest")) : null;
      const roundWinner = hostWonRound ? room.players.host.id : room.players.guest?.id || (isLocalMode ? "local_player_2" : "guest");

      setRoundOverBanner(
        isMatchOver
          ? `🏆 ${winnerName} Wins the Classroom Championship!`
          : `🎉 ${winnerName} knocked ${loserName}'s pen off the desk!`
      );

      // Auto-play instant replay after 1 second
      setTimeout(() => playInstantReplay(), 1000);

      // Track wins for unlocks
      if (isMatchOver && matchWinner === myPlayerId) {
        incrementPenFightWins();
      }

      syncGameState(
        {
          ...state,
          phase: isMatchOver ? "match_over" : "round_over",
          hostWins: nextHostWins,
          guestWins: nextGuestWins,
          hostPen: finalHost,
          guestPen: finalGuest,
          roundWinnerId: roundWinner,
          matchWinnerId: matchWinner,
          commentary: isMatchOver
            ? `🏆 ${winnerName} WINS THE CLASSROOM CHAMPIONSHIP!`
            : `${winnerName} wins Round ${state.roundNumber}!`,
          deskDamage: deskDamageRef.current,
          trickShots: newTrickShots,
          hostTrickScore: (state.hostTrickScore || 0) + (trickShot && hostWonRound ? trickShot.bonusPoints : 0),
          guestTrickScore: (state.guestTrickScore || 0) + (trickShot && !hostWonRound ? trickShot.bonusPoints : 0),
        },
        activeTurnPlayerId,
        isMatchOver ? "game_over" : "playing", // Keep room "playing" between rounds so global modal does not interrupt match
        matchWinner
      );
    },
    [isHostTurn, state, hostName, guestName, room.players, isLocalMode, playInstantReplay, myPlayerId, syncGameState, activeTurnPlayerId]
  );

  // ── Execute Flick Move ──
  const executeFlick = useCallback(
    (angle: number, power: number) => {
      gameAudio.playTick();
      gameHaptics.heavy();

      let newHostPen = { ...hostPenRef.current };
      let newGuestPen = { ...guestPenRef.current };

      const timestamp = Date.now();
      lastExecutedFlickTimestamp.current = timestamp;

      if (isHostTurn) {
        newHostPen = applyFlickImpulse(newHostPen, angle, power);
      } else {
        newGuestPen = applyFlickImpulse(newGuestPen, angle, power);
      }

      // In online multiplayer, broadcast flick to remote opponent
      if (!isLocalMode && !isAIMode) {
        sendGameMove(
          room.roomCode,
          {
            ...state,
            lastFlick: { angle, power, timestamp, playerId: myPlayerId },
          },
          activeTurnPlayerId,
          null,
          false,
          state.hostWins,
          state.guestWins
        );
      }

      startPhysicsSimulation(newHostPen, newGuestPen);
    },
    [isHostTurn, isLocalMode, isAIMode, room.roomCode, state, myPlayerId, activeTurnPlayerId, startPhysicsSimulation]
  );

  // Online Multiplayer Remote Flick Sync Listener
  useEffect(() => {
    if (isLocalMode || isAIMode) return;
    const incomingFlick = rawState?.lastFlick;
    if (incomingFlick && incomingFlick.timestamp > lastExecutedFlickTimestamp.current) {
      lastExecutedFlickTimestamp.current = incomingFlick.timestamp;
      executeFlick(incomingFlick.angle, incomingFlick.power);
    }
  }, [rawState?.lastFlick, isLocalMode, isAIMode, executeFlick]);

  // Solo AI Mode Turn Execution
  useEffect(() => {
    if (!isAIMode || state.phase !== "aiming") return;

    const isAITurn = !isHostTurn;
    if (isAITurn && !isSimulatingRef.current) {
      const timer = setTimeout(() => {
        const aiFlick = getSmartPenAIFlick(
          guestPenRef.current,
          hostPenRef.current,
          room.rules?.aiDifficulty || "medium"
        );
        executeFlick(aiFlick.angle, aiFlick.power);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAIMode, state.phase, isHostTurn, room.rules?.aiDifficulty, executeFlick]);

  // ── High-Precision Touch / Pointer Slingshot Controls ──
  const getCanvasVirtualCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    return {
      x: Math.max(0, Math.min(TABLE_DIMENSIONS.width, (px / rect.width) * TABLE_DIMENSIONS.width)),
      y: Math.max(0, Math.min(TABLE_DIMENSIONS.height, (py / rect.height) * TABLE_DIMENSIONS.height)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isCurrentTurnMine || state.phase !== "aiming" || isSimulatingRef.current || isReplayingRef.current) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const coords = getCanvasVirtualCoords(e);
    const activePen = isHostTurn ? hostPenRef.current : guestPenRef.current;

    // Generous tap tolerance for touch devices
    const dx = coords.x - activePen.x;
    const dy = coords.y - activePen.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Allow clicking on/near pen OR on active player's half of desk
    const isInsidePlayerHalf = isHostTurn ? coords.y > 600 : coords.y < 900;

    if (dist < activePen.length * 2.0 || isInsidePlayerHalf) {
      gameAudio.playClick();
      gameHaptics.light();
      isAimingRef.current = true;
      aimStartRef.current = coords;
      aimCurrentRef.current = coords;
      aimPowerRef.current = 0;
      aimAngleRef.current = isHostTurn ? -Math.PI / 2 : Math.PI / 2;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isAimingRef.current || !aimStartRef.current) return;
    const coords = getCanvasVirtualCoords(e);
    aimCurrentRef.current = coords;

    const rawDx = coords.x - aimStartRef.current.x;
    const rawDy = coords.y - aimStartRef.current.y;
    const pullDist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

    if (pullDist < 10) {
      aimPowerRef.current = 0;
      return;
    }

    // In Slingshot: pull back (opposite) -> fires forward
    // In Direct: swipe forward -> fires in direction of swipe
    const dx = aimMode === "slingshot" ? -rawDx : rawDx;
    const dy = aimMode === "slingshot" ? -rawDy : rawDy;

    const calculatedAngle = Math.atan2(dy, dx);
    const calculatedPower = Math.min(100, Math.round((pullDist / 175) * 100));

    aimAngleRef.current = calculatedAngle;
    aimPowerRef.current = calculatedPower;
    // Zero React state updates here: 100% smooth 60fps via canvas loop!
  };

  const handlePointerUp = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }

    if (!isAimingRef.current) return;
    isAimingRef.current = false;

    const power = aimPowerRef.current;
    const angle = aimAngleRef.current;

    if (power >= 10) {
      executeFlick(angle, power);
    }

    aimStartRef.current = null;
    aimCurrentRef.current = null;
    aimPowerRef.current = 0;
  };

  // Window global pointerup fallback to prevent stuck aiming
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isAimingRef.current) {
        handlePointerUp();
      }
    };
    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => window.removeEventListener("pointerup", handleGlobalPointerUp);
  }, [handlePointerUp]);

  // ── Next Round Reset Handler ──
  const handleStartNextRound = useCallback(() => {
    gameAudio.playClick();
    gameHaptics.medium();
    setRoundOverBanner(null);
    setShowReplayBadge(false);
    isReplayingRef.current = false;
    isSimulatingRef.current = false;
    isAimingRef.current = false;

    const nextRound = state.roundNumber + 1;
    const newHost = createInitialPenRigidBody("host", state.hostPen.modelId, state.hostPen.capOn, state.hostPen.skinId);
    const newGuest = createInitialPenRigidBody("guest", state.guestPen.modelId, state.guestPen.capOn, state.guestPen.skinId);

    hostPenRef.current = newHost;
    guestPenRef.current = newGuest;

    syncGameState(
      {
        ...state,
        phase: "aiming",
        roundNumber: nextRound,
        hostPen: newHost,
        guestPen: newGuest,
        currentTurn: room.players.host.id,
        roundWinnerId: null,
        commentary: `Round ${nextRound} Started! Take your positions.`,
        powerUps: [],
        hostActivePowerUp: null,
        guestActivePowerUp: null,
      },
      room.players.host.id,
      "playing",
      null
    );
  }, [state, room.players.host.id, syncGameState]);

  // ── Pen Arsenal Switcher ──
  const handleApplyPenSelection = (modelId: PenModelId, capOn: boolean, skinId: PenSkinId, surface: PenSurfaceType, rounds: number) => {
    gameAudio.playWin();
    gameHaptics.success();
    setIsPenSelectorOpen(false);

    const currentPen = isHost ? hostPenRef.current : guestPenRef.current;
    const model = PEN_MODELS[modelId] || PEN_MODELS.pilot_v5;
    const length = model.length + (capOn ? 18 : 0);
    const mass = model.mass + (capOn ? 0.25 : 0);

    const updatedPen: PenRigidBody = {
      ...currentPen,
      modelId,
      capOn,
      skinId,
      length,
      mass,
      width: model.width,
    };

    if (isHost) {
      hostPenRef.current = updatedPen;
    } else {
      guestPenRef.current = updatedPen;
    }

    syncGameState(
      {
        ...state,
        hostPen: isHost ? updatedPen : state.hostPen,
        guestPen: !isHost ? updatedPen : state.guestPen,
        surfaceType: surface,
        totalRounds: rounds,
      },
      activeTurnPlayerId,
      "playing",
      null
    );
  };

  const penFightWins = getPenFightWins();

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center w-full select-none relative transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#0d1310] p-1 sm:p-3 overflow-hidden justify-between"
          : "max-w-4xl mx-auto px-1 sm:px-2"
      }`}
    >
      {/* ── CLASSROOM DUEL CONTAINER ── */}
      <div
        className={`relative w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-[#3e2723] bg-[#27382b] flex flex-col items-center transition-all ${
          isFullscreen ? "h-full justify-between" : ""
        }`}
      >
        {/* 1. FRONT GREEN CHALKBOARD HUD (Sleek Single-Row Classroom Blackboard) */}
        <div className="w-full bg-[#1b382b] border-b-4 border-[#5d4037] px-3 py-2 text-emerald-100 flex items-center justify-between shadow-inner relative shrink-0 gap-2">
          {/* Class & Thought Tag */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded border border-emerald-500/40 text-[10px] sm:text-xs font-mono font-bold text-emerald-300 bg-emerald-950/40">
              Std 9-A
            </span>
            <span className="text-[10px] sm:text-xs font-serif italic text-emerald-200/80 hidden lg:inline truncate max-w-[200px]">
              "Practice makes perfect"
            </span>
          </div>

          {/* Chalkboard Scoreboard Center */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Host / P1 */}
            <div className="flex items-center gap-1.5">
              <span className={`text-xs sm:text-sm font-black font-mono truncate max-w-[85px] sm:max-w-[120px] ${
                isHostTurn ? "text-amber-300 underline decoration-amber-400 decoration-2 underline-offset-2" : "text-emerald-100/90"
              }`}>
                {hostName}
              </span>
              <strong className="text-sm sm:text-lg font-mono text-white bg-black/30 px-1.5 py-0.5 rounded">{state.hostWins}</strong>
              <div className="flex gap-0.5">
                {Array.from({ length: Math.ceil(state.totalRounds / 2) }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-3 h-3 rounded-xs border flex items-center justify-center text-[8px] font-bold ${
                      i < state.hostWins
                        ? "bg-amber-400 border-amber-300 text-slate-950"
                        : "border-emerald-500/30 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                ))}
              </div>
            </div>

            {/* Duel Meta */}
            <div className="flex flex-col items-center px-1">
              <span className="text-[10px] sm:text-xs font-black font-mono tracking-wider text-amber-400 uppercase">
                R{state.roundNumber}/{state.totalRounds}
              </span>
              <span className="text-[9px] font-mono text-emerald-300/70 hidden sm:inline">
                {SURFACE_TYPES[state.surfaceType || "classic_wood"]?.emoji} {SURFACE_TYPES[state.surfaceType || "classic_wood"]?.name.split(" ")[0]}
              </span>
            </div>

            {/* Guest / P2 */}
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {Array.from({ length: Math.ceil(state.totalRounds / 2) }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-3 h-3 rounded-xs border flex items-center justify-center text-[8px] font-bold ${
                      i < state.guestWins
                        ? "bg-amber-400 border-amber-300 text-slate-950"
                        : "border-emerald-500/30 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                ))}
              </div>
              <strong className="text-sm sm:text-lg font-mono text-white bg-black/30 px-1.5 py-0.5 rounded">{state.guestWins}</strong>
              <span className={`text-xs sm:text-sm font-black font-mono truncate max-w-[85px] sm:max-w-[120px] ${
                !isHostTurn ? "text-amber-300 underline decoration-amber-400 decoration-2 underline-offset-2" : "text-emerald-100/90"
              }`}>
                {guestName}
              </span>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => {
                const muted = gameAudio.toggleMute();
                setIsAudioMuted(muted);
              }}
              className="p-1 sm:p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-200 transition-all cursor-pointer"
              title={isAudioMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1 sm:p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-200 transition-all cursor-pointer flex items-center gap-1"
              title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-mono hidden md:inline">{isFullscreen ? "Exit" : "Full"}</span>
            </button>
          </div>
        </div>

        {/* 2. THE CLASSROOM ARENA WITH RECEDING FLOOR & BATTLE DESK */}
        <div
          className={`relative w-full overflow-hidden flex items-center justify-center shadow-2xl transition-all ${
            isFullscreen
              ? "flex-1 min-h-0 bg-[#c7c3b9] p-2"
              : "h-[460px] sm:h-[500px] md:h-[530px] max-h-[64vh] bg-[#d6d3cb] p-2 sm:p-3"
          }`}
        >
          {/* Tiled Floor */}
          <div
            className="absolute inset-0 opacity-75 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          {/* Surrounding Classroom Desks & Bags (Pushed to corners) */}
          <div className="absolute -left-16 top-6 w-32 h-72 bg-[#92400e] border-4 border-[#5c2c16] rounded-2xl shadow-2xl rotate-6 opacity-50 pointer-events-none hidden md:block">
            <div className="w-14 h-20 bg-blue-900 rounded-xl shadow-lg m-4 opacity-80 border border-blue-700" title="School Bag" />
          </div>
          <div className="absolute -right-16 top-12 w-32 h-72 bg-[#92400e] border-4 border-[#5c2c16] rounded-2xl shadow-2xl -rotate-6 opacity-50 pointer-events-none hidden md:block">
            <div className="w-14 h-20 bg-red-950 rounded-xl shadow-lg m-4 opacity-80 border border-rose-800" title="School Bag" />
          </div>

          {/* Aiming On-Screen Guidance Hint */}
          {isCurrentTurnMine && state.phase === "aiming" && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-amber-300 border border-amber-500/40 text-[11px] font-bold pointer-events-none z-10 flex items-center gap-1.5 shadow-md">
              <span>
                {aimMode === "slingshot"
                  ? "🏹 Pull back & release to flick forward!"
                  : "👆 Swipe forward towards target to flick!"}
              </span>
            </div>
          )}

          {/* 3. CENTER BATTLE DESK (Guaranteed 1000/1500 aspect ratio) */}
          <div
            className="h-full max-h-full aspect-[1000/1500] relative rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.65)] border-4 border-[#451a03] touch-none"
            style={{ touchAction: "none" }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`w-full h-full block touch-none ${
                isCurrentTurnMine && state.phase === "aiming"
                  ? "cursor-grab active:cursor-grabbing"
                  : "cursor-default"
              }`}
              style={{ touchAction: "none" }}
            />
          </div>

          {/* Turn & Controls Quick Toolbar */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
            {/* Left: Turn Status & Arsenal Switcher */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div
                className={`px-3 py-1.5 rounded-2xl backdrop-blur-md border text-xs font-black shadow-lg flex items-center gap-1.5 transition-all ${
                  isCurrentTurnMine
                    ? "bg-amber-500/90 text-slate-950 border-amber-300 shadow-amber-500/30 animate-pulse"
                    : "bg-card/85 text-foreground border-border/60"
                }`}
              >
                <span>
                  {isLocalMode
                    ? `👉 ${activePlayerName}'s Turn (${isHostTurn ? "Bottom Pen" : "Top Pen"})`
                    : isCurrentTurnMine
                    ? "👉 YOUR TURN"
                    : `⏳ ${activePlayerName}'s Turn`}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPenSelectorOpen(true)}
                className="rounded-2xl h-8 px-2.5 bg-card/85 backdrop-blur-md text-[11px] font-bold border-border/60 flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <span>{PEN_MODELS[selectedPenModel]?.name.split(" ")[0]}</span>
                <span className="text-[10px] text-muted-foreground">{isCapOn ? "(Cap)" : "(No Cap)"}</span>
              </Button>
            </div>

            {/* Right: Aim Mode Toggle */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playClick();
                  setAimMode((prev) => (prev === "slingshot" ? "direct" : "slingshot"));
                }}
                className="px-2.5 py-1.5 rounded-2xl bg-card/85 hover:bg-card backdrop-blur-md border border-border/60 text-[11px] font-bold text-foreground transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                title="Toggle Aiming Mode: Slingshot Pull vs Direct Swipe"
              >
                <span>{aimMode === "slingshot" ? "🏹 Slingshot Pull" : "👆 Direct Swipe"}</span>
              </button>
            </div>
          </div>

          {/* Floating Trick Shot Banner */}
          <AnimatePresence>
            {trickShotBanner && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-12 left-1/2 -translate-x-1/2 w-[92%] max-w-sm p-3 rounded-2xl bg-gradient-to-r from-purple-600/95 to-pink-600/95 backdrop-blur-xl border border-purple-400/50 shadow-2xl text-white text-center z-30 pointer-events-none"
              >
                <span className="text-sm font-black">{trickShotBanner.description}</span>
                <span className="text-xs ml-2 opacity-85">+{trickShotBanner.bonusPoints} pts</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Round Over Celebration Banner */}
          <AnimatePresence>
            {roundOverBanner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md p-4 sm:p-5 rounded-3xl bg-card/95 backdrop-blur-xl border-2 border-amber-400 shadow-2xl flex flex-col items-center gap-3 text-center z-30"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/30">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground">{roundOverBanner}</span>
                    <span className="text-xs text-muted-foreground">
                      Score: {hostName} ({state.hostWins}) — {guestName} ({state.guestWins})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {showReplayBadge && (
                    <span className="px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-400/40 text-purple-300 text-[10px] font-bold animate-pulse">
                      ⏪ REPLAY
                    </span>
                  )}

                  {state.phase === "round_over" && (
                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      onClick={handleStartNextRound}
                      className="rounded-2xl h-11 px-5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
                    >
                      <span>Next Round ({state.roundNumber + 1}/{state.totalRounds}) 🚀</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── PEN ARSENAL SELECTOR MODAL ── */}
      <AnimatePresence>
        {isPenSelectorOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg p-5 rounded-3xl bg-card border-2 border-primary/40 shadow-2xl flex flex-col gap-4 text-foreground max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <Swords className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-black">Battle Arsenal</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">{penFightWins} Wins</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPenSelectorOpen(false)}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  ✕
                </Button>
              </div>

              {/* Tab Switcher */}
              <div className="flex gap-1.5">
                {([
                  { key: "pens", label: "Pens", icon: "🖊️" },
                  { key: "surfaces", label: "Surfaces", icon: "🪵" },
                  { key: "skins", label: "Skins", icon: "🎨" },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectorTab(tab.key)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectorTab === tab.key
                        ? "bg-primary/15 border border-primary text-foreground"
                        : "bg-muted/30 border border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* PENS TAB */}
              {selectorTab === "pens" && (
                <>
                  {/* Cap Modifier Switch */}
                  <div className="w-full p-3 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-between text-xs font-bold">
                    <div>
                      <span className="text-foreground">Rear Cap Attached</span>
                      <p className="text-[10px] text-muted-foreground font-normal">
                        Adds rear mass & longer body for heavier angular spin.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCapOn(!isCapOn)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        isCapOn ? "bg-emerald-500" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          isCapOn ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Pen Cards Grid */}
                  <div className="flex flex-col gap-2.5">
                    {(Object.values(PEN_MODELS) as PenDefinition[]).map((pen) => {
                      const isSelected = selectedPenModel === pen.id;
                      const unlocked = isPenUnlocked(pen);
                      return (
                        <button
                          key={pen.id}
                          type="button"
                          onClick={() => unlocked && setSelectedPenModel(pen.id)}
                          disabled={!unlocked}
                          className={`p-3 rounded-2xl border-2 text-left flex flex-col gap-1.5 transition-all ${
                            !unlocked
                              ? "bg-muted/20 border-border/30 opacity-60 cursor-not-allowed"
                              : isSelected
                              ? "bg-primary/15 border-primary shadow-lg shadow-primary/20 scale-[1.01] cursor-pointer"
                              : "bg-card/70 border-border/50 hover:border-border cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-foreground flex items-center gap-1.5">
                              {!unlocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                              {pen.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-mono font-bold">
                              {unlocked ? pen.brand : `${pen.requiredWins} wins`}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{pen.tagline}</p>

                          {/* Stat Bars */}
                          <div className="grid grid-cols-4 gap-2 mt-1 text-[10px] font-mono">
                            <div>
                              <span className="text-muted-foreground">Weight:</span>{" "}
                              <strong className="text-amber-400">{"★".repeat(pen.stats.weight)}</strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Speed:</span>{" "}
                              <strong className="text-cyan-400">{"★".repeat(pen.stats.speed)}</strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Spin:</span>{" "}
                              <strong className="text-emerald-400">{"★".repeat(pen.stats.spin)}</strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Force:</span>{" "}
                              <strong className="text-rose-400">{"★".repeat(pen.stats.impact)}</strong>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* SURFACES TAB */}
              {selectorTab === "surfaces" && (
                <div className="flex flex-col gap-2.5">
                  {(Object.values(SURFACE_TYPES) as SurfaceDefinition[]).map((surface) => {
                    const isSelected = selectedSurface === surface.id;
                    const unlocked = isSurfaceUnlocked(surface);
                    return (
                      <button
                        key={surface.id}
                        type="button"
                        onClick={() => unlocked && setSelectedSurface(surface.id)}
                        disabled={!unlocked}
                        className={`p-3 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${
                          !unlocked
                            ? "bg-muted/20 border-border/30 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "bg-primary/15 border-primary shadow-lg cursor-pointer"
                            : "bg-card/70 border-border/50 hover:border-border cursor-pointer"
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-xl shrink-0 border-2"
                          style={{
                            background: `linear-gradient(135deg, ${surface.deskColorPrimary}, ${surface.deskColorSecondary})`,
                            borderColor: isSelected ? "var(--primary)" : "transparent",
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="font-black text-sm flex items-center gap-1.5">
                            {!unlocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                            {surface.emoji} {surface.name}
                          </span>
                          <p className="text-[11px] text-muted-foreground">{surface.description}</p>
                          {!unlocked && (
                            <span className="text-[10px] text-amber-400 font-bold mt-0.5">Unlock at {surface.requiredWins} wins</span>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {/* Match Format Selector */}
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                    <span className="text-xs font-bold text-foreground">Match Format</span>
                    <div className="flex gap-2 mt-2">
                      {[3, 5, 7].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setTotalRoundsChoice(n)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            totalRoundsChoice === n
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Best of {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SKINS TAB */}
              {selectorTab === "skins" && (
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.values(PEN_SKINS) as SkinDefinition[]).map((skin) => {
                    const isSelected = selectedSkin === skin.id;
                    const unlocked = isSkinUnlocked(skin);
                    return (
                      <button
                        key={skin.id}
                        type="button"
                        onClick={() => unlocked && setSelectedSkin(skin.id)}
                        disabled={!unlocked}
                        className={`p-3 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all ${
                          !unlocked
                            ? "bg-muted/20 border-border/30 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "bg-primary/15 border-primary shadow-lg cursor-pointer"
                            : "bg-card/70 border-border/50 hover:border-border cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{skin.emoji}</span>
                          {!unlocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                        </div>
                        <span className="text-xs font-black">{skin.name}</span>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{skin.description}</p>
                        {!unlocked && (
                          <span className="text-[9px] text-amber-400 font-bold">{skin.requiredWins} wins</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={() => handleApplyPenSelection(selectedPenModel, isCapOn, selectedSkin, selectedSurface, totalRoundsChoice)}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black rounded-2xl h-11 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25"
              >
                <span>Equip & Ready 🚀</span>
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
