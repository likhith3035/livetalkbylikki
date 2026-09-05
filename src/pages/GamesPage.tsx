import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GameId, GameMode, GameRoomState, PlayerInfo, GameCustomRules, GamerProfile } from "@/features/games/types";
import { GameCard, GameMetadata } from "@/features/games/components/GameCard";
import { GameModeModal } from "@/features/games/components/GameModeModal";
import { QuickMatchSearchingOverlay } from "@/features/games/components/QuickMatchSearchingOverlay";
import { GameScoreboard } from "@/features/games/components/GameScoreboard";
import { QRShareModal } from "@/features/games/components/QRShareModal";
import { OfflineAIFallbackBanner } from "@/features/games/components/OfflineAIFallbackBanner";
import { VictoryModal } from "@/features/games/components/VictoryModal";
import { GameLiveReactions } from "@/features/games/components/GameLiveReactions";
import { SpectatorCheerCannon } from "@/features/games/components/SpectatorCheerCannon";
import { GameInGameChat } from "@/features/games/components/GameInGameChat";
import { GamerProfileModal } from "@/features/games/components/GamerProfileModal";
import { GameAvatar } from "@/features/games/components/GameAvatar";
import { TicTacToeGame } from "@/features/games/components/games/TicTacToeGame";
import { ConnectFourGame } from "@/features/games/components/games/ConnectFourGame";
import { RPSClashGame } from "@/features/games/components/games/RPSClashGame";
import { MemoryDuelGame } from "@/features/games/components/games/MemoryDuelGame";
import { ReactionDashGame } from "@/features/games/components/games/ReactionDashGame";
import { SOSGame } from "@/features/games/components/games/SOSGame";
import { BingoGame } from "@/features/games/components/games/BingoGame";
import { HandCricketGame } from "@/features/games/components/games/HandCricketGame";
import { ChromeDinoGame } from "@/components/games/ChromeDinoGame";
import { GameHowToPlayModal } from "@/features/games/components/GameHowToPlayModal";
import {
  createGameRoom,
  joinGameRoom,
  joinAsSpectator,
  leaveSpectator,
  findOrJoinQuickMatch,
  cancelQuickMatchQueue,
  subscribeToGameRoom,
  leaveGameRoom,
  resetGameRound,
  voteRematch,
  sendGameMove,
  createInitialGameState,
} from "@/features/games/services/gameRoomService";
import {
  getGamerProfile,
  awardMatchXP,
  recordMatchHistory,
  getXpForNextLevel,
} from "@/features/games/services/gameProgressionService";
import { gameAudio } from "@/features/games/services/gameSoundService";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSEO } from "@/hooks/use-seo";
import { getCurrentUserId } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Gamepad2,
  QrCode,
  ScanLine,
  Search,
  Trophy,
  Flame,
  Swords,
  Eye,
  Percent,
  Sparkles,
  Edit3,
  WifiOff,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Bell,
  ChevronDown,
  ArrowRight,
  Play,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import QrScanner from "@/components/chat/QrScanner";

const GAMES_CATALOG: GameMetadata[] = [
  {
    id: "ttt",
    title: "Tic-Tac-Toe Neon",
    tagline: "The timeless 3x3 battle with animated win strokes and unbeatable Minimax AI.",
    category: "Classic",
    icon: "⭕",
    gradient: "from-violet-500 to-purple-600",
    accentColor: "#8b5cf6",
    badge: "Popular",
  },
  {
    id: "connect4",
    title: "Connect 4 Drop",
    tagline: "Drop chips into the 7x6 grid with gravity physics to connect four in a row.",
    category: "Strategy",
    icon: "🔴",
    gradient: "from-blue-500 to-indigo-600",
    accentColor: "#3b82f6",
    badge: "1v1 Classic",
  },
  {
    id: "rps",
    title: "Rock Paper Scissors",
    tagline: "Blind pick showdown with animated 3-2-1 clash and multi-round series.",
    category: "Casual",
    icon: "✊",
    gradient: "from-rose-500 to-pink-600",
    accentColor: "#f43f5e",
    badge: "Fast",
  },
  {
    id: "memory",
    title: "Memory Card Duel",
    tagline: "Flip and match pairs in a turn-based memory showdown. Most pairs wins!",
    category: "Brain",
    icon: "🧠",
    gradient: "from-amber-500 to-orange-600",
    accentColor: "#f59e0b",
    badge: "Brain",
  },
  {
    id: "reaction",
    title: "Reaction Dash",
    tagline: "Wait for green and tap with split-second reflexes. Millisecond precision score.",
    category: "Reflex",
    icon: "⚡",
    gradient: "from-emerald-500 to-teal-600",
    accentColor: "#10b981",
    badge: "Reflex",
  },
  {
    id: "sos",
    title: "SOS Neon Duel",
    tagline: "Place S or O on the 6x6 grid. Form S-O-S in any direction to earn points and extra turns!",
    category: "Classic",
    icon: "✨",
    gradient: "from-cyan-500 to-blue-600",
    accentColor: "#06b6d4",
    badge: "Hot 🔥",
  },
  {
    id: "bingo",
    title: "Bingo Blitz Duel",
    tagline: "1v1 Number Bingo. Call numbers, stamp tiles, and be first to complete 5 lines to shout BINGO!",
    category: "Classic",
    icon: "🎱",
    gradient: "from-amber-500 to-yellow-600",
    accentColor: "#f59e0b",
    badge: "New 🔥",
  },
  {
    id: "cricket",
    title: "Hand Cricket 1v1",
    tagline: "Odd-or-even toss, real batting vs bowling mind-games, boundary sixes, and wicket clashes!",
    category: "Strategy",
    icon: "🏏",
    gradient: "from-emerald-500 to-teal-600",
    accentColor: "#10b981",
    badge: "Hot 🔥",
  },
];

export default function GamesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const onlineCount = useOnlineCount();

  const [activeRoom, setActiveRoom] = useState<GameRoomState | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [dismissedVictoryRound, setDismissedVictoryRound] = useState<number>(-1);
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameMetadata | null>(null);
  const [isSearchingQuickMatch, setIsSearchingQuickMatch] = useState(false);
  const [searchingGameMeta, setSearchingGameMeta] = useState<GameMetadata | null>(null);

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDinoGameOpen, setIsDinoGameOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [howToPlayGameId, setHowToPlayGameId] = useState<GameId>("cricket");

  const [gamerProfile, setGamerProfile] = useState<GamerProfile>(getGamerProfile);
  const [isSelfOffline, setIsSelfOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  const [sortBy, setSortBy] = useState<"popular" | "fast" | "name">("popular");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const createdRoomCodeRef = useRef<string | null>(null);
  const recordedRoundRef = useRef<number>(-1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsSelfOffline(false);
      toast.success("Back online!");
    };
    const handleOffline = () => {
      setIsSelfOffline(true);
      toast.warning("Network connection lost. Offline AI Practice available.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useSEO({
    title: "IncogTalk Arcade – Play 1v1 Games Online (Hand Cricket, SOS, Bingo, Connect 4, Reaction Dash)",
    description:
      "Play 1v1 multiplayer games online with friends via instant QR code or duel smart AI bots. Super SOS Neon Duel, Bingo Blitz Duel, Hand Cricket, Connect Four, Tic-Tac-Toe, RPS Clash, Memory Duel & Reaction Dash on IncogTalk Arcade by Likhith Kami.",
    keywords:
      "bingo online, 1v1 bingo, hand cricket online, sos game online, sos duel, tic tac toe online, connect 4 online, 1v1 multiplayer games, play games with friends, qr code games, reaction game, reflex test, memory duel, rock paper scissors online, incogtalk arcade, likhith kami games",
    breadcrumbTitle: "IncogTalk Arcade (1v1 Games)",
    schema: {
      "@type": "SoftwareApplication",
      "name": "IncogTalk Arcade",
      "applicationCategory": "GameApplication",
      "operatingSystem": "Web, Android",
      "url": "https://incogtalkk.netlify.app/games",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "890"
      },
      "description": "Free real-time 1v1 multiplayer arcade games including Hand Cricket, Super SOS Neon Duel, Bingo Blitz Duel, Connect Four, Tic-Tac-Toe, and Reaction Dash."
    }
  });

  const myPlayerId = useMemo(() => getCurrentUserId(), []);

  const myPlayerInfo: PlayerInfo = useMemo(
    () => ({
      id: myPlayerId,
      name: gamerProfile.nickname?.trim() || "Player 1",
      avatar: gamerProfile.avatar || "👾",
      score: 0,
      level: gamerProfile.level || 1,
      isHost: true,
      isOnline: true,
      lastActive: Date.now(),
    }),
    [myPlayerId, gamerProfile]
  );

  // Track victory in local stats, award XP, and record match history
  useEffect(() => {
    if (activeRoom && (activeRoom.status === "round_over" || activeRoom.status === "game_over") && !isSpectator) {
      if (recordedRoundRef.current !== activeRoom.round && activeRoom.winnerId) {
        recordedRoundRef.current = activeRoom.round;
        const won = activeRoom.winnerId === myPlayerId;
        const draw = activeRoom.winnerId === "draw";

        const reward = awardMatchXP({ won, draw });
        setGamerProfile(reward.profile);

        const opponentName = activeRoom.players.host.id === myPlayerId
          ? activeRoom.players.guest?.name || "Opponent"
          : activeRoom.players.host.name;

        recordMatchHistory({
          gameId: activeRoom.gameId,
          mode: activeRoom.mode,
          outcome: won ? "won" : draw ? "draw" : "lost",
          opponentName,
          xpGained: reward.xpGained,
        });

        if (reward.leveledUp) {
          toast.success(`🎉 LEVEL UP! You reached Level ${reward.profile.level} (${reward.profile.title})!`);
        } else if (won) {
          toast.success(`+${reward.xpGained} XP Awarded!`);
        }

        if (reward.newBadgeUnlocked) {
          toast.success(`🏆 Achievement Unlocked: ${reward.newBadgeUnlocked.title}!`);
        }
      }
    }
  }, [activeRoom?.status, activeRoom?.round, activeRoom?.winnerId, myPlayerId, isSpectator]);

  // Auto-join if ?room=XXXX in URL (checking if spectator mode)
  useEffect(() => {
    const queryRoom = searchParams.get("room");
    const spectateParam = searchParams.get("spectate") === "true";

    if (
      queryRoom &&
      queryRoom.toUpperCase() !== createdRoomCodeRef.current &&
      (!activeRoom || activeRoom.roomCode !== queryRoom.toUpperCase())
    ) {
      if (spectateParam) {
        handleJoinSpectate(queryRoom);
      } else {
        handleJoinByCode(queryRoom);
      }
    }
  }, [searchParams]);

  // Firebase room realtime listener
  useEffect(() => {
    if (!activeRoom || activeRoom.mode === "local" || activeRoom.mode === "ai") return;

    const unsub = subscribeToGameRoom(activeRoom.roomCode, (updated) => {
      if (updated) {
        setActiveRoom(updated);
        // If we were searching for quickmatch and an opponent connected, exit searching
        if (isSearchingQuickMatch && updated.players.guest) {
          setIsSearchingQuickMatch(false);
          gameAudio.playWin();
          toast.success("Opponent connected! Game starting...");
        }

        // If both players accepted rematch, dismiss victory modal
        if (updated.status === "playing" && dismissedVictoryRound !== -1) {
          setDismissedVictoryRound(-1);
        }
      } else {
        toast.info("Room closed by host.");
        setActiveRoom(null);
        setIsSearchingQuickMatch(false);
        setIsSpectator(false);
        setSearchParams({});
      }
    });

    return () => unsub();
  }, [activeRoom?.roomCode, activeRoom?.mode, isSearchingQuickMatch, dismissedVictoryRound]);

  const handleSwitchActiveRoomToAI = useCallback(() => {
    if (!activeRoom) return;
    gameAudio.playClick();
    toast.info("Switched to Cyber AI Practice Mode!");

    const aiPlayer: PlayerInfo = {
      id: "ai_opponent",
      name: "Cyber AI 🤖",
      avatar: "🤖",
      score: activeRoom.players.guest?.score || 0,
      level: 10,
      isHost: false,
      isOnline: true,
      lastActive: Date.now(),
    };

    const nextTurn =
      activeRoom.currentTurn === activeRoom.players.host.id
        ? activeRoom.players.host.id
        : "ai_opponent";

    setActiveRoom({
      ...activeRoom,
      mode: "ai",
      currentTurn: nextTurn,
      players: {
        host: activeRoom.players.host,
        guest: aiPlayer,
      },
    });
  }, [activeRoom]);

  const handleSelectMode = async (gameId: GameId, mode: GameMode, rules?: GameCustomRules) => {
    gameAudio.playClick();
    const gameMeta = GAMES_CATALOG.find((g) => g.id === gameId) || null;

    if (isSelfOffline && (mode === "quickmatch" || mode === "friend")) {
      toast.info("Offline mode active. Starting smart AI practice match!");
      mode = "ai";
    }

    const latestProfile = getGamerProfile();
    setGamerProfile(latestProfile);
    const hostPlayerInfo: PlayerInfo = {
      id: myPlayerId,
      name: latestProfile.nickname?.trim() || "Player 1",
      avatar: latestProfile.avatar || "👾",
      score: 0,
      level: latestProfile.level || 1,
      isHost: true,
      isOnline: true,
      lastActive: Date.now(),
    };

    if (mode === "quickmatch") {
      setIsSearchingQuickMatch(true);
      setSearchingGameMeta(gameMeta);
      try {
        const result = await findOrJoinQuickMatch({
          gameId,
          player: hostPlayerInfo,
        });

        createdRoomCodeRef.current = result.room.roomCode;
        setActiveRoom(result.room);

        if (result.isMatched) {
          setIsSearchingQuickMatch(false);
          gameAudio.playWin();
          toast.success("Found an online opponent! Match starting...");
        }
      } catch (err: any) {
        setIsSearchingQuickMatch(false);
        toast.info("Online queue unavailable. Launching Cyber AI Bot match!");
        await handleSelectMode(gameId, "ai", rules);
      }
      return;
    }

    // Friend / AI / Local Modes
    try {
      const newRoom = await createGameRoom({
        gameId,
        mode,
        hostPlayer: hostPlayerInfo,
        rules,
      });

      createdRoomCodeRef.current = newRoom.roomCode;
      setActiveRoom(newRoom);
      setIsSpectator(false);
      setDismissedVictoryRound(-1);

      if (mode === "friend") {
        setIsQRModalOpen(true);
        setSearchParams({ room: newRoom.roomCode });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize game room.");
    }
  };

  const handleCancelQuickMatch = async () => {
    if (activeRoom) {
      await cancelQuickMatchQueue(activeRoom.gameId, myPlayerId, activeRoom.roomCode);
    }
    setIsSearchingQuickMatch(false);
    setActiveRoom(null);
    setSearchingGameMeta(null);
  };

  const handleSwitchToAI = async () => {
    if (!searchingGameMeta) return;
    await handleCancelQuickMatch();
    await handleSelectMode(searchingGameMeta.id, "ai");
  };

  const handleJoinByCode = async (codeToJoin: string) => {
    const clean = codeToJoin.trim().toUpperCase();
    if (!clean) {
      toast.error("Please enter a valid room code.");
      return;
    }

    try {
      const joined = await joinGameRoom({
        roomCode: clean,
        guestPlayer: {
          ...myPlayerInfo,
          isHost: false,
        },
      });

      if (joined) {
        createdRoomCodeRef.current = clean;
        setActiveRoom(joined);
        setIsSpectator(false);
        setDismissedVictoryRound(-1);
        setIsJoinModalOpen(false);
        setIsScannerOpen(false);
        setSearchParams({ room: clean });
        gameAudio.playWin();
        toast.success(`Connected to room ${clean}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to join game room.");
    }
  };

  const handleJoinSpectate = async (codeToSpectate: string) => {
    const clean = codeToSpectate.trim().toUpperCase();
    try {
      const specRoom = await joinAsSpectator(clean, {
        id: myPlayerId,
        name: myPlayerInfo.name,
        avatar: myPlayerInfo.avatar,
        joinedAt: Date.now(),
      });

      if (specRoom) {
        setActiveRoom(specRoom);
        setIsSpectator(true);
        setDismissedVictoryRound(-1);
        setIsJoinModalOpen(false);
        setIsScannerOpen(false);
        setSearchParams({ room: clean, spectate: "true" });
        toast.success(`Now spectating match in room ${clean}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Could not spectate this room.");
    }
  };

  const handleRematch = async () => {
    if (!activeRoom) return;
    gameAudio.playClick();
    const timerSec = activeRoom.rules?.turnTimerSeconds || 0;

    if (activeRoom.mode === "local" || activeRoom.mode === "ai") {
      setDismissedVictoryRound(-1);
      const freshGameState = createInitialGameState(activeRoom.gameId);
      setActiveRoom({
        ...activeRoom,
        gameState: freshGameState,
        status: "playing",
        winnerId: null,
        currentTurn: activeRoom.players.host.id,
        round: activeRoom.round + 1,
        turnExpiresAt: timerSec > 0 ? Date.now() + timerSec * 1000 : null,
      });
      return;
    }

    // Two-Way Rematch Handshake for Online Multiplayer
    try {
      const { bothReady } = await voteRematch(
        activeRoom.roomCode,
        myPlayerId,
        activeRoom.gameId,
        activeRoom.round + 1,
        timerSec
      );

      if (bothReady) {
        setDismissedVictoryRound(-1);
        toast.success("Both players ready! New round starting...");
      } else {
        toast.info("Rematch requested! Waiting for opponent to accept...");
      }
    } catch {
      toast.error("Failed to register rematch vote.");
    }
  };

  const handleTurnTimeout = useCallback(async () => {
    if (!activeRoom || activeRoom.status !== "playing" || isSpectator) return;
    const isMyTurn = activeRoom.currentTurn === myPlayerId;
    if (!isMyTurn) return;

    toast.info("Turn timed out! Turn passed to opponent.");
    gameAudio.playLose();

    const nextTurnId = activeRoom.currentTurn === activeRoom.players.host.id
      ? (activeRoom.players.guest?.id || (activeRoom.mode === "ai" ? "ai_opponent" : "local_player_2"))
      : activeRoom.players.host.id;

    const timerSec = activeRoom.rules?.turnTimerSeconds || 0;

    if (activeRoom.mode === "local" || activeRoom.mode === "ai") {
      setActiveRoom({
        ...activeRoom,
        currentTurn: nextTurnId,
        turnExpiresAt: timerSec > 0 ? Date.now() + timerSec * 1000 : null,
      });
      return;
    }

    await sendGameMove(
      activeRoom.roomCode,
      activeRoom.gameState,
      nextTurnId,
      null,
      false,
      undefined,
      undefined,
      timerSec,
      activeRoom.rules?.maxSeriesWins || 2
    );
  }, [activeRoom, isSpectator, myPlayerId]);

  const handleExitGame = useCallback(async () => {
    if (!activeRoom) return;
    const isHost = activeRoom.players.host.id === myPlayerId;

    if (isSpectator) {
      await leaveSpectator(activeRoom.roomCode, myPlayerId);
    } else if (activeRoom.mode !== "local" && activeRoom.mode !== "ai") {
      await leaveGameRoom(activeRoom.roomCode, isHost);
    }

    createdRoomCodeRef.current = null;
    setActiveRoom(null);
    setIsSpectator(false);
    setDismissedVictoryRound(-1);
    setIsSearchingQuickMatch(false);
    setSearchParams({});
    gameAudio.playClick();
  }, [activeRoom, myPlayerId, isSpectator, setSearchParams]);

  const filteredGames = useMemo(() => {
    let list = GAMES_CATALOG.filter((g) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.tagline.toLowerCase().includes(q) ||
        (g.tags && g.tags.some((t) => t.toLowerCase().includes(q)));
      const matchCat = selectedCategory === "All" || g.category === selectedCategory;
      return matchSearch && matchCat;
    });

    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "fast") {
      const fastOrder = ["rps", "reaction", "ttt", "connect4", "sos", "cricket", "bingo", "memory"];
      list = [...list].sort((a, b) => fastOrder.indexOf(a.id) - fastOrder.indexOf(b.id));
    }
    return list;
  }, [searchQuery, selectedCategory, sortBy]);

  const activeGameMeta = useMemo(() => {
    return GAMES_CATALOG.find((g) => g.id === activeRoom?.gameId);
  }, [activeRoom?.gameId]);

  const isOpponentOffline = useMemo(() => {
    if (!activeRoom || activeRoom.mode === "ai" || activeRoom.mode === "local" || activeRoom.status === "waiting" || isSpectator) {
      return false;
    }
    const isHost = activeRoom.players.host.id === myPlayerId;
    const opponent = isHost ? activeRoom.players.guest : activeRoom.players.host;
    return opponent ? !opponent.isOnline : false;
  }, [activeRoom, myPlayerId, isSpectator]);

  const xpNeeded = getXpForNextLevel(gamerProfile.level);
  const xpPercent = Math.min(Math.round((gamerProfile.xp / xpNeeded) * 100), 100);
  const winRate = gamerProfile.played > 0 ? Math.round((gamerProfile.wins / gamerProfile.played) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased select-none">
      <Header onlineCount={onlineCount} />

      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full">
        {/* VIEW 1: SEARCHING FOR QUICK MATCH RADAR */}
        {isSearchingQuickMatch ? (
          <QuickMatchSearchingOverlay
            game={searchingGameMeta}
            onCancel={handleCancelQuickMatch}
            onSwitchToAI={handleSwitchToAI}
          />
        ) : activeRoom ? (
          /* VIEW 2: ACTIVE GAME ARENA */
          <div className="flex flex-col items-center justify-center w-full max-w-2xl relative">
            <GameScoreboard
              room={activeRoom}
              myPlayerId={myPlayerId}
              gameTitle={activeGameMeta?.title || "Arcade Duel"}
              isSpectator={isSpectator}
              onExit={handleExitGame}
              onOpenQR={() => setIsQRModalOpen(true)}
              onTurnTimeout={handleTurnTimeout}
            />

            {/* Quick In-Game Rules Access */}
            <div className="w-full flex items-center justify-end px-1 -mt-1 mb-1.5">
              <button
                type="button"
                onClick={() => {
                  setHowToPlayGameId(activeRoom.gameId);
                  setIsHowToPlayOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card/60 hover:bg-card border border-border/60 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm"
                title="View rules and instructions for this game"
              >
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>How to Play</span>
              </button>
            </div>

            <OfflineAIFallbackBanner
              isOpponentOffline={isOpponentOffline}
              isSelfOffline={isSelfOffline}
              opponentName={
                activeRoom.players.host.id === myPlayerId
                  ? activeRoom.players.guest?.name || "Opponent"
                  : activeRoom.players.host.name
              }
              onSwitchToAI={handleSwitchActiveRoomToAI}
              onForfeitClaim={() => {
                setActiveRoom({
                  ...activeRoom,
                  status: "game_over",
                  winnerId: myPlayerId,
                });
              }}
            />

            {/* Render Specific Game Board */}
            <div className="w-full flex items-center justify-center my-2">
              {activeRoom.gameId === "ttt" && (
                <TicTacToeGame
                  room={activeRoom}
                  myPlayerId={myPlayerId}
                  isMyTurn={!isSpectator && activeRoom.currentTurn === myPlayerId}
                  onLocalMove={(updated) => setActiveRoom(updated)}
                />
              )}
              {activeRoom.gameId === "connect4" && (
                <ConnectFourGame
                  room={activeRoom}
                  myPlayerId={myPlayerId}
                  isMyTurn={!isSpectator && activeRoom.currentTurn === myPlayerId}
                  onLocalMove={(updated) => setActiveRoom(updated)}
                />
              )}
              {activeRoom.gameId === "rps" && (
                <RPSClashGame
                  room={activeRoom}
                  myPlayerId={myPlayerId}
                  isMyTurn={!isSpectator && activeRoom.currentTurn === myPlayerId}
                  onLocalMove={(updated) => setActiveRoom(updated)}
                />
              )}
              {activeRoom.gameId === "memory" && (
                <MemoryDuelGame
                  room={activeRoom}
                  myPlayerId={myPlayerId}
                  isMyTurn={!isSpectator && activeRoom.currentTurn === myPlayerId}
                  onLocalMove={(updated) => setActiveRoom(updated)}
                />
              )}
              {activeRoom.gameId === "reaction" && (
                <ReactionDashGame
                  room={activeRoom}
                  myPlayerId={myPlayerId}
                  isMyTurn={!isSpectator && activeRoom.currentTurn === myPlayerId}
                  onLocalMove={(updated) => setActiveRoom(updated)}
                />
              )}
              {activeRoom.gameId === "sos" && (
                <SOSGame
                  room={activeRoom}
                  myPlayerId={myPlayerId}
                  isMyTurn={!isSpectator && activeRoom.currentTurn === myPlayerId}
                  onLocalMove={(updated) => setActiveRoom(updated)}
                />
              )}
              {activeRoom.gameId === "bingo" && (
                <BingoGame
                  room={activeRoom}
                  myPlayerId={myPlayerId}
                  isMyTurn={!isSpectator && activeRoom.currentTurn === myPlayerId}
                  onLocalMove={(updated) => setActiveRoom(updated)}
                />
              )}
              {activeRoom.gameId === "cricket" && (
                <HandCricketGame
                  room={activeRoom}
                  myPlayerId={myPlayerId}
                  isMyTurn={!isSpectator && activeRoom.currentTurn === myPlayerId}
                  onLocalMove={(updated) => setActiveRoom(updated)}
                />
              )}
            </div>

            {/* Persistent On-Screen Match Action Bar (Visible when round or series ends) */}
            {(activeRoom.status === "round_over" || activeRoom.status === "game_over") && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md my-3 p-3.5 rounded-2xl bg-card/95 backdrop-blur-xl border-2 border-primary/40 shadow-2xl flex flex-col gap-2.5 z-20"
              >
                <div className="flex items-center justify-between text-xs font-bold px-1">
                  <span className="text-amber-400 flex items-center gap-1.5 font-black">
                    <Trophy className="w-4 h-4" />
                    {activeRoom.winnerId === "draw"
                      ? "Match Ended in Draw"
                      : activeRoom.winnerId === myPlayerId
                      ? "🎉 You Won the Round!"
                      : activeRoom.mode === "local"
                      ? `${activeRoom.players.host.score > (activeRoom.players.guest?.score || 0) ? activeRoom.players.host.name : (activeRoom.players.guest?.name || "Player 2")} Won!`
                      : "Round Complete"}
                  </span>
                  {dismissedVictoryRound === activeRoom.round && (
                    <button
                      type="button"
                      onClick={() => setDismissedVictoryRound(-1)}
                      className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>View Scorecard</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="default"
                    onClick={handleRematch}
                    className="flex-1 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-primary-foreground font-black shadow-lg shadow-primary/25 rounded-xl h-11 flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {activeRoom.mode === "friend" || activeRoom.mode === "quickmatch"
                        ? activeRoom.rematchVotes?.[myPlayerId]
                          ? "Rematch Ready ⏳"
                          : "Vote Rematch"
                        : "Play Again"}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={handleExitGame}
                    className="flex-1 border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 font-bold rounded-xl h-11 flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Arcade</span>
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Live In-Game Floating Reactions & Quick Chat Drawer */}
            <GameLiveReactions
              roomCode={activeRoom.roomCode}
              myPlayerId={myPlayerId}
              myPlayerName={myPlayerInfo.name}
              isSpectator={isSpectator}
            />

            {/* Spectator Cheer Cannon & Live Cheer Storm */}
            <SpectatorCheerCannon
              roomCode={activeRoom.roomCode}
              spectatorName={myPlayerInfo.name}
              isSpectator={isSpectator}
            />

            {/* In-Game Live Messenger Chat */}
            {activeRoom.mode !== "local" && (
              <GameInGameChat
                roomCode={activeRoom.roomCode}
                myPlayerId={myPlayerId}
                myPlayerName={myPlayerInfo.name}
                myPlayerAvatar={myPlayerInfo.avatar}
                isSpectator={isSpectator}
              />
            )}

            {/* QR Invite & Spectate Modal */}
            <QRShareModal
              isOpen={isQRModalOpen}
              onClose={() => setIsQRModalOpen(false)}
              roomCode={activeRoom.roomCode}
              gameTitle={activeGameMeta?.title || "Arcade Duel"}
              onScanJoin={handleJoinByCode}
            />

            {/* Victory / Next Round Modal with Two-Way Handshake */}
            <VictoryModal
              isOpen={
                (activeRoom.status === "round_over" || activeRoom.status === "game_over") &&
                dismissedVictoryRound !== activeRoom.round
              }
              room={activeRoom}
              myPlayerId={myPlayerId}
              onClose={() => setDismissedVictoryRound(activeRoom.round)}
              onRematch={handleRematch}
              onExitToLobby={handleExitGame}
            />
          </div>
        ) : (
          /* VIEW 3: GAMES LOBBY & ARCADE HUB (EXACT DASHBOARD UI) */
          <div className="flex flex-col w-full max-w-7xl mx-auto">
            {/* 1. TOP BAR: Search with Ctrl+K, Notifications & Gamer Profile Chip */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 sm:mb-8">
              {/* Left: Search Box with Ctrl K */}
              <div className="relative flex-1 max-w-md">
                <div className="flex items-center w-full h-11 px-4 rounded-full bg-card dark:bg-[#12131e] border border-border dark:border-white/[0.08] focus-within:border-indigo-500/50 shadow-sm transition-colors">
                  <Search className="w-4 h-4 text-muted-foreground dark:text-gray-400 shrink-0 mr-3" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search arcade games..."
                    className="w-full bg-transparent text-xs sm:text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500 outline-none"
                  />
                  <div className="hidden xs:flex items-center gap-1 shrink-0 ml-2">
                    <kbd className="text-[10px] font-semibold text-muted-foreground dark:text-gray-400 bg-secondary dark:bg-white/[0.06] border border-border dark:border-white/10 px-1.5 py-0.5 rounded">
                      Ctrl
                    </kbd>
                    <kbd className="text-[10px] font-semibold text-muted-foreground dark:text-gray-400 bg-secondary dark:bg-white/[0.06] border border-border dark:border-white/10 px-1.5 py-0.5 rounded">
                      K
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Right: Notification Bell & Gamer Profile Card */}
              <div className="flex items-center justify-end gap-3 shrink-0">
                {/* Notification Bell */}
                <button
                  type="button"
                  onClick={() => toast.info("No unread notifications right now.")}
                  className="relative w-10 h-10 rounded-full bg-card dark:bg-[#12131e] border border-border dark:border-white/[0.08] hover:border-border/80 dark:hover:border-white/20 flex items-center justify-center text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-all cursor-pointer shadow-sm"
                  title="Arcade Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-card dark:border-[#12131e] text-[9px] font-bold text-white flex items-center justify-center">
                    0
                  </span>
                </button>

                {/* Profile Chip */}
                <div
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-card dark:bg-[#12131e] border border-border dark:border-white/[0.08] hover:border-indigo-500/30 transition-all cursor-pointer group shadow-sm"
                  title="Click to customize gamer profile"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-gradient-to-br dark:from-indigo-500/30 dark:to-purple-600/40 border border-indigo-200 dark:border-indigo-400/40 flex items-center justify-center text-xs font-black text-indigo-700 dark:text-indigo-200 shrink-0 shadow-inner">
                    {gamerProfile.avatar || (gamerProfile.nickname ? gamerProfile.nickname.charAt(0).toUpperCase() : "R")}
                  </div>
                  <div className="flex flex-col text-left min-w-0 pr-1">
                    <span className="text-xs sm:text-sm font-bold text-foreground dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors truncate max-w-[120px] sm:max-w-[150px]">
                      {gamerProfile.nickname || "RetroSpark50"}
                    </span>
                    <span className="text-[10px] text-muted-foreground dark:text-gray-400 truncate">
                      {gamerProfile.title || "Arcade Rookie"} • Lv.{gamerProfile.level || 1}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground dark:text-gray-400 group-hover:text-foreground dark:group-hover:text-white transition-colors shrink-0" />
                </div>
              </div>
            </div>

            {/* 2. HERO BANNER: Play 1v1 Games with Anyone (Compact & Sleek) */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-pink-50/80 dark:bg-gradient-to-br dark:from-[#121324] dark:via-[#10111d] dark:to-[#0d0e17] border border-indigo-100/80 dark:border-white/[0.08] p-4 sm:p-5 md:p-6 mb-5 relative overflow-hidden shadow-sm dark:shadow-xl text-foreground dark:text-white transition-colors">
              {/* Ambient radial glow */}
              <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-indigo-600/10 dark:bg-indigo-600/15 blur-[80px] pointer-events-none" />

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center relative z-10">
                {/* Left Column: Heading, Subtitle, CTA */}
                <div className="md:col-span-8 flex flex-col items-start text-left">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-[#818cf8] mb-1.5">
                    INCOGTALK ARCADE
                  </span>

                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground dark:text-white tracking-tight leading-tight">
                    Play 1v1 Games with{" "}
                    <span className="bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#a855f7] dark:from-[#818cf8] dark:via-[#a78bfa] dark:to-[#c084fc] bg-clip-text text-transparent drop-shadow-sm dark:drop-shadow-[0_2px_12px_rgba(99,102,241,0.4)]">
                      Anyone
                    </span>
                  </h1>

                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1 max-w-lg leading-relaxed font-normal">
                    Challenge friends via QR code, chat live during matches, or test your skills against smart AI bots.
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 sm:gap-2.5 mt-3.5 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const defaultGame = GAMES_CATALOG[0];
                        setSelectedGameForModal(defaultGame);
                      }}
                      className="rounded-full bg-[#6366f1] hover:bg-[#5254e0] text-white font-bold text-xs px-4 h-8 sm:h-9 shadow-md shadow-indigo-500/25 flex items-center gap-1.5 group transition-all cursor-pointer"
                    >
                      <span>Play Now</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHowToPlayGameId("cricket");
                        setIsHowToPlayOpen(true);
                      }}
                      className="rounded-full bg-white/80 hover:bg-white text-foreground border-border/80 shadow-sm dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/20 text-xs px-3.5 h-8 sm:h-9 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current text-foreground/80 dark:text-white/90" />
                      <span>How It Works</span>
                    </Button>

                    {/* Quick Action Pills for Join Code & Scan QR */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsJoinModalOpen(true)}
                        className="text-[11px] text-muted-foreground hover:text-foreground dark:text-white/80 dark:hover:text-white px-2.5 py-1 rounded-full bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 border border-border/80 dark:border-white/15 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                        title="Enter a 6-letter room code to join friend"
                      >
                        <QrCode className="w-3 h-3 text-indigo-500 dark:text-indigo-300" />
                        <span>Join</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="text-[11px] text-muted-foreground hover:text-foreground dark:text-white/80 dark:hover:text-white px-2.5 py-1 rounded-full bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 border border-border/80 dark:border-white/15 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                        title="Scan friend's QR code camera"
                      >
                        <ScanLine className="w-3 h-3 text-indigo-500 dark:text-indigo-300" />
                        <span>Scan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDinoGameOpen(true)}
                        className="text-[11px] text-muted-foreground hover:text-foreground dark:text-white/80 dark:hover:text-white px-2.5 py-1 rounded-full bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 border border-border/80 dark:border-white/15 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                        title="Play Chrome Dino Runner"
                      >
                        <span>🦖 Dino</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Compact 3D Floating Isometric Game Tiles & Handwritten Script */}
                <div className="md:col-span-4 hidden md:flex items-center justify-center relative min-h-[120px] select-none">
                  {/* Glowing Orbits */}
                  <div className="absolute w-44 h-24 border border-indigo-300/40 dark:border-indigo-400/30 rounded-full -rotate-12 pointer-events-none" />
                  <div className="absolute w-52 h-28 border border-purple-300/30 dark:border-purple-400/20 rounded-full rotate-6 pointer-events-none" />

                  {/* Compact 3D Tile Pair */}
                  <div className="relative flex items-center justify-center perspective-[600px] w-44 h-28">
                    {/* Dark/Light Tile (X) */}
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      className="w-16 h-20 rounded-xl bg-gradient-to-br from-white to-indigo-100/90 border border-indigo-200/80 shadow-[0_12px_24px_rgba(99,102,241,0.15)] dark:from-[#1e202f] dark:to-[#121320] dark:border-white/10 dark:shadow-[0_12px_24px_rgba(0,0,0,0.6)] flex items-center justify-center transform -rotate-12 -translate-x-3 translate-y-1 z-10"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <span className="text-xl font-black text-indigo-900 dark:text-white drop-shadow-[0_0_6px_rgba(99,102,241,0.3)] dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">✕</span>
                    </motion.div>

                    {/* Neon Purple Tile (O) */}
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                      className="w-16 h-20 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#6366f1] border border-indigo-300/30 shadow-[0_12px_24px_rgba(99,102,241,0.35)] flex items-center justify-center transform rotate-6 translate-x-2 -translate-y-1 z-20"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <span className="text-xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">◯</span>
                    </motion.div>
                  </div>

                  {/* Compact Script Callout Text */}
                  <div className="absolute -right-1 top-2 transform rotate-6 text-right pointer-events-none">
                    <span className="block text-[9px] font-serif italic text-purple-700/80 dark:text-purple-300/80 leading-tight">Same Games</span>
                    <span className="block text-[9px] font-serif italic text-purple-700/70 dark:text-purple-300/70 leading-tight">Different People</span>
                    <span className="block text-[11px] font-serif italic font-bold text-purple-800 dark:text-purple-200 leading-tight">More Fun!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. FILTER & SORT NAVIGATION BAR */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar touch-pan-x">
                {["All", "Classic", "Strategy", "Reflex", "Casual", "Brain"].map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        gameAudio.playClick();
                        setSelectedCategory(cat);
                      }}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? "bg-[#6366f1] text-white shadow-md shadow-indigo-500/25"
                          : "bg-card dark:bg-[#12131e] hover:bg-secondary dark:hover:bg-[#1a1b2b] text-muted-foreground dark:text-gray-300 border border-border dark:border-white/[0.06]"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Sort Dropdown */}
              <div className="relative self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSortOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card dark:bg-[#12131e] hover:bg-secondary dark:hover:bg-[#1a1b2b] text-muted-foreground dark:text-gray-300 border border-border dark:border-white/[0.08] text-xs font-medium cursor-pointer shadow-sm transition-colors"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground dark:text-gray-400" />
                  <span>
                    {sortBy === "popular" ? "Most Popular" : sortBy === "fast" ? "Fastest Match" : "Alphabetical"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground dark:text-gray-400" />
                </button>

                {/* Sort Options Menu */}
                {isSortOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-popover dark:bg-[#12131e] border border-border dark:border-white/10 shadow-2xl p-1.5 z-30">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("popular");
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                        sortBy === "popular" ? "bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 font-bold" : "text-popover-foreground dark:text-gray-300 hover:bg-secondary dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      <span>Most Popular</span>
                      {sortBy === "popular" && <Check className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("fast");
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                        sortBy === "fast" ? "bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 font-bold" : "text-popover-foreground dark:text-gray-300 hover:bg-secondary dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      <span>Fastest Match</span>
                      {sortBy === "fast" && <Check className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("name");
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                        sortBy === "name" ? "bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 font-bold" : "text-popover-foreground dark:text-gray-300 hover:bg-secondary dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      <span>Alphabetical</span>
                      {sortBy === "name" && <Check className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 4. GAMES GRID */}
            {filteredGames.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-card dark:bg-[#12131e] border border-border dark:border-white/[0.06]">
                <span className="text-3xl mb-2">🔍</span>
                <h3 className="text-base font-bold text-foreground dark:text-white">No arcade games found</h3>
                <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1 max-w-sm">
                  Try adjusting your search query or selecting a different category filter.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-full border-border dark:border-white/10 text-xs"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filteredGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onOpenModeSelect={(g) => setSelectedGameForModal(g)}
                    onOpenHowToPlay={(g) => {
                      setHowToPlayGameId(g.id);
                      setIsHowToPlayOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Gamer Profile Customizer Modal */}
      <GamerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={gamerProfile}
        onProfileUpdated={(updated) => setGamerProfile(updated)}
      />

      {/* Game Mode Selection Modal */}
      <GameModeModal
        isOpen={!!selectedGameForModal}
        onClose={() => setSelectedGameForModal(null)}
        game={selectedGameForModal}
        onSelectMode={handleSelectMode}
        onOpenHowToPlay={(id) => {
          setHowToPlayGameId(id);
          setIsHowToPlayOpen(true);
        }}
      />

      {/* Interactive How to Play Academy Modal */}
      <GameHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
        initialGameId={howToPlayGameId}
        onSelectGameToPlay={(id) => {
          const matched = GAMES_CATALOG.find((g) => g.id === id) || null;
          setSelectedGameForModal(matched);
        }}
      />

      {/* Manual Join / Spectate Room Dialog */}
      <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
        <DialogContent className="max-w-sm p-6 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/50 shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Join or Spectate Room
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter your friend's 6-character room code to duel or watch live.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 my-3">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="e.g. K7X4P9"
              maxLength={8}
              className="h-12 rounded-xl text-center text-xl font-black tracking-widest uppercase bg-muted border-border"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJoinByCode(manualCode);
              }}
            />

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleJoinByCode(manualCode)}
                className="h-11 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/25 gap-1.5 cursor-pointer"
              >
                <Swords className="w-3.5 h-3.5" />
                Join to Play
              </Button>

              <Button
                variant="outline"
                onClick={() => handleJoinSpectate(manualCode)}
                className="h-11 rounded-xl border-amber-500/40 text-amber-500 hover:bg-amber-500/10 font-bold text-xs gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                Spectate Live
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera QR Scanner Integration */}
      <QrScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedText) => {
          setIsScannerOpen(false);
          const isSpectateLink = scannedText.includes("spectate=true");
          const urlMatch = scannedText.match(/[?&]room=([A-Za-z0-9]+)/);
          const codeToJoin = urlMatch ? urlMatch[1] : scannedText.trim();

          if (isSpectateLink) {
            handleJoinSpectate(codeToJoin);
          } else {
            handleJoinByCode(codeToJoin);
          }
        }}
      />

      {/* Classic Chrome Dino Mini-Game Modal */}
      <Dialog open={isDinoGameOpen} onOpenChange={setIsDinoGameOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-2 sm:p-4 rounded-3xl bg-transparent border-0 shadow-none">
          <ChromeDinoGame onClose={() => setIsDinoGameOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
