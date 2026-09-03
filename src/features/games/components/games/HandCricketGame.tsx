import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomState, HandCricketState, CricketDelivery } from "../../types";
import { gameAudio } from "../../services/gameSoundService";
import { sendGameMove } from "../../services/gameRoomService";
import {
  evaluateCricketToss,
  getSmartCricketAIMove,
  generateCricketCommentary,
  CRICKET_AI_PERSONAS,
  CricketAIPersonaId,
} from "./HandCricketAI";
import {
  Trophy,
  Flame,
  Swords,
  Shield,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  BookOpen,
  Compass,
  BarChart2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GameHowToPlayModal } from "../GameHowToPlayModal";

interface HandCricketGameProps {
  room: GameRoomState<HandCricketState>;
  myPlayerId: string;
  isMyTurn: boolean;
  onLocalMove?: (updatedRoom: GameRoomState<HandCricketState>) => void;
}

// Visual hand gestures corresponding to 0 to 6
export const HAND_GESTURES: { num: number; emoji: string; label: string; sub: string; color: string }[] = [
  { num: 0, emoji: "🛡️", label: "Defend", sub: "0 Runs", color: "from-slate-500/20 to-zinc-600/20 border-slate-500/40 text-slate-300" },
  { num: 1, emoji: "☝️", label: "Single", sub: "1 Run", color: "from-blue-500/20 to-cyan-600/20 border-blue-500/40 text-cyan-400" },
  { num: 2, emoji: "✌️", label: "Double", sub: "2 Runs", color: "from-teal-500/20 to-emerald-600/20 border-teal-500/40 text-teal-300" },
  { num: 3, emoji: "🤟", label: "Triple", sub: "3 Runs", color: "from-amber-500/20 to-yellow-600/20 border-amber-500/40 text-amber-300" },
  { num: 4, emoji: "🖖", label: "FOUR", sub: "Boundary", color: "from-orange-500/25 to-amber-600/25 border-orange-500/50 text-orange-400 font-black" },
  { num: 5, emoji: "🖐️", label: "Five", sub: "5 Runs", color: "from-purple-500/20 to-indigo-600/20 border-purple-500/40 text-purple-300" },
  { num: 6, emoji: "🤙", label: "SIX", sub: "Maximum", color: "from-pink-500/30 to-rose-600/30 border-pink-500/60 text-pink-400 font-black" },
];

export const HandCricketGame: React.FC<HandCricketGameProps> = ({
  room,
  myPlayerId,
  isMyTurn,
  onLocalMove,
}) => {
  const isHost = room.players.host.id === myPlayerId;
  const isAIMode = room.mode === "ai";
  const isLocalMode = room.mode === "local";

  const rawState = room.gameState;
  const state: HandCricketState = useMemo(() => {
    const defaultInnings1 = {
      battingPlayerId: "",
      runs: 0,
      wickets: 0,
      balls: 0,
      deliveries: [],
    };
    const defaultInnings2 = {
      battingPlayerId: "",
      runs: 0,
      wickets: 0,
      balls: 0,
      target: 0,
      deliveries: [],
    };

    if (rawState && rawState.phase) {
      return {
        ...rawState,
        innings1: {
          ...defaultInnings1,
          ...rawState.innings1,
          deliveries: Array.isArray(rawState.innings1?.deliveries) ? rawState.innings1.deliveries : [],
        },
        innings2: {
          ...defaultInnings2,
          ...rawState.innings2,
          deliveries: Array.isArray(rawState.innings2?.deliveries) ? rawState.innings2.deliveries : [],
        },
        currentDelivery: {
          hostPick: null,
          guestPick: null,
          revealed: false,
          lastResult: null,
          ...rawState.currentDelivery,
        },
        toss: {
          callerId: room.players.host.id,
          choice: "odd",
          hostPick: null,
          guestPick: null,
          winnerId: null,
          elected: null,
          ...rawState.toss,
        },
      };
    }

    return {
      phase: "toss",
      toss: {
        callerId: room.players.host.id,
        choice: "odd",
        hostPick: null,
        guestPick: null,
        winnerId: null,
        elected: null,
      },
      currentInnings: 1,
      batsmanId: "",
      bowlerId: "",
      maxWickets: room.rules?.maxWickets || 1,
      maxOvers: room.rules?.maxOvers ?? 2,
      innings1: defaultInnings1,
      innings2: defaultInnings2,
      currentDelivery: {
        hostPick: null,
        guestPick: null,
        revealed: false,
        lastResult: null,
      },
    };
  }, [rawState, room.players.host.id, room.rules]);

  // Local state for secret pick buffer
  const [localPick, setLocalPick] = useState<number | null>(null);
  const [isClashing, setIsClashing] = useState(false);
  const [bannerCelebration, setBannerCelebration] = useState<{ text: string; sub: string; color: string } | null>(null);
  const [aiSpeech, setAiSpeech] = useState<string>("");
  const [isCoinFlipping, setIsCoinFlipping] = useState(false);

  // Local 2-Player pass screen curtain
  const [passPlayerStep, setPassPlayerStep] = useState<1 | 2>(1);
  const [p1SecretPick, setP1SecretPick] = useState<number | null>(null);

  // Stadium Enhanced UI states: Pitch vs Wagon Wheel vs Scorecard
  const [arenaTab, setArenaTab] = useState<"pitch" | "wagon" | "scorecard">("pitch");
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const aiDifficulty = room.rules?.aiDifficulty || "medium";
  const aiPersona =
    aiDifficulty === "easy"
      ? CRICKET_AI_PERSONAS.gully
      : aiDifficulty === "hard"
      ? CRICKET_AI_PERSONAS.captain_cool
      : CRICKET_AI_PERSONAS.spin_king;

  // Active innings reference with bulletproof fallback
  const activeInnings = (state.currentInnings === 1 ? state.innings1 : state.innings2) || {
    battingPlayerId: "",
    runs: 0,
    wickets: 0,
    balls: 0,
    deliveries: [],
  };
  const activeDeliveries = Array.isArray(activeInnings.deliveries) ? activeInnings.deliveries : [];
  const isHostBatting = state.batsmanId === room.players.host.id;
  const isMyBatting = state.batsmanId === myPlayerId;

  // Calculate overs display e.g. 1.4
  const completedOvers = Math.floor((activeInnings.balls || 0) / 6);
  const ballsInOver = (activeInnings.balls || 0) % 6;
  const oversDisplay = `${completedOvers}.${ballsInOver}`;
  const maxBallsTotal = state.maxOvers > 0 ? state.maxOvers * 6 : 0;

  // Breakdown statistics for Scorecard & Wagon Wheel
  const matchStats = useMemo(() => {
    let dots = 0, ones = 0, twos = 0, threes = 0, fours = 0, sixes = 0;
    for (const d of activeDeliveries) {
      if (!d) continue;
      if (d.isWicket) continue;
      if (d.batsmanRun === 0) dots++;
      else if (d.batsmanRun === 1) ones++;
      else if (d.batsmanRun === 2) twos++;
      else if (d.batsmanRun === 3) threes++;
      else if (d.batsmanRun === 4) fours++;
      else if (d.batsmanRun === 6) sixes++;
    }
    const boundaryRuns = fours * 4 + sixes * 6;
    const runs = activeInnings.runs || 0;
    const balls = activeInnings.balls || 0;
    const boundaryPercent = runs > 0 ? Math.round((boundaryRuns / runs) * 100) : 0;
    const strikeRate = balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";
    return { dots, ones, twos, threes, fours, sixes, boundaryRuns, boundaryPercent, strikeRate };
  }, [activeDeliveries, activeInnings.runs, activeInnings.balls]);

  // Clear selections on new delivery
  useEffect(() => {
    if (!state.currentDelivery.hostPick && !state.currentDelivery.guestPick) {
      setLocalPick(null);
      setP1SecretPick(null);
      setPassPlayerStep(1);
    }
  }, [activeInnings.balls, state.currentDelivery.hostPick, state.currentDelivery.guestPick]);

  // ── AI Auto-Move Execution ──
  useEffect(() => {
    if (!isAIMode) return;
    if (state.phase !== "innings_1" && state.phase !== "innings_2" && state.phase !== "toss") return;

    // AI in Toss Phase
    if (state.phase === "toss") {
      if (state.toss.hostPick !== null && state.toss.guestPick === null) {
        const timer = setTimeout(() => {
          const aiTossPick = Math.floor(Math.random() * 6) + 1;
          const hostNum = state.toss.hostPick!;
          const guestNum = aiTossPick;
          const effectiveCaller = state.toss.callerId || room.players.host.id;
          const { isEven, callerWon } = evaluateCricketToss(state.toss.choice, hostNum, guestNum);
          const winnerId = callerWon ? effectiveCaller : "ai_player";

          // If AI won toss, AI decides to bat or bowl
          const aiElected: "bat" | "bowl" = Math.random() < 0.6 ? "bat" : "bowl";
          const finalElected = winnerId === "ai_player" ? aiElected : null;
          const nextPhase = winnerId === "ai_player" ? "innings_1" : "toss_decision";

          const nextBatsman =
            nextPhase === "innings_1"
              ? finalElected === "bat"
                ? "ai_player"
                : room.players.host.id
              : "";
          const nextBowler =
            nextPhase === "innings_1"
              ? finalElected === "bat"
                ? room.players.host.id
                : "ai_player"
              : "";

          const nextState: HandCricketState = {
            ...state,
            phase: nextPhase,
            batsmanId: nextBatsman,
            bowlerId: nextBowler,
            toss: {
              ...state.toss,
              guestPick: guestNum,
              winnerId,
              elected: finalElected,
            },
            innings1: {
              ...state.innings1,
              battingPlayerId: nextBatsman,
            },
          };

          gameAudio.playTossCoin();
          onLocalMove?.({ ...room, gameState: nextState });
        }, 800);
        return () => clearTimeout(timer);
      }
      return;
    }

    // AI in Match Innings Delivery
    const aiNeedsMove = state.currentDelivery.hostPick !== null && state.currentDelivery.guestPick === null;
    if (aiNeedsMove && !isClashing) {
      const timer = setTimeout(() => {
        const aiMove = getSmartCricketAIMove(state, "ai_player", aiDifficulty);
        if (aiMove.speech) setAiSpeech(aiMove.speech);
        handleDeliveryResolution(state.currentDelivery.hostPick!, aiMove.pick);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [
    isAIMode,
    state.phase,
    state.toss.hostPick,
    state.toss.guestPick,
    state.currentDelivery.hostPick,
    state.currentDelivery.guestPick,
    isClashing,
  ]);

  // ── Toss Phase Handlers ──
  const handleSelectTossChoice = (choice: "odd" | "even") => {
    gameAudio.playClick();
    const nextState: HandCricketState = {
      ...state,
      toss: {
        ...state.toss,
        callerId: myPlayerId,
        choice,
      },
    };
    if (isLocalMode || isAIMode) {
      onLocalMove?.({ ...room, gameState: nextState });
    } else {
      sendGameMove(room.roomCode, myPlayerId, nextState);
    }
  };

  const handlePickTossNumber = (num: number) => {
    gameAudio.playTossCoin();
    setIsCoinFlipping(true);

    setTimeout(() => {
      setIsCoinFlipping(false);
      if (isAIMode) {
        const nextState: HandCricketState = {
          ...state,
          toss: {
            ...state.toss,
            hostPick: num,
          },
        };
        onLocalMove?.({ ...room, gameState: nextState });
      } else if (isLocalMode) {
        if (state.toss.hostPick === null) {
          const nextState: HandCricketState = {
            ...state,
            toss: {
              ...state.toss,
              hostPick: num,
            },
          };
          onLocalMove?.({ ...room, gameState: nextState });
        } else {
          // Both local picked
          const hostNum = state.toss.hostPick;
          const guestNum = num;
          const effectiveCaller = state.toss.callerId || room.players.host.id;
          const { isEven, callerWon } = evaluateCricketToss(state.toss.choice, hostNum, guestNum);
          const winnerId = callerWon ? effectiveCaller : "local_player_2";

          const nextState: HandCricketState = {
            ...state,
            phase: "toss_decision",
            toss: {
              ...state.toss,
              guestPick: guestNum,
              winnerId,
            },
          };
          onLocalMove?.({ ...room, gameState: nextState });
        }
      } else {
        // Online mode
        const isH = room.players.host.id === myPlayerId;
        const nextState: HandCricketState = {
          ...state,
          toss: {
            ...state.toss,
            hostPick: isH ? num : state.toss.hostPick,
            guestPick: !isH ? num : state.toss.guestPick,
          },
        };

        if (nextState.toss.hostPick !== null && nextState.toss.guestPick !== null) {
          const effectiveCaller = nextState.toss.callerId || room.players.host.id;
          const { callerWon } = evaluateCricketToss(
            nextState.toss.choice,
            nextState.toss.hostPick,
            nextState.toss.guestPick
          );
          nextState.toss.winnerId = callerWon ? effectiveCaller : room.players.guest?.id || "guest_player";
          nextState.phase = "toss_decision";
        }
        sendGameMove(room.roomCode, myPlayerId, nextState);
      }
    }, 600);
  };

  const handleElectTossDecision = (elected: "bat" | "bowl") => {
    gameAudio.playUmpireWhistle();
    const tossWinnerId = state.toss.winnerId || myPlayerId;
    const opponentId =
      tossWinnerId === room.players.host.id
        ? room.players.guest?.id || (isAIMode ? "ai_player" : "local_player_2")
        : room.players.host.id;

    const batsmanId = elected === "bat" ? tossWinnerId : opponentId;
    const bowlerId = elected === "bat" ? opponentId : tossWinnerId;

    const nextState: HandCricketState = {
      ...state,
      phase: "innings_1",
      currentInnings: 1,
      batsmanId,
      bowlerId,
      toss: {
        ...state.toss,
        elected,
      },
      innings1: {
        ...state.innings1,
        battingPlayerId: batsmanId,
      },
    };

    if (isLocalMode || isAIMode) {
      onLocalMove?.({ ...room, gameState: nextState });
    } else {
      sendGameMove(room.roomCode, myPlayerId, nextState);
    }
  };

  // ── Delivery Resolution (Core Cricket Engine) ──
  const handleDeliveryResolution = (hostPick: number, guestPick: number) => {
    setIsClashing(true);

    const isHostBat = state.batsmanId === room.players.host.id;
    const batRun = isHostBat ? hostPick : guestPick;
    const bowlRun = isHostBat ? guestPick : hostPick;
    const isWicket = batRun === bowlRun;
    const runsAdded = isWicket ? 0 : batRun;

    // Audio & Haptics
    if (isWicket) {
      gameAudio.playWicket();
      setBannerCelebration({ text: "WICKET! OUT! 🎯", sub: "The batsman is dismissed!", color: "#ef4444" });
    } else if (batRun === 6) {
      gameAudio.playBoundarySix();
      setBannerCelebration({ text: "MAXIMUM SIX! 🚀", sub: "Dispatched into the stands!", color: "#ec4899" });
    } else if (batRun === 4) {
      gameAudio.playBoundaryFour();
      setBannerCelebration({ text: "BOUNDARY FOUR! 🏏", sub: "Timed to perfection!", color: "#f59e0b" });
    } else {
      gameAudio.playBatHit(batRun);
    }

    const currentInn = state.currentInnings === 1 ? state.innings1 : state.innings2;
    const nextBalls = currentInn.balls + 1;
    const nextWickets = isWicket ? currentInn.wickets + 1 : currentInn.wickets;
    const nextRuns = currentInn.runs + runsAdded;

    const commentary = generateCricketCommentary(
      batRun,
      bowlRun,
      isWicket,
      state.currentInnings === 2,
      state.currentInnings === 2 ? Math.max(0, state.innings2.target - nextRuns) : undefined,
      state.maxOvers > 0 ? state.maxOvers * 6 - nextBalls : undefined
    );

    const newDelivery: CricketDelivery = {
      ballNumber: nextBalls,
      batsmanRun: batRun,
      bowlerRun: bowlRun,
      isWicket,
      runsScored: runsAdded,
      commentary,
      timestamp: Date.now(),
    };

    setTimeout(() => {
      setIsClashing(false);
      setBannerCelebration(null);

      // Check Innings 1 Completion
      if (state.currentInnings === 1) {
        const isAllOut = nextWickets >= state.maxWickets;
        const isOversFinished = state.maxOvers > 0 && nextBalls >= state.maxOvers * 6;

        if (isAllOut || isOversFinished) {
          // Switch to Innings 2 Chase
          gameAudio.playUmpireWhistle();
          const nextBatsman = state.bowlerId;
          const nextBowler = state.batsmanId;
          const target = nextRuns + 1;

          const nextState: HandCricketState = {
            ...state,
            phase: "innings_break",
            currentInnings: 2,
            batsmanId: nextBatsman,
            bowlerId: nextBowler,
            innings1: {
              ...state.innings1,
              runs: nextRuns,
              wickets: nextWickets,
              balls: nextBalls,
              deliveries: [newDelivery, ...state.innings1.deliveries],
            },
            innings2: {
              ...state.innings2,
              battingPlayerId: nextBatsman,
              target,
            },
            currentDelivery: {
              hostPick: null,
              guestPick: null,
              revealed: false,
              lastResult: {
                batsmanPick: batRun,
                bowlerPick: bowlRun,
                isWicket,
                runsAdded,
                commentary,
              },
            },
          };

          if (isLocalMode || isAIMode) onLocalMove?.({ ...room, gameState: nextState });
          else sendGameMove(room.roomCode, myPlayerId, nextState);
          return;
        }

        // Standard Innings 1 progression
        const nextState: HandCricketState = {
          ...state,
          innings1: {
            ...state.innings1,
            runs: nextRuns,
            wickets: nextWickets,
            balls: nextBalls,
            deliveries: [newDelivery, ...state.innings1.deliveries],
          },
          currentDelivery: {
            hostPick: null,
            guestPick: null,
            revealed: false,
            lastResult: {
              batsmanPick: batRun,
              bowlerPick: bowlRun,
              isWicket,
              runsAdded,
              commentary,
            },
          },
        };

        if (isLocalMode || isAIMode) onLocalMove?.({ ...room, gameState: nextState });
        else sendGameMove(room.roomCode, myPlayerId, nextState);
        return;
      }

      // ── Innings 2 Evaluation (Chase) ──
      const target = state.innings2.target;
      const hasReachedTarget = nextRuns >= target;
      const isChaseAllOut = nextWickets >= state.maxWickets;
      const isChaseOversFinished = state.maxOvers > 0 && nextBalls >= state.maxOvers * 6;

      if (hasReachedTarget || isChaseAllOut || isChaseOversFinished) {
        // MATCH OVER!
        let winnerId: string | null = null;
        if (hasReachedTarget) {
          // Batsman chasing won!
          winnerId = state.batsmanId;
          gameAudio.playWin();
        } else if (nextRuns === target - 1) {
          // Super Over / Tie
          winnerId = "draw";
          gameAudio.playDraw();
        } else {
          // Defending bowler won!
          winnerId = state.bowlerId;
          gameAudio.playWin();
        }

        const nextState: HandCricketState = {
          ...state,
          phase: "match_over",
          innings2: {
            ...state.innings2,
            runs: nextRuns,
            wickets: nextWickets,
            balls: nextBalls,
            deliveries: [newDelivery, ...state.innings2.deliveries],
          },
          currentDelivery: {
            hostPick: null,
            guestPick: null,
            revealed: false,
            lastResult: {
              batsmanPick: batRun,
              bowlerPick: bowlRun,
              isWicket,
              runsAdded,
              commentary,
            },
          },
        };

        const updatedRoom = {
          ...room,
          status: "game_over" as const,
          winnerId,
          gameState: nextState,
          players: {
            host: {
              ...room.players.host,
              score: winnerId === room.players.host.id ? room.players.host.score + 1 : room.players.host.score,
            },
            guest: room.players.guest
              ? {
                  ...room.players.guest,
                  score: winnerId === room.players.guest.id ? room.players.guest.score + 1 : room.players.guest.score,
                }
              : null,
          },
        };

        if (isLocalMode || isAIMode) onLocalMove?.(updatedRoom);
        else sendGameMove(room.roomCode, myPlayerId, nextState);
        return;
      }

      // Standard Innings 2 progression
      const nextState: HandCricketState = {
        ...state,
        innings2: {
          ...state.innings2,
          runs: nextRuns,
          wickets: nextWickets,
          balls: nextBalls,
          deliveries: [newDelivery, ...state.innings2.deliveries],
        },
        currentDelivery: {
          hostPick: null,
          guestPick: null,
          revealed: false,
          lastResult: {
            batsmanPick: batRun,
            bowlerPick: bowlRun,
            isWicket,
            runsAdded,
            commentary,
          },
        },
      };

      if (isLocalMode || isAIMode) onLocalMove?.({ ...room, gameState: nextState });
      else sendGameMove(room.roomCode, myPlayerId, nextState);
    }, 1200);
  };

  // Human player selects run button
  const handleSelectDeliveryNumber = (num: number) => {
    if (isClashing) return;
    gameAudio.playClick();
    setLocalPick(num);

    if (isAIMode) {
      // Set host pick, AI effect triggers
      const nextState: HandCricketState = {
        ...state,
        currentDelivery: {
          ...state.currentDelivery,
          hostPick: num,
        },
      };
      onLocalMove?.({ ...room, gameState: nextState });
      return;
    }

    if (isLocalMode) {
      if (passPlayerStep === 1) {
        setP1SecretPick(num);
        setPassPlayerStep(2);
        setLocalPick(null);
      } else {
        // Player 2 selected! Resolve!
        const p1 = p1SecretPick!;
        const p2 = num;
        handleDeliveryResolution(p1, p2);
      }
      return;
    }

    // Online Mode
    const isH = room.players.host.id === myPlayerId;
    const nextState: HandCricketState = {
      ...state,
      currentDelivery: {
        ...state.currentDelivery,
        hostPick: isH ? num : state.currentDelivery.hostPick,
        guestPick: !isH ? num : state.currentDelivery.guestPick,
      },
    };

    if (nextState.currentDelivery.hostPick !== null && nextState.currentDelivery.guestPick !== null) {
      handleDeliveryResolution(nextState.currentDelivery.hostPick, nextState.currentDelivery.guestPick);
    } else {
      sendGameMove(room.roomCode, myPlayerId, nextState);
    }
  };

  // ── Render Toss Phase ──
  if (state.phase === "toss") {
    const isCaller = state.toss.callerId === myPlayerId;
    const callerName = isCaller ? "You" : room.players.host.name;
    const hostHasPicked = state.toss.hostPick !== null;

    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-3 select-none">
        {/* Match Header */}
        <div className="w-full text-center mb-4">
          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black uppercase tracking-wider">
            🪙 The Official Coin Toss
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-display text-foreground mt-2">
            Odd or Even Showdown
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {callerName} calls Odd or Even. Both players flash a hand number 1–6.
          </p>
        </div>

        {/* 3D Coin Animation */}
        <div className="relative my-4 flex items-center justify-center">
          <motion.div
            animate={isCoinFlipping ? { rotateY: 1800, scale: [1, 1.25, 1] } : {}}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 border-4 border-yellow-200 shadow-[0_0_30px_rgba(245,158,11,0.6)] flex items-center justify-center text-4xl select-none"
          >
            🏏
          </motion.div>
        </div>

        {/* Call Selector (Odd vs Even) */}
        <div className="w-full bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-xl mb-4 text-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            {isCaller ? "Choose Odd or Even:" : `${callerName} called ${state.toss.choice.toUpperCase()}`}
          </span>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            {(["odd", "even"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => isCaller && handleSelectTossChoice(c)}
                disabled={!isCaller}
                className={`py-2 px-4 rounded-xl font-black text-sm uppercase transition-all border ${
                  state.toss.choice === c
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-105"
                    : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Flash Number (1 to 6) */}
        <div className="w-full bg-card/80 backdrop-blur-xl border border-border/80 rounded-2xl p-4 shadow-2xl text-center">
          <span className="text-xs font-bold text-foreground mb-3 block">
            {hostHasPicked ? "Waiting for opponent toss..." : "Pick your Toss Number (1–6):"}
          </span>

          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePickTossNumber(num)}
                disabled={hostHasPicked || isCoinFlipping}
                className="py-2.5 rounded-xl bg-background/80 hover:bg-primary/20 border border-border/80 hover:border-primary font-black text-base transition-all hover:scale-110 active:scale-95 text-foreground"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Toss Decision Phase (Winner Chooses Bat or Bowl) ──
  if (state.phase === "toss_decision") {
    const tossWinnerId = state.toss.winnerId || room.players.host.id;
    const isWinner = isLocalMode || tossWinnerId === myPlayerId;
    const winnerName =
      tossWinnerId === myPlayerId
        ? "You"
        : tossWinnerId === "ai_player"
        ? aiPersona.name
        : room.players.guest?.name || (isLocalMode ? "Player 2" : "Opponent");

    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4 select-none animate-fade-in text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center text-3xl mb-3 shadow-[0_0_25px_rgba(245,158,11,0.5)]">
          🏆
        </div>
        <h2 className="text-2xl font-black text-foreground">
          {winnerName} Won the Toss!
        </h2>
        <p className="text-xs text-muted-foreground mt-1 mb-6">
          {isWinner ? "Select what to do first:" : `Waiting for ${winnerName} to decide...`}
        </p>

        {isWinner && (
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
            <button
              type="button"
              onClick={() => handleElectTossDecision("bat")}
              className="py-4 px-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-600/20 border-2 border-emerald-500 text-emerald-300 font-black text-sm flex flex-col items-center gap-1.5 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-3xl">🏏</span>
              <span>BAT FIRST</span>
            </button>

            <button
              type="button"
              onClick={() => handleElectTossDecision("bowl")}
              className="py-4 px-3 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-indigo-600/20 border-2 border-blue-500 text-blue-300 font-black text-sm flex flex-col items-center gap-1.5 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-3xl">⚾</span>
              <span>BOWL FIRST</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Innings Break Transition ──
  if (state.phase === "innings_break") {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4 select-none animate-fade-in text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border-2 border-primary/40 text-primary flex items-center justify-center text-3xl mb-3 shadow-[0_0_25px_rgba(59,130,246,0.5)]">
          ⚡
        </div>
        <h2 className="text-2xl font-black font-display text-foreground">
          Innings 1 Complete!
        </h2>
        <div className="my-4 p-4 rounded-2xl bg-card/80 border border-border w-full max-w-xs space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-semibold">Innings 1 Total:</span>
            <span className="font-black text-foreground">{state.innings1.runs} runs / {state.innings1.wickets} wkts</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-semibold">Overs Played:</span>
            <span className="font-mono text-foreground">{Math.floor(state.innings1.balls / 6)}.{state.innings1.balls % 6} ov</span>
          </div>
          <div className="pt-2 border-t border-border flex justify-between text-sm font-black text-amber-400">
            <span>Target to Chase:</span>
            <span>{state.innings2.target} RUNS</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            gameAudio.playUmpireWhistle();
            const nextState: HandCricketState = { ...state, phase: "innings_2" };
            if (isLocalMode || isAIMode) onLocalMove?.({ ...room, gameState: nextState });
            else sendGameMove(room.roomCode, myPlayerId, nextState);
          }}
          className="py-3 px-8 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          Start 2nd Innings Chase ➔
        </button>
      </div>
    );
  }

  // ── Main Live Match Arena (Innings 1 & Innings 2) ──
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-2 select-none relative">
      {/* Dynamic Stadium Atmospheric Banner & Rules Trigger */}
      <div className="w-full flex items-center justify-between mb-2 px-3 py-1.5 rounded-xl bg-card/60 border border-border/50 text-[11px] font-bold backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-1.5 text-foreground truncate min-w-0">
          <span className="text-sm shrink-0">🏟️</span>
          <span className="font-semibold text-muted-foreground truncate hidden sm:inline">Wankhede Stadium • Floodlit</span>
          <span className="text-primary font-black shrink-0">Innings {state.currentInnings} of 2</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-muted-foreground text-[10px] hidden sm:inline">
            {state.maxOvers > 0 ? `${state.maxOvers} Ov` : "Unlimited"}
          </span>
          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-[10px] font-black cursor-pointer transition-all shadow-sm"
            title="How to Play Hand Cricket"
          >
            <BookOpen className="w-3 h-3" />
            <span>How to Play</span>
          </button>
        </div>
      </div>

      {/* ── Main Stadium Scoreboard Card ── */}
      <div className="w-full p-3.5 rounded-3xl bg-card/85 backdrop-blur-2xl border-2 border-border/80 shadow-[0_0_30px_rgba(0,0,0,0.4)] mb-2.5 relative overflow-hidden">
        {/* Stadium Floodlight Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        <div className="flex items-center justify-between">
          {/* Batting Team Info */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black">
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                🏏 {isMyBatting ? "YOU BATTING" : "OPPONENT BATTING"}
              </span>
            </div>
            {/* Runs & Wickets Giant Display */}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black font-display text-foreground tracking-tight">
                {activeInnings.runs}/{activeInnings.wickets}
              </span>
              <span className="text-xs font-bold text-muted-foreground font-mono">
                ({oversDisplay}{state.maxOvers > 0 ? `/${state.maxOvers}` : ""} ov)
              </span>
            </div>

            {/* Wickets Remaining Indicator Stumps */}
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[9px] text-muted-foreground uppercase font-bold mr-0.5">Wkts:</span>
              {Array.from({ length: state.maxWickets }).map((_, wIdx) => {
                const isLost = wIdx < activeInnings.wickets;
                return (
                  <span
                    key={wIdx}
                    className={`text-[10px] ${isLost ? "opacity-30 line-through text-rose-400" : "text-emerald-400"}`}
                    title={isLost ? "Wicket Lost" : "Wicket in Hand"}
                  >
                    🏏
                  </span>
                );
              })}
            </div>
          </div>

          {/* Chase Target / Rates Badge */}
          <div className="flex flex-col items-end">
            {state.currentInnings === 2 ? (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  Target: {state.innings2.target}
                </span>
                <span className="text-xs font-black text-foreground">
                  Need {Math.max(0, state.innings2.target - activeInnings.runs)} runs
                </span>
                {state.maxOvers > 0 && (
                  <span className="text-[10px] text-muted-foreground font-mono block">
                    {Math.max(0, maxBallsTotal - activeInnings.balls)} balls left
                  </span>
                )}
              </div>
            ) : (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Run Rate
                </span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {activeInnings.balls > 0 ? ((activeInnings.runs / activeInnings.balls) * 6).toFixed(1) : "0.0"} rpo
                </span>
                <span className="text-[10px] text-muted-foreground font-mono block">
                  SR: {matchStats.strikeRate}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ball by Ball Delivery Ribbon */}
        <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0 mr-1">Over:</span>
          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar">
            {activeDeliveries.slice(0, 6).reverse().map((d, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  d.isWicket
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/40"
                    : d.batsmanRun === 6
                    ? "bg-purple-500 text-white shadow-md shadow-purple-500/40"
                    : d.batsmanRun === 4
                    ? "bg-amber-500 text-slate-950 font-black"
                    : d.batsmanRun === 0
                    ? "bg-muted text-muted-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                {d.isWicket ? "W" : d.batsmanRun}
              </div>
            ))}
            {activeDeliveries.length === 0 && (
              <span className="text-[10px] text-muted-foreground italic">First ball ready</span>
            )}
          </div>
        </div>
      </div>

      {/* ── View Mode Switcher Tabs (Pitch vs 360° Wagon Wheel vs Scorecard) ── */}
      <div className="w-full grid grid-cols-3 gap-1 mb-2.5 p-1 rounded-2xl bg-card/60 border border-border/50 relative z-20">
        <button
          id="cricket-tab-pitch"
          type="button"
          onClick={() => setArenaTab("pitch")}
          className={`py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            arenaTab === "pitch"
              ? "bg-primary text-primary-foreground font-black shadow-md shadow-primary/25"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>🏟️</span>
          <span>Pitch</span>
        </button>
        <button
          id="cricket-tab-wagon"
          type="button"
          onClick={() => setArenaTab("wagon")}
          className={`py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            arenaTab === "wagon"
              ? "bg-primary text-primary-foreground font-black shadow-md shadow-primary/25"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Wagon Wheel</span>
        </button>
        <button
          id="cricket-tab-scorecard"
          type="button"
          onClick={() => setArenaTab("scorecard")}
          className={`py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            arenaTab === "scorecard"
              ? "bg-primary text-primary-foreground font-black shadow-md shadow-primary/25"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Scorecard</span>
        </button>
      </div>

      {/* ── TAB 1: Visual Animated Cricket Pitch with 3D LED Stumps ── */}
      {arenaTab === "pitch" && (
        <div className="relative w-full aspect-[2.4/1] max-w-[min(380px,calc(100vw-2rem))] bg-gradient-to-b from-emerald-900/40 via-emerald-800/30 to-emerald-950/60 rounded-3xl border border-emerald-500/30 shadow-inner flex items-center justify-between px-6 mb-3 overflow-hidden">
          {/* Pitch Crease Lines */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-12 bg-amber-900/20 border-y border-amber-500/20 rounded-md pointer-events-none" />

          {/* Batsman Side (Left) with Animated Bat */}
          <div className="relative flex flex-col items-center z-10">
            <motion.div
              animate={
                state.currentDelivery.lastResult && !state.currentDelivery.lastResult.isWicket
                  ? { rotate: [-20, 20, 0] }
                  : {}
              }
              transition={{ duration: 0.3 }}
              className="text-2xl sm:text-3xl mb-1 cursor-default"
            >
              🏏
            </motion.div>
            <span className="text-[10px] font-bold text-foreground truncate max-w-[80px]">
              {isHostBatting ? room.players.host.name : room.players.guest?.name || "Player 2"}
            </span>
            <span className="text-[9px] font-mono text-emerald-400">Batsman</span>
          </div>

          {/* Center Clash Stage / Result Display */}
          <div className="flex flex-col items-center justify-center z-20">
            <AnimatePresence mode="wait">
              {isClashing ? (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [1, 1.25, 1], opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-card border-2 border-primary flex items-center justify-center text-xl font-black shadow-lg">
                    💥
                  </div>
                </motion.div>
              ) : state.currentDelivery.lastResult ? (
                <motion.div
                  key={activeInnings.balls}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center"
                >
                  <span
                    className={`text-sm font-black ${
                      state.currentDelivery.lastResult.isWicket
                        ? "text-rose-400 animate-bounce"
                        : state.currentDelivery.lastResult.runsAdded >= 4
                        ? "text-amber-400"
                        : "text-foreground"
                    }`}
                  >
                    {state.currentDelivery.lastResult.isWicket
                      ? "WICKET!"
                      : `+${state.currentDelivery.lastResult.runsAdded} RUNS`}
                  </span>
                  <span className="text-[9px] text-muted-foreground line-clamp-1 max-w-[140px]">
                    {state.currentDelivery.lastResult.commentary}
                  </span>
                </motion.div>
              ) : (
                <span className="text-xs text-muted-foreground font-semibold">Versus</span>
              )}
            </AnimatePresence>
          </div>

          {/* Bowler Side with 3D LED Stumps (Right) */}
          <div className="relative flex flex-col items-center z-10">
            <div className="relative w-12 h-10 flex items-end justify-center mb-1">
              {/* Top Horizontal Bails with LED glow */}
              <motion.div
                animate={
                  bannerCelebration?.text.includes("WICKET")
                    ? { y: -18, rotate: 55, opacity: [1, 1, 0] }
                    : { y: 0, rotate: 0, opacity: 1 }
                }
                transition={{ duration: 0.7 }}
                className={`absolute top-0 w-8 h-1 rounded-full z-20 transition-all ${
                  bannerCelebration?.text.includes("WICKET")
                    ? "bg-rose-500 shadow-[0_0_12px_#f43f5e]"
                    : "bg-amber-100 border border-amber-500/80"
                }`}
              />

              {/* 3 Vertical Wooden Stumps */}
              <div className="flex items-end gap-1.5 z-10">
                {[0, 1, 2].map((stumpIdx) => (
                  <motion.div
                    key={stumpIdx}
                    animate={
                      bannerCelebration?.text.includes("WICKET")
                        ? { rotate: (stumpIdx - 1) * 20 }
                        : { rotate: 0 }
                    }
                    className={`w-1.5 h-8 rounded-t-sm transition-colors ${
                      bannerCelebration?.text.includes("WICKET")
                        ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]"
                        : "bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 border border-amber-800/60"
                    }`}
                  />
                ))}
              </div>
            </div>

            <span className="text-[10px] font-bold text-foreground truncate max-w-[80px]">
              {!isHostBatting ? room.players.host.name : room.players.guest?.name || (isAIMode ? aiPersona.name : "Player 2")}
            </span>
            <span className="text-[9px] font-mono text-cyan-400">Bowler</span>
          </div>
        </div>
      )}

      {/* ── TAB 2: 360° Wagon Wheel Shot Map ── */}
      {arenaTab === "wagon" && (
        <div className="w-full aspect-[2.4/1] max-w-[min(380px,calc(100vw-2rem))] bg-card/90 rounded-3xl border border-border/80 shadow-xl flex items-center justify-between p-3 mb-3 relative overflow-hidden">
          {/* Ground Circular Graphic */}
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Outer Boundary Rope */}
              <circle cx="100" cy="100" r="92" fill="#064e3b" fillOpacity="0.3" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
              {/* 30-Yard Infield Circle */}
              <circle cx="100" cy="100" r="48" fill="#047857" fillOpacity="0.2" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 2" />
              {/* Pitch in Center */}
              <rect x="94" y="86" width="12" height="28" rx="2" fill="#d97706" />

              {/* Dynamic Shot Lines from Innings Deliveries */}
              {activeDeliveries.map((del, idx) => {
                if (del.isWicket || del.batsmanRun === 0) return null;
                // Distribute shots around 360 ground
                const angle = ((idx * 67 + del.batsmanRun * 45) % 360) * (Math.PI / 180);
                const radius = del.batsmanRun === 6 ? 92 : del.batsmanRun === 4 ? 85 : 30 + del.batsmanRun * 10;
                const endX = 100 + radius * Math.cos(angle);
                const endY = 100 + radius * Math.sin(angle);
                const color = del.batsmanRun === 6 ? "#ec4899" : del.batsmanRun === 4 ? "#f59e0b" : "#06b6d4";

                return (
                  <line
                    key={idx}
                    x1="100"
                    y1="100"
                    x2={endX}
                    y2={endY}
                    stroke={color}
                    strokeWidth={del.batsmanRun >= 4 ? 2.5 : 1.5}
                    strokeLinecap="round"
                    opacity={0.85}
                  />
                );
              })}
            </svg>
            <span className="absolute text-[8px] font-black text-amber-300 pointer-events-none">PITCH</span>
          </div>

          {/* Wagon Wheel Legend & Zones */}
          <div className="flex-1 pl-3 text-left space-y-1.5 border-l border-border/50">
            <span className="text-[10px] font-black uppercase text-foreground tracking-wider block">
              360° Shot Distribution
            </span>
            <div className="space-y-1 text-[10px]">
              <div className="flex items-center justify-between text-pink-400 font-bold">
                <span>🚀 Sixes (6):</span>
                <span>{matchStats.sixes}</span>
              </div>
              <div className="flex items-center justify-between text-amber-400 font-bold">
                <span>🏏 Fours (4):</span>
                <span>{matchStats.fours}</span>
              </div>
              <div className="flex items-center justify-between text-cyan-400 font-medium">
                <span>⚡ Running Runs:</span>
                <span>{matchStats.ones + matchStats.twos + matchStats.threes}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>🛡️ Dot Balls:</span>
                <span>{matchStats.dots}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Full Detailed Match Scorecard ── */}
      {arenaTab === "scorecard" && (
        <div className="w-full max-w-[min(380px,calc(100vw-2rem))] bg-card/90 rounded-3xl border border-border/80 shadow-xl p-3.5 mb-3 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="font-black text-foreground">Innings {state.currentInnings} Performance</span>
            <span className="font-mono text-primary font-bold">SR: {matchStats.strikeRate}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-1">
            <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground block">Boundaries</span>
              <span className="text-sm font-black text-amber-400">{matchStats.fours + matchStats.sixes}</span>
            </div>
            <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground block">Boundary %</span>
              <span className="text-sm font-black text-foreground">{matchStats.boundaryPercent}%</span>
            </div>
            <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground block">Dot Balls</span>
              <span className="text-sm font-black text-muted-foreground">{matchStats.dots}</span>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground pt-1 flex justify-between">
            <span>Runs breakdown:</span>
            <span className="font-mono text-foreground">
              {matchStats.ones}x(1s) • {matchStats.twos}x(2s) • {matchStats.fours}x(4s) • {matchStats.sixes}x(6s)
            </span>
          </div>
        </div>
      )}

      {/* Floating Boundary / Wicket Banner Overlay */}
      <AnimatePresence>
        {bannerCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute top-16 z-40 px-5 py-2 rounded-2xl border shadow-2xl flex flex-col items-center text-center"
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              borderColor: bannerCelebration.color,
              boxShadow: `0 0 30px ${bannerCelebration.color}66`,
            }}
          >
            <span className="text-base sm:text-lg font-black" style={{ color: bannerCelebration.color }}>
              {bannerCelebration.text}
            </span>
            <span className="text-[11px] text-slate-300 font-medium">{bannerCelebration.sub}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Bot Persona Dialogue Banner ── */}
      {isAIMode && (
        <div className="w-full mb-3 flex items-center gap-2 p-2 rounded-xl bg-card/50 border border-border/40 backdrop-blur-sm">
          <span className="text-2xl">{aiPersona.avatar}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px]">
              <strong style={{ color: aiPersona.color }}>{aiPersona.name}</strong>
              <span className="text-[10px] text-muted-foreground font-mono">{aiPersona.title}</span>
            </div>
            <p className="text-xs text-foreground/90 font-medium italic truncate">
              "{aiSpeech || aiPersona.quotes[isMyBatting ? "bowling" : "batting"][0]}"
            </p>
          </div>
        </div>
      )}

      {/* ── Local Pass & Play Privacy Screen Prompt ── */}
      {isLocalMode && (
        <div className="w-full mb-2 text-center">
          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
            👤 {passPlayerStep === 1 ? `${room.players.host.name}'s Turn (Secret Pick)` : "Pass to Player 2 (Secret Pick)"}
          </span>
        </div>
      )}

      {/* ── Secret Hand Gesture Number Pad (0 to 6) ── */}
      <div className="w-full bg-card/90 backdrop-blur-2xl border border-border/80 rounded-3xl p-3 shadow-xl">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-foreground">
            {localPick !== null ? "Locked in! Waiting for opponent..." : `Pick your ${isMyBatting ? "Shot" : "Delivery"}:`}
          </span>
          <span className="text-[10px] font-semibold text-primary">
            {isMyBatting ? "Runs if different • OUT if same" : "Match batsman's number to get OUT"}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {HAND_GESTURES.map((h) => {
            const isSelected = localPick === h.num;
            return (
              <button
                key={h.num}
                type="button"
                onClick={() => handleSelectDeliveryNumber(h.num)}
                disabled={isClashing || (localPick !== null && !isLocalMode)}
                className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-2xl border transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-105"
                    : `bg-card/40 ${h.color} hover:bg-card/70`
                }`}
              >
                <span className="text-xl sm:text-2xl mb-0.5">{h.emoji}</span>
                <span className="text-sm font-black leading-none">{h.num}</span>
                <span className="text-[8px] opacity-80 truncate hidden sm:block">{h.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hand Cricket How to Play Modal */}
      <GameHowToPlayModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        initialGameId="cricket"
      />
    </div>
  );
};
